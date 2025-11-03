import React from 'react';

interface CouncilMessage {
  id: string;
  type: string;
  sender: string;
  timestamp: string;
  content: string;
  context?: string;
}

interface MCPCouncilProps {
  messages: CouncilMessage[];
  status?: string;
}

const typeColors: Record<string, string> = {
  observation: 'from-emerald-400/25 via-emerald-500/10 to-transparent',
  proposal: 'from-blue-400/25 via-blue-500/10 to-transparent',
  critique: 'from-red-400/25 via-red-500/10 to-transparent',
  query: 'from-amber-400/25 via-amber-500/10 to-transparent',
  response: 'from-purple-400/25 via-purple-500/10 to-transparent',
  consensus: 'from-teal-400/25 via-teal-500/10 to-transparent',
  execution: 'from-cyan-400/25 via-cyan-500/10 to-transparent',
  heartbeat: 'from-slate-400/25 via-slate-500/10 to-transparent',
};

const MCPCouncil: React.FC<MCPCouncilProps> = ({ messages, status }) => {
  return (
    <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-surface-75/80 p-6 shadow-glass">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.18),_transparent_65%)]" />
      <div className="relative flex items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-accent-ai/80">Agent Council</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">MCP Negotiation Feed</h3>
          <p className="mt-1 text-sm text-slate-300/90">
            Real-time dialogue between Sapphire vibe traders as they question, critique, and ratify strategy under multi-agent governance.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200/80">
            <span className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'}`} />
            {status === 'connected' ? 'Mesh Online' : status === 'connecting' ? 'Mesh Syncing' : 'Mesh Offline'}
          </span>
          <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">Latest {messages.length} events</span>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {messages.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">
            Awaiting MCP traffic. Agent council will appear once proposals and queries are published.
          </div>
        ) : (
          messages.slice(0, 12).map((message) => (
            <article key={message.id} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
              <div className={`absolute inset-0 bg-gradient-to-r ${typeColors[message.type] || 'from-slate-400/20 via-slate-500/10 to-transparent'}`} />
              <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/80">
                      {message.type}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{message.sender}</p>
                  <p className="text-sm text-slate-200/90 leading-relaxed">{message.content}</p>
                  {message.context && (
                    <p className="text-xs text-slate-400/80 leading-relaxed">{message.context}</p>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default MCPCouncil;

