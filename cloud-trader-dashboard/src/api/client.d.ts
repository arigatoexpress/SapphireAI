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
    positions?: Record<string, {
        symbol?: string;
        notional?: number;
    }>;
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
export declare const fetchHealth: () => Promise<HealthResponse>;
export declare const postStart: () => Promise<ActionResponse>;
export declare const postStop: () => Promise<ActionResponse>;
export declare const emergencyStop: () => Promise<ActionResponse>;
export declare const fetchDashboard: () => Promise<DashboardResponse>;
export {};
