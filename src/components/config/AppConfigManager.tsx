"use client";

import React, { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import {
  SlidersHorizontal,
  Smartphone,
  Apple,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  RefreshCw,
  Info,
  Server,
  Layers,
  Sparkles,
} from "lucide-react";

export function AppConfigManager() {
  const { appConfig, updateAppConfigParam, deleteAppConfigParam, currentEnv } = useAdmin();

  // Quick state for Android min_version_code
  const androidCodeCurrent = Number(appConfig.min_version_code ?? appConfig.versione_minima ?? 0);
  const [androidCodeInput, setAndroidCodeInput] = useState<string>("");
  const [isUpdatingAndroid, setIsUpdatingAndroid] = useState<boolean>(false);

  // Quick state for iOS min_version_code_ios
  const iosCodeCurrent = Number(appConfig.min_version_code_ios ?? 0);
  const [iosCodeInput, setIosCodeInput] = useState<string>("");
  const [isUpdatingIos, setIsUpdatingIos] = useState<boolean>(false);

  // Add new parameter state
  const [newKey, setNewKey] = useState<string>("");
  const [newType, setNewType] = useState<"number" | "string" | "boolean">("number");
  const [newValue, setNewValue] = useState<string>("");
  const [isAddingParam, setIsAddingParam] = useState<boolean>(false);

  // Editing state for table rows
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState<string>("");

  const handleSaveAndroidVersion = async () => {
    const val = parseInt(androidCodeInput || String(androidCodeCurrent), 10);
    if (isNaN(val) || val < 0) return;
    setIsUpdatingAndroid(true);
    await updateAppConfigParam("min_version_code", val);
    setAndroidCodeInput("");
    setIsUpdatingAndroid(false);
  };

  const handleSaveIosVersion = async () => {
    const val = parseInt(iosCodeInput || String(iosCodeCurrent), 10);
    if (isNaN(val) || val < 0) return;
    setIsUpdatingIos(true);
    await updateAppConfigParam("min_version_code_ios", val);
    setIosCodeInput("");
    setIsUpdatingIos(false);
  };

  const handleToggleManutenzione = async () => {
    const curr = Boolean(appConfig.manutenzione);
    await updateAppConfigParam("manutenzione", !curr);
  };

  const handleAddNewParam = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newKey.trim();
    if (!cleanKey) return;

    let parsedVal: any = newValue;
    if (newType === "number") {
      parsedVal = Number(newValue);
      if (isNaN(parsedVal)) parsedVal = 0;
    } else if (newType === "boolean") {
      parsedVal = newValue.toLowerCase() === "true" || newValue === "1";
    }

    setIsAddingParam(true);
    const ok = await updateAppConfigParam(cleanKey, parsedVal);
    if (ok) {
      setNewKey("");
      setNewValue("");
    }
    setIsAddingParam(false);
  };

  const handleSaveInlineEdit = async (key: string, originalVal: any) => {
    let parsed: any = editingVal;
    if (typeof originalVal === "number") {
      parsed = Number(editingVal);
      if (isNaN(parsed)) parsed = 0;
    } else if (typeof originalVal === "boolean") {
      parsed = editingVal.toLowerCase() === "true" || editingVal === "1";
    }

    await updateAppConfigParam(key, parsed);
    setEditingKey(null);
  };

  // Convert appConfig to sorted entries
  const allParams = Object.entries(appConfig).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-7 h-7 text-amber-400" />
            Configurazione App & Versioni Remota
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestisci in tempo reale i parametri globali del nodo <code className="text-amber-300 font-mono bg-[#1e293b]/60 px-1.5 py-0.5 rounded text-xs">/app_config</code> nel Realtime Database di {currentEnv === "prod" ? "Produzione (cosafare-c0e33)" : "Sviluppo (rook-dev-ed702)"}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Sync RTDB Attivo</span>
        </div>
      </div>

      {/* Sezione Versioni Minime (Quick Cards) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white tracking-wide uppercase text-xs">
            Controllo Aggiornamenti Forzati (Version Codes)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Android */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] hover:border-slate-700 transition shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Android — Play Store</h3>
                  <p className="text-xs text-slate-400 font-mono">chiave: min_version_code</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Valore Attuale</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {androidCodeCurrent > 0 ? androidCodeCurrent : "Disattivato (0)"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Tutti i client Android con <code className="text-emerald-300 font-mono">versionCode &lt; min_version_code</code> verranno bloccati all'avvio con la schermata obbligatoria di aggiornamento sul Google Play Store.
            </p>

            <div className="flex items-center gap-3 pt-3 border-t border-[#1e293b]">
              <input
                type="number"
                min="0"
                placeholder={`Nuovo codice (es. ${androidCodeCurrent + 1})`}
                value={androidCodeInput}
                onChange={(e) => setAndroidCodeInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#1e293b]/70 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                onClick={handleSaveAndroidVersion}
                disabled={isUpdatingAndroid || !androidCodeInput}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
              >
                {isUpdatingAndroid ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Salva</span>
              </button>
            </div>
          </div>

          {/* Card iOS */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] hover:border-slate-700 transition shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Apple className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Apple iOS — App Store</h3>
                  <p className="text-xs text-slate-400 font-mono">chiave: min_version_code_ios</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Valore Attuale</span>
                <span className="text-2xl font-black text-blue-400 font-mono">
                  {iosCodeCurrent > 0 ? iosCodeCurrent : "Disattivato (0)"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Gli utenti iPhone con build inferiore a questo numero verranno reindirizzati all'App Store per aggiornare l'applicazione. Imposta <strong className="text-blue-300">22</strong> quando Apple pubblica l'aggiornamento.
            </p>

            <div className="flex items-center gap-3 pt-3 border-t border-[#1e293b]">
              <input
                type="number"
                min="0"
                placeholder="Nuovo codice iOS (es. 22)"
                value={iosCodeInput}
                onChange={(e) => setIosCodeInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#1e293b]/70 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              <button
                onClick={() => setIosCodeInput("22")}
                className="px-2.5 py-2 bg-[#1e293b] hover:bg-[#283548] text-slate-300 font-mono text-xs rounded-xl transition border border-slate-700"
                title="Imposta rapidamente 22"
              >
                = 22
              </button>
              <button
                onClick={handleSaveIosVersion}
                disabled={isUpdatingIos || !iosCodeInput}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-blue-600/20"
              >
                {isUpdatingIos ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Salva</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modalità Manutenzione Globale */}
      <div className={`p-5 rounded-2xl border transition ${appConfig.manutenzione ? "bg-red-950/20 border-red-500/50" : "bg-[#0f172a] border-[#1e293b]"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${appConfig.manutenzione ? "bg-red-500/20 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Stato Manutenzione Globale (/app_config/manutenzione)</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${appConfig.manutenzione ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-slate-800 text-slate-400"}`}>
                  {appConfig.manutenzione ? "Attiva (App Bloccata)" : "Disattiva (App Online)"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Se attivato, l'app mostra una schermata di avviso impedendo l'accesso standard per manutenzioni straordinarie dei server.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleManutenzione}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${appConfig.manutenzione ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30" : "bg-[#1e293b] hover:bg-slate-700 text-slate-200 border border-slate-700"}`}
          >
            {appConfig.manutenzione ? "Disattiva Manutenzione" : "Attiva Manutenzione"}
          </button>
        </div>
      </div>

      {/* Tabella di Tutti i Parametri Presenti in /app_config */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-wide uppercase text-xs">
              Tutti i Parametri nel Nodo /app_config ({allParams.length})
            </h2>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
          {allParams.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Nessun parametro presente nel nodo <code className="text-amber-400 font-mono">/app_config</code>. Usa il form sotto per aggiungerne uno.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] bg-[#141d30] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Chiave Parametro</th>
                    <th className="py-3 px-4">Tipo Dato</th>
                    <th className="py-3 px-4">Valore Attuale</th>
                    <th className="py-3 px-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60">
                  {allParams.map(([key, val]) => {
                    const isEditing = editingKey === key;
                    const valType = typeof val;

                    return (
                      <tr key={key} className="hover:bg-[#15213b]/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-amber-300">
                          {key}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            valType === "number"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : valType === "boolean"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-slate-700/40 text-slate-300 border border-slate-600/30"
                          }`}>
                            {valType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingVal}
                                onChange={(e) => setEditingVal(e.target.value)}
                                className="px-2.5 py-1 bg-[#1e293b] border border-amber-500/50 rounded text-white font-mono text-xs focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveInlineEdit(key, val)}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px]"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingKey(null)}
                                className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[10px]"
                              >
                                Annulla
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-slate-200">
                              {typeof val === "boolean" ? (val ? "true" : "false") : JSON.stringify(val)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isEditing && (
                              <button
                                onClick={() => {
                                  setEditingKey(key);
                                  setEditingVal(String(val));
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition"
                              >
                                Modifica
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`Sei sicuro di voler eliminare il parametro '${key}' da /app_config?`)) {
                                  deleteAppConfigParam(key);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                              title="Elimina parametro"
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
          )}
        </div>
      </div>

      {/* Form Aggiungi Nuovo Parametro */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-base text-white">Aggiungi o Aggiorna Parametro Arbitrario</h3>
        </div>

        <form onSubmit={handleAddNewParam} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1.5">
              Chiave Parametro
            </label>
            <input
              type="text"
              placeholder="es. min_version_code_ios"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full px-3 py-2 bg-[#1e293b]/70 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1.5">
              Tipo di Dato
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#1e293b]/70 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition"
            >
              <option value="number">Numero (Integer / Float)</option>
              <option value="string">Testo (Stringa)</option>
              <option value="boolean">Booleano (true / false)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1.5">
              Valore
            </label>
            {newType === "boolean" ? (
              <select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e293b]/70 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition"
              >
                <option value="">Seleziona...</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <input
                type={newType === "number" ? "number" : "text"}
                placeholder={newType === "number" ? "es. 22" : "es. valore"}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e293b]/70 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isAddingParam || !newKey.trim() || newValue === ""}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20"
            >
              {isAddingParam ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Salva Parametro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
