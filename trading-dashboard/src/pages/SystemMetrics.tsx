import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';

const MetricGauge: React.FC<{ label: string, value: number, unit: string }> = ({ label, value, unit }) => (
    <Box sx={{ textAlign: 'center', position: 'relative' }}>
        <Box sx={{
            width: 120, height: 120, borderRadius: '50%',
            border: '8px solid rgba(255,255,255,0.05)',
            borderTopColor: '#00d4aa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mb: 2, mx: 'auto'
        }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{value}</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{label} ({unit})</Typography>
    </Box>
);

export const SystemMetrics: React.FC = () => {
    return (
        <Box>
            <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -1, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    System Retina
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 600, mt: 1 }}>
                    Real-time infrastructure telemetry, Cloud Run instance health, and network latency monitoring.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 4, bgcolor: 'rgba(15,16,22,0.6)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <MetricGauge label="CPU Load" value={12} unit="%" />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 4, bgcolor: 'rgba(15,16,22,0.6)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <MetricGauge label="Memory" value={48} unit="%" />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 4, bgcolor: 'rgba(15,16,22,0.6)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <MetricGauge label="Latency" value={45} unit="ms" />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
