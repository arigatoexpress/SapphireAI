import React, { useMemo } from 'react';
import {
  Globe,
  Zap,
  Activity,
  Cpu,
  Target
} from 'lucide-react';
import { LiveAgentChat } from '../components/LiveAgentChat';
import { TradeActivityFeed } from '../components/TradeActivityFeed';
import { SystemComparisonBoard } from '../components/SystemComparisonBoard';
import { BotPerformanceChart } from '../components/BotPerformanceChart';
import { MarketRegimeWidget } from '../components/MarketRegimeWidget';

interface DualityDashboardProps {
  bots: any[];
  messages: any[];
  trades: any[];
  openPositions: any[];
  totalValue: number;
  totalPnl: number;
  pnlPercent: number;
  systems?: any;
  marketRegime?: any;
  data?: any; // Full dashboard data object
}

export const DualityDashboard: React.FC<DualityDashboardProps> = ({
  bots,
  messages,
  trades,
  openPositions,
  totalValue,
  totalPnl,
  pnlPercent,
  systems,
  marketRegime,
  data
}) => {

  // Filter Data by System
  const asterBots = useMemo(() => bots.filter(b => !b.system || b.system === 'aster'), [bots]);
  const hypeBots = useMemo(() => bots.filter(b => b.system === 'hyperliquid'), [bots]);

  const asterPositions = useMemo(() => openPositions.filter(p => !p.system || p.system === 'aster'), [openPositions]);
  const hypePositions = useMemo(() => openPositions.filter(p => p.system === 'hyperliquid'), [openPositions]);

  // Calculate position PnL totals per exchange
  const asterPositionPnL = useMemo(() =>
    asterPositions.reduce((acc, p) => acc + (p.pnl || 0), 0),
    [asterPositions]
  );
  const hypePositionPnL = useMemo(() =>
    hypePositions.reduce((acc, p) => acc + (p.pnl || 0), 0),
    [hypePositions]
  );
  const totalPositionPnL = asterPositionPnL + hypePositionPnL;

  // Use backend provided metrics if available, otherwise fallback to calculation
  const asterMetrics = systems?.aster || {
    pnl: trades.filter(t => !t.system || t.system === 'aster').reduce((acc, t) => acc + (t.pnl || 0), 0),
    volume: trades.filter(t => !t.system || t.system === 'aster').reduce((acc, t) => acc + (t.value || 0), 0),
    fees: 0,
    win_rate: 0,
    active_agents: asterBots.filter(b => b.active).length,
    swept_profits: 0
  };

  const hypeMetrics = systems?.hyperliquid || {
    pnl: 0,
    volume: 0,
    fees: 0,
    win_rate: 0,
    active_agents: hypeBots.length,
    swept_profits: 0
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white p-4 md:p-6 overflow-x-hidden relative font-sans selection:bg-blue-500/30">
      {/* Holographic Background */}
      <div className="holographic-grid" />

      {/* Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header Section */}
      <header className="relative z-10 mb-12 text-center">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
          <div className="status-dot bg-emerald-500" />
          <span className="text-[10px] font-mono tracking-widest text-emerald-200/80 uppercase">System Architecture: Multichain Agentic Perp Swarm</span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-4">
          {/* ASTER BRANDING */}
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h1 className="relative text-7xl md:text-9xl font-black tracking-tighter text-blue-500 hover:text-blue-400 transition-colors duration-300 cursor-default drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]">
              ASTER
            </h1>
          </div>

          {/* ACTIVE STATUS INDICATOR */}
          <div className="relative w-32 h-20 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Active</span>
            </div>
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* HYPERLIQUID BRANDING */}
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h1 className="relative text-7xl md:text-9xl font-black tracking-tighter text-emerald-500 hover:text-emerald-400 transition-colors duration-300 cursor-default drop-shadow-[0_0_25px_rgba(16,185,129,0.6)]">
              HYPE
            </h1>
          </div>
        </div>

        {/* Portfolio Summary Bar */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-6 mb-4">
          {/* Total Portfolio Value (Obfuscated) */}
          <div className="glass-card px-6 py-3 rounded-xl border border-white/10 text-center min-w-[140px]">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">Portfolio Equity</div>
            <div className="text-2xl font-black text-white tracking-widest">******</div>
          </div>

          {/* Total PnL (Percent Only) */}
          <div className="glass-card px-6 py-3 rounded-xl border border-white/10 text-center min-w-[140px]">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">Performance</div>
            <div className={`text-2xl font-black ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}{data?.total_pnl_percent?.toFixed(2) || '0.00'}%
            </div>
          </div>

          {/* Unrealized (Obfuscated/Percent) */}
          <div className="glass-card px-6 py-3 rounded-xl border border-white/10 text-center bg-white/5 min-w-[140px]">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">Unrealized</div>
            <div className={`text-xl font-bold ${totalPositionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {/* Calculating approx % for unrealized based on assumed basis if not available directly, or just hiding absolute */}
              {/* For now, let's show it as a relative efficiency metric or hide it. Let's show as % of basis if possible, or just active count */}
              {totalPositionPnL >= 0 ? '+' : ''}Active
            </div>
            <div className="text-[10px] text-white/30 font-mono mt-1">
              {openPositions.length} Positions
            </div>
          </div>

          {/* Aster Breakdown */}
          <div className="glass-card px-4 py-3 rounded-xl border border-blue-500/20 text-center relative overflow-hidden min-w-[120px]">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
            <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider mb-1">Aster</div>
            <div className={`text-lg font-bold ${asterPositionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data?.aster_pnl_percent?.toFixed(2) || '0.00'}%
            </div>
          </div>

          {/* Hype Breakdown */}
          <div className="glass-card px-4 py-3 rounded-xl border border-emerald-500/20 text-center relative overflow-hidden min-w-[120px]">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
            <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1">Hype</div>
            <div className={`text-lg font-bold ${hypePositionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data?.hl_pnl_percent?.toFixed(2) || '0.00'}%
            </div>
          </div>
        </div>
      </header>

      {/* Live Telemetry Chart */}
      <div className="relative z-10 mb-8 max-w-[1800px] mx-auto px-2">
        <div className="glass-card rounded-3xl p-1 overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-blue-500/50 transition-all duration-500" />

          <div className="bg-[#0a0a10]/80 rounded-[20px] p-4 md:p-6 h-[400px] relative">
            <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-[10px] font-code text-purple-300/50 uppercase tracking-wider">Telemetry</div>
                <div className="text-sm font-bold text-white/90">Live Performance Delta</div>
              </div>
            </div>
            <BotPerformanceChart bots={bots} />
          </div>
        </div>
      </div>

      {/* Main Command Grid */}
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-[1800px] mx-auto px-2">

        {/* LEFT COMMAND: ASTER (Cloud) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-3xl bg-gradient-to-b from-blue-950/20 to-transparent relative group">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">ASTER</h2>
                  <div className="text-[10px] font-code text-blue-400/60">CLOUD_01</div>
                </div>
              </div>
              <div className="status-dot bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </div>

            {/* Agent Roster */}
            <div className="space-y-3 pr-1 custom-scrollbar max-h-[500px] overflow-y-auto">
              {asterBots.map(bot => (
                <div key={bot.id} className="group/item relative p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg filter grayscale group-hover/item:grayscale-0 transition-all">{bot.emoji}</span>
                      <span className="font-bold text-sm text-slate-200 group-hover/item:text-blue-100">{bot.name}</span>
                    </div>
                    <div className="text-[10px] font-code text-blue-300/80 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      {bot.win_rate.toFixed(0)}% WR
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-white/30 font-mono uppercase">{bot.specialization}</span>
                    <span className="text-[10px] text-white/50">{bot.total_trades} OPS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aster Positions */}
          <div className="glass-card p-5 rounded-3xl flex-1 min-h-[200px]">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-white/40" />
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Active Positions</span>
              </div>
              <span className="text-xs font-code text-blue-400">{asterPositions.length} OPEN</span>
            </div>
            <div className="space-y-2">
              {asterPositions.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-white/20">
                  <div className="w-1 h-1 bg-current rounded-full mb-2" />
                  <span className="text-xs font-mono">NO TARGETS ACQUIRED</span>
                </div>
              )}
              {asterPositions.map((pos: any, i: number) => (
                <div key={i} className="p-2.5 rounded-lg bg-white/5 border-l-2 border-blue-500 hover:bg-white/10 transition-colors">
                  <div className="grid grid-cols-3 items-center">
                    <span className="font-code font-bold text-xs text-white">{pos.symbol}</span>
                    <span className={`text-[10px] font-bold text-center ${pos.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{pos.side}</span>
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-300">{pos.quantity}</div>
                      {pos.pnl !== undefined && (
                        <div className={`text-[9px] font-mono ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pos.pnl >= 0 ? '+' : ''}{Number(pos.pnl).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Entry/Current Price Row */}
                  {(pos.entry_price || pos.current_price) && (
                    <div className="flex justify-between mt-1.5 pt-1.5 border-t border-white/5 text-[9px] font-mono text-white/40">
                      <span>Entry: ${Number(pos.entry_price).toFixed(2)}</span>
                      <span>Now: ${Number(pos.current_price || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {/* TP/SL Row */}
                  {(pos.tp || pos.sl) && (
                    <div className="flex justify-between mt-1 text-[9px] font-mono">
                      <span className="text-emerald-400/70">TP: ${Number(pos.tp || 0).toFixed(2)}</span>
                      <span className="text-rose-400/70">SL: ${Number(pos.sl || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COMMAND: DATA & COMMS */}
        <div className="xl:col-span-6 flex flex-col gap-6">
          {/* Market Regime Widget */}
          <MarketRegimeWidget regime={marketRegime} />

          {/* Comparison Board */}
          <SystemComparisonBoard
            asterMetrics={asterMetrics}
            hyperliquidMetrics={hypeMetrics}
          />

          {/* Terminal Feed */}
          <div className="flex-1 glass-card rounded-3xl bg-black/40 overflow-hidden flex flex-col min-h-[300px] border-t-4 border-t-purple-500/20">
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-white/60" />
                <span className="font-bold text-[10px] uppercase tracking-widest text-white/60">Neural Feed</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="w-1 h-1 rounded-full bg-white/20" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar relative">
              <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
              <TradeActivityFeed trades={trades} />
            </div>
          </div>

          {/* Neural Chat */}
          <div className="h-[280px] glass-card rounded-3xl overflow-hidden border-t-4 border-t-purple-500/20">
            <LiveAgentChat messages={messages} />
          </div>
        </div>

        {/* RIGHT COMMAND: HYPE (Perps) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-3xl bg-gradient-to-b from-green-950/20 to-transparent relative group">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">HYPE</h2>
                  <div className="text-[10px] font-code text-emerald-400/60">HYPE_L1</div>
                </div>
              </div>
              <div className="status-dot bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>

            {/* Agent Roster */}
            <div className="space-y-3 pr-1 custom-scrollbar max-h-[500px] overflow-y-auto">
              {hypeBots.map(bot => (
                <div key={bot.id} className="group/item relative p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-emerald-600/10 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg filter grayscale group-hover/item:grayscale-0 transition-all">{bot.emoji}</span>
                      <span className="font-bold text-sm text-slate-200 group-hover/item:text-emerald-100">{bot.name}</span>
                    </div>
                    <div className="text-[10px] font-code text-emerald-300/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {bot.win_rate ? bot.win_rate.toFixed(0) : 0}% WR
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-white/30 font-mono uppercase">{bot.specialization}</span>
                    <span className="text-[10px] text-white/50">{bot.total_trades} OPS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hype Positions */}
          <div className="glass-card p-5 rounded-3xl flex-1 min-h-[200px]">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-white/40" />
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Active Positions</span>
              </div>
              <span className="text-xs font-code text-emerald-400">{hypePositions.length} OPEN</span>
            </div>
            <div className="space-y-2">
              {hypePositions.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-white/20">
                  <div className="w-1 h-1 bg-current rounded-full mb-2" />
                  <span className="text-xs font-mono">NO TARGETS ACQUIRED</span>
                </div>
              )}
              {hypePositions.map((pos: any, i: number) => (
                <div key={i} className="p-2.5 rounded-lg bg-white/5 border-l-2 border-emerald-500 hover:bg-white/10 transition-colors">
                  <div className="grid grid-cols-3 items-center">
                    <span className="font-code font-bold text-xs text-white">{pos.symbol}</span>
                    <span className={`text-[10px] font-bold text-center ${pos.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{pos.side}</span>
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-300">{pos.quantity}</div>
                      {pos.pnl !== undefined && (
                        <div className={`text-[9px] font-mono ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pos.pnl >= 0 ? '+' : ''}{Number(pos.pnl).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Entry/Current Price Row */}
                  {(pos.entry_price || pos.current_price) && (
                    <div className="flex justify-between mt-1.5 pt-1.5 border-t border-white/5 text-[9px] font-mono text-white/40">
                      <span>Entry: ${Number(pos.entry_price).toFixed(2)}</span>
                      <span>Now: ${Number(pos.current_price || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {/* TP/SL Row */}
                  {(pos.tp || pos.sl) && (
                    <div className="flex justify-between mt-1 text-[9px] font-mono">
                      <span className="text-emerald-400/70">TP: ${Number(pos.tp || 0).toFixed(2)}</span>
                      <span className="text-rose-400/70">SL: ${Number(pos.sl || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
