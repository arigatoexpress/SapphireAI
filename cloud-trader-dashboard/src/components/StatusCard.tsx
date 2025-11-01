import { HealthResponse } from '../api/client';

interface StatusCardProps {
  health: HealthResponse | null;
  loading: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({ health, loading }) => {
  if (loading || !health) {
    return (
      <div className="rounded-2xl border border-surface-200/40 bg-surface-100/60 p-6 text-center text-slate-300 shadow-glass">
        <div className="animate-pulse space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full bg-slate-600/40" />
          <p className="text-sm">Calibrating systems…</p>
        </div>
      </div>
    );
  }

  const statusBadge = health.running ? 'bg-emerald-400/80 text-slate-900' : 'bg-amber-400/80 text-slate-900';

  return (
    <div className="rounded-2xl border border-surface-200/40 bg-surface-100/80 p-6 text-slate-200 shadow-glass">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">System Status</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{health.running ? 'Operational' : 'Standby'}</h3>
          <p className="mt-2 text-sm text-slate-400">
            {health.running
              ? 'Autonomous execution enabled · risk guardrails engaged'
              : 'Trader halted · awaiting operator command'}
          </p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge}`}>
          <span className="h-2 w-2 rounded-full bg-slate-900" />
          {health.running ? 'Live' : 'Paused'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-surface-200/50 bg-surface-50/40 p-4 text-xs text-slate-300">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">Mode</p>
          <p className="mt-2 text-base font-medium text-white">{health.paper_trading ? 'Paper Trading' : 'Live Execution'}</p>
          <p className="mt-1 text-slate-400">
            {health.paper_trading
              ? 'Synthetic orders for signal QA'
              : 'Orders routed to orchestrator'}
          </p>
        </div>

        <div className="rounded-xl border border-surface-200/50 bg-surface-50/40 p-4 text-xs text-slate-300">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">Diagnostics</p>
          <p className="mt-2 text-base font-medium text-white">
            {health.last_error ? 'Attention Required' : 'Nominal'}
          </p>
          <p className="mt-1 text-slate-400">
            {health.last_error ?? 'No critical alerts in the last hour.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatusCard;

