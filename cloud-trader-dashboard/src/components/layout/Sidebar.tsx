import React from 'react';

interface SidebarProps {
    tabs: Array<{ id: string; label: string; icon: string }>;
    activeTab: string;
    onSelect: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ tabs, activeTab, onSelect }) => {
    return (
        <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col gap-6 bg-surface-100/60 border-r border-surface-200/60 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 via-primary-400 to-accent-teal flex items-center justify-center shadow-glass">
                    <span className="text-lg font-semibold text-white">CT</span>
                </div>
                <div>
                    <p className="text-sm uppercase tracking-widest text-slate-400">Aster Labs</p>
                    <h1 className="text-xl font-semibold text-white">Cloud Trader</h1>
                </div>
            </div>

            <nav className="flex-1">
                <ul className="space-y-2">
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTab;
                        return (
                            <li key={tab.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(tab.id)}
                                    className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${isActive
                                        ? 'bg-primary-500/20 text-white shadow-glass'
                                        : 'text-slate-400 hover:text-white hover:bg-surface-200/60'
                                        }`}
                                >
                                    <span className="text-lg">{tab.icon}</span>
                                    <span className="font-medium">{tab.label}</span>
                                    {isActive && (
                                        <span className="ml-auto h-2 w-2 rounded-full bg-accent-emerald shadow-glass" />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="rounded-xl border border-surface-200/60 bg-surface-100/80 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">Operator Status</p>
                <p className="mt-1 text-xs text-slate-400">Live telemetry streaming every 5s · WebSocket upgrade coming soon</p>
            </div>
        </aside>
    );
};

export default Sidebar;

