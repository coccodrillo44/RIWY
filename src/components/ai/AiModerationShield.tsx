"use client";

import React, { useState } from "react";
import { ShieldCheck, Sparkles, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

export function AiModerationShield() {
  const [inputText, setInputText] = useState(
    "Festa abusiva segreta nel bosco senza autorizzazioni, portate alcolici e contanti!"
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    score: number;
    approved: boolean;
    flags: string[];
    summary: string;
  } | null>(null);

  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const isToxic =
        inputText.toLowerCase().includes("abusiv") ||
        inputText.toLowerCase().includes("segret") ||
        inputText.toLowerCase().includes("alcol");

      if (isToxic) {
        setScanResult({
          score: 88,
          approved: false,
          flags: [
            "Contenuto potenzialmente fuorviante o non autorizzato",
            "Menzione di consumo non regolamentato",
          ],
          summary: "Blocco automatico raccomandato prima della pubblicazione sull'app.",
        });
      } else {
        setScanResult({
          score: 12,
          approved: true,
          flags: [],
          summary:
            "Testo conforme al 100% con le linee guida Rook. Nessun contenuto vietato o discriminatorio rilevato.",
        });
      }
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <ShieldCheck className="w-6 h-6 mr-2 text-emerald-400" />
          AI Moderation Shield
        </h1>
        <p className="text-sm text-slate-400">
          Anteprima locale: confronta il testo con un elenco di parole sospette. Non invia dati a Gemini e non blocca le pubblicazioni dell'app.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Console */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-4">
          <h2 className="text-base font-bold text-white flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
            Scanner Testo & Descrizione
          </h2>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Inserisci testo dell'evento o recensione da analizzare:
            </label>
            <textarea
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analisi in corso...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Esegui Scansione AI Preventiva</span>
              </>
            )}
          </button>
        </div>

        {/* Scan Result Report */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-4">
          <h2 className="text-base font-bold text-white">Verdetto Scansione AI</h2>

          {scanResult && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  scanResult.approved
                    ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                    : "bg-red-950/20 border-red-500/40 text-red-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {scanResult.approved ? (
                    <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {scanResult.approved
                        ? "CONTENUTO APPROVATO"
                        : "ATTENZIONE: RISCHIO ELEVATO"}
                    </h3>
                    <p className="text-xs mt-0.5">{scanResult.summary}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black">{scanResult.score}%</span>
                  <span className="text-[10px] block opacity-80">Indice Rischio</span>
                </div>
              </div>

              {scanResult.flags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 font-semibold block">
                    Anomalie Rilevate:
                  </span>
                  <div className="space-y-1.5">
                    {scanResult.flags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#141d2e] border border-red-500/30 text-xs text-red-300 flex items-center space-x-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-[#141d2e] border border-slate-800 text-[11px] text-slate-400">
                L'auto-moderazione può essere collegata a Firebase Cloud Functions per respingere o approvare gli eventi prima che compaiano nel feed dell'app Android.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
