import React from 'react';
import {
  ShieldAlert,
  Check,
  X,
  CheckCircle2,
  Clock,
  Send
} from 'lucide-react';

export default function ApprovalsTab({
  approvals,
  onApprove,
  onReject,
  onSendTelegramCard
}) {
  const approvalList = approvals || [];
  const pendingApprovals = approvalList.filter((a) => a.status === 'Pending');
  const pastApprovals = approvalList.filter((a) => a.status !== 'Pending');

  return (
    <div className="p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Human-in-the-Loop Owner Approvals Queue
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Decisions exceeding financial or operational safety thresholds require explicit business owner sign-off.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30 self-start sm:self-auto">
          {pendingApprovals.length} Pending Actions
        </span>
      </div>

      {/* Pending Approvals Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Requires Your Sign-Off
        </h3>

        {pendingApprovals.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface-900/50 border border-slate-800 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <h4 className="font-bold text-white text-sm mb-0.5">Zero Pending Approvals</h4>
            <p className="text-slate-400">All autonomous operations within normal safety parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map((app) => (
              <div
                key={app.id}
                className="p-5 rounded-2xl bg-surface-900/90 border border-amber-900/60 shadow-lg shadow-amber-950/20 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {app.type}
                    </span>
                    {app.amount && (
                      <span className="text-sm font-mono font-bold text-white">
                        ₹{Number(app.amount).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-sm">{app.title}</h4>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{app.recommendation}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {app.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onReject(app.id)}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => onApprove(app.id)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-1.5 rounded-lg transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Decision History */}
      {pastApprovals.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Past Decision History
          </h3>
          <div className="rounded-2xl bg-surface-900/60 border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="p-3.5">Approval ID</th>
                  <th className="p-3.5">Decision Title</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pastApprovals.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5 font-mono text-slate-400">{app.id}</td>
                    <td className="p-3.5 font-medium text-white">{app.title}</td>
                    <td className="p-3.5 text-slate-400 font-mono">{app.type}</td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {app.amount ? `₹${Number(app.amount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          app.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
