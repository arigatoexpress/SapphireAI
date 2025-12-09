import React, { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Activity,
    Clock,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Wifi
} from 'lucide-react';
import { useTradingData } from '../contexts/TradingContext';

const MarketStat: React.FC<{ label: string; value: string; trend?: 'up' | 'down'; subValue?: string }> = ({ label, value, trend, subValue }) => (
    <div className="flex flex-col">
        <span className="text-secondary-400 text-xs font-mono mb-1 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono text-white">{value}</span>
            {trend && (
                <span className={`flex items - center text - xs px - 1.5 py - 0.5 rounded ${trend === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'} `}>
                    {trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                    {subValue}
                </span>
            )}
        </div>
    </div>
);

const OrderBookRow: React.FC<{ price: string; size: string; total: string; type: 'bid' | 'ask'; percent: number }> = ({ price, size, total, type, percent }) => (
    <div className="relative flex items-center justify-between py-0.5 text-xs font-mono hover:bg-white/5 cursor-pointer group">
        <div
            className={`absolute top - 0 bottom - 0 ${type === 'bid' ? 'right-0 bg-emerald-500/10' : 'left-0 bg-rose-500/10'} `}
            style={{ width: `${percent}% `, transition: 'width 0.3s ease' }}
        />
        <span className={`relative z - 10 w - 1 / 3 text - left pl - 2 ${type === 'bid' ? 'text-emerald-400' : 'text-rose-400'} `}>{price}</span>
        <span className="relative z-10 w-1/3 text-right text-slate-300 group-hover:text-white">{size}</span>
        <span className="relative z-10 w-1/3 text-right pr-2 text-slate-500">{total}</span>
    </div>
);

export const TerminalPro: React.FC = () => {
    const { connected, recent_trades, market_regime, open_positions } = useTradingData();
    const [selectedPair] = useState('ETH-USD'); // In future, this could be dynamic

    return (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">

            {/* 📊 LEFT: Market Depth & Order Book */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full">

                {/* Symbol Header */}
                <div className="p-4 rounded-2xl bg-[#0a0b10] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{selectedPair}</h2>
                            <span className="text-xs text-emerald-400 font-mono flex items-center">
                                <span className={`w - 1.5 h - 1.5 rounded - full ${connected ? 'bg-emerald-500' : 'bg-red-500'} mr - 1.5 animate - pulse`} />
                                {connected ? 'MARKET OPEN' : 'DISCONNECTED'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Order Book */}
                <div className="flex-1 rounded-2xl bg-[#0a0b10] border border-white/10 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/5 flex justify-between items-center bg-[#0f1016]">
                        <span className="text-xs font-bold text-slate-400">ORDER BOOK (SIM)</span>
                        <Filter size={14} className="text-slate-500 hover:text-white cursor-pointer" />
                    </div>

                    {/* Asks */}
                    <div className="flex-1 overflow-y-auto py-2 flex flex-col-reverse">
                        {[...Array(15)].map((_, i) => (
                            <OrderBookRow
                                key={`ask - ${i} `}
                                price={(2450.50 + i * 0.1).toFixed(2)}
                                size={(Math.random() * 5).toFixed(4)}
                                total={(Math.random() * 20).toFixed(2)}
                                type="ask"
                                percent={Math.random() * 80}
                            />
                        ))}
                    </div>

                    {/* Spread Info */}
                    <div className="py-2 border-y border-white/10 bg-[#0f1016]/50 flex justify-center items-center gap-4">
                        <span className="text-lg font-bold text-white font-mono">
                            {market_regime?.current_regime === 'Bull' ? '2,455.00' : '2,450.50'}
                        </span>
                        <span className="text-xs text-slate-500">Spread: 0.10</span>
                    </div>

                    {/* Bids */}
                    <div className="flex-1 overflow-y-auto py-2">
                        {[...Array(15)].map((_, i) => (
                            <OrderBookRow
                                key={`bid - ${i} `}
                                price={(2450.40 - i * 0.1).toFixed(2)}
                                size={(Math.random() * 5).toFixed(4)}
                                total={(Math.random() * 20).toFixed(2)}
                                type="bid"
                                percent={Math.random() * 80}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* 📈 CENTER: Main Chart & Controls */}
            <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 h-full">

                {/* Stats Bar */}
                <div className="p-4 rounded-2xl bg-[#0a0b10] border border-white/10 grid grid-cols-4 gap-4">
                    <MarketStat label="Regime" value={market_regime?.current_regime || 'WAITING'} trend="up" subValue={market_regime?.volatility_score.toFixed(2)} />
                    <MarketStat label="24h High" value="$2,480.00" />
                    <MarketStat label="24h Vol" value="12.5M" />
                    <MarketStat label="Liquidity" value={market_regime?.liquidity_score.toFixed(2) || '0.00'} trend="up" subValue="Score" />
                </div>

                {/* Main Chart Area */}
                <div className="flex-1 rounded-2xl bg-[#0a0b10] border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e4/Candlestick_chart_scheme_03-en.svg')] bg-cover bg-center opacity-10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <Activity size={48} className="text-blue-500/50 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">TradingView Chart</h3>
                            <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                                <Wifi size={14} className={connected ? "text-emerald-500" : "text-rose-500"} />
                                {connected ? "Real-time Data Feed Active" : "Connecting to Data Feed..."}
                            </p>
                        </div>
                    </div>
                    {/* Timeframe Toggles */}
                    <div className="absolute top-4 left-4 flex gap-1 bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/5">
                        {['1m', '5m', '15m', '1h', '4h', 'D'].map(tf => (
                            <button key={tf} className="px-3 py-1 rounded-md text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Trade Panel */}
                <div className="h-48 rounded-2xl bg-[#0a0b10] border border-white/10 p-4 grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center justify-center h-full rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group">
                        <span className="text-emerald-400 font-bold text-lg mb-1">BUY / LONG</span>
                        <ArrowUpRight className="text-emerald-500 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="flex flex-col items-center justify-center h-full rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all group">
                        <span className="text-rose-400 font-bold text-lg mb-1">SELL / SHORT</span>
                        <ArrowDownRight className="text-rose-500 group-hover:translate-y-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* 📋 RIGHT: Recent Trades & Active Positions */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full">

                {/* Recent Trades */}
                <div className="h-1/2 rounded-2xl bg-[#0a0b10] border border-white/10 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/5 flex justify-between items-center bg-[#0f1016]">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                            <Clock size={12} /> RECENT TRADES
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {recent_trades.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500 py-10">
                                Waiting for ticks...
                            </div>
                        ) : (
                            recent_trades.map((trade) => (
                                <div key={trade.id} className="flex justify-between items-center px-4 py-2 text-xs border-b border-white/5 hover:bg-white/5">
                                    <span className={trade.side === 'BUY' ? "text-emerald-400" : "text-rose-400"}>
                                        {trade.side}
                                    </span>
                                    <span className="text-slate-300">{trade.price.toFixed(2)}</span>
                                    <span className="text-slate-500">{trade.size.toFixed(4)}</span>
                                    <span className="text-slate-600">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Active Positions */}
                <div className="h-1/2 rounded-2xl bg-[#0a0b10] border border-white/10 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/5 flex justify-between items-center bg-[#0f1016]">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                            <DollarSign size={12} /> YOUR POSITIONS
                        </span>
                    </div>
                    {open_positions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                            <span className="p-3 rounded-full bg-white/5">
                                <Search size={20} />
                            </span>
                            <span className="text-xs">No active positions</span>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto">
                            {open_positions.map((pos, i) => (
                                <div key={i} className="px-4 py-3 border-b border-white/5 hover:bg-white/5">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-white">{pos.symbol}</span>
                                        <span className={`font - mono ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} `}>
                                            {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>{pos.size} @ {pos.entry_price}</span>
                                        <span>{pos.leverage}x</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
