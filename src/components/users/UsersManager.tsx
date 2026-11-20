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
  Trash2,
  Users,
  Activity,
  Sparkles,
  Clock,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function UsersManager() {
  const { users, updateUserStatus, deleteUser, deletedUsersCount } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UtenteDB | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    user: UtenteDB;
    action: "shadowbanned" | "sospeso" | "elimina";
  } | null>(null);
  const [motivoEliminazione, setMotivoEliminazione] = useState("");
  const [showManualUidModal, setShowManualUidModal] = useState(false);
  const [manualUidInput, setManualUidInput] = useState("");

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

  const [showDetailedStats, setShowDetailedStats] = useState(true);

  const stats = useMemo(() => {
    const total = users.length;
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    const ONE_DAY = 24 * ONE_HOUR;
    const SEVEN_DAYS = 7 * ONE_DAY;
    const THIRTY_DAYS = 30 * ONE_DAY;

    let attivi = 0;
    let sospesi = 0;
    let shadow = 0;
    let enti = 0;
    let conAvatar = 0;
    let conProvincia = 0;
    let conAlert = 0;
    let conTelefono = 0;

    // Attività
    let onlineNow = 0; // < 15 min
    let activeToday = 0; // < 24h
    let activeThisWeek = 0; // 24h - 7d
    let activeThisMonth = 0; // 7d - 30d
    let inactiveOrNever = 0; // > 30d o mai

    const provinceCounts: Record<string, number> = {};

    users.forEach((u) => {
      if (u.isEnte) enti++;
      if (u.stato === "shadowbanned") shadow++;
      if (u.sospeso || u.stato === "sospeso" || u.stato === "bannato") sospesi++;
      else attivi++;

      if (u.avatarId && u.avatarId.trim().length > 0) conAvatar++;
      if (u.telefonoUser && u.telefonoUser.trim().length > 0) conTelefono++;
      if (u.paroleChiaveAlert && u.paroleChiaveAlert.length > 0) conAlert++;

      const prov = u.provincia?.trim();
      if (prov) {
        conProvincia++;
        provinceCounts[prov] = (provinceCounts[prov] || 0) + 1;
      } else {
        provinceCounts["Non impostata"] = (provinceCounts["Non impostata"] || 0) + 1;
      }

      const last = Number(u.ultimoAccesso || 0);
      if (!last || last === 0) {
        inactiveOrNever++;
      } else {
        const diff = now - last;
        if (diff <= 15 * 60 * 1000) {
          onlineNow++;
          activeToday++;
        } else if (diff <= ONE_DAY) {
          activeToday++;
        } else if (diff <= SEVEN_DAYS) {
          activeThisWeek++;
        } else if (diff <= THIRTY_DAYS) {
          activeThisMonth++;
        } else {
          inactiveOrNever++;
        }
      }
    });

    const sortedProvinces = Object.entries(provinceCounts).sort((a, b) => b[1] - a[1]);

    return {
      total,
      attivi,
      sospesi,
      shadow,
      enti,
      utentiNormali: total - enti,
      conAvatar,
      conProvincia,
      conAlert,
      conTelefono,
      onlineNow,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      inactiveOrNever,
      sortedProvinces,
    };
  }, [users]);

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
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-[#141d2e] border border-slate-800 text-slate-300">
            Totale: <strong className="text-white">{users.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            Attivi: <strong>{stats.attivi}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
            Sospesi: <strong>{stats.sospesi}</strong>
          </span>
          {stats.shadow > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
              Shadowban: <strong>{stats.shadow}</strong>
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
            Eliminati (Tombstone): <strong>{deletedUsersCount}</strong>
          </span>
        </div>
      </div>

      {/* Sezione Statistiche Utenti */}
      <div className="rounded-2xl bg-[#0f172a] border border-[#1e293b] overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#141d2e] via-[#0f172a] to-[#141d2e] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Statistiche Utenti Rook
                <span className="text-[11px] font-normal text-slate-400">
                  (Ripartizione geografica, attività e profili)
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={() => setShowDetailedStats(!showDetailedStats)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/40 hover:bg-slate-800 transition-colors border border-slate-700/50"
          >
            <span>{showDetailedStats ? "Comprimi" : "Espandi"}</span>
            {showDetailedStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showDetailedStats && (
          <div className="p-5 space-y-5">
            {/* 4 KPI Cards Rapide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Totale e Ruoli */}
              <div className="p-4 rounded-xl bg-[#141d2e]/80 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Totale Utenti</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.total}</div>
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Standard: <strong className="text-slate-200">{stats.utentiNormali}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>Enti/Org: <strong className="text-amber-300">{stats.enti}</strong></span>
                </div>
              </div>

              {/* Card 2: Attività Live */}
              <div className="p-4 rounded-xl bg-[#141d2e]/80 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Attività Recente</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">{stats.onlineNow}</span>
                  <span className="text-xs text-emerald-400/80 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    online ora
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>24 ore: <strong className="text-emerald-300">{stats.activeToday}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>7 giorni: <strong className="text-slate-200">{stats.activeThisWeek}</strong></span>
                </div>
              </div>

              {/* Card 3: Profilo & Dati */}
              <div className="p-4 rounded-xl bg-[#141d2e]/80 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Foto & Profilo</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-300">
                  {stats.total > 0 ? Math.round((stats.conAvatar / stats.total) * 100) : 0}%
                  <span className="text-xs font-normal text-slate-400 ml-1.5">con avatar</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Provincia: <strong className="text-slate-200">{stats.conProvincia}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>Alert: <strong className="text-purple-300">{stats.conAlert}</strong></span>
                </div>
              </div>

              {/* Card 4: Sicurezza & Account */}
              <div className="p-4 rounded-xl bg-[#141d2e]/80 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Stato Account</span>
                  <Shield className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {stats.attivi}
                  <span className="text-xs font-normal text-emerald-400 ml-1.5">
                    ({stats.total > 0 ? Math.round((stats.attivi / stats.total) * 100) : 0}% attivi)
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Sospesi: <strong className="text-amber-400">{stats.sospesi}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>Shadow: <strong className="text-purple-400">{stats.shadow}</strong></span>
                </div>
              </div>
            </div>

            {/* Griglia a 2 Colonne: Divisione per Provincia & Divisione per Attività */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Colonna 1: Divisione Utenti per Provincia */}
              <div className="p-4 rounded-xl bg-[#141d2e]/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Divisione Utenti per Provincia
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {stats.conProvincia} impostate su {stats.total}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-3">
                    Clicca su una provincia per filtrare istantaneamente la tabella sottostante.
                  </p>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {stats.sortedProvinces.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Nessun dato provincia registrato</p>
                    ) : (
                      stats.sortedProvinces.map(([prov, count]) => {
                        const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                        const isSelected = searchTerm.toLowerCase() === prov.toLowerCase();
                        return (
                          <div
                            key={prov}
                            onClick={() => {
                              if (prov === "Non impostata") {
                                setSearchTerm("");
                              } else {
                                setSearchTerm(isSelected ? "" : prov);
                              }
                            }}
                            className={`p-2 rounded-lg cursor-pointer transition-all border ${
                              isSelected
                                ? "bg-amber-500/15 border-amber-500/40 shadow-sm"
                                : "bg-[#0f172a]/70 hover:bg-[#1a253c] border-slate-800/60"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${prov === "Non impostata" ? "bg-slate-600" : "bg-amber-400"}`} />
                                {prov}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                <strong className="text-white">{count}</strong> utent{count === 1 ? "e" : "i"} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  prov === "Non impostata" ? "bg-slate-600" : "bg-gradient-to-r from-amber-500 to-amber-300"
                                }`}
                                style={{ width: `${Math.max(pct, 3)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Toscana: 10 province supportate</span>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-amber-400 hover:underline text-[11px]"
                    >
                      Azzera filtro ({searchTerm})
                    </button>
                  )}
                </div>
              </div>

              {/* Colonna 2: Divisione per Attività nell'App */}
              <div className="p-4 rounded-xl bg-[#141d2e]/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Divisione per Attività nell&apos;App
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ultimo Accesso
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-3">
                    Distribuzione degli utenti in base alla frequenza di utilizzo recente.
                  </p>

                  <div className="space-y-3">
                    {/* Livello 1: Online Adesso */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                          <span className="font-medium text-emerald-300">Online Adesso (&lt; 15 min)</span>
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          <strong className="text-white">{stats.onlineNow}</strong> (
                          {stats.total > 0 ? Math.round((stats.onlineNow / stats.total) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                          style={{
                            width: `${stats.total > 0 ? Math.max((stats.onlineNow / stats.total) * 100, stats.onlineNow > 0 ? 3 : 0) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Livello 2: Ultime 24h */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                          <span className="font-medium text-cyan-300">Attivi nelle ultime 24 ore</span>
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          <strong className="text-white">{stats.activeToday}</strong> (
                          {stats.total > 0 ? Math.round((stats.activeToday / stats.total) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                          style={{
                            width: `${stats.total > 0 ? Math.max((stats.activeToday / stats.total) * 100, stats.activeToday > 0 ? 3 : 0) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Livello 3: Ultimi 7 giorni */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                          <span className="font-medium text-indigo-300">Attivi negli ultimi 7 giorni</span>
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          <strong className="text-white">{stats.activeThisWeek}</strong> (
                          {stats.total > 0 ? Math.round((stats.activeThisWeek / stats.total) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-400 transition-all duration-500"
                          style={{
                            width: `${stats.total > 0 ? Math.max((stats.activeThisWeek / stats.total) * 100, stats.activeThisWeek > 0 ? 3 : 0) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Livello 4: Ultimi 30 giorni */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                          <span className="font-medium text-purple-300">Attivi nel mese (7-30 gg)</span>
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          <strong className="text-white">{stats.activeThisMonth}</strong> (
                          {stats.total > 0 ? Math.round((stats.activeThisMonth / stats.total) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-400 transition-all duration-500"
                          style={{
                            width: `${stats.total > 0 ? Math.max((stats.activeThisMonth / stats.total) * 100, stats.activeThisMonth > 0 ? 3 : 0) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Livello 5: Inattivi / Oltre 30gg o mai */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
                          <span>Inattivi o nessun accesso (&gt; 30 gg)</span>
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          <strong>{stats.inactiveOrNever}</strong> (
                          {stats.total > 0 ? Math.round((stats.inactiveOrNever / stats.total) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-600 transition-all duration-500"
                          style={{
                            width: `${stats.total > 0 ? Math.max((stats.inactiveOrNever / stats.total) * 100, stats.inactiveOrNever > 0 ? 3 : 0) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    WAU (7gg): <strong className="text-emerald-400">
                      {stats.total > 0 ? Math.round(((stats.onlineNow + stats.activeToday + stats.activeThisWeek) / stats.total) * 100) : 0}%
                    </strong>
                  </span>
                  <span>
                    Con Telefono: <strong className="text-slate-200">{stats.conTelefono}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
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

        <div className="flex flex-wrap gap-2 text-xs items-center">
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

          <button
            type="button"
            onClick={() => {
              setManualUidInput("");
              setMotivoEliminazione("");
              setShowManualUidModal(true);
            }}
            className="px-3 py-2 rounded-lg bg-red-600/15 border border-red-500/30 text-red-400 hover:bg-red-600/25 flex items-center space-x-1.5 transition text-xs font-semibold shrink-0"
            title="Elimina definitivamente un utente specificando il suo UID"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Elimina per UID</span>
          </button>
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
                        <button
                          onClick={() => {
                            setMotivoEliminazione("");
                            setConfirmModal({ user: u, action: "elimina" });
                          }}
                          title="Elimina Definitivamente dal DB"
                          className="p-1.5 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 hover:text-red-300 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

              <div className="flex items-center justify-between pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => {
                    const u = selectedUser;
                    setSelectedUser(null);
                    setMotivoEliminazione("");
                    setConfirmModal({ user: u, action: "elimina" });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600/15 border border-red-500/30 text-red-400 hover:bg-red-600/25 flex items-center space-x-1.5 transition text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Elimina dal Database</span>
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-medium"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Shadowban / Rimuovi Accesso / Eliminazione */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            {/* Header con Icona */}
            <div className="flex items-start space-x-3.5">
              <div
                className={`p-3 rounded-xl shrink-0 ${
                  confirmModal.action === "shadowbanned"
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                    : confirmModal.action === "elimina"
                    ? "bg-red-600/20 text-red-400 border border-red-500/40"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}
              >
                {confirmModal.action === "shadowbanned" ? (
                  <Ghost className="w-6 h-6" />
                ) : confirmModal.action === "elimina" ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <UserX className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {confirmModal.action === "shadowbanned"
                    ? "Conferma Shadowban Silenzioso"
                    : confirmModal.action === "elimina"
                    ? "Conferma Eliminazione Definitiva"
                    : "Conferma Sospensione Accesso"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {confirmModal.action === "shadowbanned"
                    ? "Limitazione visibilità interazioni dell'utente"
                    : confirmModal.action === "elimina"
                    ? "Rimozione permanente dell'utente da Firebase Realtime Database"
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
                  : confirmModal.action === "elimina"
                  ? "bg-red-500/15 border-red-500/30 text-red-200"
                  : "bg-red-500/10 border-red-500/25 text-red-200"
              }`}
            >
              {confirmModal.action === "shadowbanned" ? (
                <span>
                  <strong>Nota:</strong> Con lo shadowban l&apos;utente potrà continuare ad aprire l&apos;app normalmente, ma i suoi commenti, recensioni e segnalazioni non saranno più visibili agli altri utenti né al pubblico.
                </span>
              ) : confirmModal.action === "elimina" ? (
                <span>
                  <strong>Attenzione:</strong> Il record dell&apos;utente verrà cancellato irrevocabilmente dal nodo <code className="text-red-300 font-mono">/utenti/{confirmModal.user.firebaseUid}</code> nel database. L&apos;operazione è immediata e irreversibile.
                </span>
              ) : (
                <span>
                  <strong>Attenzione:</strong> L&apos;accesso dell&apos;utente verrà revocato immediatamente. Non potrà più effettuare operazioni nell&apos;app Rook finché lo stato non verrà reimpostato su &quot;Attivo&quot;.
                </span>
              )}
            </div>

            {/* Campo Motivo Eliminazione opzionale per Audit */}
            {confirmModal.action === "elimina" && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Motivo eliminazione (registrato nell&apos;Audit Log):
                </label>
                <input
                  type="text"
                  placeholder="Es: Violazione termini, richiesta utente, account spam..."
                  value={motivoEliminazione}
                  onChange={(e) => setMotivoEliminazione(e.target.value)}
                  className="w-full bg-[#141d2e] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            )}

            {/* Azioni Conferma / Annulla */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmModal(null);
                  setMotivoEliminazione("");
                }}
                className="px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-[#283548] text-slate-300 font-semibold text-xs transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmModal.action === "elimina") {
                    await deleteUser(confirmModal.user.firebaseUid, motivoEliminazione);
                  } else {
                    await updateUserStatus(confirmModal.user.firebaseUid, confirmModal.action);
                  }
                  setConfirmModal(null);
                  setMotivoEliminazione("");
                }}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs transition shadow-lg ${
                  confirmModal.action === "shadowbanned"
                    ? "bg-purple-600 hover:bg-purple-500 shadow-purple-600/30"
                    : confirmModal.action === "elimina"
                    ? "bg-red-600 hover:bg-red-500 shadow-red-600/40 border border-red-400/40"
                    : "bg-red-600 hover:bg-red-500 shadow-red-600/30"
                }`}
              >
                {confirmModal.action === "shadowbanned"
                  ? "Applica Shadowban"
                  : confirmModal.action === "elimina"
                  ? "Elimina Definitivamente"
                  : "Rimuovi Accesso"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual UID Delete Modal */}
      {showManualUidModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-red-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Elimina Utente per UID
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rimuove direttamente l&apos;UID da Firebase RTDB e lo registra in utenti_eliminati per la bonifica dei backup di Disaster Recovery.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  UID Utente Firebase *
                </label>
                <input
                  type="text"
                  placeholder="Es. d1F5g8H2k9L0mP4qRsTuVwXyZ..."
                  value={manualUidInput}
                  onChange={(e) => setManualUidInput(e.target.value.trim())}
                  className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Motivo Eliminazione (per Audit Log)
                </label>
                <input
                  type="text"
                  placeholder="Es. Richiesta utente via email / account orfano"
                  value={motivoEliminazione}
                  onChange={(e) => setMotivoEliminazione(e.target.value)}
                  className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-[11px] text-red-300 space-y-1">
                <p className="font-semibold text-red-200">Effetti immediati dell&apos;operazione:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                  <li>Eliminazione nodo profilo da <code>/utenti/{`{uid}`}</code></li>
                  <li>Pulizia di preferiti, organizzatori seguiti e bozze</li>
                  <li>Iscrizione permanente nel registro <code>/utenti_eliminati/{`{uid}`}</code> (GDPR Art. 17)</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowManualUidModal(false);
                  setManualUidInput("");
                  setMotivoEliminazione("");
                }}
                className="px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-[#283548] text-slate-300 font-semibold text-xs transition"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={!manualUidInput}
                onClick={async () => {
                  if (!manualUidInput) return;
                  const uid = manualUidInput;
                  setShowManualUidModal(false);
                  const existingUser = users.find((x) => x.firebaseUid === uid) || {
                    firebaseUid: uid,
                    email: "N/D",
                    username: `Utente (${uid.slice(0, 8)}...)`,
                  };
                  setConfirmModal({
                    user: existingUser as UtenteDB,
                    action: "elimina",
                  });
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs transition shadow-lg shadow-red-600/30"
              >
                Procedi con Eliminazione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
