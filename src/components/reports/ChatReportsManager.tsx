"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { ReportItemDB, ChatMessageDB } from "@/types";
import {
  MessageSquareWarning,
  MessagesSquare,
  Search,
  Filter,
  Clock,
  User,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  FileText,
  ArrowRight,
  ShieldAlert,
  Loader2,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// Helper sicuro per convertire qualsiasi valore in stringa senza crashare
function safeString(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    try {
      return val.text || val.messaggio || val.nome || val.titolo || JSON.stringify(val);
    } catch {
      return "";
    }
  }
  return String(val);
}

export function ChatReportsManager() {
  const adminCtx = useAdmin();
  const reports = adminCtx?.reports || [];
  const resolveReport = adminCtx?.resolveReport;
  const reopenReport = adminCtx?.reopenReport;
  const fetchChatMessages = adminCtx?.fetchChatMessages;

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "da_risolvere" | "risolto">("all");
  const [selectedMotivo, setSelectedMotivo] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // Modals State
  const [resolvingReport, setResolvingReport] = useState<ReportItemDB | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  // Chat Transcript Viewer State
  const [inspectingReport, setInspectingReport] = useState<ReportItemDB | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageDB[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Filter only chat reports (in modo sicuro da null/undefined)
  const allChatReports = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    return reports.filter((r) => {
      if (!r) return false;
      const cat = safeString(r.categoria).toLowerCase();
      const tipo = safeString(r.tipo).toLowerCase();
      return cat === "chats" || tipo === "chat";
    });
  }, [reports]);

  // Statistics
  const pendingCount = useMemo(() => {
    return allChatReports.filter((r) => !r.stato || r.stato === "nuovo" || r.stato === "in_lavorazione").length;
  }, [allChatReports]);

  const resolvedCount = useMemo(() => {
    return allChatReports.filter((r) => r.stato === "risolto").length;
  }, [allChatReports]);

  // Available unique reasons for filtering
  const uniqueMotivi = useMemo(() => {
    const set = new Set<string>();
    allChatReports.forEach((r) => {
      const mot = safeString(r?.motivo).trim();
      if (mot && mot !== "Nessun motivo") {
        set.add(mot);
      }
    });
    return Array.from(set);
  }, [allChatReports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return allChatReports.filter((rep) => {
      if (!rep) return false;

      // 1. Status Filter
      const isResolved = rep.stato === "risolto";
      if (selectedStatus === "da_risolvere" && isResolved) return false;
      if (selectedStatus === "risolto" && !isResolved) return false;

      // 2. Reason Filter
      const motivoStr = safeString(rep.motivo).trim();
      if (selectedMotivo !== "all" && motivoStr !== selectedMotivo) {
        return false;
      }

      // 3. Date Filter
      if (selectedDate && rep.timestamp) {
        const num = typeof rep.timestamp === "number" ? rep.timestamp : Number(rep.timestamp);
        if (!isNaN(num) && num > 0) {
          const d = new Date(num);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const dateKey = `${y}-${m}-${day}`;
            if (dateKey !== selectedDate) return false;
          }
        }
      }

      // 4. Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchMotivo = safeString(rep.motivo).toLowerCase().includes(q);
        const matchDettagli = (
          safeString(rep.dettagli) ||
          safeString(rep.dettaglio) ||
          safeString(rep.descrizione)
        ).toLowerCase().includes(q);
        const matchSegnalatore = (
          safeString(rep.nomeSegnalatore) ||
          safeString(rep.nomeSegnalante) ||
          safeString(rep.segnalatoreUid) ||
          safeString(rep.emailSegnalante)
        ).toLowerCase().includes(q);
        const matchSegnalato = (
          safeString(rep.nomeSegnalato) ||
          safeString(rep.idSegnalato)
        ).toLowerCase().includes(q);
        const matchChatId = (
          safeString(rep.chatId) ||
          safeString(rep.chatRoomId) ||
          safeString(rep.targetId)
        ).toLowerCase().includes(q);
        const matchUltimi = safeString(rep.ultimiMessaggi).toLowerCase().includes(q);

        return matchMotivo || matchDettagli || matchSegnalatore || matchSegnalato || matchChatId || matchUltimi;
      }

      return true;
    });
  }, [allChatReports, selectedStatus, selectedMotivo, selectedDate, searchTerm]);

  // Fetch chat messages when inspecting a report
  useEffect(() => {
    if (!inspectingReport || !fetchChatMessages) {
      setChatMessages([]);
      return;
    }

    const chatId = safeString(
      inspectingReport.chatId || inspectingReport.chatRoomId || inspectingReport.targetId
    );
    if (!chatId) {
      setChatMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    fetchChatMessages(chatId)
      .then((msgs) => {
        setChatMessages(Array.isArray(msgs) ? msgs : []);
      })
      .catch((err) => {
        console.error("Errore caricamento messaggi chat:", err);
        setChatMessages([]);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  }, [inspectingReport, fetchChatMessages]);

  const handleConfirmResolve = async () => {
    if (!resolvingReport || !resolveReport) return;
    try {
      await resolveReport(resolvingReport.id, "chats", resolutionNote);
    } catch (e) {
      console.error("Errore risoluzione segnalazione chat:", e);
    }
    setResolvingReport(null);
    setResolutionNote("");
    if (inspectingReport && inspectingReport.id === resolvingReport.id) {
      setInspectingReport(null);
    }
  };

  const handleReopen = async (rep: ReportItemDB) => {
    if (!reopenReport) return;
    try {
      await reopenReport(rep.id, "chats");
    } catch (e) {
      console.error("Errore riapertura segnalazione chat:", e);
    }
  };

  const getMotivoBadgeColor = (motivo: any) => {
    const m = safeString(motivo).toLowerCase();
    if (m.includes("molestie") || m.includes("insulti")) return "bg-red-500/10 text-red-400 border-red-500/30";
    if (m.includes("truffa") || m.includes("scam")) return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    if (m.includes("offensiv") || m.includes("inappropriat")) return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    if (m.includes("spam")) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    return "bg-slate-500/10 text-slate-300 border-slate-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-red-500/20">
              <MessageSquareWarning className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Segnalazioni Chat
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold border border-red-500/30">
                  {pendingCount} da revisionare
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit e moderazione delle conversazioni segnalate dagli utenti nell&apos;app Rook.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
              <MessagesSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Totale</div>
              <div className="text-sm font-black text-white">{allChatReports.length}</div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">In Attesa</div>
              <div className="text-sm font-black text-amber-400">{pendingCount}</div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Risolte</div>
              <div className="text-sm font-black text-emerald-400">{resolvedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca per segnalante, segnalato, motivo, dettagli o ID chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#141d2e] border border-[#1e293b] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-[#141d2e] p-1 rounded-xl border border-[#1e293b] text-xs">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedStatus === "all" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Tutte ({allChatReports.length})
            </button>
            <button
              onClick={() => setSelectedStatus("da_risolvere")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedStatus === "da_risolvere" ? "bg-red-500 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Da Risolvere ({pendingCount})
            </button>
            <button
              onClick={() => setSelectedStatus("risolto")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedStatus === "risolto" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Risolte ({resolvedCount})
            </button>
          </div>

          {/* Motivo dropdown */}
          {uniqueMotivi.length > 0 && (
            <select
              value={selectedMotivo}
              onChange={(e) => setSelectedMotivo(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#141d2e] border border-[#1e293b] text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
            >
              <option value="all">Tutti i Motivi</option>
              {uniqueMotivi.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#141d2e] border border-[#1e293b] text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                title="Azzera data"
                className="ml-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5 inline" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#1e293b] bg-[#0f172a]">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#141d2e] text-slate-400 uppercase text-[11px] font-semibold border-b border-[#1e293b]">
            <tr>
              <th className="px-4 py-3.5">Data Segnalazione</th>
              <th className="px-4 py-3.5">Persone nella Chat</th>
              <th className="px-4 py-3.5">Motivazione</th>
              <th className="px-4 py-3.5">Dettagli / Note</th>
              <th className="px-4 py-3.5 text-center">Cronologia Chat</th>
              <th className="px-4 py-3.5 text-center">Stato</th>
              <th className="px-4 py-3.5 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {filteredReports.map((rep) => {
              if (!rep) return null;
              const repIdStr = safeString(rep.id);
              const isResolved = rep.stato === "risolto";
              const segnalanteNome = safeString(rep.nomeSegnalatore || rep.nomeSegnalante || "Utente");
              const segnalanteEmail = safeString(rep.emailSegnalante || rep.segnalatoreUid || "");
              const segnalatoNome = safeString(rep.nomeSegnalato || "Utente Segnalato");
              const segnalatoId = safeString(rep.idSegnalato);
              const chatId = safeString(rep.chatId || rep.chatRoomId || rep.targetId);
              const dettagliText = safeString(rep.dettagli || rep.dettaglio || rep.descrizione);
              const ultimiText = safeString(rep.ultimiMessaggi);

              return (
                <tr key={repIdStr || Math.random().toString()} className="hover:bg-[#141d2e]/60 transition">
                  {/* Data */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-semibold text-white">
                      {rep.timestamp ? formatDate(rep.timestamp, true) : "N/D"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ID: {repIdStr.length > 6 ? repIdStr.slice(-6) : repIdStr || "N/D"}
                    </div>
                  </td>

                  {/* Persone nella chat */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {/* Segnalante */}
                      <div className="min-w-[110px]">
                        <div className="font-bold text-white text-xs flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{segnalanteNome}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                          {segnalanteEmail || "Segnalante"}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="px-1 text-slate-500">
                        <ArrowRight className="w-3.5 h-3.5 text-red-400" />
                      </div>

                      {/* Segnalato */}
                      <div className="min-w-[110px]">
                        <div className="font-bold text-amber-300 text-xs flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{segnalatoNome}</span>
                        </div>
                        <div className="text-[10px] text-red-400/80 font-medium">
                          Segnalato {segnalatoId ? `(${segnalatoId.length > 6 ? segnalatoId.slice(-6) : segnalatoId})` : ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Motivazione */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getMotivoBadgeColor(
                        rep.motivo
                      )}`}
                    >
                      {safeString(rep.motivo) || "Non specificato"}
                    </span>
                  </td>

                  {/* Dettagli */}
                  <td className="px-4 py-3.5 max-w-xs">
                    <div className="text-xs text-slate-300 line-clamp-2">
                      {dettagliText || (
                        <span className="italic text-slate-500">Nessun dettaglio aggiuntivo</span>
                      )}
                    </div>
                    {ultimiText.trim() && (
                      <div className="text-[11px] text-amber-400/80 mt-1 line-clamp-1 italic">
                        &quot;{ultimiText}&quot;
                      </div>
                    )}
                  </td>

                  {/* Cronologia Chat (Pulsante per aprire la chat completa) */}
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => setInspectingReport(rep)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition shadow-sm"
                    >
                      <MessagesSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Vedi Messaggi</span>
                    </button>
                  </td>

                  {/* Stato */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        RISOLTO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                        <Clock className="w-3 h-3" />
                        DA RISOLVERE
                      </span>
                    )}
                  </td>

                  {/* Azioni */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setInspectingReport(rep)}
                        title="Ispeziona Segnalazione e Chat"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {isResolved ? (
                        <button
                          onClick={() => handleReopen(rep)}
                          title="Riapri segnalazione"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Riapri</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setResolvingReport(rep);
                            setResolutionNote("");
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20"
                        >
                          Risolvi
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredReports.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <MessageSquareWarning className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-medium">Nessuna segnalazione chat trovata</p>
                    <p className="text-xs text-slate-500">
                      {searchTerm || selectedStatus !== "all" || selectedMotivo !== "all" || selectedDate
                        ? "Prova a modificare i filtri di ricerca."
                        : "Non ci sono segnalazioni per le chat al momento."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODALE DI RISOLUZIONE SEGNALAZIONE */}
      {resolvingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Risolvi Segnalazione Chat</h3>
              </div>
              <button
                onClick={() => setResolvingReport(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Confermando, la segnalazione verrà contrassegnata come <strong>risolta</strong>. Puoi specificare una nota di risoluzione per l&apos;audit interno.
            </p>

            <div className="p-3 rounded-xl bg-[#141d2e] border border-[#1e293b] text-xs space-y-1">
              <div className="text-slate-400">
                Segnalante: <span className="text-white font-semibold">{safeString(resolvingReport.nomeSegnalatore || resolvingReport.nomeSegnalante || "Utente")}</span>
              </div>
              <div className="text-slate-400">
                Segnalato: <span className="text-red-400 font-semibold">{safeString(resolvingReport.nomeSegnalato || "Utente")}</span>
              </div>
              <div className="text-slate-400">
                Motivo: <span className="text-amber-400 font-semibold">{safeString(resolvingReport.motivo) || "Non specificato"}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Note di Risoluzione (opzionale)
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Es. Controllati i messaggi, utente avvisato / bloccato conformemente alle linee guida..."
                rows={3}
                className="w-full p-3 rounded-xl bg-[#141d2e] border border-[#1e293b] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => setResolvingReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmResolve}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20"
              >
                Conferma Risoluzione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CRONOLOGIA COMPLETA MESSAGGI CHAT */}
      {inspectingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#1e293b] bg-[#141d2e] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <MessagesSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    Cronologia Chat Segnalata
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                      {safeString(inspectingReport.motivo) || "Segnalazione"}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Chat ID: <code className="text-amber-400 font-mono text-[11px]">{safeString(inspectingReport.chatId || inspectingReport.chatRoomId || inspectingReport.targetId) || "N/D"}</code></span>
                    <span>•</span>
                    <span>{inspectingReport.timestamp ? formatDate(inspectingReport.timestamp, true) : ""}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectingReport(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Participants Summary Header Card */}
            <div className="p-4 bg-[#090d16] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                {/* Segnalante */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    S
                  </div>
                  <div>
                    <span className="text-slate-400">Segnalante:</span>{" "}
                    <strong className="text-white">{safeString(inspectingReport.nomeSegnalatore || inspectingReport.nomeSegnalante || "Utente")}</strong>
                    {safeString(inspectingReport.emailSegnalante) && (
                      <span className="text-slate-500 text-[11px] ml-1">({safeString(inspectingReport.emailSegnalante)})</span>
                    )}
                  </div>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

                {/* Segnalato */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-[10px]">
                    !
                  </div>
                  <div>
                    <span className="text-slate-400">Interlocutore Segnalato:</span>{" "}
                    <strong className="text-red-400">{safeString(inspectingReport.nomeSegnalato || "Utente")}</strong>
                    {safeString(inspectingReport.idSegnalato) && (
                      <span className="text-slate-500 text-[11px] ml-1">UID: {safeString(inspectingReport.idSegnalato)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dettagli della segnalazione */}
              {safeString(inspectingReport.dettagli) && (
                <div className="w-full text-slate-300 bg-[#141d2e] p-2.5 rounded-lg border border-[#1e293b]/70">
                  <span className="font-semibold text-amber-400">Note del segnalante:</span> &quot;{safeString(inspectingReport.dettagli)}&quot;
                </div>
              )}
            </div>

            {/* Chat Messages Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 bg-[#0d131f]">
              {isLoadingMessages ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-xs">Recupero messaggi della chat in tempo reale dal database...</p>
                </div>
              ) : chatMessages.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-center my-2">
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-semibold">
                      Inizio cronologia ({chatMessages.length} messaggi scambiati)
                    </span>
                  </div>

                  {chatMessages.map((msg) => {
                    const msgSenderId = safeString(msg.senderId);
                    const repTargetId = safeString(inspectingReport.idSegnalato);
                    const repAuthorId = safeString(inspectingReport.idSegnalatore || inspectingReport.segnalatoreUid);

                    const isFromReported = repTargetId && msgSenderId === repTargetId;
                    const isFromReporter = repAuthorId && msgSenderId === repAuthorId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isFromReported ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px]">
                          <span
                            className={`font-bold ${
                              isFromReported
                                ? "text-red-400"
                                : isFromReporter
                                ? "text-emerald-400"
                                : "text-amber-300"
                            }`}
                          >
                            {safeString(msg.senderName) || (isFromReported ? safeString(inspectingReport.nomeSegnalato) : msgSenderId || "Utente")}
                          </span>

                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono uppercase">
                            {safeString(msg.senderRole) || "UTENTE"}
                          </span>

                          {isFromReported && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold">
                              SEGNALATO
                            </span>
                          )}

                          <span className="text-[10px] text-slate-500 ml-1">
                            {msg.timestamp ? formatDate(msg.timestamp, true) : ""}
                          </span>
                        </div>

                        <div
                          className={`max-w-lg p-3 rounded-2xl text-xs leading-relaxed shadow-md ${
                            isFromReported
                              ? "bg-red-500/15 border border-red-500/30 text-red-100 rounded-tr-none"
                              : isFromReporter
                              ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 rounded-tl-none"
                              : "bg-[#1e293b] border border-slate-700 text-slate-200 rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap select-text">{safeString(msg.testo)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Fallback if no messages are present in active RTDB /chats/$chatId/messages */
                <div className="py-10 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Nessun messaggio presente nella chat attiva</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      I partecipanti potrebbero aver eliminato la conversazione dal dispositivo. Di seguito trovi l&apos;ultimo messaggio salvato automaticamente all&apos;atto della segnalazione:
                    </p>
                  </div>

                  {safeString(inspectingReport.ultimiMessaggi).trim() ? (
                    <div className="max-w-md mx-auto p-4 rounded-xl bg-[#141d2e] border border-amber-500/30 text-left">
                      <div className="text-[10px] text-amber-400 font-bold uppercase mb-1">
                        Ultimo messaggio archiviato al report:
                      </div>
                      <p className="text-xs text-white italic">
                        &quot;{safeString(inspectingReport.ultimiMessaggi)}&quot;
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Nessun messaggio o anteprima disponibile.</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#141d2e] border-t border-[#1e293b] flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Stato attuale:{" "}
                <span className={inspectingReport.stato === "risolto" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {inspectingReport.stato === "risolto" ? "Risolto" : "Da Risolvere"}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {inspectingReport.stato !== "risolto" && (
                  <button
                    onClick={() => {
                      setResolvingReport(inspectingReport);
                      setResolutionNote("");
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20"
                  >
                    Risolvi Segnalazione
                  </button>
                )}
                <button
                  onClick={() => setInspectingReport(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}