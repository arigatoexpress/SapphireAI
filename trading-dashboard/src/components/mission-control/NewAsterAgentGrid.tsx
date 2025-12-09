import React from 'react';
import { Box, Grid, Paper, Typography, LinearProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTradingData, Agent } from '../../contexts/TradingContext';

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => (
    <Paper
        className="glass-card"
        sx={{
            p: 2,
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(10,11,16,0.9), rgba(15,16,22,0.8))',
            border: `1px solid ${agent.status === 'active' ? 'rgba(0, 212, 170, 0.4)' : 'rgba(255,255,255,0.05)'}`,
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        {/* Active Glow Overlay */}
        {agent.status === 'active' && (
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(circle at 50% 0%, rgba(0, 212, 170, 0.1), transparent 70%)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />
        )}

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{
                    width: 40, height: 40,
                    borderRadius: 1,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem'
                }}>
                    {agent.emoji}
                </Box>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                        {agent.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }}>
                        ID: {agent.id.substring(0, 6).toUpperCase()}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>{agent.win_rate}%</Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#666', fontSize: '0.6rem' }}>WIN RATE</Typography>
            </Box>
        </Box>

        {/* Mini Graph or Progress */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#aaa', fontSize: '0.7rem' }}>ALLOCATION</Typography>
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>${agent.allocation}</Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={Math.min(agent.allocation / 1000 * 100, 100)} // Mock bar
                sx={{
                    height: 3,
                    borderRadius: 1,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': { bgcolor: '#00d4aa' }
                }}
            />
        </Box>
    </Paper>
);

export const NewAsterAgentGrid: React.FC = () => {
    const { agents } = useTradingData();
    const asterAgents = agents.filter(a => !a.name.toLowerCase().includes('hype'));

    return (
        <Box>
            <Typography variant="overline" sx={{ color: '#00d4aa', fontWeight: 700, letterSpacing: 1.2, mb: 2, display: 'block' }}>
                ASTER SWARM DIRECTORY
            </Typography>
            <Grid container spacing={2}>
                {asterAgents.length === 0 ? (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)' }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>Creating Agents...</Typography>
                        </Paper>
                    </Grid>
                ) : (
                    asterAgents.map(agent => (
                        <Grid item xs={12} md={6} key={agent.id}>
                            <AgentCard agent={agent} />
                        </Grid>
                    ))
                )}
            </Grid>
        </Box>
    );
};
