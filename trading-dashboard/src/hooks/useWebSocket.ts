import { useState, useEffect, useRef } from 'react';

interface DashboardData {
  timestamp: number;
  total_pnl: number;
  portfolio_balance: number;
  total_exposure: number;
  agents: Array<{
    id: string;
    name: string;
    pnl: number;
    active_positions: number;
    total_trades: number;
  }>;
  active_positions_count: number;
  grok_overrides?: number;
}

interface UseWebSocketReturn {
  data: DashboardData | null;
  connected: boolean;
  error: string | null;
}

export const useDashboardWebSocket = (url?: string): UseWebSocketReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const wsUrl = url || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/dashboard`;

  const connect = () => {
    try {
      // For development, connect to backend API
      const backendUrl = import.meta.env.VITE_API_URL || 'wss://api.sapphiretrade.xyz';
      const fullWsUrl = url || `${backendUrl}/ws/dashboard`;

      const ws = new WebSocket(fullWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Dashboard WebSocket connected');
        setConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          setData(update);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
        setConnected(false);
      };

      ws.onclose = () => {
        console.log('🔴 Dashboard WebSocket disconnected');
        setConnected(false);

        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 5000);
      };
    } catch (e) {
      console.error('Failed to create WebSocket connection:', e);
      setError('Failed to connect');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl]);

  return { data, connected, error };
};

export default useDashboardWebSocket;
