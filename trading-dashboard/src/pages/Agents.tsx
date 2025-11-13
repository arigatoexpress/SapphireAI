import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, Avatar } from '@mui/material';

const Agents: React.FC = () => {
  const agents = [
    {
      name: "DeepSeek PvP Momentum",
      emoji: "💎",
      specialization: "Trend Predator",
      leverage: "15x",
      capital: "$1,000",
      winRate: "68%",
      strategy: "Scalp trades, exploit weak hands & stops"
    },
    {
      name: "FinGPT PvP Alpha",
      emoji: "📊",
      specialization: "Catalyst Arbitrageur",
      leverage: "12x",
      capital: "$1,000",
      winRate: "63%",
      strategy: "Preemptive news & catalyst exploitation"
    },
    {
      name: "Lag-Llama PvP Degen",
      emoji: "🎰",
      specialization: "Chaos Weaponizer",
      leverage: "50x",
      capital: "$1,000",
      winRate: "45%",
      strategy: "Liquidation cascades & volatility spikes"
    },
    {
      name: "Profit Maximizer PvP",
      emoji: "💰",
      specialization: "ASTER Stacker",
      leverage: "20x",
      capital: "$1,000",
      winRate: "60%",
      strategy: "Ensemble intelligence, ASTER priority"
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        🤖 4-Core PvP AI Agent Ensemble
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
        Elite trading predators optimized for Aster DEX - $360 daily target
      </Typography>

      {/* Aster DEX Context */}
      <Box sx={{
        mb: 4,
        p: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(0, 212, 170, 0.1) 100%)',
        border: '1px solid rgba(138, 43, 226, 0.3)',
      }}>
        <Typography variant="body1" sx={{ fontWeight: 600, color: '#8a2be2', textAlign: 'center' }}>
          🎯 Deployed on Aster DEX - 155+ USDT Perpetual Contracts
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', mt: 1 }}>
          Direct market access with institutional-grade liquidity and zero intermediary fees
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {agents.map((agent, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0, 212, 170, 0.2)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{
                    bgcolor: index === 0 ? '#00d4aa' :
                      index === 1 ? '#8a2be2' :
                        index === 2 ? '#ff4757' : '#ffa502',
                    mr: 2
                  }}>
                    {agent.emoji}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {agent.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {agent.specialization}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip label={`Leverage: ${agent.leverage}`} size="small" color="primary" />
                  <Chip label={`Capital: ${agent.capital}`} size="small" color="secondary" />
                  <Chip label={`Win Rate: ${agent.winRate}`} size="small" sx={{ bgcolor: 'rgba(0, 212, 170, 0.2)', color: '#00d4aa' }} />
                </Box>

                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {agent.strategy}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* System Status */}
      <Box sx={{ mt: 4 }}>
        <Card sx={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              🚀 PvP Combat Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Total Capital</Typography>
                <Typography variant="h6" sx={{ color: '#00d4aa', fontWeight: 600 }}>$4,000</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Daily Target</Typography>
                <Typography variant="h6" sx={{ color: '#8a2be2', fontWeight: 600 }}>$360</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Risk Profile</Typography>
                <Typography variant="h6" sx={{ color: '#ff4757', fontWeight: 600 }}>Extreme PvP</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Trading Venue</Typography>
                <Typography variant="h6" sx={{ color: '#00d4aa', fontWeight: 600 }}>Aster DEX</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Agents;
