import React from 'react';
import { Box, Container, AppBar, Toolbar, Typography, Chip, LinearProgress } from '@mui/material';
import { useTradingData } from '../../../contexts/TradingContext';

// --- Assets ---
// Logo or Icon SVG could go here

export const MissionControlLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { connected, total_pnl_percent, market_regime } = useTradingData();

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'transparent', color: '#fff', display: 'flex', flexDirection: 'column' }}>
            {/* Background Animations */}
            <div className="holographic-grid" />

            {/* Minimal Status Bar (Ticker) */}
            <Box sx={{
                px: 3, py: 1.5,
                display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                bgcolor: 'rgba(0,0,0,0.2)'
            }}>
                <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#666', fontFamily: 'JetBrains Mono', fontSize: '0.7rem' }}>MARKET REGIME</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                            {market_regime?.current_regime || 'CALCULATING...'}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#666', fontFamily: 'JetBrains Mono', fontSize: '0.7rem' }}>24H PNL</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: total_pnl_percent >= 0 ? '#00ff00' : '#ff0000', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>
                            {total_pnl_percent >= 0 ? '+' : ''}{total_pnl_percent.toFixed(2)}%
                        </Typography>
                    </Box>
                </Box>
                <Chip
                    label={connected ? "CONNECTED" : "OFFLINE"}
                    size="small"
                    sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        borderRadius: '4px',
                        bgcolor: connected ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                        color: connected ? '#00ff00' : '#ff0000',
                        border: `1px solid ${connected ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)'}`
                    }}
                />
            </Box>

            {/* Main Content Area */}
            <Box sx={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
                <Container maxWidth="xl" sx={{ py: 3 }}>
                    {children}
                </Container>
            </Box>
        </Box>
    );
};
