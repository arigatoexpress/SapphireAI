import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Container, Chip } from '@mui/material';
import AsterAgentGrid from '../components/AsterAgentGrid';
import HypeBrainStream from '../components/HypeBrainStream';
import UnifiedPositionsTable from '../components/UnifiedPositionsTable';
import AgentDetailModal from '../components/AgentDetailModal';
import { useDashboardWebSocket } from '../hooks/useWebSocket'; // Assuming this hook exists

const MissionControl: React.FC = () => {
  const { data, connected } = useDashboardWebSocket();
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  // Use real data or fallback to empty arrays
  const agentLogs = data?.messages?.filter(m => m.type === 'agent_log' || m.role === 'OBSERVATION') || [];

  // Transform Agent Metrics for Grid
  const realAgents = data?.agents?.map(a => ({
    name: a.name,
    icon: a.emoji || '🤖',
    winRate: a.win_rate || 0, // Assuming backend provides this or we calculate
    ops: a.total_trades || 0,
    status: (a.active ? 'active' : 'idle') as 'active' | 'idle',
    color: '#00d4aa',
    id: a.id // Pass ID for filtering
  })) || [];

  // Transform Positions
  const realAsterPositions = data?.open_positions?.filter(p => !p.agent.toLowerCase().includes('hype')) || [];
  const realHypePositions = data?.open_positions?.filter(p => p.agent.toLowerCase().includes('hype')) || [];

  // Handlers for TP/SL
  const handleUpdateTpSl = async (symbol: string, tp: number | null, sl: number | null) => {
    console.log(`Updating TP/SL for ${symbol}: ${tp}/${sl}`);
    try {
      // Determine API URL based on environment (similar to hook)
      const apiUrl = import.meta.env.VITE_API_URL || 'https://cloud-trader-267358751314.europe-west1.run.app';
      const baseUrl = apiUrl.replace('/ws/dashboard', ''); // messy fix, better to use env

      await fetch(`${baseUrl}/positions/${symbol}/tpsl`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tp, sl })
      });
    } catch (e) {
      console.error("Failed to update TP/SL", e);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#050505', color: '#fff', pb: 4 }}>
      {/* 1. Header Band */}
      <Box sx={{ bgcolor: '#0a0b10', borderBottom: '1px solid #222', py: 1, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1, color: '#fff' }}>
            SAPPHIRE <span style={{ color: '#00d4aa' }}>MISSION CONTROL</span>
          </Typography>
          <Chip
            label={connected ? "SYSTEMS OPERATIONAL" : "CONNECTING..."}
            size="small"
            color={connected ? "success" : "warning"}
            variant="outlined"
            className={connected ? "heartbeat" : ""}
            sx={{ borderRadius: 1, height: 20 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>NET WORTH</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Monospace' }}>******</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>PnL (24h)</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Monospace', color: (Number(data?.total_pnl) || 0) >= 0 ? '#00ff00' : '#ff0000' }}>
              {(Number(data?.total_pnl_percent) || 0).toFixed(2)}%
            </Typography>
          </Box>
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Grid container spacing={3}>

          {/* LEFT COLUMN: ASTER (Structured) */}
          <Grid item xs={12} lg={7}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <AsterAgentGrid
                agents={realAgents.length > 0 ? realAgents : []}
                onAgentClick={(agent) => setSelectedAgent(agent)}
              />

              <Box>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="overline" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 1.2 }}>
                    ACTIVE POSITIONS // CROSS-EXCHANGE
                  </Typography>
                </Box>
                <UnifiedPositionsTable
                  asterPositions={realAsterPositions as any}
                  hypePositions={realHypePositions as any}
                  onUpdateTpSl={handleUpdateTpSl}
                />
              </Box>
            </Box>
          </Grid>

          {/* RIGHT COLUMN: HYPERLIQUID (Unstructured Stream) */}
          <Grid item xs={12} lg={5}>
            <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <HypeBrainStream logs={agentLogs as any} />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Agent Detail Modal */}
      <AgentDetailModal
        open={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        agent={selectedAgent}
        logs={agentLogs}
      />
    </Box>
  );
};

export default MissionControl;
