"use client";

import React, { useState, useMemo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { EventoRespintoModerazione } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Check,
  RotateCcw,
  Trash2,
  ExternalLink,
  Eye,
  X,
  Building2,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Cpu,
} from "lucide-react";

export function AiModerationShield() {
  const {
    rejectedEvents,
    organizers,
    users,
    events,
    markRejectedEventAsExamined,
    deleteRejectedEvent,
  } = useAdmin();

  // Helper robusto per risolvere sempre il nome reale dell'organizzatore o dell'ente
  const getOrganizerName = (ev: EventoRespintoModerazione): string => {
    const rawOrg = ev.organizzatore?.trim();
    const isGenericWord = !rawOrg || rawOrg.toLowerCase() === "organizzatore" || rawOrg === "n/d";
    const isLikelyUid = Boolean(
      rawOrg && (rawOrg === ev.idOrganizzatore || (rawOrg.length >= 24 && !rawOrg.includes(" ")))
    );

    // 1. Cerca per idOrganizzatore nell'elenco enti (/enti)
    if (ev.idOrganizzatore) {
      const org = organizers.find(
        (o) => o.idEnte === ev.idOrganizzatore || o.idCreatore === ev.idOrganizzatore
      );
      if (org?.nomeEnte && org.nomeEnte.trim()) return org.nomeEnte.trim();

      // 2. Cerca negli utenti per idOrganizzatore
      const u = users.find((usr) => usr.firebaseUid === ev.idOrganizzatore);
      if (u) {
        if (u.idEnteGestito) {
          const gestito = organizers.find((o) => o.idEnte === u.idEnteGestito);
          if (gestito?.nomeEnte && gestito.nomeEnte.trim()) return gestito.nomeEnte.trim();
        }
        if (u.username && u.username.trim() && u.username.toLowerCase() !== "utente") {
          return u.username.trim();
        }
      }
    }

    // 3. Se rawOrg è un nome reale (e non la parola generica né un UID)
    if (!isGenericWord && !isLikelyUid && rawOrg) {
      return rawOrg;
    }

    // 4. Se rawOrg è un idEnte o UID, prova a cercarlo tra gli enti o utenti
    if (rawOrg) {
      const orgByRaw = organizers.find((o) => o.idEnte === rawOrg || o.idCreatore === rawOrg);
      if (orgByRaw?.nomeEnte && orgByRaw.nomeEnte.trim()) return orgByRaw.nomeEnte.trim();
      const uByRaw = users.find((usr) => usr.firebaseUid === rawOrg);
      if (uByRaw?.username && uByRaw.username.trim()) return uByRaw.username.trim();
    }

    // 5. Cerca tra gli eventi pubblicati dall'organizzatore
    if (ev.idOrganizzatore) {
      const matchedEv = events.find(
        (e) =>
          (e.idOrganizzatore === ev.idOrganizzatore || e.creatoDaUid === ev.idOrganizzatore) &&
          e.organizzatore &&
          e.organizzatore.toLowerCase() !== "organizzatore"
      );
      if (matchedEv?.organizzatore) return matchedEv.organizzatore.trim();
    }

    // 6. Fallback su username o email dell'utente
    if (ev.idOrganizzatore) {
      const u = users.find((usr) => usr.firebaseUid === ev.idOrganizzatore);
      if (u?.username && u.username.trim()) return u.username.trim();
      if (u?.email) return u.email.split("@")[0];
    }

    // 7. Ultimo fallback se rawOrg non è generico
    if (rawOrg && rawOrg.toLowerCase() !== "organizzatore") {
      return rawOrg;
    }

    return "Nome Ente non specificato";
  };

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"tutti" | "da_esaminare" | "esaminati">("tutti");
  const [fieldFilter, setFieldFilter] = useState<string>("tutti");
  const [selectedEventModal, setSelectedEventModal] = useState<EventoRespintoModerazione | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showTester, setShowTester] = useState(false);

  // Expanded card descriptions
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Stats calculation
  const pendingCount = useMemo(
    () => rejectedEvents.filter((e) => !e.letto).length,
    [rejectedEvents]
  );
  const reviewedCount = useMemo(
    () => rejectedEvents.filter((e) => e.letto).length,
    [rejectedEvents]
  );

  // Filtered rejected events
  const filteredEvents = useMemo(() => {
    return rejectedEvents.filter((ev) => {
      // Status filter
      if (statusFilter === "da_esaminare" && ev.letto) return false;
      if (statusFilter === "esaminati" && !ev.letto) return false;

      // Field filter
      if (fieldFilter !== "tutti") {
        const campo = (ev.campoViolato || "").toUpperCase();
        if (!campo.includes(fieldFilter.toUpperCase())) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.titolo?.toLowerCase().includes(q);
        const resolvedOrg = getOrganizerName(ev).toLowerCase();
        const matchOrg = resolvedOrg.includes(q) || ev.organizzatore?.toLowerCase().includes(q);
        const matchReason = ev.motivoRifiuto?.toLowerCase().includes(q);
        const matchDesc = ev.descrizione?.toLowerCase().includes(q);
        if (!matchTitle && !matchOrg && !matchReason && !matchDesc) return false;
      }

      return true;
    });
  }, [rejectedEvents, statusFilter, fieldFilter, searchQuery, organizers, users, events]);

  // Interactive tester states (preserved for manual testing)
  const [testerText, setTesterText] = useState(
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
        testerText.toLowerCase().includes("abusiv") ||
        testerText.toLowerCase().includes("segret") ||
        testerText.toLowerCase().includes("armi") ||
        testerText.toLowerCase().includes("droga");

      if (isToxic) {
        setScanResult({
          score: 92,
          approved: false,
          flags: [
            "Contenuto potenzialmente fuorviante o non autorizzato",
            "Menzione di attività non conformi alle linee guida della community",
          ],
          summary: "Blocco preventivo automatico raccomandato prima della pubblicazione sull'app Rook.",
        });
      } else {
        setScanResult({
          score: 12,
          approved: true,
          flags: [],
          summary:
            "Testo conforme al 100% con le linee guida Rook. Nessuna violazione rilevata.",
        });
      }
    }, 750);
  };

  const getBadgeForField = (field?: string) => {
    const f = (field || "NESSUNO").toUpperCase();
    if (f.includes("TITOLO")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          TITOLO
        </span>
      );
    }
    if (f.includes("DESCRIZIONE")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          DESCRIZIONE
        </span>
      );
    }
    if (f.includes("COPERTINA")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          COPERTINA
        </span>
      );
    }
    if (f.includes("PROGRAMMA")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
          PROGRAMMA / MENU
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">
        {f}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <ShieldAlert className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  AI Shield Moderation
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>GEMINI ATTIVO</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoraggio in tempo reale dei tentativi di pubblicazione respinti da Gemini 3.5 Flash Lite prima della scrittura su database.
              </p>
            </div>
          </div>
        </div>

        {/* Action Toggle for interactive tester */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTester(!showTester)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition border ${
              showTester
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-[#141d2e] hover:bg-[#1e293b] text-slate-300 border-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{showTester ? "Nascondi Sandbox Scansione" : "Apri Sandbox Scansione"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rejected */}
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Eventi Respinti Totali</span>
            <div className="text-2xl font-black text-white mt-1">{rejectedEvents.length}</div>
            <span className="text-[10px] text-slate-500">Bloccati preventivamente</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Da Esaminare / Non Letti */}
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-between relative overflow-hidden">
          {pendingCount > 0 && (
            <div className="absolute top-0 right-0 w-2 h-2 rounded-bl bg-red-500"></div>
          )}
          <div>
            <span className="text-xs text-slate-400 font-medium">Da Esaminare</span>
            <div className="text-2xl font-black text-red-400 mt-1 flex items-center space-x-2">
              <span>{pendingCount}</span>
              {pendingCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
                  NUOVI
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">In attesa di revisione admin</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Esaminati */}
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Revisionati</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{reviewedCount}</div>
            <span className="text-[10px] text-slate-500">Segnati come esaminati</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Motore AI */}
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Motore di Sicurezza</span>
            <div className="text-sm font-bold text-white mt-1">Gemini 3.5 Flash Lite</div>
            <span className="text-[10px] text-emerald-400 flex items-center space-x-1 mt-0.5">
              <span>Latenza media &lt; 1s</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Interactive Tester Sandbox (Collapsible) */}
      {showTester && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-amber-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Sandbox Test Scansione Testuale Preventiva</span>
            </h2>
            <button
              onClick={() => setShowTester(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Inserisci testo dell'evento o descrizione da testare:
              </label>
              <textarea
                rows={4}
                value={testerText}
                onChange={(e) => setTesterText(e.target.value)}
                className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
              />
              <button
                onClick={handleRunScan}
                disabled={isScanning}
                className="mt-2 w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analisi in corso...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Simula Moderazione AI</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#141d2e] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              {scanResult ? (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      scanResult.approved
                        ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                        : "bg-red-950/20 border-red-500/40 text-red-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {scanResult.approved ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      <div>
                        <h4 className="font-bold text-xs">
                          {scanResult.approved ? "APPROVATO" : "RESPINTO DA GEMINI"}
                        </h4>
                        <p className="text-[11px] opacity-90">{scanResult.summary}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black">{scanResult.score}%</span>
                      <span className="text-[9px] block opacity-70">Rischio</span>
                    </div>
                  </div>
                  {scanResult.flags.length > 0 && (
                    <div className="space-y-1">
                      {scanResult.flags.map((flag, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 flex items-center space-x-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 flex flex-col items-center justify-center h-full">
                  <Cpu className="w-8 h-8 text-slate-600 mb-2" />
                  <span>Premi "Simula Moderazione AI" per eseguire il test.</span>
                </div>
              )}
              <span className="text-[10px] text-slate-500 block pt-2 border-t border-slate-800">
                La funzione di produzione verifica contemporaneamente titolo, descrizione, copertina e programma tramite chiamata cloud.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per titolo, organizzatore o motivo del rifiuto..."
            className="w-full pl-9 pr-4 py-2 bg-[#141d2e] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex rounded-xl bg-[#141d2e] p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter("tutti")}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                statusFilter === "tutti"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Tutti ({rejectedEvents.length})
            </button>
            <button
              onClick={() => setStatusFilter("da_esaminare")}
              className={`px-3 py-1 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                statusFilter === "da_esaminare"
                  ? "bg-red-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Da Esaminare</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter("esaminati")}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                statusFilter === "esaminati"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Esaminati ({reviewedCount})
            </button>
          </div>

          {/* Field Filter */}
          <div className="flex items-center space-x-1.5 bg-[#141d2e] px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="tutti" className="bg-[#0f172a] text-white">Tutti i campi</option>
              <option value="TITOLO" className="bg-[#0f172a] text-white">Titolo</option>
              <option value="DESCRIZIONE" className="bg-[#0f172a] text-white">Descrizione</option>
              <option value="COPERTINA" className="bg-[#0f172a] text-white">Copertina</option>
              <option value="PROGRAMMA" className="bg-[#0f172a] text-white">Programma</option>
            </select>
          </div>
        </div>
      </div>

      {/* List of Rejected Events */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0f172a] border border-[#1e293b] text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            Nessun evento respinto trovato
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery || statusFilter !== "tutti" || fieldFilter !== "tutti"
              ? "Nessun risultato corrisponde ai filtri di ricerca impostati. Prova a reimpostare i filtri."
              : "Non sono stati registrati tentativi di pubblicazione respinti da Gemini AI. Tutti i contenuti inviati dagli organizzatori sono risultati conformi."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((ev) => {
            const isExpanded = !!expandedCards[ev.id];
            const isUnread = !ev.letto;

            return (
              <div
                key={ev.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isUnread
                    ? "bg-[#0f172a] border-red-500/40 shadow-lg shadow-red-500/5 ring-1 ring-red-500/20"
                    : "bg-[#0f172a]/70 border-[#1e293b] opacity-85 hover:opacity-100"
                }`}
              >
                {/* Header row: Badges, Date, and Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status badge */}
                    {isUnread ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                        <span>DA ESAMINARE</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>ESAMINATO</span>
                      </span>
                    )}

                    {/* Field badge */}
                    {getBadgeForField(ev.campoViolato)}
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(ev.timestamp)}</span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column: Event Title, Organizer, and Details */}
                  <div className="lg:col-span-8 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                        <span>{ev.titolo || "Senza titolo"}</span>
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-300 mt-1">
                        <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-bold text-amber-300/90 text-sm">
                          {getOrganizerName(ev)}
                        </span>
                      </div>
                    </div>

                    {/* Gemini AI Rejection Motivation Box */}
                    <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 space-y-1.5">
                      <div className="flex items-center space-x-2 text-red-300 text-xs font-bold">
                        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Motivo del Rifiuto (Gemini AI):</span>
                      </div>
                      <p className="text-xs text-red-200/90 leading-relaxed pl-6 italic">
                        "{ev.motivoRifiuto}"
                      </p>
                    </div>

                    {/* Description preview */}
                    {ev.descrizione && (
                      <div className="text-xs text-slate-300">
                        <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Descrizione inviata:</span>
                        </div>
                        <p className={`text-slate-300 text-xs ${!isExpanded ? "line-clamp-2" : ""}`}>
                          {ev.descrizione}
                        </p>
                        {ev.descrizione.length > 120 && (
                          <button
                            onClick={() => toggleExpand(ev.id)}
                            className="mt-1 text-[11px] text-amber-400 hover:underline flex items-center space-x-1"
                          >
                            <span>{isExpanded ? "Mostra meno" : "Mostra tutto"}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Media Preview & Actions */}
                  <div className="lg:col-span-4 flex flex-col justify-between space-y-3 pt-2 lg:pt-0 lg:border-l lg:border-slate-800 lg:pl-4">
                    {/* Media Attachments Preview */}
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block mb-2">
                        Allegati multimediali:
                      </span>
                      {ev.urlCopertina || ev.urlProgramma ? (
                        <div className="grid grid-cols-2 gap-2">
                          {ev.urlCopertina && (
                            <div
                              onClick={() => setPreviewImage(ev.urlCopertina!)}
                              className="group relative aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:border-amber-400 transition"
                            >
                              <img
                                src={ev.urlCopertina}
                                alt="Copertina"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-[10px] font-bold">
                                Copertina
                              </div>
                            </div>
                          )}
                          {ev.urlProgramma && (
                            <div
                              onClick={() => setPreviewImage(ev.urlProgramma!)}
                              className="group relative aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:border-amber-400 transition"
                            >
                              <img
                                src={ev.urlProgramma}
                                alt="Programma"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-[10px] font-bold">
                                Programma
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic block">
                          Nessuna immagine allegata
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => markRejectedEventAsExamined(ev.id)}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                            ev.letto
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                          }`}
                        >
                          {ev.letto ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Segna da riesaminare</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Segna come esaminato</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedEventModal(ev)}
                          title="Visualizza dettagli completi"
                          className="p-1.5 rounded-xl bg-[#141d2e] hover:bg-[#1e293b] text-slate-300 border border-slate-700 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Sei sicuro di voler eliminare la segnalazione per "${ev.titolo}"?`)) {
                              deleteRejectedEvent(ev.id);
                            }
                          }}
                          title="Elimina record"
                          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Detail Modal */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-bold text-white">Dettagli Moderazione AI</h3>
              </div>
              <button
                onClick={() => setSelectedEventModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400">Titolo Evento:</span>
                <p className="text-sm font-bold text-white">{selectedEventModal.titolo}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400">Organizzatore:</span>
                <p className="text-sm font-bold text-amber-300">
                  {selectedEventModal ? getOrganizerName(selectedEventModal) : ""}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400">Campo Violato:</span>
                <div className="mt-1">{getBadgeForField(selectedEventModal.campoViolato)}</div>
              </div>

              {/* Gemini Motive */}
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 space-y-1">
                <span className="text-xs text-red-300 font-bold block">
                  Motivo del Rifiuto Generato da Gemini:
                </span>
                <p className="text-xs text-red-200 leading-relaxed italic">
                  "{selectedEventModal.motivoRifiuto}"
                </p>
              </div>

              {/* Full Description */}
              {selectedEventModal.descrizione && (
                <div>
                  <span className="text-xs text-slate-400 font-semibold block mb-1">
                    Descrizione Completa Inviata:
                  </span>
                  <div className="p-3 rounded-lg bg-[#141d2e] border border-slate-800 text-xs text-slate-200 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {selectedEventModal.descrizione}
                  </div>
                </div>
              )}

              {/* Images */}
              {(selectedEventModal.urlCopertina || selectedEventModal.urlProgramma) && (
                <div>
                  <span className="text-xs text-slate-400 font-semibold block mb-2">
                    Immagini Allegate:
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedEventModal.urlCopertina && (
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Copertina</span>
                        <img
                          src={selectedEventModal.urlCopertina}
                          alt="Copertina"
                          onClick={() => setPreviewImage(selectedEventModal.urlCopertina!)}
                          className="w-full h-36 object-cover rounded-lg border border-slate-700 cursor-pointer hover:border-amber-400 transition"
                        />
                      </div>
                    )}
                    {selectedEventModal.urlProgramma && (
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Programma / Menu</span>
                        <img
                          src={selectedEventModal.urlProgramma}
                          alt="Programma"
                          onClick={() => setPreviewImage(selectedEventModal.urlProgramma!)}
                          className="w-full h-36 object-cover rounded-lg border border-slate-700 cursor-pointer hover:border-amber-400 transition"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500 pt-2 border-t border-slate-800 flex justify-between items-center">
                <span>Registrato il: {formatDate(selectedEventModal.timestamp)}</span>
                <span className="font-mono text-[10px]">ID: {selectedEventModal.id}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  markRejectedEventAsExamined(selectedEventModal.id);
                  setSelectedEventModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {selectedEventModal.letto ? "Segna come Da Riesaminare" : "Segna come Esaminato"}
                </span>
              </button>
              <button
                onClick={() => setSelectedEventModal(null)}
                className="px-4 py-2 rounded-xl bg-[#141d2e] hover:bg-[#1e293b] text-slate-300 text-xs font-semibold transition"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Zoom Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Anteprima"
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-slate-700 shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
