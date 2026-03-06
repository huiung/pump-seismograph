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
): { close: () => void } {
  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  let closed = false;

  function connect() {
    if (closed) return;

    ws = new WebSocket(`${BITQUERY_WSS}${apiKey}`);

    ws.onopen = () => {
      reconnectAttempts = 0;
      ws?.send(JSON.stringify({ type: 'start', id: '1', payload: { query: PUMP_SUBSCRIPTION } }));
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type !== 'data' || !data.payload?.data?.Solana?.DEXTradeByTokens) return;

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
      onError?.(err);
    };

    ws.onclose = () => {
      if (closed) return;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts++;
      setTimeout(connect, delay);
    };
  }

  connect();

  return {
    close: () => {
      closed = true;
      ws?.close();
    },
  };
}
