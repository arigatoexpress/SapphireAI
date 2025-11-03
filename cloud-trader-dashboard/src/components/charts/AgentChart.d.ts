import React from 'react';
interface AgentChartData {
    timestamp: string;
    equity: number;
    benchmark?: number;
}
interface AgentChartProps {
    data: AgentChartData[];
    height?: number;
    showBenchmark?: boolean;
}
declare const AgentChart: React.FC<AgentChartProps>;
export default AgentChart;
