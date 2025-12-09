import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { useTradingData, LogMessage } from '../../contexts/TradingContext';

const LogItem: React.FC<{ log: LogMessage }> = ({ log }) => {
    const isBuy = log.role === 'BUY' || log.content.includes('BUY');
    const isSell = log.role === 'SELL' || log.content.includes('SELL');

    return (
        <Box sx={{
            fontFamily: 'JetBrains Mono',
            fontSize: '0.8rem',
            mb: 1.5,
            display: 'flex',
            gap: 1.5,
            opacity: 0.9,
            '&:hover': { opacity: 1 }
        }}>
            <Typography variant="caption" sx={{ color: '#444', minWidth: 65, flexShrink: 0 }}>
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
            <Box>
                <Typography component="span" sx={{
                    color: isBuy ? '#00ff00' : isSell ? '#ff0000' : '#00d4aa',
                    fontWeight: 700,
                    mr: 1
                }}>
                    [{log.role}]
                </Typography>
                <Typography component="span" sx={{ color: '#ccc' }}>
                    {log.content}
                </Typography>
            </Box>
        </Box>
    );
};

export const NewAsterBrainStream: React.FC = () => {
    const { logs } = useTradingData();
    const bottomRef = useRef<HTMLDivElement>(null);

    return (
        <Box sx={{
            height: '100%',
            minHeight: 500,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
            overflow: 'hidden'
        }}>
            {/* Header */}
            <Box sx={{
                p: 1.5,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                bgcolor: 'rgba(255,255,255,0.02)'
            }}>
                <Typography variant="overline" sx={{ fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
                    ASTER NEURAL STREAM
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <div className="status-dot" style={{ backgroundColor: '#00ff00' }} />
                    <Typography variant="caption" sx={{ color: '#00ff00' }}>LIVE</Typography>
                </Box>
            </Box>

            {/* Logs Area */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                {logs.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, opacity: 0.3 }}>
                        <Typography variant="caption" sx={{ color: '#666', fontFamily: 'JetBrains Mono' }}>Waiting for neural activity...</Typography>
                        <Typography variant="caption" sx={{ color: '#666', fontFamily: 'JetBrains Mono' }}>System initializing...</Typography>
                    </Box>
                ) : (
                    logs.map((log, i) => (
                        <LogItem key={log.id + i} log={log} />
                    ))
                )}
                <div ref={bottomRef} />
            </Box>
        </Box>
    );
};
