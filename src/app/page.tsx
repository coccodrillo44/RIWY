"use client";

import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAdmin } from "@/context/AdminContext";
import { DashboardCockpit } from "@/components/dashboard/DashboardCockpit";
import { EventsManager } from "@/components/events/EventsManager";
import { UsersManager } from "@/components/users/UsersManager";
import { OrganizersManager } from "@/components/organizers/OrganizersManager";
import { AuditTimeMachine } from "@/components/audit/AuditTimeMachine";
import { ReportsCenter } from "@/components/reports/ReportsCenter";
import { TuscanyMapViewer } from "@/components/map/TuscanyMapViewer";
import { FeatureFlagsManager } from "@/components/features/FeatureFlagsManager";
import { BroadcastNotificationHub } from "@/components/broadcast/BroadcastNotificationHub";
import { AiModerationShield } from "@/components/ai/AiModerationShield";
import { OrganizerStudio } from "@/components/studio/OrganizerStudio";
import { RefreshCw, LogIn, ShieldAlert, LogOut, X } from "lucide-react";

function LoginScreen() {
  const { loginWithGoogle, logout, currentUser, accessDenied, isAuthChecking } = useAdmin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090d16] p-6 text-slate-100">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-2xl space-y-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-amber-500/20">
          R
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">RIWY — Pannello Rook</h1>
          <p className="text-xs text-slate-400 mt-1">Accesso riservato agli amministratori</p>
        </div>

        {isAuthChecking ? (
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Verifica permessi in corso...</span>
          </div>
        ) : accessDenied ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2 text-left">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                L'account <strong>{currentUser?.email}</strong> non è tra gli amministratori autorizzati di Rook.
              </span>
            </div>
            <button
              onClick={logout}
              className="w-full py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#283548] text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Esci e usa un altro account</span>
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-500/20"
          >
            <LogIn className="w-4 h-4" />
            <span>Accedi con Google</span>
          </button>
        )}
      </div>
    </div>
  );
}

function Toast() {
  const { toast, dismissToast } = useAdmin();
  if (!toast) return null;

  const color =
    toast.type === "error"
      ? "bg-red-950/90 border-red-500/50 text-red-200"
      : toast.type === "success"
      ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
      : "bg-slate-800/95 border-slate-600 text-slate-200";

  return (
    <div
      role="status"
      className={`fixed bottom-5 right-5 z-[60] max-w-sm flex items-start space-x-3 px-4 py-3 rounded-xl border text-xs shadow-2xl backdrop-blur ${color}`}
    >
      <span className="flex-1">{toast.text}</span>
      <button onClick={dismissToast} aria-label="Chiudi" className="opacity-70 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AdminApp() {
  const {
    activeTab,
    isLiveConnected,
    adminEmail,
    isLoading,
    refreshData,
    onlineUsersCount,
    currentUser,
    isSuperAdmin,
    isAuthChecking,
  } = useAdmin();

  if (!isSuperAdmin) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-[#0d131f]/90 border-b border-[#1e293b] px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">Rook Web Operations</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-amber-400 capitalize">
              {activeTab.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Live Online Badge (users with a recent ultimoAccesso) */}
            <div
              title="Utenti con accesso negli ultimi 10 minuti (campo ultimoAccesso)"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{onlineUsersCount} Online</span>
            </div>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#141d2e] border border-slate-800 text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}></span>
              <span>{isLiveConnected ? "RTDB Europe-West1 Connesso" : "In Connessione..."}</span>
            </div>

            <button
              onClick={refreshData}
              title="Riconnetti i dati da Firebase"
              className="p-2 rounded-lg bg-[#141d2e] hover:bg-[#1e293b] text-slate-300 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading || isAuthChecking ? "animate-spin text-amber-400" : ""}`} />
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                👑
              </div>
              <span className="hidden md:inline font-semibold text-slate-200">
                {currentUser?.email || adminEmail}
              </span>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" && <DashboardCockpit />}
          {activeTab === "events" && <EventsManager />}
          {activeTab === "users" && <UsersManager />}
          {activeTab === "organizers" && <OrganizersManager />}
          {activeTab === "audit" && <AuditTimeMachine />}
          {activeTab === "reports" && <ReportsCenter />}
          {activeTab === "map" && <TuscanyMapViewer />}
          {activeTab === "feature_flags" && <FeatureFlagsManager />}
          {activeTab === "broadcast" && <BroadcastNotificationHub />}
          {activeTab === "ai_moderation" && <AiModerationShield />}
          {activeTab === "studio" && <OrganizerStudio />}
        </main>
      </div>

      <Toast />
    </div>
  );
}
