"use client";

import React, { useMemo } from "react";
import { useAdmin } from "@/context/AdminContext";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Building2,
  History,
  AlertTriangle,
  MapPin,
  ToggleLeft,
  BellRing,
  ShieldCheck,
  Briefcase,
  LogOut,
  ChevronRight,
} from "lucide-react";

export function Sidebar() {
  const { activeTab, setActiveTab, reports, organizerRequests, isLiveConnected, adminEmail, logout } = useAdmin();

  const pendingReportsCount = useMemo(() => {
    return reports.filter((r) => !r.stato || r.stato === "nuovo" || r.stato === "in_lavorazione").length;
  }, [reports]);

  const pendingOrgCount = useMemo(() => {
    return organizerRequests.filter((o) => !o.stato || o.stato === "IN_ATTESA").length;
  }, [organizerRequests]);

  const navItems = [
    { id: "dashboard", label: "Dashboard Cockpit", icon: LayoutDashboard },
    { id: "users", label: "Gestione Utenti", icon: Users },
    { id: "events", label: "Gestione Eventi", icon: CalendarDays },
    {
      id: "organizers",
      label: "Organizzatori & Enti",
      icon: Building2,
      badge: pendingOrgCount > 0 ? pendingOrgCount : null,
      badgeColor: "bg-amber-500",
    },
    {
      id: "reports",
      label: "Centro Segnalazioni",
      icon: AlertTriangle,
      badge: pendingReportsCount > 0 ? pendingReportsCount : null,
      badgeColor: "bg-red-500",
    },
    { id: "audit", label: "Audit Log & Diff", icon: History },
    { id: "map", label: "Mappa Live Toscana", icon: MapPin },
    { id: "feature_flags", label: "Kill Switch & Flags", icon: ToggleLeft },
    { id: "broadcast", label: "Notifiche Broadcast", icon: BellRing },
    { id: "ai_moderation", label: "AI Shield Moderation", icon: ShieldCheck },
    { id: "studio", label: "Studio Organizzatore", icon: Briefcase },
  ];

  return (
    <aside className="w-64 bg-[#0d131f] border-r border-[#1e293b] flex flex-col h-screen select-none shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20">
            R
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg tracking-tight text-white">RIWY</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">Controllo Totale Rook</p>
          </div>
        </div>
      </div>

      {/* Realtime Status Indicator */}
      <div className="px-5 py-2.5 bg-[#090d16]/70 border-b border-[#1e293b]/60 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLiveConnected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isLiveConnected ? "bg-emerald-500" : "bg-amber-500"
              }`}
            ></span>
          </span>
          <span className="text-slate-300 font-medium">
            {isLiveConnected ? "Firebase Live RTDB" : "In Connessione..."}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">eu-west1</span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#141d2e]"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold text-slate-950 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400/80" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Admin User Footer Profile */}
      <div className="p-3 border-t border-[#1e293b] bg-[#090d16]/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#141d2e]/80 border border-[#1e293b]">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-amber-300 shrink-0">
              SA
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{adminEmail}</p>
              <p className="text-[10px] text-amber-400 font-mono">SuperAdmin</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Esci dal pannello"
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
