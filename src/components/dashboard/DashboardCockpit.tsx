"use client";

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import {
  Users,
  CalendarCheck,
  Building2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Flame,
  Zap,
  MapPin,
  Eye,
  ArrowUpRight,
  Database,
  Radio,
  Smartphone,
} from "lucide-react";
import { getCategoryBadgeClass, formatDate, formatEventDate, isBoostAttivo, isEventoPassato, normalizeCategory } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, { fill: string; stroke: string; bg: string; text: string }> = {
  "Cibo & Sagre": { fill: "#f59e0b", stroke: "#d97706", bg: "bg-amber-500", text: "text-amber-400" },
  "Musica & Feste": { fill: "#a855f7", stroke: "#9333ea", bg: "bg-purple-500", text: "text-purple-400" },
  "Arte & Cultura": { fill: "#3b82f6", stroke: "#2563eb", bg: "bg-blue-500", text: "text-blue-400" },
  "Sport & Movimento": { fill: "#10b981", stroke: "#059669", bg: "bg-emerald-500", text: "text-emerald-400" },
  "Famiglia & Bambini": { fill: "#ec4899", stroke: "#db2777", bg: "bg-pink-500", text: "text-pink-400" },
  "Fiere & Mercati": { fill: "#f97316", stroke: "#ea580c", bg: "bg-orange-500", text: "text-orange-400" },
  "Nuove Aperture": { fill: "#06b6d4", stroke: "#0891b2", bg: "bg-cyan-500", text: "text-cyan-400" },
  "Altro": { fill: "#64748b", stroke: "#475569", bg: "bg-slate-500", text: "text-slate-400" },
};

