import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useDashboardWebSocket } from '../hooks/useWebSocket';

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
  active?: boolean;
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
  agent: string;
  tp?: number;
  sl?: number;
  system?: 'ASTER' | 'HYPERLIQUID';
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
  agent: string;
  role: string;
  content: string;
  type?: string;
  message?: string;
}

export interface MarketRegime {
  current_regime: string;
  volatility_score: number;
  trend_score: number;
  liquidity_score: number;
}

export interface RecentActivityItem {
  symbol: string;
  timestamp: number;
  winning_signal: string;
  confidence: number;
  agreement: number;
  is_strong: boolean;
  reasoning?: string;
}

export interface DashboardData {
  // Restoring flat properties used by components
  total_pnl: number;
  portfolio_value: number;
  cash_balance: number;
  total_pnl_percent: number;

  agents: Agent[];
  metrics: {
    total_pnl: number;
    daily_pnl: number;
    win_rate: number;
    sharpe_ratio: number;
  };
  open_positions: Position[];
  recent_trades: Trade[];
  recent_activity: RecentActivityItem[];
  market_regime: MarketRegime;
  logs: LogMessage[];
  connected: boolean;
  apiBaseUrl: string;
  portfolio_history: number[];  // Last 24 values for sparkline
}

// --- Context Definition ---
const TradingContext = createContext<DashboardData | undefined>(undefined);

// Agent emojis mapping
const AGENT_EMOJIS: Record<string, string> = {
  'trend-momentum-agent': '📈',
  'market-maker-agent': '🏦',
  'swing-trader-agent': '🔄',
};

const AGENT_NAMES: Record<string, string> = {
  'trend-momentum-agent': 'Trend Momentum',
  'market-maker-agent': 'Market Maker',
  'swing-trader-agent': 'Swing Trader',
};

// --- Safe Defaults ---
const DEFAULT_DATA: DashboardData = {
  total_pnl: 0,
  portfolio_value: 0,
  cash_balance: 0,
  total_pnl_percent: 0,

  agents: [],
  metrics: {
    total_pnl: 0,
    daily_pnl: 0,
    win_rate: 0,
    sharpe_ratio: 0,
  },
  open_positions: [],
  recent_trades: [],
  recent_activity: [],
  market_regime: {
    current_regime: 'Neutral',
    volatility_score: 0,
    trend_score: 0,
    liquidity_score: 0,
  },
  logs: [],
  connected: false,
  apiBaseUrl: 'https://cloud-trader-267358751314.europe-west1.run.app',
  portfolio_history: [],
};

// --- Provider ---
export const TradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const portfolioHistoryRef = useRef<number[]>([]);

  // WebSocket connection - primary data source
  const { data: wsData, connected: wsConnected } = useDashboardWebSocket();

  const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    return 'https://cloud-trader-267358751314.europe-west1.run.app';
  };

  // Process WebSocket data when received
  useEffect(() => {
    if (wsData && wsConnected) {
      const portfolioValue = wsData.portfolio_balance || wsData.total_pnl || 0;

      // Track portfolio history for sparklines (keep last 24 values)
      if (portfolioValue > 0) {
        portfolioHistoryRef.current = [
          ...portfolioHistoryRef.current.slice(-23),
          portfolioValue
        ];
      }

      // Transform WebSocket data to our format
      const agents: Agent[] = (wsData.agents || []).map((agent: any) => ({
        id: agent.id || agent.name,
        name: AGENT_NAMES[agent.id] || agent.name || agent.id,
        type: 'AI Agent',
        status: 'active' as const,
        pnl: agent.pnl || 0,
        pnl_percent: agent.pnlPercent || 0,
        total_trades: agent.total_trades || 0,
        win_rate: agent.win_rate || 0,
        allocation: agent.allocation || 333,
        emoji: AGENT_EMOJIS[agent.id] || agent.emoji || '🤖',
        active: true
      }));

      const positions: Position[] = (wsData.open_positions || []).map((pos: any) => ({
        symbol: pos.symbol,
        side: pos.side,
        size: pos.quantity || pos.size || 0,
        entry_price: pos.entry_price || 0,
        mark_price: pos.current_price || pos.mark_price || 0,
        pnl: pos.pnl || 0,
        pnl_percent: pos.pnl_percent || 0,
        leverage: pos.leverage || 1,
        agent: pos.agent || '',
        tp: pos.tp,
        sl: pos.sl,
      }));

      setData(prev => ({
        ...prev,
        agents: agents.length > 0 ? agents : prev.agents,
        open_positions: positions,
        portfolio_value: portfolioValue || prev.portfolio_value,
        total_pnl: wsData.total_pnl || prev.total_pnl,
        total_pnl_percent: wsData.total_pnl_percent || prev.total_pnl_percent,
        cash_balance: wsData.portfolio_balance || prev.cash_balance,
        connected: true,
        portfolio_history: [...portfolioHistoryRef.current],
        market_regime: wsData.marketRegime ? {
          current_regime: wsData.marketRegime.regime || 'Active',
          volatility_score: wsData.marketRegime.volatility_level || 0,
          trend_score: wsData.marketRegime.trend_strength || 0,
          liquidity_score: wsData.marketRegime.confidence || 0,
        } : prev.market_regime,
      }));
    }
  }, [wsData, wsConnected]);

  // Fallback polling when WebSocket is disconnected
  const fetchData = async () => {
    if (wsConnected) return; // Skip if WebSocket is connected

    try {
      const apiUrl = getApiUrl();
      const [consensusRes, healthRes] = await Promise.all([
        fetch(`${apiUrl}/consensus/state`).catch(() => null),
        fetch(`${apiUrl}/health`).catch(() => null)
      ]);

      if (consensusRes?.ok) {
        const consensusData = await consensusRes.json();
        const healthData = healthRes?.ok ? await healthRes.json() : { running: true };
        const stats = consensusData.stats || {};

        const agentPerformance = stats.agent_performance || {};
        const agents: Agent[] = Object.entries(agentPerformance).map(([id, perf]: [string, any]) => ({
          id,
          name: AGENT_NAMES[id] || id.replace(/-/g, ' ').replace('agent', '').trim(),
          type: 'AI Agent',
          status: 'active' as const,
          pnl: 0,
          pnl_percent: 0,
          total_trades: perf.total_trades || 0,
          win_rate: perf.win_rate || 0,
          allocation: (perf.current_weight || 1) * 333,
          emoji: AGENT_EMOJIS[id] || '🤖',
          active: true
        }));

        const recentActivity: RecentActivityItem[] = Array.isArray(stats.recent_activity)
          ? stats.recent_activity
          : [];

        setData(prev => ({
          ...prev,
          agents,
          total_pnl: consensusData.total_pnl || 0,
          total_pnl_percent: consensusData.total_pnl_percent || 0,
          portfolio_value: consensusData.portfolio_value || prev.portfolio_value || 0,
          cash_balance: consensusData.cash_balance || prev.cash_balance || 0,
          market_regime: {
            current_regime: healthData.running ? 'Active Trading' : 'Idle',
            volatility_score: stats.avg_confidence || 0,
            trend_score: stats.avg_agreement || 0,
            liquidity_score: stats.success_rate || 0
          },
          recent_activity: recentActivity,
          connected: healthData.running,
          apiBaseUrl: apiUrl
        }));
      }
    } catch (e) {
      console.error('❌ [Context] Fetch failed:', e);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 15 seconds as fallback (increased from 10s since WebSocket is primary)
    pollIntervalRef.current = setInterval(fetchData, 15000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [wsConnected]);

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
