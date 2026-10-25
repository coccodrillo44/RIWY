"use client";

import React, { useState, useMemo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { ReportItemDB } from "@/types";
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
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function ReportsCenter() {
  const { reports, events, organizers, resolveReport, reopenReport, setActiveTab } = useAdmin();

  // Tab: "events" (Segnalazioni Eventi) | "bugs" (Segnalazioni Bug & Sistema)
  const [activeTabType, setActiveTabType] = useState<"events" | "bugs">("events");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "da_risolvere" | "risolto">("all");
  const [selectedMotivo, setSelectedMotivo] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // Modals State
  const [resolvingReport, setResolvingReport] = useState<ReportItemDB | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [inspectingReport, setInspectingReport] = useState<ReportItemDB | null>(null);

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

  // Divisione delle segnalazioni per macro-categoria (Eventi vs Bug)
  const { eventReports, bugReports } = useMemo(() => {
    const evList: ReportItemDB[] = [];
    const bugList: ReportItemDB[] = [];

    reports.forEach((r) => {
      const cat = (r.categoria || "").toLowerCase();
      const tipo = (r.tipo || "").toLowerCase();
      if (cat === "bugs" || cat === "bug" || cat === "suggerimenti" || tipo === "bug") {
        bugList.push(r);
      } else {
        // "events", "evento", default
        evList.push(r);
      }
    });

    return { eventReports: evList, bugReports: bugList };
  }, [reports]);

  // Conteggi Da Risolvere
  const pendingEventsCount = useMemo(
    () => eventReports.filter((r) => r.stato !== "risolto").length,
    [eventReports]
  );
  const pendingBugsCount = useMemo(
    () => bugReports.filter((r) => r.stato !== "risolto").length,
    [bugReports]
  );

  // Lista attiva in base al tab selezionato
  const currentTabReports = activeTabType === "events" ? eventReports : bugReports;

  // Motivazioni preimpostate & dinamiche per il filtro
  const availableMotivations = useMemo(() => {
    const set = new Set<string>();

    if (activeTabType === "events") {
      set.add("Informazioni errate o fuorvianti");
      set.add("Evento annullato o non svolto");
      set.add("Spam / Contenuto inappropriato");
      set.add("Luogo o data errati");
      set.add("Altro");
    }

    currentTabReports.forEach((r) => {
      if (r.motivo && r.motivo.trim() && r.motivo !== "Nessun motivo") {
        set.add(r.motivo.trim());
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

      // 2. Filtro Motivazione (solo per Segnalazioni Eventi, dove sono preimpostate)
      if (activeTabType === "events" && selectedMotivo !== "all") {
        const motivoNorm = (rep.motivo || "").trim().toLowerCase();
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
          const reporter = (rep.emailSegnalante || rep.segnalatoreUid || rep.segnalatoDa || "").toLowerCase();
          const reason = (rep.motivo || "").toLowerCase();
          const desc = (rep.descrizione || rep.dettaglio || rep.dettagli || "").toLowerCase();

          const matches =
            title.includes(term) ||
            org.includes(term) ||
            reporter.includes(term) ||
            reason.includes(term) ||
            desc.includes(term) ||
            rep.id.toLowerCase().includes(term);

          if (!matches) return false;
        } else {
          const bugTitle = (rep.titoloTarget || rep.motivo || "").toLowerCase();
          const desc = (rep.descrizione || rep.dettaglio || rep.dettagli || "").toLowerCase();
          const device = (rep.dispositivo || "").toLowerCase();
          const reporter = (rep.emailUtente || rep.segnalatoreUid || rep.emailSegnalante || "").toLowerCase();

          const matches =
            bugTitle.includes(term) ||
            desc.includes(term) ||
            device.includes(term) ||
            reporter.includes(term) ||
            rep.id.toLowerCase().includes(term);

          if (!matches) return false;
        }
      }

      return true;
    });
  }, [currentTabReports, selectedStatus, selectedMotivo, selectedDate, searchTerm, activeTabType, events, organizers]);

  // Gestione Risoluzione
  const handleConfirmResolution = async () => {
    if (!resolvingReport) return;
    await resolveReport(
      resolvingReport.id,
      resolvingReport.categoria || (activeTabType === "events" ? "events" : "bugs"),
      resolutionNote || "Verificato e gestito secondo policy",
      resolvingReport.idOrganizzatore
    );
    setResolvingReport(null);
    setResolutionNote("");
  };

  // Gestione Riapertura
  const handleReopen = async (rep: ReportItemDB) => {
    await reopenReport(
      rep.id,
      rep.categoria || (activeTabType === "events" ? "events" : "bugs"),
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
    (activeTabType === "events" && selectedMotivo !== "all") ||
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
            Monitoraggio in tempo reale dei ticket utente: anomalie eventi, contenuti e bug applicativi.
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

      {/* Tabs: Divisione tra Segnalazioni su Eventi e Segnalazioni sui Bug */}
      <div className="flex border-b border-[#1e293b] gap-2">
        <button
          onClick={() => {
            setActiveTabType("events");
            setSelectedMotivo("all");
          }}
          className={`pb-3.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
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
            setActiveTabType("bugs");
            setSelectedMotivo("all");
          }}
          className={`pb-3.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
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
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-wrap gap-3 items-center justify-between">
        {/* Search Bar per Evento o Organizzatore (o Titolo/Dispositivo per Bug) */}
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTabType === "events"
                ? "Cerca per nome evento, organizzatore o segnalatore..."
                : "Cerca per titolo bug, dispositivo, descrizione o email..."
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

          {/* Menu a tendina Motivazione - Solo per Segnalazioni Eventi (preimpostate) */}
          {activeTabType === "events" && (
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

      {/* Tabella Segnalazioni (Visualizzazione su righe come per le altre schermate) */}
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
              ) : (
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Titolo Bug / Oggetto</th>
                  <th className="px-4 py-3">Dispositivo & Versione</th>
                  <th className="px-4 py-3">Descrizione Problema</th>
                  <th className="px-4 py-3">Segnalatore</th>
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
                const reporterEmail =
                  rep.emailSegnalante || rep.emailUtente || rep.segnalatoDa || rep.segnalatoreUid || "Utente";
                const descriptionText =
                  rep.descrizione || rep.dettaglio || rep.dettagli || "Nessun dettaglio aggiuntivo";

                return (
                  <tr key={rep.id} className="hover:bg-[#141d2e]/60 transition">
                    {/* 1. Data */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center text-slate-200 font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <span>{formatDate(rep.timestamp)}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        ID: {rep.id.slice(0, 10)}...
                      </span>
                    </td>

                    {/* 2 & 3. Specifico per Tab Eventi o Bug */}
                    {activeTabType === "events" ? (
                      <>
                        {/* Evento Segnalato */}
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="font-bold text-white text-sm line-clamp-1" title={evTitle}>
                            {evTitle}
                          </div>
                          {rep.idEvento && (
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                              ID Ev: {rep.idEvento}
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
                              {rep.idOrganizzatore}
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
                            title={rep.titoloTarget || rep.motivo}
                          >
                            {rep.titoloTarget || rep.motivo || "Segnalazione Bug"}
                          </div>
                          {rep.gravita && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-red-500/10 text-red-400 border border-red-500/20 inline-block mt-0.5">
                              Gravità: {rep.gravita}
                            </span>
                          )}
                        </td>

                        {/* Dispositivo & Versione App */}
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="flex items-center space-x-1.5 text-slate-300">
                            <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate" title={rep.dispositivo || "N/D"}>
                              {rep.dispositivo || "Dispositivo N/D"}
                            </span>
                          </div>
                          {rep.versioneApp && (
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5 pl-5">
                              App v{rep.versioneApp}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {/* 4. Motivazione & Dettagli */}
                    <td className="px-4 py-3 max-w-[280px]">
                      {activeTabType === "events" ? (
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1e293b] text-amber-300 border border-amber-500/20 inline-block mb-1">
                            {rep.motivo || "Altro"}
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

                    {/* 6. Tag Stato: "DA RISOLVERE" (e non NUOVO) oppure "RISOLTO" */}
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
                          title="Vedi dettagli completi"
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
                  : resolvingReport.titoloTarget || resolvingReport.motivo}
              </div>
              <p className="text-slate-400">
                <span className="text-amber-400 font-medium">Motivo: </span>
                {resolvingReport.motivo || "Nessun motivo"}
              </p>
              {resolvingReport.descrizione && (
                <p className="text-slate-300 italic pt-1">
                  &ldquo;{resolvingReport.descrizione}&rdquo;
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
                placeholder="Es. Evento modificato e verificato, oppure segnalazione infondata archiviata..."
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

      {/* Modal: Dettagli Ispettore Segnalazione */}
      {inspectingReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Dettagli Segnalazione</h3>
              </div>
              <button
                onClick={() => setInspectingReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
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

              {/* Data invio */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-medium">Inviata il:</span>
                <span className="text-white font-mono">{formatDate(inspectingReport.timestamp)}</span>
              </div>

              {/* ID Ticket */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-medium">ID Ticket:</span>
                <span className="text-slate-300 font-mono text-[11px]">{inspectingReport.id}</span>
              </div>

              {/* Evento o Oggetto */}
              {activeTabType === "events" ? (
                <>
                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-slate-400 font-medium block mb-1">Evento target:</span>
                    <div className="p-2 rounded-lg bg-[#141d2e] border border-slate-800 font-bold text-white">
                      {getEventTitle(inspectingReport)}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-slate-400 font-medium block mb-1">Organizzatore responsabile:</span>
                    <div className="p-2 rounded-lg bg-[#141d2e] border border-slate-800 text-slate-200">
                      {getEventOrganizer(inspectingReport)}
                      {inspectingReport.idOrganizzatore && (
                        <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                          UID Ente: {inspectingReport.idOrganizzatore}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-slate-400 font-medium block mb-1">Oggetto / Titolo:</span>
                    <div className="p-2 rounded-lg bg-[#141d2e] border border-slate-800 font-bold text-white">
                      {inspectingReport.titoloTarget || inspectingReport.motivo || "Bug Report"}
                    </div>
                  </div>

                  {inspectingReport.dispositivo && (
                    <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Dispositivo utente:</span>
                      <span className="text-slate-200 font-mono">{inspectingReport.dispositivo}</span>
                    </div>
                  )}

                  {inspectingReport.versioneApp && (
                    <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Versione app:</span>
                      <span className="text-slate-200 font-mono">v{inspectingReport.versioneApp}</span>
                    </div>
                  )}
                </>
              )}

              {/* Motivazione */}
              <div className="border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-medium block mb-1">Motivazione indicata:</span>
                <span className="px-2.5 py-1 rounded bg-[#1e293b] text-amber-300 font-semibold border border-amber-500/20 inline-block">
                  {inspectingReport.motivo || "Nessuna motivazione espressa"}
                </span>
              </div>

              {/* Descrizione / Testo */}
              <div className="border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-medium block mb-1">Dettaglio descrittivo del problema:</span>
                <div className="p-3 rounded-lg bg-[#141d2e] border border-slate-800 text-slate-200 whitespace-pre-wrap">
                  {inspectingReport.descrizione ||
                    inspectingReport.dettaglio ||
                    inspectingReport.dettagli ||
                    "Nessun commento aggiuntivo inserito dall'utente."}
                </div>
              </div>

              {/* Segnalatore */}
              <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Segnalato da:</span>
                <span className="text-slate-200 font-mono">
                  {inspectingReport.emailSegnalante ||
                    inspectingReport.emailUtente ||
                    inspectingReport.segnalatoDa ||
                    inspectingReport.segnalatoreUid ||
                    "Utente anonimo"}
                </span>
              </div>

              {/* Note di Risoluzione (se presente) */}
              {inspectingReport.risoluzioneNote && (
                <div className="border-t border-slate-800 pt-2">
                  <span className="text-emerald-400 font-medium block mb-1">Note di Risoluzione:</span>
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs">
                    <p className="font-semibold">Gestito da: {inspectingReport.risoltoDa || "Amministratore"}</p>
                    <p className="mt-1">{inspectingReport.risoluzioneNote}</p>
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
