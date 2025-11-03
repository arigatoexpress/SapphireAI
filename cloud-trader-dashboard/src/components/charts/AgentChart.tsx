import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

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

const AgentChart: React.FC<AgentChartProps> = ({ data, height = 120, showBenchmark = false }) => {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      time: new Date(point.timestamp).getTime(),
      equity: point.equity,
      benchmark: point.benchmark || 0,
    }));
  }, [data]);

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatTime = (time: number) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (chartData.length === 0) {
    return (
      <div className={`h-${height} w-full flex items-center justify-center text-slate-500 text-xs`}>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4c63ff" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4c63ff" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tick={false}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={false}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatValue(value),
            name === 'equity' ? 'Agent Equity' : 'Benchmark'
          ]}
          labelFormatter={(time) => formatTime(time)}
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '6px',
            color: '#cbd5f5',
            fontSize: '12px',
          }}
        />
        <Area
          type="monotone"
          dataKey="equity"
          stroke="#4c63ff"
          fillOpacity={1}
          fill="url(#equityGradient)"
          strokeWidth={1.5}
        />
        {showBenchmark && (
          <Area
            type="monotone"
            dataKey="benchmark"
            stroke="#22d3ee"
            fillOpacity={1}
            fill="url(#benchmarkGradient)"
            strokeWidth={1}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AgentChart;
