import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const getLogIcon = (type) => {
    switch (type) {
        case 'success':
            return '✅';
        case 'error':
            return '❌';
        case 'warning':
            return '⚠️';
        default:
            return 'ℹ️';
    }
};
const getLogColor = (type) => {
    switch (type) {
        case 'success':
            return 'text-green-400';
        case 'error':
            return 'text-red-400';
        case 'warning':
            return 'text-yellow-400';
        default:
            return 'text-slate-300';
    }
};
const ActivityLog = ({ logs }) => {
    const [filter, setFilter] = React.useState('all');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [autoScroll, setAutoScroll] = React.useState(true);
    const scrollRef = React.useRef(null);
    const lastLogCountRef = React.useRef(logs.length);
    const formatTimestamp = React.useCallback((timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        }
        catch {
            return timestamp;
        }
    }, []);
    // Filter logs based on type and search term
    const filteredLogs = React.useMemo(() => {
        let filtered = logs;
        if (filter !== 'all') {
            filtered = filtered.filter(log => log.type === filter);
        }
        if (searchTerm) {
            filtered = filtered.filter(log => log.message.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return filtered;
    }, [logs, filter, searchTerm]);
    // Handle auto-scroll when new logs arrive
    React.useEffect(() => {
        const hasNewLogs = logs.length > lastLogCountRef.current;
        lastLogCountRef.current = logs.length;
        if (hasNewLogs && autoScroll && scrollRef.current) {
            // Use setTimeout to ensure DOM has updated
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                        top: scrollRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    }, [logs.length, autoScroll]);
    // Handle manual scroll to disable auto-scroll
    const handleScroll = React.useCallback(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
            setAutoScroll(isAtBottom);
        }
    }, []);
    return (_jsxs("div", { className: "rounded-2xl border border-surface-200/40 bg-surface-100/80 p-6 shadow-glass", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-slate-400", children: "Activity Monitor" }), _jsx("h3", { className: "text-xl font-semibold text-white", children: "System Activity" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "text-sm text-slate-400", children: [filteredLogs.length, " of ", logs.length, " entries"] }), _jsx("button", { onClick: () => setAutoScroll(!autoScroll), className: `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${autoScroll
                                    ? 'bg-primary-500/20 text-primary-300 border border-primary-400/30'
                                    : 'bg-slate-600/20 text-slate-400 border border-slate-500/30'}`, children: autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF' })] })] }), _jsxs("div", { className: "flex flex-wrap gap-3 mb-4", children: [_jsx("div", { className: "flex gap-2", children: ['all', 'info', 'success', 'warning', 'error'].map((type) => (_jsx("button", { onClick: () => setFilter(type), className: `px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${filter === type
                                ? type === 'all' ? 'bg-slate-500/20 text-slate-200 border border-slate-400/30' :
                                    type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                                        type === 'warning' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                                            type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                                                'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                                : 'bg-surface-50/40 text-slate-400 hover:bg-surface-50/60 border border-surface-200/40'}`, children: type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) }, type))) }), _jsx("div", { className: "flex-1 min-w-48", children: _jsx("input", { type: "text", placeholder: "Search logs...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full px-3 py-1 bg-surface-50/40 border border-surface-200/40 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50" }) })] }), _jsx("div", { ref: scrollRef, onScroll: handleScroll, className: "space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-surface-100/20", children: filteredLogs.length > 0 ? (filteredLogs.map((log, index) => (_jsxs("div", { className: `flex items-start space-x-3 p-3 rounded-xl border transition-all duration-200 ${log.type === 'error' ? 'bg-red-500/10 border-red-400/20 hover:bg-red-500/15' :
                        log.type === 'warning' ? 'bg-yellow-500/10 border-yellow-400/20 hover:bg-yellow-500/15' :
                            log.type === 'success' ? 'bg-green-500/10 border-green-400/20 hover:bg-green-500/15' :
                                'bg-surface-50/40 border-surface-200/40 hover:bg-surface-50/60'}`, children: [_jsx("span", { className: "text-lg flex-shrink-0 mt-0.5", children: getLogIcon(log.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: `text-sm ${getLogColor(log.type)} break-words leading-relaxed`, children: log.message }), _jsx("p", { className: "text-xs text-slate-500 mt-1 font-mono opacity-75", children: formatTimestamp(log.timestamp) })] })] }, `${log.timestamp}-${index}`)))) : (_jsxs("div", { className: "text-center py-12 text-slate-400", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-full bg-surface-50/40 flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-slate-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }) }), _jsx("p", { className: "text-sm font-medium", children: "No matching activity" }), _jsx("p", { className: "text-xs mt-1 opacity-75", children: logs.length === 0 ? 'System events will appear here' : 'Try adjusting your filters' })] })) })] }));
};
export default ActivityLog;
