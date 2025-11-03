import React from 'react';
interface TradeRecord {
    id?: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    timestamp: string;
    model?: string | null;
    agent_id?: string | null;
    status?: string;
    notional?: number;
    source?: string;
    pnl?: number;
}
interface PerformanceTrendsProps {
    trades: TradeRecord[];
}
declare const PerformanceTrends: React.FC<PerformanceTrendsProps>;
export default PerformanceTrends;
