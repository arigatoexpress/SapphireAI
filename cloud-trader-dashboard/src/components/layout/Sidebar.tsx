import React from 'react';

interface SidebarProps {
    tabs: Array<{ id: string; label: string; icon: string }>;
    activeTab: string;
    onSelect: (id: string) => void;
    mobileMenuOpen?: boolean;
    setMobileMenuOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ tabs, activeTab, onSelect, mobileMenuOpen, setMobileMenuOpen }) => {
    const handleTabSelect = (id: string) => {
        onSelect(id);
        if (setMobileMenuOpen) {
            setMobileMenuOpen(false);
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileMenuOpen?.(false)}
                />
            )}

            <aside className={`fixed lg:static top-0 left-0 z-50 h-full w-64 flex-col gap-6 bg-gradient-to-b from-surface-100/95 via-surface-100/90 to-surface-100/95 border-r border-surface-200/60 backdrop-blur-sm p-6 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:flex'
                }`}>
                {/* Sapphire accent elements */}
                <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-primary-400/10 to-accent-teal/10 blur-2xl" />
                <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-gradient-to-br from-accent-teal/10 to-primary-400/10 blur-xl" />

                <div className="relative flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 via-primary-400 to-accent-teal flex items-center justify-center shadow-glass ring-2 ring-white/10">
                        <span className="text-lg font-semibold text-white">💎</span>
                    </div>
                    <div>
                        <p className="text-sm uppercase tracking-widest text-slate-400 font-medium">Aster Labs</p>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white via-primary-200 to-accent-teal bg-clip-text text-transparent">
                            Sapphire AI
                        </h1>
                        <p className="text-xs text-slate-500">Multi-Agent Trading</p>
                    </div>
                </div>

                <nav className="flex-1">
                    <ul className="space-y-1">
                        {tabs.map((tab) => {
                            const isActive = tab.id === activeTab;
                            return (
                                <li key={tab.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleTabSelect(tab.id)}
                                        className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 overflow-hidden ${isActive
                                            ? 'bg-primary-500/20 text-white shadow-glass scale-[1.02]'
                                            : 'text-slate-400 hover:text-white hover:bg-surface-200/60 hover:scale-[1.01]'
                                            }`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-r ${isActive ? 'from-primary-500/10 to-accent-teal/10' : 'from-white/5 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                                        <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>{tab.icon}</span>
                                        <span className="font-medium relative z-10">{tab.label}</span>
                                        {isActive && (
                                            <span className="ml-auto h-2 w-2 rounded-full bg-accent-emerald shadow-glass animate-pulse" />
                                        )}
                                        {!isActive && (
                                            <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs">→</span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* System Status Footer */}
                <div className="relative rounded-xl border border-surface-200/40 bg-gradient-to-br from-surface-100/80 to-surface-50/60 p-4 shadow-glass">
                    {/* Mini accent */}
                    <div className="absolute top-0 right-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary-400/20 to-accent-teal/20 blur-sm" />

                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-glass" />
                            <p className="text-sm font-semibold text-white">Live Capital Engaged</p>
                        </div>

                        <div className="space-y-1 text-xs text-slate-400">
                            <div className="flex items-center justify-between">
                                <span>Agents:</span>
                                <span className="text-emerald-400 font-medium">4 Live Models</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Margin:</span>
                                <span className="text-blue-400 font-medium">Full Access</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Alerts:</span>
                                <span className="text-purple-400 font-medium">Telegram Push</span>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-surface-200/40">
                            <p className="text-xs text-slate-500 text-center">
                                💎 Sapphire AI — Live Desk
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

