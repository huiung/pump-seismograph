import { TokenEvent } from '@/lib/classifier';

const BITQUERY_WSS = 'wss://streaming.bitquery.io/eap?token=';

const PUMP_SUBSCRIPTION = `
subscription {
  Solana {
    DEXTradeByTokens(
      where: {
        Trade: {
          Dex: {
            ProtocolName: { is: "pump" }
          }
        }
        Transaction: { Result: { Success: true } }
      }
    ) {
      Trade {
        Currency {
          Name
          Symbol
          MintAddress
          Description
        }
        Amount
        AmountInUSD
        Side {
          Amount
          AmountInUSD
        }
      }
      Block {
        Time
      }
    }
  }
}
`;

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

    try {
      ws = new WebSocket(`${BITQUERY_WSS}${apiKey}`, 'graphql-ws');
    } catch (err) {
      console.error('[Bitquery] WebSocket creation failed:', err);
      onConnectionFail?.();
      return;
    }

    ws.onopen = () => {
      console.log('[Bitquery] WebSocket connected');
      reconnectAttempts = 0;
      // graphql-ws protocol: send connection_init with auth
      ws?.send(JSON.stringify({
        type: 'connection_init',
        payload: { Authorization: `Bearer ${apiKey}` },
      }));
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        // Handle connection_ack -> send subscription
        if (data.type === 'connection_ack') {
          console.log('[Bitquery] Connection acknowledged, subscribing...');
          ws?.send(JSON.stringify({
            type: 'start',
            id: '1',
            payload: { query: PUMP_SUBSCRIPTION },
          }));
          return;
        }

        if (data.type === 'connection_error') {
          console.error('[Bitquery] Connection error:', data.payload);
          onError?.(data.payload);
          if (!hasReceivedData && reconnectAttempts >= 2) {
            onConnectionFail?.();
          }
          return;
        }

        if (data.type === 'error') {
          console.error('[Bitquery] Subscription error:', data.payload);
          onError?.(data.payload);
          return;
        }

        if (data.type !== 'data' || !data.payload?.data?.Solana?.DEXTradeByTokens) return;

        hasReceivedData = true;

        for (const trade of data.payload.data.Solana.DEXTradeByTokens) {
          const currency = trade.Trade.Currency;
          const event: TokenEvent = {
            name: currency.Name || '',
            symbol: currency.Symbol || '',
            description: currency.Description || undefined,
            mintAddress: currency.MintAddress || '',
            timestamp: new Date(trade.Block.Time).getTime(),
            initialBuyVolume: trade.Trade.AmountInUSD || 0,
            tradeAmount: trade.Trade.Side?.AmountInUSD || 0,
          };
          onEvent(event);
        }
      } catch (err) {
        onError?.(err);
      }
    };

    ws.onerror = (err) => {
      console.error('[Bitquery] WebSocket error:', err);
      onError?.(err);
    };

    ws.onclose = (ev) => {
      console.log('[Bitquery] WebSocket closed:', ev.code, ev.reason);
      if (closed) return;

      if (!hasReceivedData && reconnectAttempts >= 3) {
        console.warn('[Bitquery] Failed to connect after 3 attempts, falling back');
        onConnectionFail?.();
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts++;
      setTimeout(connect, delay);
    };
  }

  connect();

  // Timeout: if no data after 10s, fall back
  setTimeout(() => {
    if (!hasReceivedData && !closed) {
      console.warn('[Bitquery] No data received after 10s, falling back to demo');
      onConnectionFail?.();
    }
  }, 10000);

  return {
    close: () => {
      closed = true;
      ws?.close();
    },
  };
}
