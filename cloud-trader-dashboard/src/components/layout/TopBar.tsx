import React from 'react';

interface TopBarProps {
    onRefresh: () => void;
    lastUpdated?: string;
    healthRunning?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ onRefresh, lastUpdated, healthRunning }) => {
    const statusLabel = healthRunning ? 'Live' : 'Paused';
    const statusColor = healthRunning ? 'bg-emerald-400/80' : 'bg-amber-400/80';

    return (
        <header className="sticky top-0 z-40 border-b border-surface-200/60 bg-surface-100/80 backdrop-blur-xs">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Autonomous Trading Control Center</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">Mission Control</h2>
                    <p className="mt-0.5 text-sm text-slate-400">Monitor risk, performance, and AI decision quality in real time.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden text-right sm:block">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Last Sync</p>
                        <p className="text-sm font-medium text-slate-200">
                            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}
                        </p>
                    </div>

                    <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-slate-900 ${statusColor}`}
                    >
                        <span className="h-2 w-2 rounded-full bg-slate-900" />
                        {statusLabel}
                    </span>

                    <button
                        type="button"
                        onClick={onRefresh}
                        className="group relative overflow-hidden rounded-full bg-primary-500/80 px-4 py-2 text-sm font-medium text-white shadow-glass transition hover:bg-primary-500"
                    >
                        <span className="mr-2">🔄</span>
                        Refresh
                        <span className="absolute inset-0 -z-10 bg-gradient-to-r from-accent-teal/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopBar;

