"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { ReportItemDB, ChatMessageDB } from "@/types";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Bug,
  Calendar,
  Search,
  Filter,
  Clock,
  Smartphone,
  User,
  Eye,
  RefreshCw,
  X,
  FileText,
  Building2,
  RotateCcw,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

function safeStr(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item;
        const sender = item.nome || item.senderName || item.da || "";
        const text =
          item.testo ||
          item.text ||
          item.message ||
          (typeof item === "object" ? JSON.stringify(item) : String(item));
        return sender ? `${sender}: ${text}` : text;
      })
      .filter(Boolean)
      .join(" | ");
  }
  if (typeof val === "object") {
    return val.testo || val.text || val.message || JSON.stringify(val);
  }
  return String(val);
}

export function ReportsCenter() {
  const { reports, events, organizers, resolveReport, reopenReport, fetchChatMessages } = useAdmin();

  // Tab: "events" (Segnalazioni Eventi) | "organizers" (Segnalazioni Enti & Org) | "chats" (Segnalazioni Chat) | "bugs" (Segnalazioni Bug & Sistema) | "suggerimenti" (Suggerimenti & Idee)
  const [activeTabType, setActiveTabType] = useState<"events" | "organizers" | "chats" | "bugs" | "suggerimenti">("events");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "da_risolvere" | "risolto">("all");
  const [selectedMotivo, setSelectedMotivo] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // Modals State
  const [resolvingReport, setResolvingReport] = useState<ReportItemDB | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [inspectingReport, setInspectingReport] = useState<ReportItemDB | null>(null);

  // Chat inspection state
  const [chatMessages, setChatMessages] = useState<ChatMessageDB[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [copiedChatId, setCopiedChatId] = useState<boolean>(false);

  // Helper per estrarre il nome dell'organizzatore
  const getEventOrganizer = (rep: ReportItemDB): string => {
    if (rep.organizzatore && rep.organizzatore.trim()) return rep.organizzatore.trim();
    if (rep.nomeOrganizzatore && rep.nomeOrganizzatore.trim()) return rep.nomeOrganizzatore.trim();
    if (rep.idOrganizzatore) {
      const org = organizers.find((o) => o.idEnte === rep.idOrganizzatore);
      if (org?.nomeEnte) return org.nomeEnte;
    }
    if (rep.idEvento) {
      const ev = events.find((e) => e.id === rep.idEvento);
      if (ev?.organizzatore) return ev.organizzatore;
    }
    return "Organizzatore non specificato";
  };

  // Helper per estrarre il titolo dell'evento
  const getEventTitle = (rep: ReportItemDB): string => {
    if (rep.titoloEvento && rep.titoloEvento.trim()) return rep.titoloEvento.trim();
    if (rep.titoloTarget && rep.titoloTarget.trim()) return rep.titoloTarget.trim();
    if (rep.idEvento) {
      const ev = events.find((e) => e.id === rep.idEvento);
      if (ev?.titolo) return ev.titolo;
    }
    return rep.targetId ? `ID Evento: ${rep.targetId}` : "Evento senza titolo";
  };

  // Format YYYY-MM-DD in local timezone
  const getLocalDateKey = (ts?: number): string => {
    if (!ts) return "";
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Helper per verificare se un report è di tipo chat
  const isChatReport = (rep: ReportItemDB | null): boolean => {
    if (!rep) return false;
    const cat = String(rep.categoria || "").toLowerCase();
    const tipo = String(rep.tipo || "").toLowerCase();
    return (
      cat === "chats" ||
      cat === "chat" ||
      cat === "users" ||
      cat === "user" ||
      cat === "utenti" ||
      tipo === "chat" ||
      tipo === "utente" ||
      Boolean(rep.chatRoomId || rep.chatId)
    );
  };

  // Helper per verificare se un report è di tipo organizzatore / ente
  const isOrganizerReport = (rep: ReportItemDB | null): boolean => {
    if (!rep) return false;
    const cat = String(rep.categoria || "").toLowerCase();
    const tipo = String(rep.tipo || "").toLowerCase();
    return (
      cat === "organizzatori" ||
      cat === "organizers" ||
      cat === "enti" ||
      cat === "ente" ||
      tipo === "organizzatore" ||
      tipo === "ente"
    );
  };

  // Caricamento cronologia messaggi quando si apre la modale di una chat
  useEffect(() => {
    if (!inspectingReport) {
      setChatMessages([]);
      return;
    }

    const isChat = activeTabType === "chats" || isChatReport(inspectingReport);
    const chatId = safeStr(inspectingReport.chatRoomId || inspectingReport.chatId || inspectingReport.targetId);

    if (isChat && chatId && fetchChatMessages) {
      setIsLoadingChat(true);
      fetchChatMessages(chatId)
        .then((msgs) => setChatMessages(Array.isArray(msgs) ? msgs : []))
        .catch((err) => {
          console.error("Errore recupero messaggi chat:", err);
          setChatMessages([]);
        })
        .finally(() => setIsLoadingChat(false));
    } else {
      setChatMessages([]);
    }
  }, [inspectingReport, activeTabType, fetchChatMessages]);

  const reloadChat = async () => {
    if (!inspectingReport || !fetchChatMessages) return;
    const chatId = safeStr(inspectingReport.chatRoomId || inspectingReport.chatId || inspectingReport.targetId);
    if (!chatId) return;
    setIsLoadingChat(true);
    try {
      const msgs = await fetchChatMessages(chatId);
      setChatMessages(Array.isArray(msgs) ? msgs : []);
    } catch {
      setChatMessages([]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleCopyChatId = (id: string) => {
    if (!id) return;
    try {
      navigator.clipboard?.writeText(id);
      setCopiedChatId(true);
      setTimeout(() => setCopiedChatId(false), 2000);
    } catch (_) {}
  };

  // Divisione delle segnalazioni per macro-categoria (Eventi vs Enti/Organizzatori vs Chat vs Bug vs Suggerimenti)
  const { eventReports, organizerReports, chatReports, bugReports, suggerimentiReports } = useMemo(() => {
    const evList: ReportItemDB[] = [];
    const orgList: ReportItemDB[] = [];
    const chatList: ReportItemDB[] = [];
    const bugList: ReportItemDB[] = [];
    const suggList: ReportItemDB[] = [];

    reports.forEach((r) => {
      const cat = String(r.categoria || "").toLowerCase();
      const tipo = String(r.tipo || "").toLowerCase();
      if (cat === "suggerimenti" || cat === "suggerimento" || tipo === "suggerimento") {
        suggList.push(r);
      } else if (cat === "bugs" || cat === "bug" || tipo === "bug") {
        bugList.push(r);
      } else if (
        cat === "chats" ||
        cat === "chat" ||
        cat === "users" ||
        cat === "user" ||
        cat === "utenti" ||
        tipo === "chat" ||
        tipo === "utente" ||
        Boolean(r.chatRoomId || r.chatId)
      ) {
        chatList.push(r);
      } else if (
        cat === "organizzatori" ||
        cat === "organizers" ||
        cat === "enti" ||
        cat === "ente" ||
        tipo === "organizzatore" ||
        tipo === "ente"
      ) {
        orgList.push(r);
      } else {
        // "events", "evento", default
        evList.push(r);
      }
    });

    return { eventReports: evList, organizerReports: orgList, chatReports: chatList, bugReports: bugList, suggerimentiReports: suggList };
  }, [reports]);

  // Conteggi Da Risolvere
  const pendingEventsCount = useMemo(
    () => eventReports.filter((r) => r.stato !== "risolto").length,
    [eventReports]
  );
  const pendingOrganizersCount = useMemo(
    () => organizerReports.filter((r) => r.stato !== "risolto").length,
    [organizerReports]
  );
  const pendingChatsCount = useMemo(
    () => chatReports.filter((r) => r.stato !== "risolto").length,
    [chatReports]
  );
  const pendingBugsCount = useMemo(
    () => bugReports.filter((r) => r.stato !== "risolto").length,
    [bugReports]
  );
  const pendingSuggerimentiCount = useMemo(
    () => suggerimentiReports.filter((r) => r.stato !== "risolto").length,
    [suggerimentiReports]
  );

  // Lista attiva in base al tab selezionato
  const currentTabReports =
    activeTabType === "events"
      ? eventReports
      : activeTabType === "organizers"
      ? organizerReports
      : activeTabType === "chats"
      ? chatReports
      : activeTabType === "bugs"
      ? bugReports
      : suggerimentiReports;

  // Motivazioni preimpostate & dinamiche per il filtro
  const availableMotivations = useMemo(() => {
    const set = new Set<string>();

    if (activeTabType === "events") {
      set.add("Informazioni errate o fuorvianti");
      set.add("Evento annullato o non svolto");
      set.add("Spam / Contenuto inappropriato");
      set.add("Luogo o data errati");
      set.add("Altro");
    } else if (activeTabType === "organizers") {
      set.add("Contenuti o immagini inappropriate");
      set.add("Profilo falso o truffa");
      set.add("Eventi inesistenti o ingannevoli");
      set.add("Comportamento scorretto o molestie");
      set.add("Altro motivo");
    } else if (activeTabType === "chats") {
      set.add("Spam o messaggi indesiderati");
      set.add("Molestie o minacce");
      set.add("Contenuti offensivi o inappropriati");
      set.add("Truffa, frode o impersonificazione");
      set.add("Altro motivo");
    } else if (activeTabType === "suggerimenti") {
      set.add("Nuova funzionalità");
      set.add("Miglioramento interfaccia / UI");
      set.add("Nuova categoria o filtro");
      set.add("Altro");
    }

    currentTabReports.forEach((r) => {
      const m = safeStr(r.motivo).trim();
      if (m && m !== "Nessun motivo") {
        set.add(m);
      }
    });

    return Array.from(set);
  }, [currentTabReports, activeTabType]);

  // Filtro combinato
  const filteredReports = useMemo(() => {
    return currentTabReports.filter((rep) => {
      // 1. Filtro Stato
      const isResolved = rep.stato === "risolto";
      if (selectedStatus === "da_risolvere" && isResolved) return false;
      if (selectedStatus === "risolto" && !isResolved) return false;

      // 2. Filtro Motivazione (per Segnalazioni Eventi, Organizzatori e Chat)
      if ((activeTabType === "events" || activeTabType === "organizers" || activeTabType === "chats") && selectedMotivo !== "all") {
        const motivoNorm = safeStr(rep.motivo).trim().toLowerCase();
        const selNorm = selectedMotivo.trim().toLowerCase();
        if (motivoNorm !== selNorm) return false;
      }

      // 3. Filtro Data
      if (selectedDate) {
        const itemDate = getLocalDateKey(rep.timestamp);
        if (itemDate !== selectedDate) return false;
      }

      // 4. Search Bar
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (activeTabType === "events") {
          const title = getEventTitle(rep).toLowerCase();
          const org = getEventOrganizer(rep).toLowerCase();
          const reporter = safeStr(rep.emailSegnalante || rep.segnalatoreUid || rep.segnalatoDa).toLowerCase();
          const reason = safeStr(rep.motivo).toLowerCase();
          const desc = safeStr(rep.descrizione || rep.dettaglio || rep.dettagli).toLowerCase();

          const matches =
            title.includes(term) ||
            org.includes(term) ||
            reporter.includes(term) ||
            reason.includes(term) ||
            desc.includes(term) ||
            safeStr(rep.id).toLowerCase().includes(term);

          if (!matches) return false;
        } else if (activeTabType === "organizers") {
          const orgName = safeStr(rep.nomeOrganizzatore || rep.organizzatore || rep.titoloTarget).toLowerCase();
          const orgId = safeStr(rep.idOrganizzatore || rep.targetId).toLowerCase();
          const reporter = safeStr(
            rep.nomeSegnalante || rep.nomeSegnalatore || rep.emailSegnalante || rep.segnalatoDa || rep.idSegnalante || rep.segnalatoreUid
          ).toLowerCase();
          const reason = safeStr(rep.motivo).toLowerCase();
          const desc = safeStr(rep.descrizione || rep.dettaglio || rep.dettagli).toLowerCase();

          const matches =
            orgName.includes(term) ||
            orgId.includes(term) ||
            reporter.includes(term) ||
            reason.includes(term) ||
            desc.includes(term) ||
            safeStr(rep.id).toLowerCase().includes(term);

          if (!matches) return false;
        } else if (activeTabType === "chats") {
          const targetName = safeStr(rep.nomeSegnalato || rep.nomeControparte || rep.titoloTarget).toLowerCase();
          const targetUid = safeStr(rep.idSegnalato || rep.idControparte || rep.targetId).toLowerCase();
          const chatId = safeStr(rep.chatRoomId || rep.chatId).toLowerCase();
          const reporter = safeStr(
            rep.nomeSegnalante || rep.nomeSegnalatore || rep.emailSegnalante || rep.idSegnalante || rep.segnalatoreUid
          ).toLowerCase();
          const reason = safeStr(rep.motivo).toLowerCase();
          const desc = safeStr(rep.descrizione || rep.dettaglio || rep.dettagli).toLowerCase();

          const matches =
            targetName.includes(term) ||
            targetUid.includes(term) ||
            chatId.includes(term) ||
            reporter.includes(term) ||
            reason.includes(term) ||
            desc.includes(term) ||
            safeStr(rep.id).toLowerCase().includes(term);

          if (!matches) return false;
        } else {
          const bugTitle = safeStr(rep.titoloTarget || rep.motivo).toLowerCase();
          const desc = safeStr(rep.descrizione || rep.dettaglio || rep.dettagli).toLowerCase();
          const device = safeStr(rep.dispositivo).toLowerCase();
          const reporter = safeStr(rep.emailUtente || rep.segnalatoreUid || rep.emailSegnalante).toLowerCase();

          const matches =
            bugTitle.includes(term) ||
            desc.includes(term) ||
            device.includes(term) ||
            reporter.includes(term) ||
            safeStr(rep.id).toLowerCase().includes(term);

          if (!matches) return false;
        }
      }

      return true;
    });
  }, [currentTabReports, selectedStatus, selectedMotivo, selectedDate, searchTerm, activeTabType, events, organizers]);

  // Gestione Risoluzione
  const handleConfirmResolution = async () => {
    if (!resolvingReport) return;
    const cat = resolvingReport.categoria || (activeTabType === "events" ? "events" : activeTabType === "organizers" ? "organizzatori" : activeTabType === "chats" ? "chats" : "bugs");
    await resolveReport(
      resolvingReport.id,
      cat,
      resolutionNote || "Verificato e gestito secondo policy",
      resolvingReport.idOrganizzatore
    );
    setResolvingReport(null);
    setResolutionNote("");
  };

  // Gestione Riapertura
  const handleReopen = async (rep: ReportItemDB) => {
    const cat = rep.categoria || (activeTabType === "events" ? "events" : activeTabType === "organizers" ? "organizzatori" : activeTabType === "chats" ? "chats" : "bugs");
    await reopenReport(
      rep.id,
      cat,
      rep.idOrganizzatore
    );
  };

  // Reset dei filtri
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedMotivo("all");
    setSelectedDate("");
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedStatus !== "all" ||
    ((activeTabType === "events" || activeTabType === "organizers" || activeTabType === "chats") && selectedMotivo !== "all") ||
    selectedDate !== "";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-amber-400" />
            Centro Segnalazioni & Moderazione
          </h1>
          <p className="text-sm text-slate-400">
            Monitoraggio in tempo reale dei ticket: segnalazioni chat e messaggi, anomalie eventi, enti e organizzatori, bug e suggerimenti.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">
            Segnalazioni visualizzate:{" "}
            <strong className="text-amber-400">{filteredReports.length}</strong> su{" "}
            {currentTabReports.length}
          </span>
        </div>
      </div>

      {/* Tabs: Divisione tra Segnalazioni Eventi, Organizzatori, Chat, Bug e Suggerimenti */}
      <div className="flex border-b border-[#1e293b] gap-2 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTabType("events");
            setSelectedMotivo("all");
          }}
          className={`pb-3.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTabType === "events"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Segnalazioni Eventi
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#141d2e] border border-slate-700 text-slate-300">
            {eventReports.length}
          </span>
          {pendingEventsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingEventsCount} da risolvere
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTabType("organizers");
            setSelectedMotivo("all");
          }}
          className={`pb-3.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTabType === "organizers"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Segnalazioni Enti & Org
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#141d2e] border border-slate-700 text-slate-300">
            {organizerReports.length}
          </span>
          {pendingOrganizersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingOrganizersCount} da risolvere
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTabType("chats");
            setSelectedMotivo("all");
          }}
          className={`pb-3.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTabType === "chats"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Segnalazioni Chat
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#141d2e] border border-slate-700 text-slate-300">
            {chatReports.length}
          </span>
          {pendingChatsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingChatsCount} da risolvere
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTabType("bugs");
            setSelectedMotivo("all");
          }}
          className={`pb-3.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTabType === "bugs"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bug className="w-4 h-4" />
          Segnalazioni Bug & Sistema
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#141d2e] border border-slate-700 text-slate-300">
            {bugReports.length}
          </span>
          {pendingBugsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingBugsCount} da risolvere
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTabType("suggerimenti");
            setSelectedMotivo("all");
          }}
          className={`pb-3.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTabType === "suggerimenti"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Suggerimenti & Idee
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#141d2e] border border-slate-700 text-slate-300">
            {suggerimentiReports.length}
          </span>
          {pendingSuggerimentiCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingSuggerimentiCount} da valutare
            </span>
          )}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-wrap gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTabType === "events"
                ? "Cerca per nome evento, organizzatore o segnalatore..."
                : activeTabType === "organizers"
                ? "Cerca per organizzatore, ID, motivo o segnalatore..."
                : activeTabType === "chats"
                ? "Cerca per utente segnalato, stanza chat, motivo o segnalatore..."
                : activeTabType === "bugs"
                ? "Cerca per titolo bug, dispositivo, descrizione o email..."
                : "Cerca per idea, testo suggerimento, dispositivo o utente..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141d2e] border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns: Stato, Motivazione, Data */}
        <div className="flex flex-wrap gap-2 text-xs items-center">
          {/* Menu a tendina Stato: da risolvere / risolto */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 text-[11px] hidden md:inline">Stato:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-[#141d2e] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="da_risolvere">Da risolvere</option>
              <option value="risolto">Risolto</option>
            </select>
          </div>

          {/* Menu a tendina Motivazione - Per Segnalazioni Eventi, Organizzatori e Chat */}
          {(activeTabType === "events" || activeTabType === "organizers" || activeTabType === "chats") && (
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 text-[11px] hidden md:inline">Motivo:</span>
              <select
                value={selectedMotivo}
                onChange={(e) => setSelectedMotivo(e.target.value)}
                className="bg-[#141d2e] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 max-w-[190px] truncate"
              >
                <option value="all">Tutte le motivazioni</option>
                {availableMotivations.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro per Data */}
          <div className="flex items-center space-x-1.5 relative">
            <span className="text-slate-400 text-[11px] hidden md:inline">Data:</span>
            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#141d2e] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 [color-scheme:dark]"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate("")}
                  title="Azzera data"
                  className="ml-1 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Reset filtri */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
              title="Resetta filtri"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Tabella Segnalazioni */}
      {filteredReports.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[#1e293b] bg-[#0f172a]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141d2e] text-slate-400 uppercase text-[11px] font-semibold border-b border-[#1e293b]">
              {activeTabType === "events" ? (
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Evento Segnalato</th>
                  <th className="px-4 py-3">Organizzatore</th>
                  <th className="px-4 py-3">Motivazione & Dettagli</th>
                  <th className="px-4 py-3">Segnalatore</th>
                  <th className="px-4 py-3 text-center">Stato</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              ) : activeTabType === "organizers" ? (
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Organizzatore Segnalato</th>
                  <th className="px-4 py-3">Tipo Target</th>
                  <th className="px-4 py-3">Motivazione & Dettagli</th>
                  <th className="px-4 py-3">Segnalatore</th>
                  <th className="px-4 py-3 text-center">Stato</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              ) : activeTabType === "chats" ? (
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Persone nella Chat</th>
                  <th className="px-4 py-3">Stanza / ID Chat</th>
                  <th className="px-4 py-3">Motivazione & Dettagli</th>
                  <th className="px-4 py-3">Segnalatore</th>
                  <th className="px-4 py-3 text-center">Stato</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              ) : activeTabType === "bugs" ? (
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Titolo Bug / Oggetto</th>
                  <th className="px-4 py-3">Dispositivo & Versione</th>
                  <th className="px-4 py-3">Descrizione Problema</th>
                  <th className="px-4 py-3">Segnalatore</th>
                  <th className="px-4 py-3 text-center">Stato</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Oggetto / Titolo</th>
                  <th className="px-4 py-3">Dispositivo & Versione</th>
                  <th className="px-4 py-3">Descrizione Suggerimento</th>
                  <th className="px-4 py-3">Utente Proponente</th>
                  <th className="px-4 py-3 text-center">Stato</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredReports.map((rep) => {
                const isResolved = rep.stato === "risolto";
                const evTitle = getEventTitle(rep);
                const evOrg = getEventOrganizer(rep);
                const reporterEmail = safeStr(
                  rep.emailSegnalante ||
                    rep.emailUtente ||
                    rep.nomeSegnalatore ||
                    rep.nomeSegnalante ||
                    rep.segnalatoDa ||
                    rep.segnalatoreUid ||
                    "Utente"
                );
                const descriptionText = safeStr(
                  rep.descrizione || rep.dettaglio || rep.dettagli || "Nessun dettaglio aggiuntivo"
                );

                return (
                  <tr key={rep.id} className="hover:bg-[#141d2e]/60 transition">
                    {/* 1. Data */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center text-slate-200 font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <span>{formatDate(rep.timestamp)}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        ID: {safeStr(rep.id).slice(0, 10)}...
                      </span>
                    </td>

                    {/* 2 & 3. Specifico per Tab Eventi, Organizzatori, Chat o Bug/Suggerimenti */}
                    {activeTabType === "events" ? (
                      <>
                        {/* Evento Segnalato */}
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="font-bold text-white text-sm line-clamp-1" title={evTitle}>
                            {evTitle}
                          </div>
                          {rep.idEvento && (
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                              ID Ev: {safeStr(rep.idEvento)}
                            </span>
                          )}
                        </td>

                        {/* Organizzatore */}
                        <td className="px-4 py-3 max-w-[190px]">
                          <div className="flex items-center space-x-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="font-medium text-slate-200 truncate" title={evOrg}>
                              {evOrg}
                            </span>
                          </div>
                          {rep.idOrganizzatore && (
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5 pl-5">
                              {safeStr(rep.idOrganizzatore)}
                            </span>
                          )}
                        </td>
                      </>
                    ) : activeTabType === "organizers" ? (
                      <>
                        {/* Organizzatore Segnalato */}
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="flex items-center space-x-1.5">
                            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="truncate">
                              <span
                                className="font-bold text-white text-sm block truncate"
                                title={safeStr(rep.nomeOrganizzatore || rep.organizzatore || rep.titoloTarget || "Organizzatore")}
                              >
                                {safeStr(rep.nomeOrganizzatore || rep.organizzatore || rep.titoloTarget || "Organizzatore")}
                              </span>
                              {rep.idOrganizzatore && (
                                <span className="text-[10px] text-slate-500 font-mono block truncate">
                                  ID: {safeStr(rep.idOrganizzatore)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Tipo Target */}
                        <td className="px-4 py-3 max-w-[190px]">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 inline-block">
                            Ente / Organizzatore
                          </span>
                        </td>
                      </>
                    ) : activeTabType === "chats" ? (
                      <>
                        {/* Persone nella Chat */}
                        <td className="px-4 py-3 max-w-[240px]">
                          <div className="space-y-1">
                            {/* Utente Segnalato */}
                            <div className="flex items-center space-x-1.5">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/15 text-red-300 border border-red-500/30 shrink-0">
                                Segnalato
                              </span>
                              <span
                                className="font-bold text-white text-xs truncate"
                                title={safeStr(rep.nomeSegnalato || rep.nomeControparte || rep.titoloTarget || "Utente Segnalato")}
                              >
                                {safeStr(rep.nomeSegnalato || rep.nomeControparte || rep.titoloTarget || "Utente Segnalato")}
                              </span>
                            </div>
                            {(rep.idSegnalato || rep.idControparte) && (
                              <span className="text-[10px] text-slate-500 font-mono block truncate pl-1">
                                UID: {safeStr(rep.idSegnalato || rep.idControparte)}
                              </span>
                            )}

                            {/* Interlocutore / Segnalatore */}
                            <div className="pt-0.5 border-t border-slate-800/60 flex items-center space-x-1 text-[11px] text-slate-400">
                              <span className="text-[9px] font-medium text-slate-500 shrink-0">Da:</span>
                              <span
                                className="text-slate-300 truncate font-medium"
                                title={safeStr(rep.nomeSegnalatore || rep.nomeSegnalante || rep.emailSegnalante || rep.idSegnalatore || "Utente")}
                              >
                                {safeStr(rep.nomeSegnalatore || rep.nomeSegnalante || rep.emailSegnalante || rep.idSegnalatore || "Utente")}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Stanza / ID Chat */}
                        <td className="px-4 py-3 max-w-[190px]">
                          <div className="flex items-center space-x-1.5 text-slate-300">
                            <MessageCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span
                              className="font-mono text-xs text-slate-200 truncate"
                              title={safeStr(rep.chatRoomId || rep.chatId || rep.targetId)}
                            >
                              {safeStr(rep.chatRoomId || rep.chatId || rep.targetId || "Chat")}
                            </span>
                          </div>
                          {rep.ultimiMessaggi && (
                            <span
                              className="text-[10px] text-slate-400 truncate block mt-0.5 pl-5"
                              title={safeStr(rep.ultimiMessaggi)}
                            >
                              Ultimo msg: {safeStr(rep.ultimiMessaggi)}
                            </span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Titolo Bug */}
                        <td className="px-4 py-3 max-w-[220px]">
                          <div
                            className="font-bold text-white text-sm line-clamp-1"
                            title={safeStr(rep.titoloTarget || rep.motivo)}
                          >
                            {safeStr(
                              rep.titoloTarget ||
                                rep.motivo ||
                                (activeTabType === "suggerimenti" ? "Suggerimento Utente" : "Segnalazione Bug")
                            )}
                          </div>
                          {rep.gravita && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-red-500/10 text-red-400 border border-red-500/20 inline-block mt-0.5">
                              Gravità: {safeStr(rep.gravita)}
                            </span>
                          )}
                        </td>

                        {/* Dispositivo & Versione App */}
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="flex items-center space-x-1.5 text-slate-300">
                            <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate" title={safeStr(rep.dispositivo || "N/D")}>
                              {safeStr(rep.dispositivo || "Dispositivo N/D")}
                            </span>
                          </div>
                          {rep.versioneApp && (
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5 pl-5">
                              App v{safeStr(rep.versioneApp)}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {/* 4. Motivazione & Dettagli */}
                    <td className="px-4 py-3 max-w-[280px]">
                      {activeTabType === "events" || activeTabType === "chats" || activeTabType === "organizers" ? (
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1e293b] text-amber-300 border border-amber-500/20 inline-block mb-1">
                            {safeStr(rep.motivo || "Altro")}
                          </span>
                          <p className="text-slate-300 text-xs line-clamp-2 italic" title={descriptionText}>
                            &ldquo;{descriptionText}&rdquo;
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-300 text-xs line-clamp-2" title={descriptionText}>
                            {descriptionText}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* 5. Segnalatore */}
                    <td className="px-4 py-3 max-w-[160px] whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-slate-300">
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate text-xs" title={reporterEmail}>
                          {reporterEmail}
                        </span>
                      </div>
                    </td>

                    {/* 6. Tag Stato */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isResolved ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          RISOLTO
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          DA RISOLVERE
                        </span>
                      )}
                    </td>

                    {/* 7. Azioni */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5">
                        {/* Dettagli modal */}
                        <button
                          onClick={() => setInspectingReport(rep)}
                          className="p-1.5 rounded-lg bg-[#141d2e] border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition"
                          title="Vedi dettagli completi e messaggi chat"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Risolvi o Riapri */}
                        {!isResolved ? (
                          <button
                            onClick={() => {
                              setResolvingReport(rep);
                              setResolutionNote("");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 transition shadow-sm"
                            title="Segna come risolto"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Risolvi
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReopen(rep)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs inline-flex items-center gap-1 border border-slate-700 transition"
                            title="Riapri segnalazione e imposta su 'Da risolvere'"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            Riapri
                          </button>
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
          <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-400">
            Nessuna segnalazione trovata con i filtri impostati
          </p>
          <p className="max-w-md mx-auto text-slate-500">
            {hasActiveFilters
              ? "Prova a modificare i filtri di ricerca, stato o data selezionati."
              : `Nessuna segnalazione registrata in /reports/${activeTabType}.`}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#141d2e] border border-slate-700 text-amber-400 hover:text-amber-300 text-xs font-medium inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reimposta tutti i filtri
            </button>
          )}
        </div>
      )}

      {/* Modal: Risoluzione Segnalazione */}
      {resolvingReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-2" />
                Risoluzione Segnalazione
              </h3>
              <button
                onClick={() => setResolvingReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#141d2e] border border-slate-800 text-xs space-y-1">
              <div className="font-semibold text-white">
                {activeTabType === "events"
                  ? getEventTitle(resolvingReport)
                  : activeTabType === "organizers" || isOrganizerReport(resolvingReport)
                  ? `Organizzatore: ${safeStr(resolvingReport.nomeOrganizzatore || resolvingReport.organizzatore || resolvingReport.titoloTarget || "Organizzatore")}`
                  : activeTabType === "chats" || isChatReport(resolvingReport)
                  ? resolvingReport.nomeSegnalato || resolvingReport.nomeControparte
                    ? `Chat con ${resolvingReport.nomeSegnalato || resolvingReport.nomeControparte}`
                    : resolvingReport.titoloTarget || "Segnalazione Chat"
                  : resolvingReport.titoloTarget || resolvingReport.motivo}
              </div>
              <p className="text-slate-400">
                <span className="text-amber-400 font-medium">Motivo: </span>
                {safeStr(resolvingReport.motivo || "Nessun motivo")}
              </p>
              {(resolvingReport.descrizione || resolvingReport.dettaglio || resolvingReport.dettagli) && (
                <p className="text-slate-300 italic pt-1">
                  &ldquo;{safeStr(resolvingReport.descrizione || resolvingReport.dettaglio || resolvingReport.dettagli)}&rdquo;
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Note risoluzione / Azione intrapresa:
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Es. Verificato contenuto chat, utente avvertito o segnalazione gestita secondo policy..."
                className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setResolvingReport(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#141d2e] text-slate-300 hover:text-white text-xs border border-slate-700 transition"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmResolution}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Archivia come Risolto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dettagli Ispettore Segnalazione con Visualizzatore Chat */}
      {inspectingReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div
            className={`bg-[#0f172a] border border-[#1e293b] rounded-2xl ${
              activeTabType === "chats" || isChatReport(inspectingReport) ? "max-w-2xl" : "max-w-lg"
            } w-full p-6 space-y-4 shadow-2xl max-h-[88vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                {activeTabType === "chats" || isChatReport(inspectingReport) ? (
                  <MessageCircle className="w-5 h-5 text-amber-400" />
                ) : activeTabType === "organizers" || isOrganizerReport(inspectingReport) ? (
                  <Building2 className="w-5 h-5 text-amber-400" />
                ) : (
                  <FileText className="w-5 h-5 text-amber-400" />
                )}
                <h3 className="text-base font-bold text-white">
                  {activeTabType === "chats" || isChatReport(inspectingReport)
                    ? "Dettagli Segnalazione Chat"
                    : activeTabType === "organizers" || isOrganizerReport(inspectingReport)
                    ? "Dettagli Segnalazione Organizzatore"
                    : "Dettagli Segnalazione"}
                </h3>
              </div>
              <button
                onClick={() => setInspectingReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Stato Badge */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Stato corrente:</span>
                {inspectingReport.stato === "risolto" ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    RISOLTO
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    DA RISOLVERE
                  </span>
                )}
              </div>

              {/* Data invio & ID Ticket */}
              <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2 text-[11px]">
                <div>
                  <span className="text-slate-400 font-medium block">Inviata il:</span>
                  <span className="text-white font-mono">{formatDate(inspectingReport.timestamp)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">ID Ticket:</span>
                  <span className="text-slate-300 font-mono text-[10px] truncate block" title={safeStr(inspectingReport.id)}>
                    {safeStr(inspectingReport.id)}
                  </span>
                </div>
              </div>

              {/* Sezione Specifica: Eventi vs Organizzatori vs Chat vs Bug */}
              {activeTabType === "events" ? (
                <>
                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-slate-400 font-medium block mb-1">Evento target:</span>
                    <div className="p-2.5 rounded-lg bg-[#141d2e] border border-slate-800 font-bold text-white">
                      {getEventTitle(inspectingReport)}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-slate-400 font-medium block mb-1">Organizzatore responsabile:</span>
                    <div className="p-2.5 rounded-lg bg-[#141d2e] border border-slate-800 text-slate-200">
                      {getEventOrganizer(inspectingReport)}
                      {inspectingReport.idOrganizzatore && (
                        <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                          UID Ente: {safeStr(inspectingReport.idOrganizzatore)}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : activeTabType === "organizers" || isOrganizerReport(inspectingReport) ? (
                <>
                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-slate-400 font-medium block mb-1">Organizzatore segnalato:</span>
                    <div className="p-2.5 rounded-lg bg-[#141d2e] border border-slate-800 font-bold text-white flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="truncate">
                          {safeStr(
                            inspectingReport.nomeOrganizzatore ||
                              inspectingReport.organizzatore ||
                              inspectingReport.titoloTarget ||
                              "Organizzatore"
                          )}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0 ml-2">
                        Ente / Profilo
                      </span>
                    </div>
                  </div>

                  {inspectingReport.idOrganizzatore && (
                    <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">UID Organizzatore:</span>
                      <span className="text-slate-200 font-mono text-xs select-all">
                        {safeStr(inspectingReport.idOrganizzatore)}
                      </span>
                    </div>
                  )}
                </>
              ) : activeTabType === "chats" || isChatReport(inspectingReport) ? (
                <>
                  {/* Persone nella Chat: Utente Segnalato & Segnalatore */}
                  <div className="border-t border-slate-800 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Utente Segnalato */}
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                          UTENTE SEGNALATO
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm truncate">
                        {safeStr(
                          inspectingReport.nomeSegnalato ||
                            inspectingReport.nomeControparte ||
                            inspectingReport.titoloTarget ||
                            "Utente Segnalato"
                        )}
                      </div>
                      {(inspectingReport.idSegnalato || inspectingReport.idControparte) && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-1 truncate">
                          UID: {safeStr(inspectingReport.idSegnalato || inspectingReport.idControparte)}
                        </span>
                      )}
                    </div>

                    {/* Utente Segnalante */}
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          UTENTE SEGNALANTE
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm truncate">
                        {safeStr(
                          inspectingReport.nomeSegnalatore ||
                            inspectingReport.nomeSegnalante ||
                            inspectingReport.emailSegnalante ||
                            inspectingReport.segnalatoDa ||
                            "Utente Segnalante"
                        )}
                      </div>
                      {(inspectingReport.idSegnalatore ||
                        inspectingReport.idSegnalante ||
                        inspectingReport.segnalatoreUid) && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-1 truncate">
                          UID:{" "}
                          {safeStr(
                            inspectingReport.idSegnalatore ||
                              inspectingReport.idSegnalante ||
                              inspectingReport.segnalatoreUid
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ID Stanza Chat con Copia */}
                  {(inspectingReport.chatRoomId || inspectingReport.chatId || inspectingReport.targetId) && (
                    <div className="border-t border-slate-800 pt-2 flex items-center justify-between p-2.5 rounded-lg bg-[#141d2e] border border-slate-800">
                      <div>
                        <span className="text-slate-400 text-[10px] block">ID Stanza Chat:</span>
                        <span className="text-amber-400 font-mono text-xs select-all">
                          {safeStr(inspectingReport.chatRoomId || inspectingReport.chatId || inspectingReport.targetId)}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleCopyChatId(
                            safeStr(inspectingReport.chatRoomId || inspectingReport.chatId || inspectingReport.targetId)
                          )
                        }
                        className="px-2 py-1 rounded bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition"
                        title="Copia ID Stanza"
                      >
                        {copiedChatId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiato</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copia ID</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Cronologia Completa dei Messaggi Scambiati in Chat */}
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold text-white text-xs">
                          Cronologia Conversazione Chat
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#141d2e] text-slate-300 border border-slate-700">
                          {chatMessages.length} messaggi
                        </span>
                      </div>
                      <button
                        onClick={reloadChat}
                        disabled={isLoadingChat}
                        className="p-1.5 rounded-lg bg-[#141d2e] border border-slate-700 text-slate-400 hover:text-white transition disabled:opacity-50"
                        title="Ricarica messaggi dal database"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingChat ? "animate-spin text-amber-400" : ""}`} />
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 p-3 rounded-xl bg-[#0a0f1d] border border-slate-800 text-xs">
                      {isLoadingChat ? (
                        <div className="py-6 flex items-center justify-center space-x-2 text-slate-400">
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Caricamento messaggi della chat in corso...</span>
                        </div>
                      ) : chatMessages.length > 0 ? (
                        chatMessages.map((msg) => {
                          const isReported =
                            (inspectingReport.idSegnalato && msg.senderId === inspectingReport.idSegnalato) ||
                            (inspectingReport.nomeSegnalato && msg.senderName === inspectingReport.nomeSegnalato);

                          return (
                            <div
                              key={msg.id}
                              className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                                isReported
                                  ? "bg-red-950/20 border-red-500/30 text-red-100"
                                  : "bg-[#141d2e] border-slate-800 text-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center space-x-1.5">
                                  <span
                                    className={`font-bold ${
                                      isReported ? "text-red-300" : "text-amber-400"
                                    }`}
                                  >
                                    {safeStr(msg.senderName || msg.senderId || "Mittente")}
                                  </span>
                                  {isReported && (
                                    <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                      Segnalato
                                    </span>
                                  )}
                                  {msg.senderRole && (
                                    <span className="text-[9px] text-slate-400 px-1 rounded bg-slate-800">
                                      {msg.senderRole}
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-400 font-mono">
                                  {formatDate(msg.timestamp)}
                                </span>
                              </div>
                              <p className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                                {safeStr(msg.testo)}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-4 text-center text-slate-400 space-y-1">
                          <p className="text-xs font-semibold text-slate-300">
                            Nessun messaggio presente nel database per questa stanza
                          </p>
                          <p className="text-[11px] text-slate-500">
                            La chat potrebbe essere stata ripulita o non ancora attiva su RTDB Europe-West1.
                          </p>
                          {inspectingReport.ultimiMessaggi && (
                            <div className="mt-2.5 p-2 rounded-lg bg-[#141d2e] border border-slate-700/60 text-left">
                              <span className="text-[10px] text-amber-400 font-semibold block">
                                Ultimo messaggio allegato alla segnalazione:
                              </span>
                              <p className="text-slate-300 italic text-[11px] mt-0.5">
                                &ldquo;{safeStr(inspectingReport.ultimiMessaggi)}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-slate-400 font-medium block mb-1">Oggetto / Titolo:</span>
                    <div className="p-2.5 rounded-lg bg-[#141d2e] border border-slate-800 font-bold text-white">
                      {safeStr(
                        inspectingReport.titoloTarget ||
                          inspectingReport.motivo ||
                          (activeTabType === "suggerimenti" ? "Suggerimento Utente" : "Bug Report")
                      )}
                    </div>
                  </div>

                  {inspectingReport.dispositivo && (
                    <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Dispositivo utente:</span>
                      <span className="text-slate-200 font-mono">{safeStr(inspectingReport.dispositivo)}</span>
                    </div>
                  )}

                  {inspectingReport.versioneApp && (
                    <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Versione app:</span>
                      <span className="text-slate-200 font-mono">v{safeStr(inspectingReport.versioneApp)}</span>
                    </div>
                  )}
                </>
              )}

              {/* Segnalatore (per Eventi, Organizzatori, Bug, Suggerimenti) */}
              {!(activeTabType === "chats" || isChatReport(inspectingReport)) && (
                <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Inviata da:</span>
                  <div className="flex items-center space-x-1.5 text-slate-200 font-medium truncate max-w-[70%]">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span
                      className="truncate text-xs font-mono"
                      title={safeStr(
                        inspectingReport.emailSegnalante ||
                          inspectingReport.emailUtente ||
                          inspectingReport.nomeSegnalatore ||
                          inspectingReport.nomeSegnalante ||
                          inspectingReport.segnalatoDa ||
                          inspectingReport.idSegnalante ||
                          "Utente"
                      )}
                    >
                      {safeStr(
                        inspectingReport.emailSegnalante ||
                          inspectingReport.emailUtente ||
                          inspectingReport.nomeSegnalatore ||
                          inspectingReport.nomeSegnalante ||
                          inspectingReport.segnalatoDa ||
                          inspectingReport.idSegnalante ||
                          "Utente"
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Motivazione */}
              <div className="border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-medium block mb-1">Motivazione indicata:</span>
                <span className="px-2.5 py-1 rounded bg-[#1e293b] text-amber-300 font-semibold border border-amber-500/20 inline-block">
                  {safeStr(inspectingReport.motivo || "Nessuna motivazione espressa")}
                </span>
              </div>

              {/* Descrizione / Testo */}
              <div className="border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-medium block mb-1">Dettaglio descrittivo inviato:</span>
                <div className="p-3 rounded-lg bg-[#141d2e] border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {safeStr(
                    inspectingReport.descrizione ||
                      inspectingReport.dettaglio ||
                      inspectingReport.dettagli ||
                      "Nessun commento aggiuntivo inserito dall'utente."
                  )}
                </div>
              </div>

              {/* Note di Risoluzione (se presente) */}
              {inspectingReport.risoluzioneNote && (
                <div className="border-t border-slate-800 pt-2">
                  <span className="text-emerald-400 font-medium block mb-1">Note di Risoluzione:</span>
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs">
                    <p className="font-semibold">
                      Gestito da: {safeStr(inspectingReport.risoltoDa || "Amministratore")}
                    </p>
                    <p className="mt-1">{safeStr(inspectingReport.risoluzioneNote)}</p>
                    {inspectingReport.timestampRisoluzione && (
                      <span className="text-[10px] text-emerald-400/70 block mt-1">
                        Risolto il: {formatDate(inspectingReport.timestampRisoluzione)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Azioni modal */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#1e293b]">
              <button
                onClick={() => setInspectingReport(null)}
                className="px-4 py-1.5 rounded-lg bg-[#141d2e] border border-slate-700 text-slate-300 hover:text-white text-xs transition"
              >
                Chiudi
              </button>
              {inspectingReport.stato !== "risolto" ? (
                <button
                  onClick={() => {
                    const target = inspectingReport;
                    setInspectingReport(null);
                    setResolvingReport(target);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Risolvi Segnalazione
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const target = inspectingReport;
                    setInspectingReport(null);
                    await handleReopen(target);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Riapri Segnalazione
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
