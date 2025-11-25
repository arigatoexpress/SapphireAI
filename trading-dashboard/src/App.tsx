import React, { useState, useEffect } from 'react';
import { AppShell } from './layouts/AppShell';
import { BotPerformanceBoard } from './components/BotPerformanceBoard';
import { LiveAgentChat } from './components/LiveAgentChat';
import { TradeActivityFeed } from './components/TradeActivityFeed';
import { useDashboardWebSocket } from './hooks/useWebSocket';

// Mock data for initial render
const MOCK_BOTS = [
  {
    id: 'trend-momentum-agent',
    name: 'Trend Momentum',
    emoji: '⚡',
    pnl: 12.45,
    pnlPercent: 12.45,
    allocation: 100,
    activePositions: 2,
    history: [
      { time: '00:00', value: 100 },
      { time: '04:00', value: 102 },
      { time: '08:00', value: 101 },
      { time: '12:00', value: 108 },
      { time: '16:00', value: 112.45 },
    ]
  },
  {
    id: 'financial-sentiment-agent',
    name: 'Sentiment Analysis',
    emoji: '💭',
    pnl: -2.30,
    pnlPercent: -2.30,
    allocation: 100,
    activePositions: 1,
    history: [
      { time: '00:00', value: 100 },
      { time: '04:00', value: 99 },
      { time: '08:00', value: 98 },
      { time: '12:00', value: 98.5 },
      { time: '16:00', value: 97.7 },
    ]
  },
  {
    id: 'market-prediction-agent',
    name: 'Market Prediction',
    emoji: '🔮',
    pnl: 5.10,
    pnlPercent: 5.10,
    allocation: 100,
    activePositions: 0,
    history: [
      { time: '00:00', value: 100 },
      { time: '04:00', value: 101 },
      { time: '08:00', value: 103 },
      { time: '12:00', value: 104 },
      { time: '16:00', value: 105.1 },
    ]
  },
];

const MOCK_MESSAGES = [
  {
    id: '1',
    agentId: 'trend-momentum-agent',
    agentName: 'Trend Momentum',
    role: 'ANALYSIS',
    content: 'BTCUSDT showing strong bullish divergence on 15m timeframe. RSI oversold.',
    timestamp: new Date().toISOString(),
    tags: ['technical', 'bullish'],
    relatedSymbol: 'BTCUSDT'
  },
  {
    id: '2',
    agentId: 'financial-sentiment-agent',
    agentName: 'Sentiment Analysis',
    role: 'CONFIRMATION',
    content: 'Social sentiment score +0.85. High volume of positive mentions on X regarding ETF inflows.',
    timestamp: new Date().toISOString(),
    tags: ['sentiment', 'news'],
    relatedSymbol: 'BTCUSDT'
  },
  {
    id: '3',
    agentId: 'system',
    agentName: 'System',
    role: 'DECISION',
    content: 'Consensus reached: BUY BTCUSDT. Confidence: 0.88',
    timestamp: new Date().toISOString(),
  }
];

const MOCK_TRADES = [
  {
    id: 't1',
    symbol: 'BTCUSDT',
    side: 'BUY',
    type: 'MARKET',
    price: 97450.20,
    quantity: 0.0005,
    total: 48.72,
    timestamp: new Date().toISOString(),
    status: 'FILLED',
    agentId: 'trend-momentum-agent'
  }
] as const;

function App() {
  const { data, connected } = useDashboardWebSocket();
  
  // Use real data if available, otherwise fallback to mock for visual testing
  const bots = data?.agents || MOCK_BOTS;
  const messages = data?.messages || MOCK_MESSAGES;
  const trades = data?.recentTrades || MOCK_TRADES;
  
  const totalValue = bots.reduce((acc: number, bot: any) => acc + bot.allocation + bot.pnl, 0);
  const totalPnl = bots.reduce((acc: number, bot: any) => acc + bot.pnl, 0);
  const pnlPercent = (totalPnl / 600) * 100; // Based on $600 initial capital

  return (
    <AppShell connectionStatus={connected ? 'connected' : 'disconnected'}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Performance & Trades */}
        <div className="xl:col-span-2 space-y-6">
          <BotPerformanceBoard 
            bots={bots}
            totalValue={totalValue}
            dayChange={totalPnl}
            dayChangePercent={pnlPercent}
          />
          <TradeActivityFeed trades={trades as any} />
        </div>

        {/* Right Column: Agent Chat */}
        <div className="xl:col-span-1">
          <LiveAgentChat messages={messages} />
        </div>
      </div>
    </AppShell>
  );
}

export default App;
