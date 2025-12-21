import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, LayoutDashboard, Terminal } from 'lucide-react';

interface MasterLayoutProps {
    children: React.ReactNode;
}

export const MasterLayout: React.FC<MasterLayoutProps> = ({ children }) => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-[#050508] text-white font-sans">
            {/* Background gradient */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-[#050508] to-[#050508]" />
            </div>

            {/* Navigation Header */}
            <header className="relative z-20 border-b border-white/10 bg-[#050508]/80 backdrop-blur-xl">
                <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-3">
                    <nav className="flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
                            <Zap className="w-6 h-6 text-cyan-400" />
                            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                Sapphire AI
                            </span>
                        </Link>

                        {/* Navigation Links */}
                        <div className="flex items-center gap-1">
                            <Link
                                to="/"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/')
                                        ? 'bg-cyan-500/20 text-cyan-400'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </Link>
                            <Link
                                to="/terminal"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/terminal')
                                        ? 'bg-cyan-500/20 text-cyan-400'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Terminal className="w-4 h-4" />
                                Terminal Pro
                            </Link>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Main Content - Full width, clean layout */}
            <main className="relative z-10 min-h-screen">
                <div className="max-w-[1800px] mx-auto p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};
