"use client";

import React from "react";
import { useAdmin } from "@/context/AdminContext";
import {
  ToggleLeft,
  AlertOctagon,
  ShieldAlert,
  Flame,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export function FeatureFlagsManager() {
  const { featureFlags, toggleFeatureFlag } = useAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <ToggleLeft className="w-6 h-6 mr-2 text-amber-400" />
          Kill Switch & Feature Flags
        </h1>
        <p className="text-sm text-slate-400">
          Abilita o disabilita al volo le funzionalità dell'app mobile Rook senza dover rilasciare un aggiornamento sul Play Store.
        </p>
      </div>

      {/* Flags List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featureFlags.map((flag) => {
          const isCritical = flag.impatto === "critico";

          return (
            <div
              key={flag.id}
              className={`p-5 rounded-2xl bg-[#0f172a] border transition-all ${
                flag.attivo && isCritical
                  ? "border-red-500 bg-red-950/20 shadow-xl shadow-red-500/10"
                  : "border-[#1e293b] hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isCritical
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : flag.impatto === "alto"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      Impatto: {flag.impatto}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      chiave: {flag.chiave}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white">{flag.nome}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{flag.descrizione}</p>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => toggleFeatureFlag(flag.id)}
                  className={`w-14 h-8 rounded-full transition-all relative shrink-0 p-1 ${
                    flag.attivo
                      ? isCritical
                        ? "bg-red-500"
                        : "bg-emerald-500"
                      : "bg-[#1e293b]"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-all transform ${
                      flag.attivo ? "translate-x-6 shadow-md" : "translate-x-0"
                    }`}
                  ></div>
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs">
                <span className="text-slate-500">Stato:</span>
                <span
                  className={`font-bold ${
                    flag.attivo ? "text-emerald-400" : "text-slate-400"
                  }`}
                >
                  {flag.attivo ? "ATTIVO IN PRODUZIONE" : "DISABILITATO"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
