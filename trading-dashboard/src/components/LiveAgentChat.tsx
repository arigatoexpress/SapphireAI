import React, { useRef, useEffect } from 'react';
import { MessageSquare, Bot, Brain, Zap, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  role: string;
  content: string;
  timestamp: string;
  tags?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  relatedSymbol?: string;
}

interface Props {
  messages: ChatMessage[];
}

export const LiveAgentChat: React.FC<Props> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col h-[500px] backdrop-blur-sm overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-blue-400" size={20} />
          <h3 className="font-semibold text-white">Agent Consensus Stream</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-400 font-medium">Live</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
            <Bot size={48} strokeWidth={1.5} />
            <p>Waiting for agent activity...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
      </div>
    </div>
  );
};

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isSystem = message.agentId === 'system';
  
  return (
    <div className={`flex gap-3 ${isSystem ? 'justify-center my-4' : 'justify-start'}`}>
      {!isSystem && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mt-1">
          {getAgentIcon(message.agentId)}
        </div>
      )}
      
      <div className={`flex flex-col max-w-[85%] ${isSystem ? 'items-center w-full' : ''}`}>
        {!isSystem && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-300">{message.agentName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wide">
              {message.role}
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock size={10} />
              {format(new Date(message.timestamp), 'HH:mm:ss')}
            </span>
          </div>
        )}

        <div 
          className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
            ${isSystem 
              ? 'bg-slate-800/50 text-slate-400 text-xs py-1 px-3 rounded-full border border-slate-800' 
              : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
            }
          `}
        >
          {message.content}
        </div>

        {!isSystem && message.tags && message.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-800/50 border border-slate-700/50 text-[10px] text-slate-400">
                #{tag}
              </span>
            ))}
            {message.relatedSymbol && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-medium">
                ${message.relatedSymbol}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function getAgentIcon(agentId: string) {
  switch (agentId) {
    case 'market-prediction-agent': return <Brain size={16} className="text-purple-400" />;
    case 'trend-momentum-agent': return <Zap size={16} className="text-amber-400" />;
    case 'financial-sentiment-agent': return <MessageSquare size={16} className="text-blue-400" />;
    default: return <Bot size={16} className="text-slate-400" />;
  }
}

