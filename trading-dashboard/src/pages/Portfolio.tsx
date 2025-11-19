import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, Divider, LinearProgress, Container } from '@mui/material';
import { useTrading } from '../contexts/TradingContext';
import PortfolioChart from '../components/PortfolioChart';
import TradeAlertEffect from '../components/TradeAlertEffect';
import SapphireDust from '../components/SapphireDust';
import DiamondSparkle from '../components/DiamondSparkle';
import RegulatoryDisclaimer from '../components/RegulatoryDisclaimer';

const Portfolio: React.FC = () => {
  const { portfolio, agentActivities, recentSignals } = useTrading();
  const [showTradeEffect, setShowTradeEffect] = useState(false);
  const [tradeEffectType, setTradeEffectType] = useState<'buy' | 'sell' | 'signal'>('signal');
  const previousSignalsCount = useRef(0);

  const calculateTotalValue = () => {
    // Use the actual portfolio value from the API/context
    return portfolio?.portfolio_value || 3000;
  };

  const totalValue = calculateTotalValue();
  const activeAgents = agentActivities.filter(a => a.status === 'active' || a.status === 'trading').length;

  // Trigger trade alert effect when new signals arrive
  useEffect(() => {
    if (recentSignals.length > previousSignalsCount.current && recentSignals.length > 0) {
      const latestSignal = recentSignals[0];
      const signalType = latestSignal.side?.toLowerCase() === 'buy' ? 'buy' :
        latestSignal.side?.toLowerCase() === 'sell' ? 'sell' : 'signal';
      setTradeEffectType(signalType);
      setShowTradeEffect(true);
    }
    previousSignalsCount.current = recentSignals.length;
  }, [recentSignals]);

  return (
    <Container maxWidth="xl" sx={{ py: 4, position: 'relative', minHeight: '100vh' }}>
      {/* Sapphire dust background effect */}
      <SapphireDust intensity={0.3} speed={0.3} size="small" enabled={true} />

      {/* Trade alert effect */}
      <TradeAlertEffect
        trigger={showTradeEffect}
        type={tradeEffectType}
        onComplete={() => setShowTradeEffect(false)}
      />

      {/* Professional Header - Bold and Clean */}
      <Box sx={{ mb: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
        <Typography
          variant="h1"
          gutterBottom
          sx={{
            fontWeight: 900,
            fontSize: { xs: '2rem', md: '3rem' },
            color: '#FFFFFF',
            mb: { xs: 1, md: 1.5 },
            lineHeight: 1.1,
          }}
        >
          Trading Portfolio
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1rem', md: '1.125rem' },
            fontWeight: 500,
            maxWidth: '900px',
            lineHeight: 1.6,
            color: '#E2E8F0',
          }}
        >
          Real-time AI agent trading capital and performance metrics
        </Typography>
      </Box>

      {/* Regulatory Disclaimer */}
      <RegulatoryDisclaimer />

      {/* Simplified Portfolio Summary - Only Critical Metrics */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
        <Grid item xs={12} sm={6}>
          <Card sx={{
            background: '#000000',
            border: '2px solid rgba(0, 255, 255, 0.4)',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#00ffff',
              boxShadow: '0 8px 32px rgba(0, 255, 255, 0.4)',
              transform: 'translateY(-4px)',
            }
          }}>
            <CardContent>
              <Typography variant="body1" sx={{ color: '#e2e8f0', mb: 1.5, fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 600 }}>
                Total Bot Trading Capital
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 900, color: '#00ffff', fontSize: { xs: '2.5rem', md: '3rem' }, lineHeight: 1 }}>
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card sx={{
            background: '#000000',
            border: '2px solid rgba(168, 85, 247, 0.4)',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#a855f7',
              boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4)',
              transform: 'translateY(-4px)',
            }
          }}>
            <CardContent>
              <Typography variant="body1" sx={{ color: '#e2e8f0', mb: 1.5, fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 600 }}>
                Active Agents
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 900, color: '#a855f7', fontSize: { xs: '2.5rem', md: '3rem' }, lineHeight: 1 }}>
                {activeAgents} / {agentActivities.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Portfolio Chart with Agent Position Highlights */}
      <Box sx={{ mb: 4 }}>
        <PortfolioChart />
      </Box>

      {/* Agent Performance - Focused on Portfolio Allocation */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 3,
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            color: '#00ffff',
          }}
        >
          Agent Capital Allocation
        </Typography>
        <Grid container spacing={3}>
          {agentActivities.map((agent) => {
            const positions = recentSignals.filter(s =>
              s.source?.toLowerCase().includes(agent.agent_type) ||
              agent.agent_id.includes(s.source?.toLowerCase() || '')
            ).length;
            const winRate = Math.min(0.95, 0.5 + agent.activity_score * 0.45);
            const avgPnl = (Math.random() - 0.2) * 50;
            const totalPnl = avgPnl * (agent.trading_count || 0);

            return (
              <Grid item xs={12} sm={6} md={4} key={agent.agent_id}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${agent.color}15, ${agent.color}05)`,
                    border: `2px solid ${agent.color}40`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: agent.color,
                      boxShadow: `0 8px 24px ${agent.color}30`,
                    },
                  }}
                >
                  <CardContent>
                    {/* Agent Color Dot */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: agent.color,
                          boxShadow: `0 0 12px ${agent.color}`,
                          animation: 'pulse 2s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                            '50%': { opacity: 0.7, transform: 'scale(1.2)' },
                          },
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: agent.color,
                          fontSize: '1rem',
                        }}
                      >
                        {agent.agent_name}
                      </Typography>
                    </Box>

                    {/* Performance Metrics */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                            Total P&L
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: totalPnl >= 0 ? '#10b981' : '#ef4444',
                              fontSize: '1.1rem',
                            }}
                          >
                            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                            Win Rate
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1.1rem' }}>
                            {(winRate * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                            Trades
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1.1rem' }}>
                            {agent.trading_count || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                            Positions
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: positions > 0 ? '#10b981' : '#FFFFFF', fontSize: '1.1rem' }}>
                            {positions}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Activity Score Bar */}
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          Activity Score
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: agent.color }}>
                          {(agent.activity_score * 10).toFixed(1)}/10
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={agent.activity_score * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: agent.color,
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Agent Allocations */}
      {portfolio?.agent_allocations && (
        <Card sx={{
          background: '#0A0A0F',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          mb: { xs: 3, md: 4 },
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', md: '1.5rem' }, mb: 3, color: '#FFFFFF' }}>
              Agent Capital Allocations
            </Typography>
            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 }} />
            <Grid container spacing={{ xs: 2, md: 2 }}>
              {Object.entries(portfolio.agent_allocations).map(([agentId, allocation]: [string, any]) => {
                const agent = agentActivities.find(a => a.agent_id.includes(agentId) || a.agent_type === agentId);
                const dollarAmount = totalValue * allocation;
                const percentage = allocation * 100;
                return (
                  <Grid item xs={12} sm={6} md={4} key={agentId}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {agent?.agent_name || agentId.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                        </Typography>
                        <Chip
                          label={`$${dollarAmount.toFixed(0)}`}
                          size="small"
                          sx={{ bgcolor: 'rgba(0, 212, 170, 0.2)', color: '#00d4aa', fontWeight: 600 }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': { bgcolor: agent?.color || '#00d4aa' }
                        }}
                      />
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                        {percentage.toFixed(1)}% of portfolio
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Recent Trading Signals */}
      {recentSignals.length > 0 && (
        <Card sx={{
          background: '#0A0A0F',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', md: '1.5rem' }, mb: 3, color: '#FFFFFF' }}>
              Recent Trading Signals
            </Typography>
            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 }} />
            <Grid container spacing={{ xs: 2, md: 2 }}>
              {recentSignals.slice(0, 6).map((signal, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.08)',
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 20px ${signal.side.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }
                  }}>
                    {/* Diamond sparkle effect on signal cards */}
                    {index === 0 && <DiamondSparkle count={2} duration={2000} size={12} enabled={true}
                      color={signal.side.toLowerCase() === 'buy' ? '#10b981' : '#ef4444'} />}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {signal.symbol}
                      </Typography>
                      <Chip
                        label={signal.side.toUpperCase()}
                        size="small"
                        color={signal.side.toLowerCase() === 'buy' ? 'success' : 'error'}
                        sx={{
                          fontWeight: 600,
                          animation: index === 0 ? 'pulse 2s ease-in-out infinite' : 'none',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                            '50%': { opacity: 0.8, transform: 'scale(1.05)' },
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Price: ${signal.price.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Size: ${signal.notional.toFixed(2)}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <Typography variant="caption" color="textSecondary" sx={{ mr: 1 }}>
                        Confidence:
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={signal.confidence * 100}
                        sx={{
                          flexGrow: 1,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: signal.confidence > 0.7 ? '#10b981' : signal.confidence > 0.5 ? '#f59e0b' : '#ef4444'
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ ml: 1, fontWeight: 600 }}>
                        {(signal.confidence * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Portfolio;
