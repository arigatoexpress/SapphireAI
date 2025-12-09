import React from 'react';
import { CommandDock } from './CommandDock';

interface MasterLayoutProps {
    children: React.ReactNode;
}

export const MasterLayout: React.FC<MasterLayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen bg-[#050508] text-white font-sans overflow-hidden selection:bg-blue-500/30 relative">

            {/* 🌌 Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050508] to-[#050508]" />
                <div className="holographic-grid opacity-40" />
            </div>

            {/* 🖥️ MAIN CONTENT LAYER */}
            {/* No padding for sidebar anymore. Full width canvas. */}
            <main className="flex-1 relative z-10 overflow-y-auto h-full w-full">
                <div className="min-h-full p-6 lg:p-8 animate-in fade-in duration-500 pb-32">
                    {/* Added pb-32 to ensure content isn't hidden behind the floating dock */}
                    {children}
                </div>
            </main>

            {/* 🚀 THE HYPER-DOCK (Floating Navigation) */}
            <CommandDock />
        </div>
    );
};
