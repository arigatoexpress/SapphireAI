import React from 'react';
import { Box, Grid, Paper, Typography, Chip } from '@mui/material';
import { TrendingUp, TrendingDown, Wallet, Activity, Users } from 'lucide-react';
import { useTradingData } from '../contexts/TradingContext';
import { NewAsterAgentGrid } from '../components/mission-control/NewAsterAgentGrid';
import UnifiedPositionsTable from '../components/UnifiedPositionsTable';
import { NewAsterBrainStream } from '../components/mission-control/NewAsterBrainStream';

// Stat Card Component
const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
}> = ({ title, value, subtitle, trend, icon }) => (
    <Paper
        sx={{
            p: 2.5,
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(10,11,16,0.95), rgba(15,16,22,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
            height: '100%',
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}>
                {title}
            </Typography>
            <Box sx={{ color: '#444' }}>{icon}</Box>
        </Box>
        <Typography variant="h5" sx={{
            fontWeight: 700,
            color: trend === 'up' ? '#00d4aa' : trend === 'down' ? '#ff6b6b' : '#fff',
            fontFamily: 'JetBrains Mono, monospace',
            mb: 0.5
        }}>
            {value}
        </Typography>
        {subtitle && (
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                {subtitle}
            </Typography>
        )}
    </Paper>
);

export const UnifiedDashboard: React.FC = () => {
    const {
        portfolio_value,
        total_pnl,
        total_pnl_percent,
        agents,
        open_positions,
        // connected is available but shown in header
        market_regime
    } = useTradingData();

    const activeAgents = agents.filter(a => a.status === 'active').length;
    const pnlTrend = total_pnl >= 0 ? 'up' : 'down';

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}>
                    Dashboard
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                        Sapphire AI Trading System
                    </Typography>
                    {market_regime && (
                        <Chip
                            label={market_regime.current_regime}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(0,212,170,0.1)',
                                color: '#00d4aa',
                                fontSize: '0.65rem',
                                height: 20
                            }}
                        />
                    )}
                </Box>
            </Box>

            {/* Stats Row */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Portfolio Value"
                        value={`$${portfolio_value.toLocaleString()}`}
                        icon={<Wallet size={18} />}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Total P&L"
                        value={`${total_pnl >= 0 ? '+' : ''}$${total_pnl.toFixed(2)}`}
                        subtitle={`${total_pnl_percent >= 0 ? '+' : ''}${total_pnl_percent.toFixed(2)}%`}
                        trend={pnlTrend}
                        icon={pnlTrend === 'up' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Active Agents"
                        value={`${activeAgents} / ${agents.length}`}
                        subtitle="AI agents running"
                        icon={<Users size={18} />}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Open Positions"
                        value={`${open_positions.length}`}
                        subtitle="Active trades"
                        icon={<Activity size={18} />}
                    />
                </Grid>
            </Grid>

            {/* Main Content */}
            <Grid container spacing={3}>
                {/* Left Column: Agents & Positions */}
                <Grid item xs={12} lg={7}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <NewAsterAgentGrid />
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, rgba(10,11,16,0.95), rgba(15,16,22,0.9))',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <Typography variant="overline" sx={{ color: '#00d4aa', fontWeight: 700, letterSpacing: 1.2, mb: 2, display: 'block' }}>
                                OPEN POSITIONS
                            </Typography>
                            <UnifiedPositionsTable
                                asterPositions={open_positions as any}
                                hypePositions={[]}
                                onUpdateTpSl={(sym, tp, sl) => console.log('TP/SL Update', sym, tp, sl)}
                            />
                        </Paper>
                    </Box>
                </Grid>

                {/* Right Column: Activity Feed */}
                <Grid item xs={12} lg={5}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, rgba(10,11,16,0.95), rgba(15,16,22,0.9))',
                            border: '1px solid rgba(255,255,255,0.06)',
                            height: 'calc(100vh - 350px)',
                            minHeight: 400,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Typography variant="overline" sx={{ color: '#00d4aa', fontWeight: 700, letterSpacing: 1.2, mb: 2, display: 'block' }}>
                            BRAIN STREAM
                        </Typography>
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <NewAsterBrainStream />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default UnifiedDashboard;
