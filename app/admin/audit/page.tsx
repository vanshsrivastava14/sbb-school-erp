import { getAuditLogs } from "@/lib/db/store";
import { History, Shield, Clock } from "lucide-react";

export default async function AdminAuditPage() {
  const logs = await getAuditLogs();

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#0f2537] font-serif">Security & System Audit Logs</h1>
          <p className="text-xs text-slate-500">
            Immutable log of user logins, student record changes, teacher marks submissions, and report card publications.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          <span>{logs.length} Total Events Logged</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Timestamp</th>
                <th className="py-3 px-3.5">User</th>
                <th className="py-3 px-3.5">Action</th>
                <th className="py-3 px-3.5">Entity</th>
                <th className="py-3 px-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800">
                      {log.userName}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-600">
                      {log.entity}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
