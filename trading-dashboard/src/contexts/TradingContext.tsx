import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';

// --- Types ---
export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'stopped';
  pnl: number;
  pnl_percent: number;
  total_trades: number;
  win_rate: number;
  allocation: number;
  emoji?: string;
  active?: boolean; // Legacy support
}

export interface Position {
  symbol: string;
  side: 'BUY' | 'SELL';
  size: number;
  entry_price: number;
  mark_price: number;
  pnl: number;
  pnl_percent: number;
  leverage: number;
  agent: string; // "Aster Swarm" or "Hype Bull"
  tp?: number;
  sl?: number;
  system?: 'ASTER' | 'HYPERLIQUID'; // Derived
}

export interface Trade {
  id: string;
  symbol: string;
  side: string;
  price: number;
  size: number;
  timestamp: string;
  agent: string;
}

export interface LogMessage {
  id: string;
  timestamp: string;
  agent: string;      // "Hype Bull"
  role: string;       // "OBSERVATION", "BUY", "SELL"
  content: string;    // The thought process
  type?: string;      // Legacy "agent_log"
  message?: string;   // Legacy fallback
}

export interface MarketRegime {
  current_regime: string;
  volatility_score: number;
  trend_score: number;
  liquidity_score: number;
}

export interface DashboardData {
  total_pnl: number;
  total_pnl_percent: number;
  portfolio_value: number;
  cash_balance: number;
  agents: Agent[];
  open_positions: Position[];
  recent_trades: Trade[];
  market_regime: MarketRegime | null;
  logs: LogMessage[];
  connected: boolean;
  apiBaseUrl: string;
}

// --- Context Definition ---
const TradingContext = createContext<DashboardData | undefined>(undefined);

// --- Safe Defaults ---
const DEFAULT_DATA: DashboardData = {
  total_pnl: 0,
  total_pnl_percent: 0,
  portfolio_value: 0,
  cash_balance: 0,
  agents: [],
  open_positions: [],
  recent_trades: [],
  market_regime: null,
  logs: [],
  connected: false,
  apiBaseUrl: 'https://cloud-trader-267358751314.northamerica-northeast1.run.app',
};

// --- Provider ---
export const TradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine WS URL
  const getWsUrl = () => {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;

    // Cloud Run northamerica-northeast1
    return 'wss://cloud-trader-267358751314.northamerica-northeast1.run.app/ws/dashboard';
  };

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = getWsUrl();
    console.log(`🔌 [Context] Connecting to ${url}`);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ [Context] Connected');
      setConnected(true);
      setData(prev => ({ ...prev, connected: true }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // 1. Partial Updates (Logs)
        if (msg.type === 'agent_log') {
          setData(prev => ({
            ...prev,
            logs: [transformLog(msg.data), ...prev.logs].slice(0, 100)
          }));
          return;
        }

        // 2. Full Snapshots (Standard)
        if (msg.portfolio_value !== undefined || msg.total_pnl !== undefined) {
          setData(prev => ({
            ...prev,
            ...normalizeSnapshot(msg),
            logs: prev.logs, // Keep existing logs stream
            connected: true
          }));
        }

      } catch (e) {
        console.warn('⚠️ [Context] Malformed message:', e);
      }
    };

    ws.onclose = () => {
      console.log('❌ [Context] Disconnected');
      setConnected(false);
      setData(prev => ({ ...prev, connected: false }));
      wsRef.current = null;
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('🔥 [Context] Error:', err);
      ws.close();
    };
  };

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // Helper: Normalize Backend Data to Strict Shape
  const normalizeSnapshot = (raw: any): Partial<DashboardData> => {
    return {
      total_pnl: Number(raw.total_pnl) || 0,
      total_pnl_percent: Number(raw.total_pnl_percent) || 0,
      portfolio_value: Number(raw.portfolio_value) || 0,
      cash_balance: Number(raw.cash_balance) || 0,
      agents: Array.isArray(raw.agents) ? raw.agents.map(normalizeAgent) : [],
      open_positions: Array.isArray(raw.open_positions) ? raw.open_positions.map(normalizePosition) : [],
      recent_trades: Array.isArray(raw.trades) ? raw.trades : [],
      market_regime: raw.market_regime || null,
    };
  };

  const normalizeAgent = (a: any): Agent => ({
    id: a.id || a.name || 'unknown',
    name: a.name || 'Unknown Agent',
    type: a.type || 'Standard',
    status: a.active ? 'active' : 'idle',
    pnl: Number(a.pnl) || 0,
    pnl_percent: Number(a.pnl_percent) || 0,
    total_trades: Number(a.total_trades) || 0,
    win_rate: Number(a.win_rate) || 0,
    allocation: Number(a.allocation) || 0,
    emoji: a.emoji || '🤖',
    active: !!a.active
  });

  const normalizePosition = (p: any): Position => ({
    symbol: p.symbol || 'UNKNOWN',
    side: p.side || 'BUY',
    size: Number(p.size) || 0,
    entry_price: Number(p.entry_price) || 0,
    mark_price: Number(p.mark_price) || 0,
    pnl: Number(p.pnl) || 0,
    pnl_percent: Number(p.pnl_percent) || 0,
    leverage: Number(p.leverage) || 1,
    agent: p.agent || 'Manual',
    tp: p.tp ? Number(p.tp) : undefined,
    sl: p.sl ? Number(p.sl) : undefined,
    system: (p.agent && p.agent.toLowerCase().includes('hype')) ? 'HYPERLIQUID' : 'ASTER'
  });

  const transformLog = (raw: any): LogMessage => ({
    id: raw.id || `log_${Date.now()}`,
    timestamp: raw.timestamp || new Date().toISOString(),
    agent: raw.agentName || raw.agent || 'System',
    role: raw.role || 'INFO',
    content: raw.content || raw.message || '',
  });

  return (
    <TradingContext.Provider value={data}>
      {children}
    </TradingContext.Provider>
  );
};

// --- Hook ---
export const useTradingData = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTradingData must be used within a TradingProvider');
  }
  return context;
};
