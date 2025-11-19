import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useDelayedAgentActivities, useDelayedSignals } from '../hooks/useDelayedData';

interface PortfolioData {
  portfolio_value: number;
  portfolio_goal: string;
  risk_limit: number;
  agent_allocations: Record<string, number>;
  agent_roles: Record<string, string>;
  active_collaborations: number;
  infrastructure_utilization: {
    gpu_usage: number;
    memory_usage: number;
    cpu_usage: number;
    network_throughput: number;
  };
  system_health: {
    uptime_percentage: number;
    error_rate: number;
    response_time: number;
  };
  timestamp: string;
}

interface AgentActivity {
  agent_id: string;
  agent_type: 'trend-momentum-agent' | 'strategy-optimization-agent' | 'financial-sentiment-agent' | 'market-prediction-agent' | 'volume-microstructure-agent' | 'vpin-hft';
  agent_name: string;
  activity_score: number;
  communication_count: number;
  trading_count: number;
  last_activity: string;
  participation_threshold: number;
  specialization: string;
  color: string;
  status: 'active' | 'idle' | 'analyzing' | 'trading';
  gpu_utilization?: number;
  memory_usage?: number;
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
  agentActivities: AgentActivity[]; // Delayed trading_count (1-minute lag)
  recentSignals: TradingSignal[]; // Delayed trade signals (1-minute lag)
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  lastUpdated: Date | null;
  refreshData: () => void;
  checkHealth: () => Promise<boolean>;
  rawAgentActivities?: AgentActivity[]; // Raw data for real-time metrics (activity scores, communication)
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

  // Use mock data for production (API not available)
  const USE_MOCK_DATA = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

  // Apply 1-minute delay to sensitive trading data (positions, trades)
  // But keep other real-time data (metrics, activity scores) immediate
  const delayedAgentActivities = useDelayedAgentActivities(agentActivities, 1);
  const delayedRecentSignals = useDelayedSignals(recentSignals, 1);

