import React, { useMemo } from 'react';
import { DashboardAgent } from '../../api/client';

interface AgentRadarProps {
  agent: DashboardAgent;
}

const statusColorMap: Record<string, string> = {
  active: 'text-emerald-300',
  monitoring: 'text-sky-300',
  idle: 'text-slate-300',
  error: 'text-red-300',
};

const AgentRadar: React.FC<AgentRadarProps> = ({ agent }) => {
  const tokens = useMemo(() => agent.symbols ?? [], [agent.symbols]);
  const activeSymbols = useMemo(() => new Set((agent.positions ?? []).map((p) => (p.symbol || '').toUpperCase())), [agent.positions]);

  const radarTargets = useMemo(() => {
    if (tokens.length === 0) {
      return [];
    }
    const radius = 42; // percentage of container
    return tokens.map((symbol, index) => {
      const angle = (index / tokens.length) * Math.PI * 2;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      const isActive = activeSymbols.has(symbol.toUpperCase());
      return {
        symbol,
        left: `${x}%`,
        top: `${y}%`,
        isActive,
      };
    });
  }, [tokens, activeSymbols]);

  const statusColor = statusColorMap[agent.status?.toLowerCase()] ?? 'text-cyan-300';

  return (
    <div className="relative h-40 w-40 shrink-0">
      <div className="radar-grid" />
      <div className="radar-center-glow" />
      <div className="radar-beam" />

      <svg className="absolute inset-0" viewBox="0 0 200 200" role="presentation" aria-hidden="true">
        <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="0.6" />
        <circle cx="100" cy="100" r="46" fill="none" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="0.6" />
        <circle cx="100" cy="100" r="22" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="0.6" />
        <line x1="100" y1="8" x2="100" y2="192" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="0.6" />
        <line x1="8" y1="100" x2="192" y2="100" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="0.6" />
        <line x1="34" y1="34" x2="166" y2="166" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="0.5" />
        <line x1="166" y1="34" x2="34" y2="166" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="0.5" />
      </svg>

      {radarTargets.map((target) => (
        <div
          key={target.symbol}
          style={{ left: target.left, top: target.top }}
          className={`radar-target absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/15 text-xs font-semibold tracking-wide text-cyan-100 backdrop-blur-sm ${
            target.isActive ? 'text-emerald-200 border-emerald-400/50 bg-emerald-500/20' : ''
          }`}
        >
          <span>{target.symbol}</span>
        </div>
      ))}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
        <span className={`text-[0.65rem] uppercase tracking-[0.4em] text-slate-400 ${statusColor}`}>Radar</span>
        <span className="text-sm font-semibold text-white">{agent.name}</span>
        <span className="text-[0.6rem] text-slate-400">Targets: {tokens.join(' · ') || '—'}</span>
      </div>
    </div>
  );
};

export default AgentRadar;


