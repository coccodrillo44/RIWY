"use client";

import React, { useState, useMemo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { UtenteDB } from "@/types";
import {
  Search,
  UserCheck,
  UserX,
  Ghost,
  Shield,
  Eye,
  Database,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function UsersManager() {
  const { users, updateUserStatus } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UtenteDB | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    user: UtenteDB;
    action: "shadowbanned" | "sospeso";
  } | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = u.username || "";
      const email = u.email || "";
      const provincia = u.provincia || "";
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        provincia.toLowerCase().includes(term);

      const isEnte = Boolean(u.isEnte);
      let matchesRole = true;
      if (roleFilter === "organizzatore") {
        matchesRole = isEnte;
      } else if (roleFilter === "utente") {
        matchesRole = !isEnte;
      }

      const isSospeso = u.sospeso || u.stato === "sospeso" || u.stato === "bannato";
      let matchesStatus = true;
      if (statusFilter === "attivo") {
        matchesStatus = !isSospeso;
      } else if (statusFilter === "sospeso") {
        matchesStatus = isSospeso;
      } else if (statusFilter === "shadowbanned") {
        matchesStatus = u.stato === "shadowbanned";
      } else if (statusFilter === "online") {
        matchesStatus = Number(u.ultimoAccesso || 0) > Date.now() - 10 * 60 * 1000;
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Gestione Utenti
          </h1>
          <p className="text-sm text-slate-400">
            Dati in tempo reale degli utenti registrati su Rook tramite Firebase Auth & Realtime Database.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Iscritti trovati: <strong className="text-amber-400">{filteredUsers.length}</strong> su {users.length}
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca per username, email o provincia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141d2e] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-2 text-xs">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#141d2e] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tutti i Ruoli</option>
            <option value="utente">Utente Normale</option>
            <option value="organizzatore">Organizzatore (Ente)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#141d2e] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tutti gli Stati</option>
            <option value="attivo">Attivo</option>
            <option value="sospeso">Sospeso / Bloccato</option>
            <option value="online">Online ora (10 min)</option>
            <option value="shadowbanned">Shadowbanned (Silenzioso)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[#1e293b] bg-[#0f172a]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141d2e] text-slate-400 uppercase text-[11px] font-semibold border-b border-[#1e293b]">
              <tr>
                <th className="px-4 py-3">Utente & Email</th>
                <th className="px-4 py-3">Provincia</th>
                <th className="px-4 py-3">Tipologia</th>
                <th className="px-4 py-3">Stato Account</th>
                <th className="px-4 py-3">Recapito</th>
                <th className="px-4 py-3 text-right">Azioni Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredUsers.map((u) => {
                const isSospeso = u.sospeso || u.stato === "sospeso" || u.stato === "bannato";
                const isShadow = u.stato === "shadowbanned";

                return (
                  <tr key={u.firebaseUid} className="hover:bg-[#141d2e]/60 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white text-sm">
                        {u.username || "Utente Senza Username"}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">UID: {u.firebaseUid}</div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                      {u.provincia ? `Prov. di ${u.provincia}` : "Non indicata"}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.isEnte ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ORGANIZZATORE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                          Utente Standard
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {!isSospeso && !isShadow ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Attivo
                        </span>
                      ) : isShadow ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center w-fit">
                          <Ghost className="w-3 h-3 mr-1" /> Shadowbanned
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/15 text-red-400 border border-red-500/30">
                          Sospeso
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {u.telefonoUser || "Nessun telefono"}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedUser(u)}
                          title="Visualizza Dettagli"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isSospeso || isShadow ? (
                          <button
                            onClick={() => updateUserStatus(u.firebaseUid, "attivo")}
                            title="Riattiva Utente"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setConfirmModal({ user: u, action: "shadowbanned" })}
                              title="Shadowban (Silenzia)"
                              className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition"
                            >
                              <Ghost className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmModal({ user: u, action: "sospeso" })}
                              title="Rimuovi Accesso (Sospendi)"
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2 bg-[#0f172a]">
          <Database className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-400">
            Nessun utente trovato in /utenti
          </p>
          <p className="max-w-md mx-auto text-slate-500">
            {users.length === 0
              ? "Il database Firebase non contiene attualmente profili nel nodo /utenti. Gli utenti che effettuano l'accesso dall'app compariranno qui in tempo reale."
              : "Nessun utente corrisponde ai filtri impostati."}
          </p>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {selectedUser.username || "Scheda Utente"}
                </h2>
                <p className="text-xs text-slate-400 font-mono">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#141d2e] rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">UID Utente</span>
                  <span className="text-slate-200 font-mono text-[11px] truncate block">
                    {selectedUser.firebaseUid}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Provincia</span>
                  <span className="text-slate-200 font-semibold">{selectedUser.provincia ? `Prov. di ${selectedUser.provincia}` : "Non indicata"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Profilo Organizzatore</span>
                  <span className="text-amber-400 font-bold">
                    {selectedUser.isEnte ? `Ente (${selectedUser.idEnteGestito || "attivo"})` : "Utente Standard"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Telefono</span>
                  <span className="text-slate-200">{selectedUser.telefonoUser || "Nessuno"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#141d2e] rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Stato</span>
                  <span className="text-slate-200 font-semibold">{selectedUser.stato || (selectedUser.sospeso ? "sospeso" : "attivo")}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ultimo accesso</span>
                  <span className="text-slate-200">{selectedUser.ultimoAccesso ? formatDate(selectedUser.ultimoAccesso) : "Non registrato dall'app"}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-[#1e293b]">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Shadowban / Rimuovi Accesso */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            {/* Header con Icona */}
            <div className="flex items-start space-x-3.5">
              <div
                className={`p-3 rounded-xl shrink-0 ${
                  confirmModal.action === "shadowbanned"
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}
              >
                {confirmModal.action === "shadowbanned" ? (
                  <Ghost className="w-6 h-6" />
                ) : (
                  <UserX className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {confirmModal.action === "shadowbanned"
                    ? "Conferma Shadowban Silenzioso"
                    : "Conferma Sospensione Accesso"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {confirmModal.action === "shadowbanned"
                    ? "Limitazione visibilità interazioni dell'utente"
                    : "Revoca immediata dei permessi di accesso"}
                </p>
              </div>
            </div>

            {/* Dati Utente Coinvolto */}
            <div className="p-3.5 rounded-xl bg-[#141d2e] border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Username:</span>
                <span className="font-bold text-white truncate max-w-[220px]">
                  {confirmModal.user.username || "Utente Senza Username"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-[220px]">
                  {confirmModal.user.email || "Nessuna email"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">UID Firebase:</span>
                <span className="text-slate-500 font-mono text-[10px] truncate max-w-[220px]">
                  {confirmModal.user.firebaseUid}
                </span>
              </div>
            </div>

            {/* Avviso Effetti */}
            <div
              className={`p-3 rounded-xl text-xs border ${
                confirmModal.action === "shadowbanned"
                  ? "bg-purple-500/10 border-purple-500/25 text-purple-200"
                  : "bg-red-500/10 border-red-500/25 text-red-200"
              }`}
            >
              {confirmModal.action === "shadowbanned" ? (
                <span>
                  <strong>Nota:</strong> Con lo shadowban l'utente potrà continuare ad aprire l'app normalmente, ma i suoi commenti, recensioni e segnalazioni non saranno più visibili agli altri utenti né al pubblico.
                </span>
              ) : (
                <span>
                  <strong>Attenzione:</strong> L'accesso dell'utente verrà revocato immediatamente. Non potrà più effettuare operazioni nell'app Rook finché lo stato non verrà reimpostato su &quot;Attivo&quot;.
                </span>
              )}
            </div>

            {/* Azioni Conferma / Annulla */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-[#283548] text-slate-300 font-semibold text-xs transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  updateUserStatus(confirmModal.user.firebaseUid, confirmModal.action);
                  setConfirmModal(null);
                }}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs transition shadow-lg ${
                  confirmModal.action === "shadowbanned"
                    ? "bg-purple-600 hover:bg-purple-500 shadow-purple-600/30"
                    : "bg-red-600 hover:bg-red-500 shadow-red-600/30"
                }`}
              >
                {confirmModal.action === "shadowbanned" ? "Applica Shadowban" : "Rimuovi Accesso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
