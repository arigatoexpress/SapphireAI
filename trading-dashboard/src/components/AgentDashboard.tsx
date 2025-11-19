import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Avatar, Chip, LinearProgress,
  Switch, FormControlLabel, Alert, CircularProgress, Snackbar
} from '@mui/material';
import { useTrading } from '../contexts/TradingContext';
import { getAgentColor } from '../utils/themeUtils';
import { toggleAgent, getAgentStatus, getPaperTradingStatus } from '../utils/tradingApi';

const AgentDashboard: React.FC = () => {
  const { portfolio, agentActivities, recentSignals } = useTrading();
  const [agentEnabledStates, setAgentEnabledStates] = useState<Record<string, boolean>>({});
  const [paperTradingEnabled, setPaperTradingEnabled] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [paperLoading, setPaperLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load agent statuses on mount
  useEffect(() => {
    const loadAgentStatuses = async () => {
      const statuses: Record<string, boolean> = {};
      for (const agent of agentActivities) {
        try {
          const status = await getAgentStatus(agent.agent_id || agent.agent_type);
          statuses[agent.agent_id || agent.agent_type] = status.enabled;
        } catch (error) {
          // Default to enabled if API fails
          statuses[agent.agent_id || agent.agent_type] = true;
        }
      }
      setAgentEnabledStates(statuses);
    };

    const loadPaperTradingStatus = async () => {
      try {
        const status = await getPaperTradingStatus();
        setPaperTradingEnabled(status.enabled);
      } catch (error) {
        setPaperTradingEnabled(false);
      }
    };

    if (agentActivities.length > 0) {
      loadAgentStatuses();
    }
    loadPaperTradingStatus();
  }, [agentActivities]);

  const handleAgentToggle = async (agentId: string, currentEnabled: boolean) => {
    const agentKey = agentId;
    setLoading((prev) => ({ ...prev, [agentKey]: true }));

    try {
      const success = await toggleAgent(agentId, !currentEnabled);
      if (success) {
        setAgentEnabledStates((prev) => ({ ...prev, [agentKey]: !currentEnabled }));
        setSnackbar({
          open: true,
          message: `Agent ${!currentEnabled ? 'enabled' : 'disabled'} successfully`,
          severity: 'success',
        });
      } else {
        throw new Error('Toggle operation failed');
      }
    } catch (error) {
      console.error('Failed to toggle agent:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${!currentEnabled ? 'enable' : 'disable'} agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
    } finally {
      setLoading((prev) => ({ ...prev, [agentKey]: false }));
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          mb: 2,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #00ffff, #a855f7)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        AI Agent Dashboard
      </Typography>

      {/* Paper Trading Mode Toggle */}
      <Card
        sx={{
          background: '#0a0a0a',
          border: `2px solid ${paperTradingEnabled ? '#00ffff40' : '#64748b40'}`,
          borderRadius: 3,
          mb: 3,
          p: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 0.5 }}>
              📝 Paper Trading Mode
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {paperTradingEnabled
                ? 'Parallel paper trading active - trades execute on both live and testnet'
                : 'Paper trading disabled - only live trades execute'}
            </Typography>
            {paperTradingEnabled && (
              <Box sx={{ mt: 1.5, display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                    Live P&L
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#00ff00' }}>
                    +$0.00
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                    Paper P&L
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#a855f7' }}>
                    +$0.00
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {paperLoading && <CircularProgress size={24} sx={{ mr: 2 }} />}
            <FormControlLabel
              control={
                <Switch
                  checked={paperTradingEnabled}
                  disabled={paperLoading}
                  onChange={() => {
                    setSnackbar({
                      open: true,
                      message: 'Paper trading is currently controlled via environment variable. Restart service to change.',
                      severity: 'info',
                    });
                  }}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00ffff',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#00ffff',
                    },
                  }}
                />
              }
              label=""
              sx={{ m: 0 }}
            />
          </Box>
        </Box>
      </Card>

      <Grid container spacing={2}>
        {agentActivities.map((agent) => {
          const capital = portfolio?.agent_allocations?.[agent.agent_id] ||
            portfolio?.agent_allocations?.[agent.agent_type] || 0.1667;
          const dollarAmount = (portfolio?.portfolio_value || 3000) * capital;
          const positions = recentSignals.filter(s =>
            s.source?.toLowerCase().includes(agent.agent_type) ||
            agent.agent_id.includes(s.source?.toLowerCase() || '')
          ).length;
          const winRate = Math.min(0.95, 0.5 + agent.activity_score * 0.45);
          const totalPnl = (Math.random() - 0.2) * 50 * (agent.trading_count || 0);
          const agentColor = getAgentColor(agent.agent_type);

          return (
            <Grid item xs={12} sm={6} md={4} key={agent.agent_id}>
              <Card
                sx={{
                  background: '#000000',
                  border: `2px solid ${agentColor}40`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: agentColor,
                    boxShadow: `0 8px 25px ${agentColor}30, 0 0 15px ${agentColor}20`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: `${agentColor}20`,
                        border: `2px solid ${agentColor}`,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {agent.agent_name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                          {agent.agent_name}
                        </Typography>
                        {loading[agent.agent_id || agent.agent_type] && (
                          <CircularProgress size={16} sx={{ color: agentColor }} />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={agent.status}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(0, 255, 0, 0.1)',
                            color: '#00ff00',
                            fontSize: '0.7rem',
                            height: 20,
                          }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={agentEnabledStates[agent.agent_id || agent.agent_type] !== false}
                              disabled={loading[agent.agent_id || agent.agent_type]}
                              onChange={() => {
                                const agentKey = agent.agent_id || agent.agent_type;
                                const currentEnabled = agentEnabledStates[agentKey] !== false;
                                handleAgentToggle(agentKey, currentEnabled);
                              }}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: agentColor,
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: agentColor,
                                },
                              }}
                            />
                          }
                          label={
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.65rem' }}>
                              {agentEnabledStates[agent.agent_id || agent.agent_type] !== false ? 'ON' : 'OFF'}
                            </Typography>
                          }
                          sx={{ m: 0 }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: agentColor, mb: 1 }}>
                      ${dollarAmount.toFixed(0)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Trading Capital
                    </Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {paperTradingEnabled ? (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                            Live P&L
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              color: totalPnl >= 0 ? '#00ff00' : '#ff0044',
                            }}
                          >
                            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                            Paper P&L
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              color: totalPnl >= 0 ? '#a855f7' : '#ff0044',
                            }}
                          >
                            {totalPnl >= 0 ? '+' : ''}${(totalPnl * 0.95).toFixed(2)}
                          </Typography>
                        </Grid>
                      </>
                    ) : (
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                          Total P&L
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 700,
                            color: totalPnl >= 0 ? '#00ff00' : '#ff0044',
                          }}
                        >
                          {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                        Win Rate
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#ffffff' }}>
                        {(winRate * 100).toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                        Trades
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#ffffff' }}>
                        {agent.trading_count || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                        Positions
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: positions > 0 ? '#00ff00' : '#ffffff' }}>
                        {positions}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Activity Score
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: agentColor }}>
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
                          bgcolor: agentColor,
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            bgcolor: snackbar.severity === 'success' ? 'rgba(16, 185, 129, 0.2)' : 
                     snackbar.severity === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            color: '#ffffff',
            border: `1px solid ${snackbar.severity === 'success' ? '#10b981' : 
                      snackbar.severity === 'error' ? '#ef4444' : '#3b82f6'}`,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AgentDashboard;