export function DashboardCockpit() {
  const {
    events,
    users,
    organizers,
    organizerRequests,
    reports,
    auditLogs,
    analytics,
    onlineUsersCount,
    setActiveTab,
    toggleBooster,
    navigateToEventsWithCategory,
  } = useAdmin();

  const onlineNow = useMemo(() => {
    const limit = Date.now() - 10 * 60 * 1000;
    return users
      .filter((u) => Number(u.ultimoAccesso || 0) > limit)
      .sort((a, b) => Number(b.ultimoAccesso) - Number(a.ultimoAccesso));
  }, [users]);

  const activeEvents = useMemo(() => events.filter((e) => !e.oscurato && !isEventoPassato(e)), [events]);
  const pastEvents = useMemo(() => events.filter((e) => isEventoPassato(e)), [events]);
  const featuredEvents = useMemo(() => events.filter(isBoostAttivo), [events]);
  const pendingReports = useMemo(
    () => reports.filter((r) => !r.stato || r.stato === "nuovo" || r.stato === "in_lavorazione"),
    [reports]
  );
  const pendingRequests = useMemo(
    () => organizerRequests.filter((r) => !r.stato || r.stato === "IN_ATTESA"),
    [organizerRequests]
  );

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [pieTooltipPos, setPieTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Group and compute Pie Chart slices
  const pieData = useMemo(() => {
    const total = events.length;
    if (total === 0) return { total: 0, slices: [] };

    const counts: Record<string, number> = {};
    events.forEach((ev) => {
      const cat = normalizeCategory(ev.categoria || "Altro");
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const entries = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([categoria, count]) => {
        const percentage = (count / total) * 100;
        const color = CATEGORY_COLORS[categoria] || {
          fill: "#64748b",
          stroke: "#475569",
          bg: "bg-slate-500",
          text: "text-slate-400",
        };
        return {
          categoria,
          count,
          percentage,
          percentStr: `${percentage.toFixed(1)}%`,
          color,
        };
      })
      .sort((a, b) => b.count - a.count);

    let currentAngle = -Math.PI / 2; // Inizio a ore 12
    const slices = entries.map((item) => {
      const sliceAngle = (item.percentage / 100) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = startAngle + sliceAngle / 2;
      currentAngle = endAngle;

      return {
        ...item,
        startAngle,
        endAngle,
        midAngle,
        sliceAngle,
      };
    });

    return { total, slices };
  }, [events]);

  const activeSlice = useMemo(() => {
    if (!hoveredCategory) return null;
    return pieData.slices.find((s) => s.categoria === hoveredCategory) || null;
  }, [hoveredCategory, pieData.slices]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#111927] via-[#141e30] to-[#1c2940] border border-[#22324d] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Rook Realtime Operations
            </span>
            <span className="text-xs text-slate-400">Database Live Toscana</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Plancia di Comando RIWY
          </h1>
          <p className="text-sm text-slate-300">
            Dati in tempo reale dall'infrastruttura Firebase di Rook (nessun dato inventato o simulato).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("broadcast")}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/25"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Notifica Flash</span>
          </button>
          <button
            onClick={() => setActiveTab("feature_flags")}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#283548] text-slate-200 font-medium text-xs border border-slate-700 transition"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Kill Switch</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid: 5 Cards with Online Users Card First! */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* CARD RICHIESTA: Persone Online nell'App in Tempo Reale */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-950/40 to-[#0f172a] border border-emerald-500/50 shadow-lg shadow-emerald-500/10 hover:border-emerald-400 transition relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center">
              <span className="relative flex h-2.5 w-2.5 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Online Adesso
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{onlineUsersCount}</span>
            <span className="text-[11px] font-semibold text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
              LIVE
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {`Accessi negli ultimi 10 min · ${analytics.guestsCount} ospiti totali`}
          </p>
          {onlineNow.length > 0 ? (
            <ul className="mt-2 space-y-1 max-h-24 overflow-y-auto">
              {onlineNow.map((u) => (
                <li key={u.firebaseUid} className="flex items-center justify-between text-[11px] text-slate-200">
                  <span className="truncate">{u.username || u.email}</span>
                  <span className="text-slate-500 shrink-0 ml-2">{formatDate(u.ultimoAccesso, true)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[10px] text-slate-500">Nessun utente connesso (richiede l'app Rook aggiornata).</p>
          )}
        </div>

        {/* Card 2: Utenti Registrati */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("users")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab("users");
            }
          }}
          className="group p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-blue-500/60 hover:bg-[#111c33] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-blue-300 uppercase tracking-wider transition">
              Utenti Registrati
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{users.length}</span>
            <span className="text-[11px] text-blue-400 group-hover:text-blue-300 font-medium flex items-center gap-0.5 transition">
              Gestisci <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-400 transition">
            Account registrati
          </p>
        </div>

        {/* Card 3: Eventi a Catalogo */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("events")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab("events");
            }
          }}
          className="group p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-amber-500/60 hover:bg-[#1b1c2e] hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-amber-300 uppercase tracking-wider transition">
              Eventi Catalogo
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 group-hover:scale-105 transition">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{events.length}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-amber-400 flex items-center">
                <Flame className="w-3.5 h-3.5 mr-0.5 fill-current" />
                {featuredEvents.length} Booster
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-400 transition">
            {activeEvents.length} visibili · {pastEvents.length} nello storico
          </p>
        </div>

        {/* Card 4: Organizzatori & Enti */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("organizers")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab("organizers");
            }
          }}
          className="group p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-emerald-500/60 hover:bg-[#10222a] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-emerald-300 uppercase tracking-wider transition">
              Enti & Organizzatori
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:scale-105 transition">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{organizers.length}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-amber-400">
                {pendingRequests.length} In Richiesta
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-400 transition">
            {organizers.filter((o) => o.verificato).length} verificati con badge
          </p>
        </div>

        {/* Card 5: Segnalazioni */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("reports")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab("reports");
            }
          }}
          className="group p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-red-500/60 hover:bg-[#221623] hover:shadow-lg hover:shadow-red-500/10 transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-red-300 uppercase tracking-wider transition">
              Segnalazioni
            </span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 group-hover:bg-red-500/20 group-hover:scale-105 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{reports.length}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-red-400">
                {pendingReports.length} Da Risolvere
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-400 transition">
            Ticket inviati dagli utenti
          </p>
        </div>
      </div>

      {/* Middle Grid: Category Breakdown + Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Category Distribution with Interactive Pie Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
            <h2 className="text-base font-bold text-white">
              Distribuzione Eventi per Categorie
            </h2>
            <button
              onClick={() => setActiveTab("events")}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center"
            >
              Vedi Tutti <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {events.length > 0 && pieData.slices.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-1">
              {/* Pie Chart SVG Canvas with Tooltip */}
              <div
                className="relative flex items-center justify-center shrink-0 w-[240px] h-[240px]"
                onMouseLeave={() => {
                  setHoveredCategory(null);
                  setPieTooltipPos(null);
                }}
              >
                <svg
                  viewBox="0 0 240 240"
                  className="w-full h-full overflow-visible"
                >
                  <g>
                    {pieData.slices.length === 1 ? (
                      <circle
                        cx="120"
                        cy="120"
                        r="95"
                        fill={pieData.slices[0].color.fill}
                        className="cursor-pointer transition-transform duration-200 hover:scale-105"
                        onClick={() => navigateToEventsWithCategory(pieData.slices[0].categoria)}
                        onMouseEnter={() => {
                          setHoveredCategory(pieData.slices[0].categoria);
                          setPieTooltipPos({ x: 120, y: 120 });
                        }}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                          if (rect) {
                            setPieTooltipPos({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    ) : (
                      pieData.slices.map((slice) => {
                        const cx = 120;
                        const cy = 120;
                        const r = 95;
                        const isHovered = hoveredCategory === slice.categoria;
                        const offset = isHovered ? 8 : 0;
                        const tx = Math.cos(slice.midAngle) * offset;
                        const ty = Math.sin(slice.midAngle) * offset;

                        const x1 = cx + r * Math.cos(slice.startAngle);
                        const y1 = cy + r * Math.sin(slice.startAngle);
                        const x2 = cx + r * Math.cos(slice.endAngle);
                        const y2 = cy + r * Math.sin(slice.endAngle);
                        const largeArc = slice.sliceAngle > Math.PI ? 1 : 0;
                        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                        return (
                          <path
                            key={slice.categoria}
                            d={d}
                            fill={slice.color.fill}
                            stroke="#0f172a"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            style={{
                              transform: `translate(${tx}px, ${ty}px)`,
                              transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s",
                              opacity: hoveredCategory && !isHovered ? 0.55 : 1,
                            }}
                            className="cursor-pointer"
                            onClick={() => navigateToEventsWithCategory(slice.categoria)}
                            onMouseEnter={() => setHoveredCategory(slice.categoria)}
                            onMouseMove={(e) => {
                              const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                              if (rect) {
                                setPieTooltipPos({
                                  x: e.clientX - rect.left,
                                  y: e.clientY - rect.top,
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredCategory(null)}
                          />
                        );
                      })
                    )}
                  </g>
                </svg>

                {/* Floating Tooltip on Hover */}
                {activeSlice && pieTooltipPos && (
                  <div
                    style={{
                      left: `${pieTooltipPos.x}px`,
                      top: `${pieTooltipPos.y}px`,
                      transform: "translate(-50%, -125%)",
                    }}
                    className="pointer-events-none absolute z-30 px-3 py-2 rounded-xl bg-[#090d16]/95 border border-slate-700 shadow-2xl backdrop-blur-md whitespace-nowrap text-xs transition-opacity duration-150"
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-white mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: activeSlice.color.fill }}
                      />
                      <span>{activeSlice.categoria}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Eventi:</span>
                        <strong className="text-white font-mono">{activeSlice.count}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Percentuale:</span>
                        <strong className="text-amber-400 font-mono font-bold">
                          {activeSlice.percentStr}
                        </strong>
                      </div>
                    </div>
                    <div className="pt-1 mt-1 border-t border-slate-800 text-[10px] text-amber-400 font-medium flex items-center justify-center">
                      Clicca per gestire eventi &rarr;
                    </div>
                  </div>
                )}
              </div>

              {/* Legend & Details Column */}
              <div className="flex-1 w-full space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {pieData.slices.map((slice) => {
                    const isHovered = hoveredCategory === slice.categoria;
                    return (
                      <div
                        key={slice.categoria}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigateToEventsWithCategory(slice.categoria)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigateToEventsWithCategory(slice.categoria);
                          }
                        }}
                        onMouseEnter={() => setHoveredCategory(slice.categoria)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs select-none ${
                          isHovered
                            ? "bg-[#141d2e] border-slate-500 shadow-md scale-[1.02]"
                            : "bg-[#0b1120]/60 border-slate-800/80 hover:border-slate-700 hover:bg-[#141d2e]/50"
                        }`}
                        title={`Clicca per filtrare gli eventi per ${slice.categoria}`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: slice.color.fill }}
                          />
                          <span className={`font-semibold truncate ${isHovered ? "text-white" : "text-slate-300"}`}>
                            {slice.categoria}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {slice.count}
                          </span>
                          <span
                            className="font-bold font-mono text-[11px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${slice.color.fill}20`,
                              color: slice.color.fill,
                            }}
                          >
                            {slice.percentStr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Nessun evento disponibile per calcolare la distribuzione.
            </div>
          )}
        </div>

        {/* Right Column: Live Stream Audit Feed */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
                Feed Live Attività
              </h2>
              <button
                onClick={() => setActiveTab("audit")}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Log Completi
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Eventi intercettati in tempo reale dal database
            </p>

            <div className="space-y-3 mt-4 max-h-[340px] overflow-y-auto pr-1">
              {auditLogs.length > 0 ? (
                auditLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-[#141d2e] border border-[#1e293b] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 font-mono text-[11px]">
                        {log.azione}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-200 line-clamp-2">{log.dettagli}</p>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>Da: {log.operatore?.email || "Admin"}</span>
                      <span className="uppercase text-[9px] px-1 rounded bg-slate-800 text-slate-300">
                        {log.targetTipo}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-1">
                  <Database className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                  <p>In attesa di nuove azioni su /audit_logs...</p>
                  <p className="text-[10px]">Tutte le modifiche al database verranno registrate qui.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Sincronizzazione bidirezionale attiva in tempo reale con Rook.</span>
          </div>
        </div>
      </div>

      {/* Featured Events (Booster) Highlight Row */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Eventi con Booster Attivo ("⚡ In Evidenza")
              </h2>
              <p className="text-xs text-slate-400">
                Visualizzati in cima alla home dell'app Rook nel carosello dorato
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("events")}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
          >
            Gestisci Booster
          </button>
        </div>

        {featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl bg-[#141d2e] border border-amber-500/30 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(
                        ev.categoria
                      )}`}
                    >
                      {ev.categoria}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center">
                      <Flame className="w-3 h-3 mr-0.5 fill-current" /> BOOST
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-sm text-white line-clamp-1">
                    {ev.titolo}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center mt-1">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    {ev.luogo || "Toscana"} — {formatEventDate(ev)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1e293b] text-xs">
                  <span className="text-slate-400 flex items-center">
                    <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    {ev.numeroRecensioni || 0} recensioni
                  </span>
                  <button
                    onClick={() => toggleBooster(ev.id)}
                    className="px-2 py-1 rounded text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition"
                  >
                    Disattiva
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            Nessun evento ha attualmente il Booster dorato attivo. Puoi abilitarlo dalla scheda "Gestione Eventi".
          </div>
        )}
      </div>
    </div>
  );
}
