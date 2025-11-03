import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
const statusColorMap = {
    active: 'text-emerald-300',
    monitoring: 'text-sky-300',
    idle: 'text-slate-300',
    error: 'text-red-300',
};
const AgentRadar = ({ agent }) => {
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
    return (_jsxs("div", { className: "relative h-40 w-40 shrink-0", children: [_jsx("div", { className: "radar-grid" }), _jsx("div", { className: "radar-center-glow" }), _jsx("div", { className: "radar-beam" }), _jsxs("svg", { className: "absolute inset-0", viewBox: "0 0 200 200", role: "presentation", "aria-hidden": "true", children: [_jsx("circle", { cx: "100", cy: "100", r: "94", fill: "none", stroke: "rgba(148, 163, 184, 0.12)", strokeWidth: "0.8" }), _jsx("circle", { cx: "100", cy: "100", r: "70", fill: "none", stroke: "rgba(148, 163, 184, 0.15)", strokeWidth: "0.6" }), _jsx("circle", { cx: "100", cy: "100", r: "46", fill: "none", stroke: "rgba(148, 163, 184, 0.15)", strokeWidth: "0.6" }), _jsx("circle", { cx: "100", cy: "100", r: "22", fill: "none", stroke: "rgba(148, 163, 184, 0.2)", strokeWidth: "0.6" }), _jsx("line", { x1: "100", y1: "8", x2: "100", y2: "192", stroke: "rgba(148, 163, 184, 0.15)", strokeWidth: "0.6" }), _jsx("line", { x1: "8", y1: "100", x2: "192", y2: "100", stroke: "rgba(148, 163, 184, 0.15)", strokeWidth: "0.6" }), _jsx("line", { x1: "34", y1: "34", x2: "166", y2: "166", stroke: "rgba(148, 163, 184, 0.1)", strokeWidth: "0.5" }), _jsx("line", { x1: "166", y1: "34", x2: "34", y2: "166", stroke: "rgba(148, 163, 184, 0.1)", strokeWidth: "0.5" })] }), radarTargets.map((target) => (_jsx("div", { style: { left: target.left, top: target.top }, className: `radar-target absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/15 text-xs font-semibold tracking-wide text-cyan-100 backdrop-blur-sm ${target.isActive ? 'text-emerald-200 border-emerald-400/50 bg-emerald-500/20' : ''}`, children: _jsx("span", { children: target.symbol }) }, target.symbol))), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-1 text-center", children: [_jsx("span", { className: `text-[0.65rem] uppercase tracking-[0.4em] text-slate-400 ${statusColor}`, children: "Radar" }), _jsx("span", { className: "text-sm font-semibold text-white", children: agent.name }), _jsxs("span", { className: "text-[0.6rem] text-slate-400", children: ["Targets: ", tokens.join(' · ') || '—'] })] })] }));
};
export default AgentRadar;