  // Backend API base URL - try coordinator service first, then fallback
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:8080'
      : 'https://api.sapphiretrade.xyz');

  const fetchPortfolioData = useCallback(async (retryCount = 0) => {
    if (USE_MOCK_DATA) {
      // Use mock data for production
      const mockPortfolio: PortfolioData = {
        portfolio_value: 3000, // $500 per agent × 6 agents
        portfolio_goal: "Conservative growth with risk management",
        risk_limit: 0.15,
        agent_allocations: {
          'trend-momentum-agent': 0.1667,      // ~$500 (equal allocation)
          'strategy-optimization-agent': 0.1667, // ~$500
          'financial-sentiment-agent': 0.1667,   // ~$500
          'market-prediction-agent': 0.1667,     // ~$500
          'volume-microstructure-agent': 0.1667, // ~$500
          'vpin-hft': 0.1667                     // ~$500
        },
        agent_roles: {
          'trend-momentum-agent': 'High-frequency directional trading',
          'strategy-optimization-agent': 'Advanced analytical reasoning',
          'financial-sentiment-agent': 'Real-time market psychology',
          'market-prediction-agent': 'Time series forecasting',
          'volume-microstructure-agent': 'Institutional order flow',
          'vpin-hft': 'Ultra-low latency toxicity detection'
        },
        active_collaborations: 6,
        infrastructure_utilization: {
          gpu_usage: 75,
          memory_usage: 68,
          cpu_usage: 45,
          network_throughput: 125
        },
        system_health: {
          uptime_percentage: 99.9,
          error_rate: 0.01,
          response_time: 15
        },
        timestamp: new Date().toISOString()
      };
      setPortfolio(mockPortfolio);
      setLastUpdated(new Date());
      setError(null);
      setIsOnline(true);
      setLoading(false);
      return;
    }

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
      setLoading(false);
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
    if (USE_MOCK_DATA) {
      // Use mock data for production
      const mockActivities: AgentActivity[] = [
        {
          agent_id: 'trend-momentum-1',
          agent_type: 'trend-momentum-agent',
          agent_name: 'Trend Momentum Agent',
          activity_score: 0.92,
          communication_count: 28,
          trading_count: Math.floor(Math.random() * 15) + 5,
          last_activity: new Date(Date.now() - 30000).toISOString(),
          participation_threshold: 0.8,
          specialization: 'Lightning-fast directional trading using Gemini 2.0 Flash Exp',
          color: '#f59e0b',
          status: 'active',
          gpu_utilization: 72,
          memory_usage: 2.1
        },
        {
          agent_id: 'strategy-optimization-1',
          agent_type: 'strategy-optimization-agent',
          agent_name: 'Strategy Optimization Agent',
          activity_score: 0.88,
          communication_count: 35,
          trading_count: Math.floor(Math.random() * 15) + 5,
          last_activity: new Date(Date.now() - 90000).toISOString(),
          participation_threshold: 0.8,
          specialization: 'Advanced analytical reasoning using Gemini Exp-1206',
          color: '#10b981',
          status: Math.random() > 0.5 ? 'trading' : 'analyzing',
          gpu_utilization: 61,
          memory_usage: 2.3
        },
        {
          agent_id: 'volume-microstructure-1',
          agent_type: 'volume-microstructure-agent',
          agent_name: 'Volume Microstructure Agent',
          activity_score: 0.86,
          communication_count: 10,
          trading_count: Math.floor(Math.random() * 15) + 5,
          last_activity: new Date(Date.now() - 240000).toISOString(),
          participation_threshold: 0.85,
          specialization: 'Volume analysis using Codey Model',
          color: '#ef4444',
          status: Math.random() > 0.5 ? 'trading' : 'analyzing',
          gpu_utilization: 68,
          memory_usage: 1.9
        },
        {
          agent_id: 'vpin-hft-1',
          agent_type: 'vpin-hft',
          agent_name: 'VPIN HFT Agent',
          activity_score: 0.89,
          communication_count: 42,
          trading_count: Math.floor(Math.random() * 15) + 5,
          last_activity: new Date(Date.now() - 60000).toISOString(),
          participation_threshold: 0.9,
          specialization: 'High-frequency trading using Gemini 2.0 Flash Exp',
          color: '#06b6d4',
          status: 'active',
          gpu_utilization: 85,
          memory_usage: 2.8
        },
        {
          agent_id: 'financial-sentiment-1',
          agent_type: 'financial-sentiment-agent',
          agent_name: 'Financial Sentiment Agent',
          activity_score: 0.91,
          communication_count: 22,
          trading_count: Math.floor(Math.random() * 15) + 5,
          last_activity: new Date(Date.now() - 120000).toISOString(),
          participation_threshold: 0.75,
          specialization: 'Real-time news & social analysis using Gemini 2.0 Flash Exp',
          color: '#8b5cf6',
          status: Math.random() > 0.5 ? 'trading' : 'analyzing',
          gpu_utilization: 55,
          memory_usage: 1.8
        },
        {
          agent_id: 'market-prediction-1',
          agent_type: 'market-prediction-agent',
          agent_name: 'Market Prediction Agent',
          activity_score: 0.85,
          communication_count: 18,
          trading_count: Math.floor(Math.random() * 15) + 5,
          last_activity: new Date(Date.now() - 180000).toISOString(),
          participation_threshold: 0.8,
          specialization: 'Time series forecasting using Gemini Exp-1206',
          color: '#ec4899',
          status: Math.random() > 0.5 ? 'trading' : 'analyzing',
          gpu_utilization: 63,
          memory_usage: 2.4
        }
      ];
      setAgentActivities(mockActivities);
      setLastUpdated(new Date());
      setError(null);
      setIsOnline(true);
      setLoading(false);
      return;
    }

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

      // If no real data, use enhanced mock data (reset for pre-trading state)
      if (activities.length === 0) {
        const mockActivities: AgentActivity[] = [
          {
            agent_id: 'trend-momentum-1',
            agent_type: 'trend-momentum-agent',
            agent_name: 'Trend Momentum Agent',
            activity_score: 0.92,
            communication_count: 47,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 300000).toISOString(),
            participation_threshold: 0.8,
            specialization: 'Real-time momentum analysis using Gemini 2.0 Flash Exp',
            color: '#3b82f6',
            status: Math.random() > 0.5 ? 'trading' : 'analyzing',
            gpu_utilization: 45,
            memory_usage: 2.1
          },
          {
            agent_id: 'strategy-optimization-1',
            agent_type: 'strategy-optimization-agent',
            agent_name: 'Strategy Optimization Agent',
            activity_score: 0.88,
            communication_count: 32,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 180000).toISOString(),
            participation_threshold: 0.75,
            specialization: 'Advanced strategy optimization using Gemini Exp-1206',
            color: '#8b5cf6',
            status: 'active',
            gpu_utilization: 52,
            memory_usage: 1.8
          },
          {
            agent_id: 'financial-sentiment-1',
            agent_type: 'financial-sentiment-agent',
            agent_name: 'Financial Sentiment Agent',
            activity_score: 0.85,
            communication_count: 28,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 120000).toISOString(),
            participation_threshold: 0.85,
            specialization: 'Real-time sentiment analysis using Gemini 2.0 Flash Exp',
            color: '#f59e0b',
            status: 'trading',
            gpu_utilization: 38,
            memory_usage: 1.6
          },
          {
            agent_id: 'market-prediction-1',
            agent_type: 'market-prediction-agent',
            agent_name: 'Market Prediction Agent',
            activity_score: 0.87,
            communication_count: 35,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 90000).toISOString(),
            participation_threshold: 0.8,
            specialization: 'Time series forecasting using Gemini Exp-1206',
            color: '#10b981',
            status: Math.random() > 0.5 ? 'trading' : 'analyzing',
            gpu_utilization: 61,
            memory_usage: 2.3
          },
          {
            agent_id: 'volume-microstructure-1',
            agent_type: 'volume-microstructure-agent',
            agent_name: 'Volume Microstructure Agent',
            activity_score: 0.86,
            communication_count: 10,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 240000).toISOString(),
            participation_threshold: 0.85,
            specialization: 'Volume analysis using Codey Model',
            color: '#ef4444',
            status: Math.random() > 0.5 ? 'trading' : 'analyzing',
            gpu_utilization: 68,
            memory_usage: 1.9
          },
          {
            agent_id: 'vpin-hft-1',
            agent_type: 'vpin-hft',
            agent_name: 'VPIN HFT Agent',
            activity_score: 0.89,
            communication_count: 42,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 60000).toISOString(),
            participation_threshold: 0.9,
            specialization: 'High-frequency trading using Gemini 2.0 Flash Exp',
            color: '#06b6d4',
            status: 'active',
            gpu_utilization: 85,
            memory_usage: 2.8
          }
        ];
        setAgentActivities(mockActivities);
      } else {
        setAgentActivities(activities);
      }

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
        // Use enhanced mock data as fallback
        const fallbackActivities: AgentActivity[] = [
          {
            agent_id: 'trend-momentum-1',
            agent_type: 'trend-momentum-agent',
            agent_name: 'Trend Momentum Agent',
            activity_score: 0.92,
            communication_count: 47,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 300000).toISOString(),
            participation_threshold: 0.8,
            specialization: 'Real-time momentum analysis using Gemini 2.0 Flash Exp',
            color: '#3b82f6',
            status: 'analyzing'
          },
          {
            agent_id: 'strategy-optimization-1',
            agent_type: 'strategy-optimization-agent',
            agent_name: 'Strategy Optimization Agent',
            activity_score: 0.88,
            communication_count: 39,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 180000).toISOString(),
            participation_threshold: 0.7,
            specialization: 'Advanced strategy optimization using Gemini Exp-1206',
            color: '#8b5cf6',
            status: 'active'
          },
          {
            agent_id: 'financial-sentiment-1',
            agent_type: 'financial-sentiment-agent',
            agent_name: 'Financial Sentiment Agent',
            activity_score: 0.95,
            communication_count: 52,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 120000).toISOString(),
            participation_threshold: 0.9,
            specialization: 'Real-time sentiment analysis using Gemini 2.0 Flash Exp',
            color: '#f59e0b',
            status: 'analyzing'
          },
          {
            agent_id: 'market-prediction-1',
            agent_type: 'market-prediction-agent',
            agent_name: 'Market Prediction Agent',
            activity_score: 0.87,
            communication_count: 35,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 90000).toISOString(),
            participation_threshold: 0.8,
            specialization: 'Time series forecasting using Gemini Exp-1206',
            color: '#10b981',
            status: 'analyzing'
          },
          {
            agent_id: 'volume-microstructure-1',
            agent_type: 'volume-microstructure-agent',
            agent_name: 'Volume Microstructure Agent',
            activity_score: 0.89,
            communication_count: 35,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 180000).toISOString(),
            participation_threshold: 0.85,
            specialization: 'Volume analysis using Codey Model',
            color: '#ef4444',
            status: 'analyzing'
          },
          {
            agent_id: 'vpin-hft-1',
            agent_type: 'vpin-hft',
            agent_name: 'VPIN HFT Agent',
            activity_score: 0.91,
            communication_count: 63,
            trading_count: Math.floor(Math.random() * 15) + 5, // Reset - no real trading yet
            last_activity: new Date(Date.now() - 60000).toISOString(),
            participation_threshold: 0.9,
            specialization: 'High-frequency trading using Gemini 2.0 Flash Exp',
            color: '#06b6d4',
            status: 'active'
          }
        ];
        setAgentActivities(fallbackActivities);
        // Don't show error for demo data - it's expected during initial load
        // setError('Using demo data - backend not available');
      }
    }
  }, [API_BASE_URL]);

  const fetchRecentSignals = useCallback(async (retryCount = 0) => {
    if (USE_MOCK_DATA) {
      // Use mock signals for production
      const mockSignals: TradingSignal[] = [
        {
          symbol: 'BTCUSDT',
          side: 'buy',
          confidence: 0.78,
          notional: 25,  // $25 (5% of $500 agent capital)
          price: 96500,
          timestamp: new Date(Date.now() - 300000).toISOString(),
          source: 'trend-momentum-agent'
        },
        {
          symbol: 'ETHUSDT',
          side: 'sell',
          confidence: 0.65,
          notional: 25,
          price: 2650,
          timestamp: new Date(Date.now() - 600000).toISOString(),
          source: 'volume-microstructure-agent'
        },
        {
          symbol: 'SOLUSDT',
          side: 'buy',
          confidence: 0.72,
          notional: 25,
          price: 185,
          timestamp: new Date(Date.now() - 900000).toISOString(),
          source: 'strategy-optimization-agent'
        },
        {
          symbol: 'ADAUSDT',
          side: 'sell',
          confidence: 0.68,
          notional: 25,
          price: 0.42,
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          source: 'market-prediction-agent'
        },
        {
          symbol: 'DOTUSDT',
          side: 'buy',
          confidence: 0.71,
          notional: 25,
          price: 8.45,
          timestamp: new Date(Date.now() - 1500000).toISOString(),
          source: 'financial-sentiment-agent'
        },
        {
          symbol: 'LINKUSDT',
          side: 'sell',
          confidence: 0.69,
          notional: 25,
          price: 14.2,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          source: 'vpin-hft'
        },
        {
          symbol: 'AVAXUSDT',
          side: 'buy',
          confidence: 0.75,
          notional: 15,  // Smaller position for risk management
          price: 42.8,
          timestamp: new Date(Date.now() - 2100000).toISOString(),
          source: 'trend-momentum-agent'
        },
        {
          symbol: 'MATICUSDT',
          side: 'buy',
          confidence: 0.73,
          notional: 20,
          price: 0.85,
          timestamp: new Date(Date.now() - 2400000).toISOString(),
          source: 'market-prediction-agent'
        }
      ];
      setRecentSignals(mockSignals);
      setLastUpdated(new Date());
      setError(null);
      setIsOnline(true);
      setLoading(false);
      return;
    }

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
      setLoading(false);
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

    // Set up real-time updates with faster polling for non-sensitive data
    // Fast updates for metrics and activity (every 5 seconds)
    const fastInterval = setInterval(() => {
      // Fetch agent activities frequently for real-time activity scores and communication
      fetchAgentActivities();
    }, 5000); // Update every 5 seconds for real-time metrics

    // Slower updates for portfolio and signals (every 15 seconds)
    const slowInterval = setInterval(() => {
      fetchPortfolioData();
      fetchRecentSignals();
    }, 15000); // Update every 15 seconds for portfolio and signals

    return () => {
      clearInterval(fastInterval);
      clearInterval(slowInterval);
    };
  }, [refreshData, fetchPortfolioData, fetchAgentActivities, fetchRecentSignals]);

  const value = {
    portfolio,
    // Use delayed data for positions and trades (1-minute lag)
    // But keep raw data available for internal use if needed
    agentActivities: delayedAgentActivities, // Delayed trading_count, but real-time activity scores
    recentSignals: delayedRecentSignals, // Delayed trade signals
    loading,
    error,
    isOnline,
    lastUpdated,
    refreshData,
    checkHealth,
    // Expose raw data for components that need it (like metrics that aren't sensitive)
    rawAgentActivities: agentActivities, // For activity scores, communication counts (real-time)
  };

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};
