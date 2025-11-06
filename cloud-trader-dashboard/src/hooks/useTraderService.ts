import React, { useEffect, useState, useCallback, useRef } from 'react';
import { fetchDashboard, HealthResponse, DashboardResponse } from '../api/client';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface MCPMessage {
  id: string;
  type: string;
  sender: string;
  timestamp: string;
  content: string;
  context?: string;
}

export const useTraderService = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const pollInterval = 15000; // Default 15s - faster updates for better UX
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [mcpMessages, setMcpMessages] = useState<MCPMessage[]>([]);
  const mcpBaseUrl = import.meta.env.VITE_MCP_URL as string | undefined;
  const [mcpStatus, setMcpStatus] = useState<'connecting' | 'connected' | 'disconnected'>(mcpBaseUrl ? 'connecting' : 'disconnected');
  const mcpSocketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toISOString();
    setLogs((prev) => [{
      timestamp,
      message,
      type
    }, ...prev.slice(0, 99)]); // Keep last 100 logs
  }, []);

  const refresh = useCallback(async () => {
    const wasLoading = loading;
    if (!wasLoading) setLoading(true);
    setError(null);

    try {
      // Fetch dashboard data - this is our single source of truth
      const data = await fetchDashboard();

      // Update dashboard data
      setDashboardData(data);

      // Extract health info from dashboard data
      const healthData = {
        running: data.system_status.services.cloud_trader === 'running',
        paper_trading: data.portfolio.source === 'local', // Assume paper trading if using local portfolio
        last_error: null
      };

      setHealth(healthData);
      setConnectionStatus('connected');
      setError(null);
      setRetryCount(0); // Reset retry count on successful connection

      // Only log health checks occasionally to avoid spam
      if (wasLoading || !health || health.running !== healthData.running) {
        addLog(`System ${healthData.running ? 'running' : 'stopped'} ${healthData.paper_trading ? '(Paper Trading)' : '(Live Trading)'}`, 'info');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching health';

      // Be more forgiving on initial loads and network errors
      const isNetworkError = errorMessage.includes('CORS') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError');

      if (isNetworkError && retryCount < 3) {
        // Network errors on initial attempts - these might be temporary
        setConnectionStatus('connecting');
        setRetryCount(prev => prev + 1);
        addLog(`Network connectivity issue (attempt ${retryCount + 1}/3): ${errorMessage}`, 'warning');
        // Don't show error state yet, let it retry
        setError(null);
      } else if (isNetworkError) {
        // After 3 failed attempts, show a user-friendly error
        setError('Unable to connect to trading service. Please check your internet connection and try again.');
        setConnectionStatus('disconnected');
        addLog(`Connection failed after ${retryCount} attempts: ${errorMessage}`, 'error');
      } else {
        // Other types of errors (parsing, server errors, etc.)
        setError(errorMessage);
        setConnectionStatus('disconnected');
        addLog(`Connection error: ${errorMessage}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [addLog, retryCount, loading, health]);

  // Use refs to avoid stale closures in polling
  const pollIntervalRef = React.useRef(pollInterval);
  const connectionStatusRef = React.useRef(connectionStatus);

  // Update refs when values change
  React.useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  useEffect(() => {
    // Initial load
    refresh();

    // Set up polling with exponential backoff on errors
    let intervalId: ReturnType<typeof setTimeout> | undefined;
    let currentInterval = pollIntervalRef.current;

    const scheduleNextPoll = () => {
      intervalId = setTimeout(async () => {
        await refresh();

        // Adjust polling interval based on connection status
        if (connectionStatusRef.current === 'disconnected') {
          currentInterval = Math.min(currentInterval * 1.5, 60000); // Max 60s on errors
        } else {
          currentInterval = pollIntervalRef.current; // Reset to normal
        }

        scheduleNextPoll();
      }, currentInterval);
    };

    scheduleNextPoll();

    return () => {
      if (intervalId !== undefined) clearTimeout(intervalId);
    };
  }, [refresh]); // Only depend on refresh to prevent excessive re-runs

  // Connection status indicator
  useEffect(() => {
    if (connectionStatus === 'disconnected' && !error) {
      addLog('🔄 Attempting to reconnect...', 'warning');
    } else if (connectionStatus === 'connected' && error) {
      setConnectionStatus('disconnected');
    }
  }, [connectionStatus, error, addLog]);

  useEffect(() => {
    if (!mcpBaseUrl) {
      setMcpStatus('disconnected');
      return;
    }
    const controller = new AbortController();

    const connect = () => {
      try {
        const wsUrl = mcpBaseUrl.replace('http', 'ws');
        const socket = new WebSocket(wsUrl);
        setMcpStatus('connecting');
        socket.onopen = () => {
          setMcpStatus('connected');
          mcpSocketRef.current = socket;
        };
        socket.onerror = () => {
          setMcpStatus('disconnected');
        };
        socket.onclose = () => {
          setMcpStatus('disconnected');
          mcpSocketRef.current = null;
          const timeoutId = setTimeout(() => {
            if (!controller.signal.aborted) {
              connect();
            }
          }, 3000);
          reconnectRef.current = timeoutId;
        };
        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            const message = payload.message;
            if (!message) return;
            const entry: MCPMessage = {
              id: message.payload?.reference_id || crypto.randomUUID(),
              type: message.message_type ?? 'unknown',
              sender: message.sender_id ?? 'MCP',
              timestamp: message.timestamp ?? new Date().toISOString(),
              content: message.payload?.rationale || message.payload?.answer || message.payload?.notes || JSON.stringify(message.payload),
              context: message.payload?.question || message.payload?.symbol,
            };
            setMcpMessages((prev) => [entry, ...prev].slice(0, 50));
          } catch (err) {
            console.error('Failed to parse MCP message', err);
          }
        };
      } catch (err) {
        setMcpStatus('disconnected');
        console.error('Failed to initialise MCP socket', err);
      }
    };

    connect();

    return () => {
      controller.abort();
      const activeSocket = mcpSocketRef.current;
      if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
        activeSocket.close();
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
      mcpSocketRef.current = null;
    };
  }, [mcpBaseUrl]);

  return {
    health,
    dashboardData,
    loading,
    error,
    logs,
    connectionStatus,
    mcpMessages,
    mcpStatus,
    refresh,
    addLog
  };
};

