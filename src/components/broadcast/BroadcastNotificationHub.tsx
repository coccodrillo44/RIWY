"use client";

import React, { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import {
  BellRing,
  Send,
  Smartphone,
  Sparkles,
  MapPin,
  Tag,
  CheckCircle2,
} from "lucide-react";

export function BroadcastNotificationHub() {
  const { sendBroadcastPush } = useAdmin();

  const [title, setTitle] = useState("🏰 Grande novità nel weekend in Toscana!");
  const [body, setBody] = useState(
    "Scopri le nuove sagre gastronomiche e gli eventi in evidenza vicino a te su Rook."
  );
  const [targetProvince, setTargetProvince] = useState("all");
  const [targetCategory, setTargetCategory] = useState("all");
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const provinces = ["FI", "PI", "LU", "SI", "AR", "LI", "MS", "GR", "PO", "PT"];
  const categories = [
    "Cibo & Sagre",
    "Musica & Feste",
    "Arte & Cultura",
    "Sport & Movimento",
    "Famiglia & Bambini",
    "Fiere & Mercati",
    "Nuove Aperture",
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || isSending) return;

    setIsSending(true);
    const ok = await sendBroadcastPush({
      title,
      body,
      targetProvince: targetProvince === "all" ? undefined : targetProvince,
      targetCategory: targetCategory === "all" ? undefined : targetCategory,
    });
    setIsSending(false);

    if (ok) {
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <BellRing className="w-6 h-6 mr-2 text-amber-400" />
          Centro Invio Notifiche Push Broadcast
        </h1>
        <p className="text-sm text-slate-400">
          Invia notifiche push istantanee su smartphone a tutti gli utenti o segmentate per provincia e categoria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Composer */}
        <form onSubmit={handleSend} className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
            Componi Messaggio Push
          </h2>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Titolo Notifica
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Testo del Messaggio
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> Segmento Provincia
              </label>
              <select
                value={targetProvince}
                onChange={(e) => setTargetProvince(e.target.value)}
                className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Tutta la Toscana (Tutti gli utenti)</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    Solo provincia di {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center">
                <Tag className="w-3.5 h-3.5 mr-1 text-slate-400" /> Categoria di Interesse
              </label>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Tutte le Categorie</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4 fill-current" />
              <span>Invia Notifica Istantanea a Rook App</span>
            </button>
          </div>

          {sentSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Notifica presa in carico e inviata con successo agli smartphone via Firebase Cloud Functions ed FCM!
              </span>
            </div>
          )}
        </form>

        {/* Live Smartphone Notification Preview */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center">
              <Smartphone className="w-4 h-4 mr-2 text-slate-400" />
              Anteprima Notifica su Smartphone Android (M3)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Come apparirà la notifica sui dispositivi degli utenti in Toscana
            </p>
          </div>

          {/* Android Notification Banner Mockup */}
          <div className="p-4 rounded-2xl bg-[#1e293b]/90 border border-slate-700 shadow-2xl space-y-2 max-w-sm mx-auto w-full">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center space-x-1.5">
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[9px] font-black text-slate-950">
                  R
                </div>
                <span className="font-semibold text-slate-300">Rook • Eventi in Toscana</span>
              </div>
              <span>Adesso</span>
            </div>

            <div className="pt-1">
              <h4 className="font-bold text-xs text-white leading-tight">
                {title || "Titolo della notifica"}
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                {body || "Testo del messaggio..."}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/80 text-[10px] text-amber-400 font-medium">
              <span>Tocca per aprire l'evento</span>
              <span>FCM • Topic {targetProvince === "all" ? "Toscana" : targetProvince}</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            Il messaggio viene elaborato da Cloud Functions che inoltra l'annuncio push via FCM a tutti gli smartphone target.
          </div>
        </div>
      </div>
    </div>
  );
}
