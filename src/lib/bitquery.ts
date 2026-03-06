import { TokenEvent } from '@/lib/classifier';

const PUMP_FUN_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

// Cache token metadata to avoid repeated API calls
const metadataCache = new Map<string, { name: string; symbol: string } | null>();
const pendingFetches = new Map<string, Promise<{ name: string; symbol: string } | null>>();

async function fetchTokenMetadata(
  mintAddress: string,
  apiKey: string,
): Promise<{ name: string; symbol: string } | null> {
  if (metadataCache.has(mintAddress)) return metadataCache.get(mintAddress) || null;
  if (pendingFetches.has(mintAddress)) return pendingFetches.get(mintAddress) || null;

  const promise = (async () => {
    try {
      const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'metadata',
          method: 'getAsset',
          params: { id: mintAddress, displayOptions: { showFungible: true } },
        }),
      });
      const { result } = await res.json();
      if (result?.content?.metadata) {
        const meta = {
          name: result.content.metadata.name || mintAddress.slice(0, 8),
          symbol: result.content.metadata.symbol || '???',
        };
        metadataCache.set(mintAddress, meta);
        return meta;
      }
      // Fallback: try token_info
      if (result?.token_info?.symbol) {
        const meta = {
          name: result.token_info.symbol,
          symbol: result.token_info.symbol,
        };
        metadataCache.set(mintAddress, meta);
        return meta;
      }
      metadataCache.set(mintAddress, null);
      return null;
    } catch (err) {
      console.error('[Helius] Metadata fetch failed:', err);
      return null;
    } finally {
      pendingFetches.delete(mintAddress);
    }
  })();

  pendingFetches.set(mintAddress, promise);
  return promise;
}

function extractTokenInfo(txData: Record<string, unknown>): {
  mintAddress: string;
  solAmount: number;
} | null {
  try {
    const result = txData as Record<string, unknown>;
    const tx = result.transaction as Record<string, unknown> | undefined;
    const meta = result.meta as Record<string, unknown> | undefined;
    if (!tx || !meta) return null;

    const message = tx.message as Record<string, unknown> | undefined;
    if (!message) return null;

    // Extract mint address from token balance changes
    const postTokenBalances = meta.postTokenBalances as Array<Record<string, unknown>> | undefined;
    let mintAddress = '';
    if (postTokenBalances && postTokenBalances.length > 0) {
      mintAddress = (postTokenBalances[0].mint as string) || '';
    }

    if (!mintAddress) {
      // Try account keys - for pump.fun, token mint is often in the accounts
      const accountKeys = message.accountKeys as Array<Record<string, unknown>> | undefined;
      if (accountKeys && accountKeys.length > 1) {
        // Filter out known programs and find likely mint address
        for (const key of accountKeys) {
          const pubkey = (key.pubkey as string) || (key as unknown as string);
          if (
            pubkey &&
            pubkey !== PUMP_FUN_PROGRAM &&
            pubkey.length >= 32 &&
            !pubkey.startsWith('11111') &&
            !pubkey.startsWith('Token')
          ) {
            mintAddress = pubkey;
            break;
          }
        }
      }
    }

    if (!mintAddress) return null;

    // Extract SOL amount from balance changes
    const preBalances = meta.preBalances as number[] | undefined;
    const postBalances = meta.postBalances as number[] | undefined;
    let solAmount = 0;
    if (preBalances && postBalances && preBalances.length > 0) {
      // First account is usually the payer - calculate SOL spent
      const diff = Math.abs(preBalances[0] - postBalances[0]);
      solAmount = diff / 1e9; // lamports to SOL
    }

    return { mintAddress, solAmount };
  } catch {
    return null;
  }
}

export function createPumpFunSubscription(
  apiKey: string,
  onEvent: (event: TokenEvent) => void,
  onError?: (error: unknown) => void,
  onConnectionFail?: () => void,
): { close: () => void } {
  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  let closed = false;
  let hasReceivedData = false;

  function connect() {
    if (closed) return;

    const wsUrl = `wss://mainnet.helius-rpc.com/?api-key=${apiKey}`;

    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      console.error('[Helius] WebSocket creation failed:', err);
      onConnectionFail?.();
      return;
    }

    ws.onopen = () => {
      console.log('[Helius] WebSocket connected');
      reconnectAttempts = 0;

      // Subscribe to Pump.fun program transactions
      ws?.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'transactionSubscribe',
        params: [
          {
            failed: false,
            accountInclude: [PUMP_FUN_PROGRAM],
          },
          {
            commitment: 'confirmed',
            encoding: 'jsonParsed',
            transactionDetails: 'full',
            maxSupportedTransactionVersion: 0,
          },
        ],
      }));

      // Keep-alive ping every 30s
      const pingInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ jsonrpc: '2.0', id: 'ping', method: 'ping' }));
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        // Skip subscription confirmation
        if (data.result !== undefined && !data.params) {
          console.log('[Helius] Subscription confirmed:', data.result);
          return;
        }

        // Handle transaction notifications
        if (data.method === 'transactionNotification' && data.params?.result) {
          hasReceivedData = true;
          const txResult = data.params.result;
          const txData = txResult.transaction;

          if (!txData) return;

          const tokenInfo = extractTokenInfo(txData);
          if (!tokenInfo || !tokenInfo.mintAddress) return;

          // Fetch metadata asynchronously and emit event
          fetchTokenMetadata(tokenInfo.mintAddress, apiKey).then((meta) => {
            const event: TokenEvent = {
              name: meta?.name || tokenInfo.mintAddress.slice(0, 8),
              symbol: meta?.symbol || '???',
              mintAddress: tokenInfo.mintAddress,
              timestamp: Date.now(),
              initialBuyVolume: tokenInfo.solAmount * 150, // rough SOL->USD estimate
              tradeAmount: tokenInfo.solAmount,
            };
            onEvent(event);
          });
        }
      } catch (err) {
        onError?.(err);
      }
    };

    ws.onerror = (err) => {
      console.error('[Helius] WebSocket error:', err);
      onError?.(err);
    };

    ws.onclose = (ev) => {
      console.log('[Helius] WebSocket closed:', ev.code, ev.reason);
      if (closed) return;

      if (!hasReceivedData && reconnectAttempts >= 3) {
        console.warn('[Helius] Failed to connect after 3 attempts, falling back');
        onConnectionFail?.();
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts++;
      setTimeout(connect, delay);
    };
  }

  connect();

  // Timeout: if no data after 15s, fall back
  setTimeout(() => {
    if (!hasReceivedData && !closed) {
      console.warn('[Helius] No data received after 15s, falling back to demo');
      onConnectionFail?.();
    }
  }, 15000);

  return {
    close: () => {
      closed = true;
      ws?.close();
    },
  };
}
