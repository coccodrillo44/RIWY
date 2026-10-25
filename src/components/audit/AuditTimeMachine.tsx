"use client";

import React, { useState, useMemo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { AuditLogDB } from "@/types";
import {
  History,
  Search,
  Eye,
  Code,
  Database,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function AuditTimeMachine() {
  const { auditLogs } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [targetFilter, setTargetFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogDB | null>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const term = searchTerm.toLowerCase();
      const details = log.dettagli || "";
      const action = log.azione || "";
      const email = log.operatore?.email || "";

      const matchesSearch =
        details.toLowerCase().includes(term) ||
        action.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term);

      const matchesTarget = targetFilter === "all" || log.targetTipo === targetFilter;

      return matchesSearch && matchesTarget;
    });
  }, [auditLogs, searchTerm, targetFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <History className="w-6 h-6 mr-2 text-amber-400" />
          Audit Engine & Time Machine
        </h1>
        <p className="text-sm text-slate-400">
          Registro immutabile in tempo reale di tutte le modifiche, creazioni, eliminazioni e passaggi eseguiti sull'app Rook.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca per azione, email operatore o testo dettagli..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141d2e] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="bg-[#141d2e] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tutte le Entità</option>
            <option value="evento">Eventi</option>
            <option value="utente">Utenti</option>
            <option value="ente">Enti / Organizzatori</option>
            <option value="sistema">Sistema & Flag</option>
            <option value="segnalazione">Segnalazioni</option>
          </select>
        </div>
      </div>

      {/* Audit Logs List */}
      {filteredLogs.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[#1e293b] bg-[#0f172a]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141d2e] text-slate-400 uppercase text-[11px] font-semibold border-b border-[#1e293b]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Azione Eseguita</th>
                <th className="px-4 py-3">Operatore</th>
                <th className="px-4 py-3">Tipo Target</th>
                <th className="px-4 py-3">Dettagli Azione</th>
                <th className="px-4 py-3 text-right">Diff Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#141d2e]/60 transition">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                    {formatDate(log.timestamp)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-bold text-amber-400 font-mono text-xs">
                      {log.azione}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-slate-200 font-medium">{log.operatore?.email || "Admin"}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Ruolo: {log.operatore?.ruolo || "superadmin"}
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {log.targetTipo}
                    </span>
                  </td>

                  <td className="px-4 py-3 max-w-md">
                    <p className="text-slate-300 line-clamp-2">{log.dettagli}</p>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {log.targetId}</span>
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {log.diffPrima || log.diffDopo ? (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-semibold border border-blue-500/30 text-[11px] flex items-center ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Confronta
                      </button>
                    ) : (
                      <span className="text-slate-600 text-[11px] italic">No diff</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2 bg-[#0f172a]">
          <Database className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-400">
            Nessun log presente in /audit_logs
          </p>
          <p className="max-w-md mx-auto text-slate-500">
            Ogni operazione eseguita dal pannello (attivazione booster, modifica orari, approvazione enti, blocco utenti) genera automaticamente una voce di audit immutabile.
          </p>
        </div>
      )}

      {/* Visual Diff Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div>
                <h2 className="text-base font-bold text-white flex items-center">
                  <Code className="w-4 h-4 mr-2 text-amber-400" />
                  Time Machine Diff Viewer — {selectedLog.azione}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confronto visivo tra lo stato prima e dopo l'intervento
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Prima */}
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30">
                <span className="text-red-400 font-bold block mb-2 uppercase text-[10px] tracking-wider">
                  [-] STATO PRECEDENTE (PRIMA)
                </span>
                <pre className="text-red-200 overflow-x-auto whitespace-pre-wrap max-h-64">
                  {selectedLog.diffPrima
                    ? JSON.stringify(selectedLog.diffPrima, null, 2)
                    : "(Dato non presente o nuovo elemento)"}
                </pre>
              </div>

              {/* Dopo */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <span className="text-emerald-400 font-bold block mb-2 uppercase text-[10px] tracking-wider">
                  [+] NUOVO STATO APPLICATO (DOPO)
                </span>
                <pre className="text-emerald-200 overflow-x-auto whitespace-pre-wrap max-h-64">
                  {selectedLog.diffDopo
                    ? JSON.stringify(selectedLog.diffDopo, null, 2)
                    : "(Elemento rimosso o azzerato)"}
                </pre>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141d2e] border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-white block mb-0.5">Note di Log:</span>
              <p>{selectedLog.dettagli}</p>
              <div className="mt-1 text-[10px] text-slate-500 font-mono">
                Registrato da: {selectedLog.operatore?.email} alle {formatDate(selectedLog.timestamp)}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs"
              >
                Chiudi Diff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
