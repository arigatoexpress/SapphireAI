import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface PortfolioData {
  portfolio_value: number;
  portfolio_goal: string;
  risk_limit: number;
  agent_allocations: Record<string, number>;
  agent_roles: Record<string, string>;
  active_collaborations: number;
  timestamp: string;
}

interface AgentActivity {
  agent_id: string;
  activity_score: number;
  communication_count: number;
  trading_count: number;
  last_activity: string;
  participation_threshold: number;
}

interface TradingSignal {
  symbol: string;
  side: string;
  confidence: number;
  notional: number;
  price: number;
  timestamp: string;
  source: string;
}

interface TradingContextType {
  portfolio: PortfolioData | null;
  agentActivities: AgentActivity[];
  recentSignals: TradingSignal[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  lastUpdated: Date | null;
  refreshData: () => void;
  checkHealth: () => Promise<boolean>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};

interface TradingProviderProps {
  children: React.ReactNode;
}

export const TradingProvider: React.FC<TradingProviderProps> = ({ children }) => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [recentSignals, setRecentSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Backend API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.sapphiretrade.xyz';

  const fetchPortfolioData = useCallback(async (retryCount = 0) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${API_BASE_URL}/portfolio-status`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setPortfolio(data);
      setLastUpdated(new Date());
      setError(null); // Clear any previous errors
      setIsOnline(true);
    } catch (err) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        setError('Request timeout - please check your connection');
      } else if (retryCount < 2) {
        // Retry up to 2 times with exponential backoff
        setTimeout(() => fetchPortfolioData(retryCount + 1), Math.pow(2, retryCount) * 1000);
        return;
      } else {
        setError('Failed to fetch portfolio data after retries');
      }
    }
  }, [API_BASE_URL]);

  const fetchAgentActivities = useCallback(async (retryCount = 0) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/agent-activity`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      const activities = Object.entries(data).map(([agent_id, activity]: [string, any]) => ({
        agent_id,
        ...activity
      }));
      setAgentActivities(activities);
      setLastUpdated(new Date());
      setError(null);
      setIsOnline(true);
    } catch (err) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        setError('Request timeout - please check your connection');
      } else if (retryCount < 2) {
        setTimeout(() => fetchAgentActivities(retryCount + 1), Math.pow(2, retryCount) * 1000);
        return;
      } else {
        setError('Failed to fetch agent activities after retries');
      }
    }
  }, [API_BASE_URL]);

  const fetchRecentSignals = useCallback(async (retryCount = 0) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/global-signals`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setRecentSignals(data.signals || []);
      setLastUpdated(new Date());
      setError(null);
      setIsOnline(true);
    } catch (err) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        setError('Request timeout - please check your connection');
      } else if (retryCount < 2) {
        setTimeout(() => fetchRecentSignals(retryCount + 1), Math.pow(2, retryCount) * 1000);
        return;
      } else {
        setError('Failed to fetch recent signals after retries');
      }
    }
  }, [API_BASE_URL]);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/healthz`, {
        signal: controller.signal,
        method: 'GET'
      });
      clearTimeout(timeoutId);

      const isHealthy = response.ok;
      setIsOnline(isHealthy);
      return isHealthy;
    } catch (err) {
      setIsOnline(false);
      return false;
    }
  }, [API_BASE_URL]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.allSettled([
        fetchPortfolioData(),
        fetchAgentActivities(),
        fetchRecentSignals()
      ]);
      // Promise.allSettled allows partial failures - if one API fails, others still succeed
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchPortfolioData, fetchAgentActivities, fetchRecentSignals]);

  useEffect(() => {
    refreshData();

    // Set up real-time updates (polling for now, can be upgraded to websockets later)
    const interval = setInterval(() => {
      // Use individual fetches for background updates to avoid blocking UI
      fetchPortfolioData();
      fetchAgentActivities();
      fetchRecentSignals();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [refreshData, fetchPortfolioData, fetchAgentActivities, fetchRecentSignals]);

  const value = {
    portfolio,
    agentActivities,
    recentSignals,
    loading,
    error,
    isOnline,
    lastUpdated,
    refreshData,
    checkHealth,
  };

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};
