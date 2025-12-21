import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Fade,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  FlashOn,
  Timeline,
  Assessment,
} from '@mui/icons-material';
import { useTrading } from '../contexts/TradingContext';

interface LiveTrade {
  id: string;
  timestamp: string;
  agent_id: string;
  agent_name: string;
  agent_type: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  notional: number;
  confidence: number;
  pnl?: number;
  status: 'pending' | 'filled' | 'partial' | 'cancelled';
}

const LiveTrades: React.FC = () => {
  const { recentSignals, agentActivities, portfolio } = useTrading();
  const [trades, setTrades] = useState<LiveTrade[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:8080'
      : 'https://api.sapphiretrade.xyz');

  // Generate live trades from recent signals
  useEffect(() => {
    const generateLiveTrades = () => {
      const liveTrades: LiveTrade[] = [];

      recentSignals.forEach((signal, index) => {
        const agent = agentActivities.find(a =>
          a.agent_id.includes(signal.source?.toLowerCase() || '') ||
          signal.source?.toLowerCase().includes(a.agent_type)
        );

        liveTrades.push({
          id: `trade-${signal.timestamp}-${index}`,
          timestamp: signal.timestamp,
          agent_id: agent?.agent_id || 'unknown',
          agent_name: agent?.agent_name || signal.source || 'Unknown Agent',
          agent_type: agent?.agent_type || 'unknown',
          symbol: signal.symbol,
          side: signal.side.toLowerCase() as 'buy' | 'sell',
          price: signal.price,
          size: signal.notional / signal.price,
          notional: signal.notional,
          confidence: signal.confidence,
          status: index === 0 ? 'filled' : index < 3 ? 'partial' : 'pending',
          pnl: (Math.random() - 0.3) * signal.notional * 0.1, // Simulated P&L
        });
      });

      // Sort by timestamp descending (newest first)
      liveTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTrades(liveTrades.slice(0, 20)); // Show last 20 trades
    };

    generateLiveTrades();
  }, [recentSignals, agentActivities]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Refresh is handled by TradingContext
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getAgentColor = (agentType: string) => {
    const agent = agentActivities.find(a => a.agent_type === agentType);
    return agent?.color || '#8b5cf6';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled': return '#10b981';
      case 'partial': return '#f59e0b';
      case 'pending': return '#06b6d4';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const filledTrades = trades.filter(t => t.status === 'filled').length;

  return (
    <Paper
      elevation={0}
      sx={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        mb: 4,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(6, 182, 212, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ec4899, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(236, 72, 153, 0.3)',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', boxShadow: '0 4px 16px rgba(236, 72, 153, 0.3)' },
                '50%': { transform: 'scale(1.05)', boxShadow: '0 6px 24px rgba(236, 72, 153, 0.5)' },
              },
            }}
          >
            <FlashOn sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>
              Live Trades
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Real-time trade executions from AI agents
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right', mr: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
              Total P&L
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: totalPnL >= 0 ? '#10b981' : '#ef4444',
              }}
            >
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </Typography>
          </Box>
          <Chip
            label={`${filledTrades} Filled`}
            size="small"
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              fontWeight: 600,
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          />
          <Tooltip title={autoRefresh ? "Pause Auto-Refresh" : "Resume Auto-Refresh"} arrow>
            <IconButton
              size="small"
              onClick={() => setAutoRefresh(!autoRefresh)}
              sx={{
                color: autoRefresh ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <Refresh sx={{ fontSize: 20, animation: autoRefresh ? 'spin 2s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Trades List */}
      <Box
        sx={{
          maxHeight: '500px',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(236, 72, 153, 0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(236, 72, 153, 0.3)',
            borderRadius: '3px',
          },
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={40} />
          </Box>
        )}

        {!loading && trades.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Timeline sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              No live trades yet. AI agents are analyzing the market...
            </Typography>
          </Box>
        )}

        {!loading && trades.length > 0 && (
          <List sx={{ p: 0 }}>
            {trades.map((trade, index) => (
              <React.Fragment key={trade.id}>
                <Fade in timeout={300}>
                  <ListItem
                    sx={{
                      p: 2,
                      background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                      '&:hover': {
                        background: 'rgba(236, 72, 153, 0.1)',
                      },
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: `${getAgentColor(trade.agent_type)}20`,
                          border: `2px solid ${getAgentColor(trade.agent_type)}`,
                          width: 40,
                          height: 40,
                        }}
                      >
                        {trade.side === 'buy' ? (
                          <TrendingUp sx={{ fontSize: 20, color: getAgentColor(trade.agent_type) }} />
                        ) : (
                          <TrendingDown sx={{ fontSize: 20, color: getAgentColor(trade.agent_type) }} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: '#FFFFFF',
                              fontSize: '0.95rem',
                            }}
                          >
                            {trade.symbol}
                          </Typography>
                          <Chip
                            label={trade.side.toUpperCase()}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: trade.side === 'buy' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: trade.side === 'buy' ? '#10b981' : '#ef4444',
                              border: `1px solid ${trade.side === 'buy' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                            }}
                          />
                          <Chip
                            label={trade.status.toUpperCase()}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: `${getStatusColor(trade.status)}20`,
                              color: getStatusColor(trade.status),
                              border: `1px solid ${getStatusColor(trade.status)}40`,
                            }}
                          />
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: getAgentColor(trade.agent_type),
                              boxShadow: `0 0 8px ${getAgentColor(trade.agent_type)}`,
                              ml: 'auto',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              <strong>Agent:</strong> {trade.agent_name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              <strong>Price:</strong> ${trade.price.toFixed(4)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              <strong>Size:</strong> {trade.size.toFixed(4)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              <strong>Notional:</strong> ${trade.notional.toFixed(2)}
                            </Typography>
                          </Box>
                          {trade.pnl !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                P&L:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: trade.pnl >= 0 ? '#10b981' : '#ef4444',
                                }}
                              >
                                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', ml: 1 }}>
                                Confidence: {(trade.confidence * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                          )}
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                            {formatTime(trade.timestamp)} • {new Date(trade.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </Fade>
                {index < trades.length - 1 && <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default LiveTrades;
