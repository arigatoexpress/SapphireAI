import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  MessageSquare, 
  TrendingUp, 
  Menu, 
  X,
  Bell,
  Settings,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

interface AppShellProps {
  children: React.ReactNode;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export const AppShell: React.FC<AppShellProps> = ({ children, connectionStatus }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const statusColor = {
    connected: 'bg-emerald-500',
    disconnected: 'bg-rose-500',
    connecting: 'bg-amber-500'
  }[connectionStatus];

  const statusText = {
    connected: 'System Online',
    disconnected: 'Offline',
    connecting: 'Connecting...'
  }[connectionStatus];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20">
                <Zap className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-lg font-bold tracking-tight hidden sm:inline-block">
                Sapphire<span className="text-blue-400">AI</span>
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1 ml-6">
              <NavButton 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')}
                icon={<LayoutDashboard size={18} />}
                label="Dashboard" 
              />
              <NavButton 
                active={activeTab === 'agents'} 
                onClick={() => setActiveTab('agents')}
                icon={<MessageSquare size={18} />}
                label="Agent Chat" 
              />
              <NavButton 
                active={activeTab === 'trades'} 
                onClick={() => setActiveTab('trades')}
                icon={<Activity size={18} />}
                label="Live Trades" 
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              <span className={`h-2 w-2 rounded-full ${statusColor} animate-pulse`} />
              <span className="text-xs font-medium text-slate-400 hidden sm:inline-block">
                {statusText}
              </span>
            </div>
            <button className="p-2 text-slate-400 hover:text-white relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950 pt-20 px-4 space-y-2">
          <MobileNavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard" 
          />
          <MobileNavButton 
            active={activeTab === 'agents'} 
            onClick={() => { setActiveTab('agents'); setIsMobileMenuOpen(false); }}
            icon={<MessageSquare size={20} />}
            label="Agent Chat" 
          />
          <MobileNavButton 
            active={activeTab === 'trades'} 
            onClick={() => { setActiveTab('trades'); setIsMobileMenuOpen(false); }}
            icon={<Activity size={20} />}
            label="Live Trades" 
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">
        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
      ${active 
        ? 'bg-slate-800 text-white' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
      }`}
  >
    {icon}
    {label}
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-colors
      ${active 
        ? 'bg-slate-800 text-white' 
        : 'text-slate-400 hover:bg-slate-900'
      }`}
  >
    {icon}
    {label}
  </button>
);

