const API_URL = import.meta.env.VITE_API_URL || 'https://cloud-trader-cfxefrvooa-uc.a.run.app';
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || API_URL;

export interface HealthResponse {
  running: boolean;
  paper_trading: boolean;
  last_error: string | null;
  status?: string;
  service?: string;
}

interface ActionResponse {
  status: string;
}

export interface DashboardPosition {
  symbol: string;
  notional?: number;
  side?: string;
  size?: number;
  entry_price?: number;
  current_price?: number;
  pnl?: number;
  pnl_percent?: number;
  leverage?: number;
  model_used?: string;
  timestamp?: string;
}

export interface DashboardPortfolio {
  balance?: number;
  total_exposure?: number;
  positions?: Record<string, { symbol?: string; notional?: number }>;
  source?: string;
  alerts?: string[];
}

export interface DashboardTargets {
  daily_pnl_target: number;
  max_drawdown_limit: number;
  min_confidence_threshold: number;
  target_win_rate: number;
  alerts: string[];
}

export interface DashboardSystemStatus {
  services: Record<string, string>;
  models: Record<string, string>;
  redis_connected: boolean;
  timestamp: string;
}

export interface DashboardResponse {
  portfolio: DashboardPortfolio;
  positions: DashboardPosition[];
  recent_trades: any[];
  model_performance: any[];
  model_reasoning: any[];
  system_status: DashboardSystemStatus;
  targets: DashboardTargets;
}

const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = 10_000,
) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(id);
  }
};

export const fetchHealth = async (): Promise<HealthResponse> => {
  return (await fetchWithTimeout(`${API_URL}/healthz`)) as HealthResponse;
};

export const postStart = async (): Promise<ActionResponse> => {
  return (await fetchWithTimeout(`${API_URL}/start`, { method: 'POST' })) as ActionResponse;
};

export const postStop = async (): Promise<ActionResponse> => {
  return (await fetchWithTimeout(`${API_URL}/stop`, { method: 'POST' })) as ActionResponse;
};

export const emergencyStop = async (): Promise<ActionResponse> => {
  const ORCHESTRATOR_URL = 'https://wallet-orchestrator-880429861698.us-central1.run.app';
  return (await fetchWithTimeout(`${ORCHESTRATOR_URL}/emergency_stop`, { method: 'POST' })) as ActionResponse;
};

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  return (await fetchWithTimeout(`${DASHBOARD_URL}/dashboard`)) as DashboardResponse;
};

