"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { EventoDB, OrganizerEventDraft, CreateOwnEnteData } from "@/types";
import {
  Briefcase,
  Plus,
  Trash2,
  Edit,
  EyeOff,
  CheckCircle,
  MapPin,
  Search,
  Upload,
  Building2,
  Lock,
  Globe,
  Phone,
  FileText,
  Loader2,
  ShieldCheck,
  X,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Clock,
  Check,
  Mail,
} from "lucide-react";
import { formatEventDate, isEventoPassato } from "@/lib/utils";

const CATEGORIES = [
  "Cibo & Sagre",
  "Musica & Feste",
  "Arte & Cultura",
  "Sport & Movimento",
  "Famiglia & Bambini",
  "Fiere & Mercati",
  "Nuove Aperture",
];

const PROVINCES = ["FI", "PI", "LU", "SI", "AR", "LI", "MS", "GR", "PO", "PT"] as const;

const PROVINCE_MAP: Record<string, string> = {
  firenze: "FI",
  pisa: "PI",
  lucca: "LU",
  siena: "SI",
  arezzo: "AR",
  livorno: "LI",
  pistoia: "PT",
  grosseto: "GR",
  prato: "PO",
  massa: "MS",
  carrara: "MS",
  "massa-carrara": "MS",
};

const inputCls =
  "w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500";

// Tabella completa dei prefissi europei allineata con l'app Rook (ProfilePage.kt)
export interface PrefissoEuropeo {
  codiceIso: string;
  nomePaese: string;
  prefisso: string;
  bandiera: string;
  minCifre?: number;
  maxCifre?: number;
  cifreEsatte?: number;
}

export const PREFISSI_EUROPEI: PrefissoEuropeo[] = [
  { codiceIso: "IT", nomePaese: "Italia", prefisso: "+39", bandiera: "🇮🇹", cifreEsatte: 10 },
  { codiceIso: "SM", nomePaese: "San Marino", prefisso: "+378", bandiera: "🇸🇲", minCifre: 6, maxCifre: 10 },
  { codiceIso: "VA", nomePaese: "Città del Vaticano", prefisso: "+379", bandiera: "🇻🇦", cifreEsatte: 10 },
  { codiceIso: "FR", nomePaese: "Francia", prefisso: "+33", bandiera: "🇫🇷", cifreEsatte: 9 },
  { codiceIso: "DE", nomePaese: "Germania", prefisso: "+49", bandiera: "🇩🇪", minCifre: 10, maxCifre: 11 },
  { codiceIso: "ES", nomePaese: "Spagna", prefisso: "+34", bandiera: "🇪🇸", cifreEsatte: 9 },
  { codiceIso: "GB", nomePaese: "Regno Unito", prefisso: "+44", bandiera: "🇬🇧", cifreEsatte: 10 },
  { codiceIso: "CH", nomePaese: "Svizzera", prefisso: "+41", bandiera: "🇨🇭", cifreEsatte: 9 },
  { codiceIso: "AT", nomePaese: "Austria", prefisso: "+43", bandiera: "🇦🇹", minCifre: 10, maxCifre: 13 },
  { codiceIso: "BE", nomePaese: "Belgio", prefisso: "+32", bandiera: "🇧🇪", cifreEsatte: 9 },
  { codiceIso: "NL", nomePaese: "Paesi Bassi", prefisso: "+31", bandiera: "🇳🇱", cifreEsatte: 9 },
  { codiceIso: "PT", nomePaese: "Portogallo", prefisso: "+351", bandiera: "🇵🇹", cifreEsatte: 9 },
  { codiceIso: "IE", nomePaese: "Irlanda", prefisso: "+353", bandiera: "🇮🇪", cifreEsatte: 9 },
  { codiceIso: "GR", nomePaese: "Grecia", prefisso: "+30", bandiera: "🇬🇷", cifreEsatte: 10 },
  { codiceIso: "PL", nomePaese: "Polonia", prefisso: "+48", bandiera: "🇵🇱", cifreEsatte: 9 },
  { codiceIso: "RO", nomePaese: "Romania", prefisso: "+40", bandiera: "🇷🇴", minCifre: 9, maxCifre: 10 },
  { codiceIso: "SE", nomePaese: "Svezia", prefisso: "+46", bandiera: "🇸🇪", minCifre: 7, maxCifre: 10 },
  { codiceIso: "DK", nomePaese: "Danimarca", prefisso: "+45", bandiera: "🇩🇰", cifreEsatte: 8 },
  { codiceIso: "NO", nomePaese: "Norvegia", prefisso: "+47", bandiera: "🇳🇴", cifreEsatte: 8 },
  { codiceIso: "FI", nomePaese: "Finlandia", prefisso: "+358", bandiera: "🇫🇮", minCifre: 9, maxCifre: 10 },
  { codiceIso: "HR", nomePaese: "Croazia", prefisso: "+385", bandiera: "🇭🇷", minCifre: 8, maxCifre: 9 },
  { codiceIso: "CZ", nomePaese: "Repubblica Ceca", prefisso: "+420", bandiera: "🇨🇿", cifreEsatte: 9 },
  { codiceIso: "HU", nomePaese: "Ungheria", prefisso: "+36", bandiera: "🇭🇺", cifreEsatte: 9 },
  { codiceIso: "SK", nomePaese: "Slovacchia", prefisso: "+421", bandiera: "🇸🇰", cifreEsatte: 9 },
  { codiceIso: "BG", nomePaese: "Bulgaria", prefisso: "+359", bandiera: "🇧🇬", minCifre: 8, maxCifre: 9 },
  { codiceIso: "SI", nomePaese: "Slovenia", prefisso: "+386", bandiera: "🇸🇮", cifreEsatte: 8 },
  { codiceIso: "LU", nomePaese: "Lussemburgo", prefisso: "+352", bandiera: "🇱🇺", cifreEsatte: 9 },
  { codiceIso: "LT", nomePaese: "Lituania", prefisso: "+370", bandiera: "🇱🇹", cifreEsatte: 8 },
  { codiceIso: "LV", nomePaese: "Lettonia", prefisso: "+371", bandiera: "🇱🇻", cifreEsatte: 8 },
  { codiceIso: "EE", nomePaese: "Estonia", prefisso: "+372", bandiera: "🇪🇪", minCifre: 7, maxCifre: 8 },
  { codiceIso: "CY", nomePaese: "Cipro", prefisso: "+357", bandiera: "🇨🇾", cifreEsatte: 8 },
  { codiceIso: "MT", nomePaese: "Malta", prefisso: "+356", bandiera: "🇲🇹", cifreEsatte: 8 },
  { codiceIso: "IS", nomePaese: "Islanda", prefisso: "+354", bandiera: "🇮🇸", cifreEsatte: 7 },
  { codiceIso: "AL", nomePaese: "Albania", prefisso: "+355", bandiera: "🇦🇱", cifreEsatte: 9 },
  { codiceIso: "RS", nomePaese: "Serbia", prefisso: "+381", bandiera: "🇷🇸", minCifre: 8, maxCifre: 9 },
  { codiceIso: "BA", nomePaese: "Bosnia ed Erzegovina", prefisso: "+387", bandiera: "🇧🇦", cifreEsatte: 8 },
  { codiceIso: "ME", nomePaese: "Montenegro", prefisso: "+382", bandiera: "🇲🇪", cifreEsatte: 8 },
  { codiceIso: "MK", nomePaese: "Macedonia del Nord", prefisso: "+389", bandiera: "🇲🇰", cifreEsatte: 8 },
  { codiceIso: "MC", nomePaese: "Monaco", prefisso: "+377", bandiera: "🇲🇨", minCifre: 8, maxCifre: 9 },
  { codiceIso: "LI", nomePaese: "Liechtenstein", prefisso: "+423", bandiera: "🇱🇮", cifreEsatte: 7 },
  { codiceIso: "AD", nomePaese: "Andorra", prefisso: "+376", bandiera: "🇦🇩", cifreEsatte: 6 },
];

function isLunghezzaValida(prefix: PrefissoEuropeo, digitsCount: number): boolean {
  if (prefix.cifreEsatte != null) {
    return digitsCount === prefix.cifreEsatte;
  }
  const min = prefix.minCifre ?? 8;
  const max = prefix.maxCifre ?? 12;
  return digitsCount >= min && digitsCount <= max;
}

function getPhoneErrorMessage(prefix: PrefissoEuropeo, digitsCount: number): string {
  if (prefix.cifreEsatte != null) {
    return `Il numero per ${prefix.nomePaese} (${prefix.prefisso}) deve avere esattamente ${prefix.cifreEsatte} cifre (attualmente: ${digitsCount}).`;
  }
  return `Il numero per ${prefix.nomePaese} (${prefix.prefisso}) deve avere tra ${prefix.minCifre ?? 8} e ${prefix.maxCifre ?? 12} cifre (attualmente: ${digitsCount}).`;
}

function parsePhoneNumber(raw: string): { prefix: PrefissoEuropeo; local: string } {
  const cleaned = (raw || "").trim();
  const sorted = [...PREFISSI_EUROPEI].sort((a, b) => b.prefisso.length - a.prefisso.length);
  for (const p of sorted) {
    if (cleaned.startsWith(p.prefisso)) {
      const rest = cleaned.slice(p.prefisso.length).replace(/\D/g, "");
      return { prefix: p, local: rest };
    }
  }
  return { prefix: PREFISSI_EUROPEI[0], local: cleaned.replace(/\D/g, "") };
}

function toDateOnlyInput(ms?: number | string | null): string {
  if (!ms) return "";
  const d = typeof ms === "number" ? new Date(ms) : new Date(ms);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getTodayDateString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Calcola tutti i giorni distinti coperti dagli intervalli dell'evento
function calcolaGiorniCoperti(dateIntervalli: { inizio: string; fine: string }[]): string[] {
  const daysSet = new Set<string>();

  dateIntervalli.forEach(({ inizio, fine }) => {
    if (!inizio) return;
    const startStr = inizio.includes("T") ? inizio.split("T")[0] : inizio;
    const rawEnd = fine && fine.includes("T") ? fine.split("T")[0] : fine || startStr;
    const endStr = rawEnd >= startStr ? rawEnd : startStr;

    const startParts = startStr.split("-").map((p) => parseInt(p, 10));
    const endParts = endStr.split("-").map((p) => parseInt(p, 10));
    if (startParts.length !== 3 || endParts.length !== 3) return;

    const current = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

    let count = 0;
    while (current.getTime() <= end.getTime() && count < 366) {
      const pad = (n: number) => String(n).padStart(2, "0");
      const dStr = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
      daysSet.add(dStr);
      current.setDate(current.getDate() + 1);
      count++;
    }
  });

  return Array.from(daysSet).sort();
}

function formatDataItaliana(dateStr: string): string {
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const giornoSettimana = d.toLocaleDateString("it-IT", { weekday: "long" });
    const capitalized = giornoSettimana.charAt(0).toUpperCase() + giornoSettimana.slice(1);
    const giornoMese = d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    return `${capitalized} ${giornoMese}`;
  } catch {
    return dateStr;
  }
}

function emptyDraft(prov = "FI", comune = ""): OrganizerEventDraft {
  const today = getTodayDateString();
  return {
    titolo: "",
    categoria: CATEGORIES[0],
    via: "",
    comune,
    provincia: prov,
    latitudine: 0,
    longitudine: 0,
    descrizione: "",
    urlWeb: "",
    opzioniVeg: false,
    accessibileDisabili: false,
    date: [{ inizio: today, fine: today }],
    orariGiornalieri: {},
    immagineCopertina: "",
    immagineMenu: "",
  };
}

function draftFromEvent(ev: EventoDB): OrganizerEventDraft {
  const parts = (ev.luogo || "").split(",").map((p) => p.trim());
  const rawDates: { dataInizio: number; dataFine: number }[] = Array.isArray(ev.date)
    ? ev.date
    : ev.date
    ? (Object.values(ev.date as unknown as Record<string, { dataInizio: number; dataFine: number }>))
    : [];

  const today = getTodayDateString();
  const date = rawDates.map((d) => ({
    inizio: toDateOnlyInput(d.dataInizio),
    fine: toDateOnlyInput(d.dataFine),
  }));

  return {
    titolo: ev.titolo || "",
    categoria: ev.categoria || CATEGORIES[0],
    via: parts[0] || "",
    comune: parts[1] || "",
    provincia: (parts[2] || ev.provincia || "FI").toUpperCase(),
    latitudine: Number(ev.latitudine || 0),
    longitudine: Number(ev.longitudine || 0),
    descrizione: ev.descrizione || "",
    urlWeb: ev.urlWeb || "",
    opzioniVeg: !!ev.opzioniVeg,
    accessibileDisabili: !!ev.accessibileDisabili,
    date: date.length
      ? date
      : [
          {
            inizio: typeof ev.data === "number" ? toDateOnlyInput(ev.data) : today,
            fine: typeof ev.data === "number" ? toDateOnlyInput(ev.data) : today,
          },
        ],
    orariGiornalieri: ev.orariGiornalieri ? { ...ev.orariGiornalieri } : {},
    immagineCopertina: ev.immagineCopertina || "",
    immagineMenu: ev.immagineMenu || "",
  };
}

interface AddressSuggestion {
  displayName: string;
  via: string;
  comune: string;
  provincia: string;
  lat: number;
  lon: number;
}

// Sotto-componente unificato per i 5 gruppi di campi del profilo Ente
interface EnteProfileFieldsProps {
  enteForm: CreateOwnEnteData;
  setEnteForm: React.Dispatch<React.SetStateAction<CreateOwnEnteData>>;
  selectedPhonePrefix: PrefissoEuropeo;
  setSelectedPhonePrefix: (p: PrefissoEuropeo) => void;
  phoneLocalNumber: string;
  setPhoneLocalNumber: (s: string) => void;
  isPhoneValid: boolean;
  isDuplicateEnteName: boolean;
  enteAddressSearch: string;
  handleEnteAddressInputChange: (val: string) => void;
  enteAddressSuggestions: AddressSuggestion[];
  isSearchingEnteAddress: boolean;
  showEnteSuggestionsDropdown: boolean;
  setShowEnteSuggestionsDropdown: (show: boolean) => void;
  handleSelectEnteSuggestion: (sug: AddressSuggestion) => void;
  handleResetEnteAddress: () => void;
}

function EnteProfileFields({
  enteForm,
  setEnteForm,
  selectedPhonePrefix,
  setSelectedPhonePrefix,
  phoneLocalNumber,
  setPhoneLocalNumber,
  isPhoneValid,
  isDuplicateEnteName,
  enteAddressSearch,
  handleEnteAddressInputChange,
  enteAddressSuggestions,
  isSearchingEnteAddress,
  showEnteSuggestionsDropdown,
  setShowEnteSuggestionsDropdown,
  handleSelectEnteSuggestion,
  handleResetEnteAddress,
}: EnteProfileFieldsProps) {
  const isEnteAddressLocked = Boolean(enteForm.sedeOrg && enteForm.sedeOrg.trim());

  return (
    <div className="space-y-4">
      {/* 1. Dati Identificativi */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
          <Building2 className="w-3.5 h-3.5 mr-1" /> 1. Dati Identificativi
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Nome Ente / Organizzatore *</label>
            <input
              className={`w-full bg-[#141d2e] border rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                isDuplicateEnteName
                  ? "border-red-500 focus:border-red-400"
                  : "border-slate-700 focus:border-amber-500"
              }`}
              required
              value={enteForm.nomeEnte}
              onChange={(e) => setEnteForm({ ...enteForm, nomeEnte: e.target.value })}
              placeholder="es. Pro Loco Firenze, Associazione Culturale..."
            />
            {isDuplicateEnteName ? (
              <div className="mt-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Un ente con questo nome esiste già nel sistema. Scegli un nome diverso o distintivo.</span>
              </div>
            ) : enteForm.nomeEnte.trim() ? (
              <span className="text-[11px] text-emerald-400 font-medium flex items-center mt-1">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Nome disponibile
              </span>
            ) : null}
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Referente (Nome e Cognome) *</label>
            <input
              className={inputCls}
              required
              value={enteForm.referenteOrg}
              onChange={(e) => setEnteForm({ ...enteForm, referenteOrg: e.target.value })}
              placeholder="es. Mario Rossi"
            />
          </div>
        </div>
      </div>

      {/* 2. Sede Legale & Territorio con Autocompletamento e Modifica Atomica (Tutto o Nulla) */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
          <MapPin className="w-3.5 h-3.5 mr-1" /> 2. Sede Legale & Territorio Toscano (Modifica Atomica)
        </span>

        {isEnteAddressLocked ? (
          // Blocco Indirizzo Sede Bloccato (Read-Only) con Modifica Atomica ("o cambio tutto o nulla")
          <div className="p-3.5 rounded-xl bg-[#141d2e] border border-amber-500/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Indirizzo Sede Verificato e Confermato</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 flex items-center">
                  <Lock className="w-3 h-3 mr-1 text-amber-400" /> Bloccato
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetEnteAddress}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center space-x-1 border border-amber-500/30 transition shadow-sm"
                title="Reimposta l'indirizzo per cercarne uno nuovo completo (modifica atomica)"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                <span>Cambia indirizzo (reimposta)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1 text-[11px] flex items-center">
                  <Lock className="w-3 h-3 mr-1 text-slate-500" /> Indirizzo Sede (Via e Civico) - Bloccato
                </label>
                <input
                  readOnly
                  disabled
                  value={enteForm.sedeOrg}
                  className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 cursor-not-allowed select-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-[11px] flex items-center">
                  <Lock className="w-3 h-3 mr-1 text-slate-500" /> Comune - Bloccato
                </label>
                <input
                  readOnly
                  disabled
                  value={enteForm.comuneEnte}
                  className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 cursor-not-allowed select-none"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-slate-400 block mb-1 text-[11px] flex items-center">
                  <Lock className="w-3 h-3 mr-1 text-slate-500" /> Provincia (Toscana) - Bloccata
                </label>
                <input
                  readOnly
                  disabled
                  value={enteForm.provinciaEnte}
                  className="w-full sm:w-1/3 bg-[#0a0f1d] border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 cursor-not-allowed select-none font-semibold"
                />
              </div>
            </div>

            <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-slate-300 flex items-start space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Modifica atomica attiva:</strong> Per garantire l&apos;integrità e la coerenza geografica con l&apos;app Rook, non è consentito modificare singolarmente solo la via, solo il comune o solo la provincia. Clicca su <em>&quot;Cambia indirizzo&quot;</em> per selezionare un&apos;altra sede completa.
              </span>
            </div>
          </div>
        ) : (
          // Ricerca con autocompletamento quando nessun indirizzo è ancora confermato
          <div className="space-y-2">
            <label className="text-slate-200 font-semibold block mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center">
                <Search className="w-3.5 h-3.5 mr-1 text-amber-400" /> Cerca Indirizzo Sede (Autocompletamento obbligatorio) *
              </span>
              {isSearchingEnteAddress && (
                <span className="text-[11px] text-amber-400 flex items-center font-normal">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" /> Ricerca sede in corso...
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={enteAddressSearch}
                onChange={(e) => handleEnteAddressInputChange(e.target.value)}
                onFocus={() => enteAddressSuggestions.length > 0 && setShowEnteSuggestionsDropdown(true)}
                placeholder="Digita via, piazza o comune della sede (es. Via dei Calzaiuoli, Firenze)..."
                className="w-full bg-[#141d2e] border border-amber-500/50 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 pl-8"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />

              {/* Dropdown dei suggerimenti per l'indirizzo della sede */}
              {showEnteSuggestionsDropdown && enteAddressSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-20 max-h-52 overflow-y-auto divide-y divide-slate-800">
                  {enteAddressSuggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectEnteSuggestion(sug)}
                      className="p-2.5 hover:bg-amber-500/10 cursor-pointer transition text-left flex items-start space-x-2"
                    >
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-white text-xs">{sug.via || sug.displayName}</div>
                        <div className="text-[11px] text-slate-400">
                          {sug.comune} ({sug.provincia})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Cerca e seleziona la sede legale dai risultati per impostare via, comune e provincia (modifica atomica).
            </p>
          </div>
        )}
      </div>

      {/* 3. Recapiti Ufficiali con controllo cifre prefisso europeo */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
          <Phone className="w-3.5 h-3.5 mr-1" /> 3. Recapiti Ufficiali di Contatto
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Email Ufficiale Ente *</label>
            <input
              type="email"
              className={inputCls}
              required
              value={enteForm.emailEnte}
              onChange={(e) => setEnteForm({ ...enteForm, emailEnte: e.target.value })}
              placeholder="es. info@ente.it"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block mb-1 flex items-center justify-between text-xs">
              <span>Telefono / Cellulare *</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {selectedPhonePrefix.bandiera} {selectedPhonePrefix.prefisso} (
                {selectedPhonePrefix.cifreEsatte
                  ? `${selectedPhonePrefix.cifreEsatte} cifre`
                  : `${selectedPhonePrefix.minCifre}-${selectedPhonePrefix.maxCifre} cifre`}
                )
              </span>
            </label>
            <div className="flex gap-2">
              {/* Dropdown Prefissi Nazionali Europei */}
              <div className="w-40 shrink-0">
                <select
                  value={selectedPhonePrefix.codiceIso}
                  onChange={(e) => {
                    const found = PREFISSI_EUROPEI.find((p) => p.codiceIso === e.target.value);
                    if (found) setSelectedPhonePrefix(found);
                  }}
                  className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {PREFISSI_EUROPEI.map((p) => (
                    <option key={p.codiceIso} value={p.codiceIso}>
                      {p.bandiera} {p.prefisso} {p.nomePaese} ({p.codiceIso})
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Numero Locale (solo cifre, max consentito in base al prefisso) */}
              <div className="flex-1">
                <input
                  type="tel"
                  inputMode="numeric"
                  className={`w-full bg-[#141d2e] border rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                    phoneLocalNumber.length > 0 && !isPhoneValid
                      ? "border-amber-500 focus:border-amber-400"
                      : isPhoneValid
                      ? "border-emerald-500/80 focus:border-emerald-400"
                      : "border-slate-700 focus:border-amber-500"
                  }`}
                  required
                  value={phoneLocalNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    const max = selectedPhonePrefix.cifreEsatte ?? selectedPhonePrefix.maxCifre ?? 12;
                    if (digits.length <= max) {
                      setPhoneLocalNumber(digits);
                    }
                  }}
                  placeholder={
                    selectedPhonePrefix.cifreEsatte
                      ? `es. 3331234567 (${selectedPhonePrefix.cifreEsatte} cifre)`
                      : `es. 3331234567 (${selectedPhonePrefix.minCifre}-${selectedPhonePrefix.maxCifre} cifre)`
                  }
                />
              </div>
            </div>

            {/* Feedback dinamico validazione telefono */}
            <div className="pt-0.5">
              {phoneLocalNumber.length > 0 && !isPhoneValid ? (
                <span className="text-[11px] text-amber-400 font-medium flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />
                  {getPhoneErrorMessage(selectedPhonePrefix, phoneLocalNumber.length)}
                </span>
              ) : isPhoneValid ? (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1 shrink-0" />
                  Numero valido per {selectedPhonePrefix.nomePaese} ({phoneLocalNumber.length} cifre)
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Inserisci le cifre locali senza prefisso (
                  {selectedPhonePrefix.cifreEsatte
                    ? `${selectedPhonePrefix.cifreEsatte} cifre esatte`
                    : `da ${selectedPhonePrefix.minCifre} a ${selectedPhonePrefix.maxCifre} cifre`}
                  )
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Canali Social & Web */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
          <Globe className="w-3.5 h-3.5 mr-1" /> 4. Presenza Online & Canali Social (Opzionali)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Sito Web</label>
            <input
              className={inputCls}
              value={enteForm.sitoWeb || ""}
              onChange={(e) => setEnteForm({ ...enteForm, sitoWeb: e.target.value })}
              placeholder="https://www.tuosito.it"
            />
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Instagram</label>
            <input
              className={inputCls}
              value={enteForm.instagram || ""}
              onChange={(e) => setEnteForm({ ...enteForm, instagram: e.target.value })}
              placeholder="@nomeaccount oppure link"
            />
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Facebook</label>
            <input
              className={inputCls}
              value={enteForm.facebook || ""}
              onChange={(e) => setEnteForm({ ...enteForm, facebook: e.target.value })}
              placeholder="facebook.com/pagina"
            />
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">TikTok</label>
            <input
              className={inputCls}
              value={enteForm.tiktok || ""}
              onChange={(e) => setEnteForm({ ...enteForm, tiktok: e.target.value })}
              placeholder="@account"
            />
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">LinkedIn</label>
            <input
              className={inputCls}
              value={enteForm.linkedin || ""}
              onChange={(e) => setEnteForm({ ...enteForm, linkedin: e.target.value })}
              placeholder="linkedin.com/company/..."
            />
          </div>
        </div>
      </div>

      {/* 5. Descrizione dell'Attività */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
          <FileText className="w-3.5 h-3.5 mr-1" /> 5. Chi Siamo & Attività
        </span>
        <div>
          <label className="text-slate-300 font-semibold block mb-1">Descrizione dell&apos;Ente e Missione *</label>
          <textarea
            rows={3}
            className={inputCls}
            required
            value={enteForm.descEnte}
            onChange={(e) => setEnteForm({ ...enteForm, descEnte: e.target.value })}
            placeholder="Descrivi brevemente di cosa si occupa il tuo ente, quali eventi organizza e la sua missione..."
          />
        </div>
      </div>
    </div>
  );
}

export function OrganizerStudio() {
  const {
    currentUser,
    organizers,
    events,
    saveOrganizerEvent,
    createOwnEnte,
    reinviaEmailVerificaEnte,
    toggleOscurato,
    deleteEvent,
  } = useAdmin();

  const myUid = currentUser?.uid || "";
  // L'amministratore opera esclusivamente per il proprio ente (nessuna impersonificazione di terzi)
  const myEnte = organizers.find((o) => o.idEnte === myUid);

  // Form per creare o modificare il proprio ente
  const [showEnteModal, setShowEnteModal] = useState(false);
  const [enteForm, setEnteForm] = useState<CreateOwnEnteData>({
    nomeEnte: "",
    referenteOrg: "",
    sedeOrg: "",
    comuneEnte: "Firenze",
    provinciaEnte: "FI",
    emailEnte: currentUser?.email || "",
    telefonoEnte: "+39 ",
    descEnte: "",
    sitoWeb: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    linkedin: "",
  });
  const [savingEnte, setSavingEnte] = useState(false);

  // Prefisso e numero locale per validazione cifre
  const [selectedPhonePrefix, setSelectedPhonePrefix] = useState<PrefissoEuropeo>(PREFISSI_EUROPEI[0]);
  const [phoneLocalNumber, setPhoneLocalNumber] = useState("");

  const isPhoneValid = useMemo(() => {
    return isLunghezzaValida(selectedPhonePrefix, phoneLocalNumber.length);
  }, [selectedPhonePrefix, phoneLocalNumber]);

  // Controllo duplicato nome ente
  const isDuplicateEnteName = useMemo(() => {
    const candidate = enteForm.nomeEnte.trim().toLowerCase();
    if (!candidate) return false;
    return organizers.some(
      (o) => o.idEnte !== myUid && o.nomeEnte?.trim().toLowerCase() === candidate
    );
  }, [organizers, myUid, enteForm.nomeEnte]);

  // Autocompletamento Indirizzo Sede Ente
  const [enteAddressSearch, setEnteAddressSearch] = useState("");
  const [enteAddressSuggestions, setEnteAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingEnteAddress, setIsSearchingEnteAddress] = useState(false);
  const [showEnteSuggestionsDropdown, setShowEnteSuggestionsDropdown] = useState(false);
  const enteSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizza i dati dell'ente corrente se esistente
  useEffect(() => {
    if (myEnte) {
      const parsedPhone = parsePhoneNumber(myEnte.telefonoEnte || "+39 ");
      setSelectedPhonePrefix(parsedPhone.prefix);
      setPhoneLocalNumber(parsedPhone.local);

      setEnteForm({
        nomeEnte: myEnte.nomeEnte || "",
        referenteOrg: myEnte.referenteOrg || "",
        sedeOrg: myEnte.sedeOrg || "",
        comuneEnte: myEnte.comuneEnte || "Firenze",
        provinciaEnte: myEnte.provinciaEnte || "FI",
        emailEnte: myEnte.emailEnte || currentUser?.email || "",
        telefonoEnte: myEnte.telefonoEnte || "+39 ",
        descEnte: myEnte.descEnte || "",
        sitoWeb: myEnte.sitoWeb || "",
        instagram: myEnte.instagram || "",
        facebook: myEnte.facebook || "",
        tiktok: myEnte.tiktok || "",
        linkedin: myEnte.linkedin || "",
      });
      if (myEnte.sedeOrg) {
        setEnteAddressSearch(
          `${myEnte.sedeOrg}${myEnte.comuneEnte ? `, ${myEnte.comuneEnte}` : ""}${
            myEnte.provinciaEnte ? ` (${myEnte.provinciaEnte})` : ""
          }`
        );
      }
    }
  }, [myEnte, currentUser]);

  // Gestione Evento
  const [draft, setDraft] = useState<OrganizerEventDraft | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [cover, setCover] = useState<File | null>(null);
  const [programma, setProgramma] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const hasCover = Boolean(cover || (draft?.immagineCopertina && draft.immagineCopertina.trim()));
  const hasProgramma = Boolean(programma || (draft?.immagineMenu && draft.immagineMenu.trim()));

  // Autocompletamento Indirizzo Evento (OpenStreetMap / Nominatim)
  const [addressSearch, setAddressSearch] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal Impostazione Orari per data / tutti i giorni
  const [orarioModal, setOrarioModal] = useState<{
    isOpen: boolean;
    targetDay: string | null; // null = applica a tutti
    oraInizio1: string;
    oraFine1: string;
    haSecondaFascia: boolean;
    oraInizio2: string;
    oraFine2: string;
    applicaATutti: boolean;
  }>({
    isOpen: false,
    targetDay: null,
    oraInizio1: "19:00",
    oraFine1: "23:30",
    haSecondaFascia: false,
    oraInizio2: "12:00",
    oraFine2: "15:00",
    applicaATutti: false,
  });

  // Filtra solo gli eventi dell'ente dell'amministratore
  const enteEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          e.idOrganizzatore === myUid ||
          (Array.isArray(e.idCoOrganizzatori) && e.idCoOrganizzatori.includes(myUid))
      ),
    [events, myUid]
  );

  // Giorni coperti calcolati dinamicamente dalle date selezionate
  const giorniCoperti = useMemo(() => {
    if (!draft?.date) return [];
    return calcolaGiorniCoperti(draft.date);
  }, [draft?.date]);

  const openNew = () => {
    setEditingId(undefined);
    setCover(null);
    setProgramma(null);
    setAddressSearch("");
    setAddressSuggestions([]);
    setShowSuggestionsDropdown(false);
    setDraft(emptyDraft(myEnte?.provinciaEnte || "FI", myEnte?.comuneEnte || ""));
  };

  const openEdit = (ev: EventoDB) => {
    setEditingId(ev.id);
    setCover(null);
    setProgramma(null);
    setAddressSearch(ev.luogo || "");
    setAddressSuggestions([]);
    setShowSuggestionsDropdown(false);
    setDraft(draftFromEvent(ev));
  };

  const closeForm = () => {
    setDraft(null);
    setEditingId(undefined);
    setCover(null);
    setProgramma(null);
    setAddressSearch("");
    setAddressSuggestions([]);
    setShowSuggestionsDropdown(false);
  };

  // Funzione di ricerca autocompletamento indirizzo per la SEDE DELL'ENTE
  const handleEnteAddressInputChange = (val: string) => {
    setEnteAddressSearch(val);
    if (enteSearchTimeoutRef.current) {
      clearTimeout(enteSearchTimeoutRef.current);
    }

    if (val.trim().length < 3) {
      setEnteAddressSuggestions([]);
      setShowEnteSuggestionsDropdown(false);
      return;
    }

    setIsSearchingEnteAddress(true);
    enteSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(`${val.trim()}, Toscana, Italia`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=it&viewbox=9.68,44.48,12.40,42.20&bounded=0&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "it" } }
        );
        if (!res.ok) throw new Error("Errore chiamata geocoder");
        const json = await res.json();
        if (Array.isArray(json)) {
          const parsed: AddressSuggestion[] = json.map((item: any) => {
            const addr = item.address || {};
            const road = addr.road || addr.pedestrian || addr.street || item.display_name.split(",")[0] || "";
            const houseNumber = addr.house_number ? ` ${addr.house_number}` : "";
            const viaFinale = `${road}${houseNumber}`.trim();
            const comune = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || "";
            const provRaw = (addr.county || addr.state_district || addr.state || "").toLowerCase();

            let siglaProv = "FI";
            for (const [key, sigla] of Object.entries(PROVINCE_MAP)) {
              if (provRaw.includes(key)) {
                siglaProv = sigla;
                break;
              }
            }

            return {
              displayName: item.display_name,
              via: viaFinale || item.display_name.split(",")[0],
              comune: comune,
              provincia: siglaProv,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
            };
          });
          setEnteAddressSuggestions(parsed);
          setShowEnteSuggestionsDropdown(true);
        }
      } catch (e) {
        console.warn("Autocompletamento indirizzo sede non riuscito:", e);
      } finally {
        setIsSearchingEnteAddress(false);
      }
    }, 350);
  };

  const handleSelectEnteSuggestion = (sug: AddressSuggestion) => {
    setEnteForm((prev) => ({
      ...prev,
      sedeOrg: sug.via,
      comuneEnte: sug.comune || prev.comuneEnte || "Firenze",
      provinciaEnte: sug.provincia || prev.provinciaEnte || "FI",
    }));
    setEnteAddressSearch(`${sug.via}${sug.comune ? `, ${sug.comune}` : ""} (${sug.provincia})`);
    setShowEnteSuggestionsDropdown(false);
  };

  const handleResetEnteAddress = () => {
    setEnteForm((prev) => ({
      ...prev,
      sedeOrg: "",
      comuneEnte: "",
      provinciaEnte: "FI",
    }));
    setEnteAddressSearch("");
    setEnteAddressSuggestions([]);
    setShowEnteSuggestionsDropdown(false);
  };

  // Funzione di ricerca autocompletamento indirizzo per l'EVENTO
  const handleAddressInputChange = (val: string) => {
    setAddressSearch(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length < 3) {
      setAddressSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }

    setIsSearchingAddress(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(`${val.trim()}, Toscana, Italia`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=it&viewbox=9.68,44.48,12.40,42.20&bounded=0&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "it" } }
        );
        if (!res.ok) throw new Error("Errore chiamata geocoder");
        const json = await res.json();
        if (Array.isArray(json)) {
          const parsed: AddressSuggestion[] = json.map((item: any) => {
            const addr = item.address || {};
            const road = addr.road || addr.pedestrian || addr.street || item.display_name.split(",")[0] || "";
            const houseNumber = addr.house_number ? ` ${addr.house_number}` : "";
            const viaFinale = `${road}${houseNumber}`.trim();
            const comune = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || "";
            const provRaw = (addr.county || addr.state_district || addr.state || "").toLowerCase();

            let siglaProv = "FI";
            for (const [key, sigla] of Object.entries(PROVINCE_MAP)) {
              if (provRaw.includes(key)) {
                siglaProv = sigla;
                break;
              }
            }

            return {
              displayName: item.display_name,
              via: viaFinale || item.display_name.split(",")[0],
              comune: comune,
              provincia: siglaProv,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
            };
          });
          setAddressSuggestions(parsed);
          setShowSuggestionsDropdown(true);
        }
      } catch (e) {
        console.warn("Autocompletamento indirizzo evento non riuscito:", e);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = (sug: AddressSuggestion) => {
    if (draft) {
      setDraft({
        ...draft,
        via: sug.via,
        comune: sug.comune || draft.comune,
        provincia: sug.provincia || draft.provincia,
        latitudine: sug.lat,
        longitudine: sug.lon,
      });
    }
    setAddressSearch(`${sug.via}${sug.comune ? `, ${sug.comune}` : ""} (${sug.provincia})`);
    setShowSuggestionsDropdown(false);
  };

  const handleResetEventAddress = () => {
    if (!draft) return;
    setDraft({
      ...draft,
      via: "",
      comune: "",
      provincia: "FI",
      latitudine: 0,
      longitudine: 0,
    });
    setAddressSearch("");
    setAddressSuggestions([]);
    setShowSuggestionsDropdown(false);
  };

  // Apertura modal orario per un giorno specifico o per tutti
  const openOrarioDialog = (targetDay: string | null) => {
    if (!draft) return;
    const currentOrario = targetDay && draft.orariGiornalieri ? draft.orariGiornalieri[targetDay] || "" : "";
    const slots = currentOrario ? currentOrario.split(",").map((s) => s.trim()) : [];

    const slot1 = slots[0] ? slots[0].split("-").map((s) => s.trim()) : [];
    const slot2 = slots[1] ? slots[1].split("-").map((s) => s.trim()) : [];

    setOrarioModal({
      isOpen: true,
      targetDay,
      oraInizio1: slot1[0] || "19:00",
      oraFine1: slot1[1] || "23:30",
      haSecondaFascia: Boolean(slots[1]),
      oraInizio2: slot2[0] || "12:00",
      oraFine2: slot2[1] || "15:00",
      applicaATutti: targetDay === null,
    });
  };

  // Conferma salvataggio orario dal modal
  const handleConfirmOrario = () => {
    if (!draft) return;
    const s1 = `${orarioModal.oraInizio1 || "19:00"} - ${orarioModal.oraFine1 || "23:30"}`;
    const stringaOrario = orarioModal.haSecondaFascia
      ? `${s1}, ${orarioModal.oraInizio2 || "12:00"} - ${orarioModal.oraFine2 || "15:00"}`
      : s1;

    const newMap: Record<string, string> = { ...(draft.orariGiornalieri || {}) };

    if (orarioModal.applicaATutti || orarioModal.targetDay === null) {
      giorniCoperti.forEach((g) => {
        newMap[g] = stringaOrario;
      });
    } else {
      newMap[orarioModal.targetDay] = stringaOrario;
    }

    setDraft({
      ...draft,
      orariGiornalieri: newMap,
    });
    setOrarioModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleRemoveOrario = (day: string) => {
    if (!draft) return;
    const newMap = { ...(draft.orariGiornalieri || {}) };
    delete newMap[day];
    setDraft({
      ...draft,
      orariGiornalieri: newMap,
    });
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !myEnte) return;
    if (!draft.via.trim() || draft.latitudine === 0 || draft.longitudine === 0) {
      alert("Seleziona un indirizzo valido per l'evento dai suggerimenti per posizionarlo sulla mappa.");
      return;
    }
    if (draft.date.length === 0 || !draft.date[0]?.inizio) {
      alert("Seleziona almeno una data valida per l'evento.");
      return;
    }
    if (!hasCover) {
      alert("La locandina / immagine di copertina è obbligatoria. Carica un'immagine di copertina per pubblicare l'evento.");
      return;
    }
    if (!hasProgramma) {
      alert("La foto del programma / menù dell'evento è obbligatoria. Carica un'immagine per il programma per pubblicare l'evento.");
      return;
    }
    setSaving(true);
    try {
      const ok = await saveOrganizerEvent(
        draft,
        { id: myEnte.idEnte, nome: myEnte.nomeEnte || "Organizzatore" },
        cover,
        programma,
        editingId
      );
      if (ok) closeForm();
    } catch (err) {
      console.error("Errore imprevisto durante il salvataggio:", err);
      alert("Si è verificato un errore durante la pubblicazione dell'evento. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEnte = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDuplicateEnteName) {
      alert(
        `Impossibile procedere: Un ente con il nome "${enteForm.nomeEnte.trim()}" esiste già nel database di Rook. Scegli un nome diverso.`
      );
      return;
    }

    if (!enteForm.sedeOrg.trim() || !enteForm.comuneEnte.trim()) {
      alert("Seleziona un indirizzo valido per la sede dell'ente tramite la ricerca (modifica atomica).");
      return;
    }

    if (!isPhoneValid) {
      alert(getPhoneErrorMessage(selectedPhonePrefix, phoneLocalNumber.length));
      return;
    }

    if (
      !enteForm.nomeEnte.trim() ||
      !enteForm.referenteOrg.trim() ||
      !enteForm.emailEnte.trim() ||
      !enteForm.descEnte.trim()
    ) {
      alert("Compila tutti i campi obbligatori contrassegnati da (*).");
      return;
    }

    const payload: CreateOwnEnteData = {
      ...enteForm,
      telefonoEnte: `${selectedPhonePrefix.prefisso} ${phoneLocalNumber.trim()}`,
    };

    setSavingEnte(true);
    try {
      const ok = await createOwnEnte(payload);
      if (ok) {
        setShowEnteModal(false);
      }
    } catch (err) {
      console.error("Errore salvataggio profilo ente:", err);
      alert("Si è verificato un errore durante il salvataggio dell'ente.");
    } finally {
      setSavingEnte(false);
    }
  };

  const set = (patch: Partial<OrganizerEventDraft>) => draft && setDraft({ ...draft, ...patch });

  const isEventAddressLocked = Boolean(draft && draft.via && draft.via.trim() && draft.latitudine !== 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <Briefcase className="w-6 h-6 mr-2 text-amber-400" />
          Studio Organizzatore
        </h1>
        <p className="text-sm text-slate-400">
          Crea, modifica e pubblica gli eventi del tuo Ente ufficiale. I tuoi eventi compaiono immediatamente sull&apos;app Rook.
        </p>
      </div>

      {/* Sezione Creazione Ente se non esiste ancora */}
      {!myEnte && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>Configura il tuo Profilo Ente Ufficiale</span>
          </div>
          <p className="text-xs text-slate-300">
            Per pubblicare eventi su Rook è necessario creare il profilo del tuo Ente o Organizzazione. I dati richiesti sono gli stessi previsti dall&apos;app Rook.
          </p>

          <form onSubmit={handleSaveEnte} className="space-y-4 pt-2">
            <EnteProfileFields
              enteForm={enteForm}
              setEnteForm={setEnteForm}
              selectedPhonePrefix={selectedPhonePrefix}
              setSelectedPhonePrefix={setSelectedPhonePrefix}
              phoneLocalNumber={phoneLocalNumber}
              setPhoneLocalNumber={setPhoneLocalNumber}
              isPhoneValid={isPhoneValid}
              isDuplicateEnteName={isDuplicateEnteName}
              enteAddressSearch={enteAddressSearch}
              handleEnteAddressInputChange={handleEnteAddressInputChange}
              enteAddressSuggestions={enteAddressSuggestions}
              isSearchingEnteAddress={isSearchingEnteAddress}
              showEnteSuggestionsDropdown={showEnteSuggestionsDropdown}
              setShowEnteSuggestionsDropdown={setShowEnteSuggestionsDropdown}
              handleSelectEnteSuggestion={handleSelectEnteSuggestion}
              handleResetEnteAddress={handleResetEnteAddress}
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingEnte || isDuplicateEnteName || !isPhoneValid || !enteForm.sedeOrg.trim()}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition disabled:opacity-50 shadow-lg shadow-amber-500/20"
              >
                {savingEnte ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                <span>{savingEnte ? "Attivazione in corso..." : "Salva e Attiva Profilo Ente Ufficiale"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra dell'Ente Ufficiale (Se esistente) */}
      {myEnte && (
        <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">{myEnte.nomeEnte}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Il tuo Ente Ufficiale
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                <span>
                  {myEnte.sedeOrg ? `${myEnte.sedeOrg}, ` : ""}
                  {myEnte.comuneEnte} ({myEnte.provinciaEnte})
                </span>
                {myEnte.referenteOrg && <span>• Referente: {myEnte.referenteOrg}</span>}
                {myEnte.telefonoEnte && <span>• Tel: {myEnte.telefonoEnte}</span>}
                {myEnte.emailEnte && <span>• {myEnte.emailEnte}</span>}
              </div>
              {myEnte.emailVerificata === false && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      Nuova email <strong>{myEnte.emailEnte}</strong> in attesa di verifica. Controlla la posta e clicca sul link di conferma.
                    </span>
                  </div>
                  <button
                    onClick={() => reinviaEmailVerificaEnte(myEnte.idEnte)}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[11px] transition ml-3 shrink-0"
                  >
                    Reinvia email
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setShowEnteSuggestionsDropdown(false);
                setShowEnteModal(true);
              }}
              className="px-3 py-2 rounded-lg bg-[#141d2e] hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center transition"
            >
              <Edit className="w-3.5 h-3.5 mr-1" /> Dati Ente
            </button>
            <button
              onClick={openNew}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center transition shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4 mr-1" /> Nuovo evento
            </button>
          </div>
        </div>
      )}

      {/* Tabella Eventi dell'Ente */}
      {myEnte && (
        <div className="overflow-x-auto rounded-xl border border-[#1e293b] bg-[#0f172a]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141d2e] text-slate-400 uppercase text-[11px] font-semibold border-b border-[#1e293b]">
              <tr>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Data & Luogo</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {enteEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nessun evento pubblicato finora per il tuo ente. Clicca su &quot;Nuovo evento&quot; per iniziare.
                  </td>
                </tr>
              )}
              {enteEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#141d2e]/60">
                  <td className="px-4 py-3">
                    <span className="font-bold text-white block">{ev.titolo}</span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{ev.descrizione}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{formatEventDate(ev)}</div>
                    <div className="text-slate-400 flex items-center mt-0.5">
                      <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                      {ev.luogo}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {ev.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isEventoPassato(ev) ? (
                      <span className="text-slate-400 font-medium">Passato (Storico)</span>
                    ) : ev.oscurato ? (
                      <span className="text-red-400 font-semibold">Oscurato</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Visibile in App
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      title="Modifica evento"
                      onClick={() => openEdit(ev)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title={ev.oscurato ? "Ripristina visibilità" : "Oscura evento"}
                      onClick={() => toggleOscurato(ev.id, !ev.oscurato)}
                      className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition"
                    >
                      {ev.oscurato ? <CheckCircle className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      title="Elimina definitivamente"
                      onClick={() => {
                        const motivo = window.prompt(`Eliminare l'evento "${ev.titolo}"? Inserisci il motivo:`);
                        if (motivo !== null) deleteEvent(ev.id, motivo || "Rimosso dall'organizzatore");
                      }}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Modifica Dati Ente */}
      {showEnteModal && (
        <div className="fixed inset-0 bg-black/75 flex items-start justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleSaveEnte}
            className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-xs my-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <h2 className="text-base font-bold text-white flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-amber-400" /> Modifica Dati Profilo Ente Ufficiale
              </h2>
              <button
                type="button"
                onClick={() => setShowEnteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <EnteProfileFields
              enteForm={enteForm}
              setEnteForm={setEnteForm}
              selectedPhonePrefix={selectedPhonePrefix}
              setSelectedPhonePrefix={setSelectedPhonePrefix}
              phoneLocalNumber={phoneLocalNumber}
              setPhoneLocalNumber={setPhoneLocalNumber}
              isPhoneValid={isPhoneValid}
              isDuplicateEnteName={isDuplicateEnteName}
              enteAddressSearch={enteAddressSearch}
              handleEnteAddressInputChange={handleEnteAddressInputChange}
              enteAddressSuggestions={enteAddressSuggestions}
              isSearchingEnteAddress={isSearchingEnteAddress}
              showEnteSuggestionsDropdown={showEnteSuggestionsDropdown}
              setShowEnteSuggestionsDropdown={setShowEnteSuggestionsDropdown}
              handleSelectEnteSuggestion={handleSelectEnteSuggestion}
              handleResetEnteAddress={handleResetEnteAddress}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setShowEnteModal(false)}
                className="px-4 py-2 rounded-lg bg-[#141d2e] text-slate-300"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={savingEnte || isDuplicateEnteName || !isPhoneValid || !enteForm.sedeOrg.trim()}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50 flex items-center transition shadow-lg shadow-amber-500/20"
              >
                {savingEnte && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                <span>Salva Dati Ente</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Creazione / Modifica Evento */}
      {draft && myEnte && (
        <div className="fixed inset-0 bg-black/75 flex items-start justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleSaveEvent}
            className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-xs my-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingId ? "Modifica evento" : "Nuovo evento"}
                </h2>
                <span className="text-[11px] text-slate-400">
                  Organizzatore: <strong className="text-amber-400">{myEnte.nomeEnte}</strong>
                </span>
              </div>
              <button type="button" onClick={closeForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Titolo */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Titolo dell&apos;Evento *</label>
              <input
                className={inputCls}
                required
                value={draft.titolo}
                onChange={(e) => set({ titolo: e.target.value })}
                placeholder="es. Sagra del Tartufo, Concerto d'Estate..."
              />
            </div>

            {/* Categoria e Sito Web */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Categoria *</label>
                <select
                  className={inputCls}
                  value={draft.categoria}
                  onChange={(e) => set({ categoria: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Link Sito Web / Biglietti (opzionale)</label>
                <input
                  className={inputCls}
                  value={draft.urlWeb}
                  onChange={(e) => set({ urlWeb: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Sezione Indirizzo Evento con Modifica Atomica (COORDINATE NON VISIBILI) */}
            <div className="p-4 rounded-xl bg-[#0b101c] border border-slate-800 space-y-3">
              {isEventAddressLocked ? (
                // Indirizzo Evento Bloccato (Read-Only) - SENZA COORDINATE VISIBILI
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Indirizzo Evento Verificato e Collegato alla Mappa</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 flex items-center">
                        <Lock className="w-3 h-3 mr-1 text-amber-400" /> Bloccato
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetEventAddress}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center space-x-1 border border-amber-500/30 transition shadow-sm"
                      title="Reimposta l'indirizzo dell'evento per cercarne uno nuovo completo (modifica atomica)"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      <span>Cambia indirizzo (reimposta)</span>
                    </button>
                  </div>

                  {/* Campi Indirizzo Parsati Bloccati (Coordinate NON mostrate) */}
                  <div className="grid grid-cols-6 gap-2">
                    <div className="col-span-3">
                      <label className="text-slate-400 text-[11px] block mb-1 flex items-center">
                        <Lock className="w-3 h-3 mr-1 text-slate-500" /> Via / Piazza - Bloccata
                      </label>
                      <input
                        readOnly
                        disabled
                        value={draft.via}
                        className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 cursor-not-allowed select-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-slate-400 text-[11px] block mb-1 flex items-center">
                        <Lock className="w-3 h-3 mr-1 text-slate-500" /> Comune - Bloccato
                      </label>
                      <input
                        readOnly
                        disabled
                        value={draft.comune}
                        className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 cursor-not-allowed select-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1 flex items-center">
                        <Lock className="w-3 h-3 mr-1 text-slate-500" /> Prov.
                      </label>
                      <input
                        readOnly
                        disabled
                        value={draft.provincia}
                        className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 cursor-not-allowed select-none font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-slate-300 flex items-start space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Modifica atomica attiva:</strong> Via, comune e provincia sono collegati alla posizione sulla mappa di Rook. Non è possibile modificarli singolarmente. Clicca su <em>&quot;Cambia indirizzo&quot;</em> per cercare un nuovo luogo completo.
                    </span>
                  </div>
                </div>
              ) : (
                // Ricerca Indirizzo Evento con Autocompletamento
                <div className="space-y-2">
                  <label className="text-slate-200 font-semibold block mb-1 flex items-center justify-between">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-amber-400" /> Cerca Indirizzo Evento (Autocompletamento obbligatorio) *
                    </span>
                    {isSearchingAddress && (
                      <span className="text-[11px] text-amber-400 flex items-center font-normal">
                        <Loader2 className="w-3 h-3 animate-spin mr-1" /> Ricerca in corso...
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={addressSearch}
                      onChange={(e) => handleAddressInputChange(e.target.value)}
                      onFocus={() => addressSuggestions.length > 0 && setShowSuggestionsDropdown(true)}
                      placeholder="Inizia a digitare via, piazza o comune in Toscana..."
                      className="w-full bg-[#141d2e] border border-amber-500/50 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 pl-8"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />

                    {/* Dropdown dei suggerimenti indirizzo */}
                    {showSuggestionsDropdown && addressSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-800">
                        {addressSuggestions.map((sug, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(sug)}
                            className="p-2.5 hover:bg-amber-500/10 cursor-pointer transition text-left flex items-start space-x-2"
                          >
                            <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-semibold text-white text-xs">{sug.via || sug.displayName}</div>
                              <div className="text-[11px] text-slate-400">
                                {sug.comune} ({sug.provincia})
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Cerca e seleziona l&apos;indirizzo dai risultati: via, comune e provincia verranno assegnati e bloccati insieme (modifica atomica).
                  </p>
                </div>
              )}
            </div>

            {/* SEZIONE 1: Date dell'Evento (Con Icona Calendario Visibile e Cliccabile) */}
            <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" /> 1. Date Programmate dell&apos;Evento *
                </span>
                <span className="text-[11px] text-slate-400">
                  {giorniCoperti.length} {giorniCoperti.length === 1 ? "giorno programmato" : "giorni programmati"}
                </span>
              </div>

              <div className="space-y-2.5">
                {draft.date.map((d, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Giorno Inizio *</span>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          required
                          style={{ colorScheme: "dark" }}
                          className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2.5 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 cursor-pointer [color-scheme:dark]"
                          value={d.inizio}
                          onChange={(e) => {
                            const date = [...draft.date];
                            const nuovaInizio = e.target.value;
                            const fineAggiornata = d.fine && d.fine >= nuovaInizio ? d.fine : nuovaInizio;
                            date[i] = { ...d, inizio: nuovaInizio, fine: fineAggiornata };
                            set({ date });
                          }}
                          onClick={(e) => {
                            try {
                              (e.currentTarget as any).showPicker?.();
                            } catch {}
                          }}
                        />
                        <Calendar className="w-4 h-4 text-amber-400 absolute left-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Giorno Fine</span>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          style={{ colorScheme: "dark" }}
                          className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2.5 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 cursor-pointer [color-scheme:dark]"
                          value={d.fine || d.inizio}
                          min={d.inizio}
                          onChange={(e) => {
                            const date = [...draft.date];
                            date[i] = { ...d, fine: e.target.value };
                            set({ date });
                          }}
                          onClick={(e) => {
                            try {
                              (e.currentTarget as any).showPicker?.();
                            } catch {}
                          }}
                        />
                        <Calendar className="w-4 h-4 text-amber-400 absolute left-2.5 pointer-events-none" />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={draft.date.length === 1}
                      onClick={() => set({ date: draft.date.filter((_, k) => k !== i) })}
                      className="p-2.5 mt-5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-20 transition"
                      title="Rimuovi intervallo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const today = getTodayDateString();
                  set({ date: [...draft.date, { inizio: today, fine: today }] });
                }}
                className="text-amber-400 hover:text-amber-300 font-semibold text-xs pt-1 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5 mr-0.5" />
                <span>Aggiungi un altro intervallo o giorno</span>
              </button>
            </div>

            {/* SEZIONE 2: Orari dell'Evento (Opzionale) con "Imposta per tutti i giorni" come nell'App */}
            <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" /> 2. Orari dell&apos;Evento (Opzionale)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Imposta gli orari per ciascun giorno programmato oppure applica lo stesso orario a tutti i giorni.
                  </p>
                </div>

                {giorniCoperti.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openOrarioDialog(null)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center space-x-1.5 border border-amber-500/30 transition shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Imposta per tutti i giorni</span>
                  </button>
                )}
              </div>

              {giorniCoperti.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-[#141d2e] border border-slate-800 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Seleziona prima le date sopra per poter impostare gli orari.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {giorniCoperti.map((dayStr) => {
                    const orarioGiorno = draft.orariGiornalieri?.[dayStr] || "";
                    const labelData = formatDataItaliana(dayStr);

                    return (
                      <div
                        key={dayStr}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                          orarioGiorno
                            ? "bg-amber-500/5 border-amber-500/30 text-white"
                            : "bg-[#141d2e] border-slate-800 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Calendar className={`w-4 h-4 shrink-0 ${orarioGiorno ? "text-amber-400" : "text-slate-500"}`} />
                          <div className="truncate">
                            <span className="font-semibold text-xs text-white block">{labelData}</span>
                            <span className="text-[11px] text-slate-400 block">
                              {orarioGiorno ? (
                                <strong className="text-amber-400 font-semibold">{orarioGiorno}</strong>
                              ) : (
                                "Nessun orario impostato (Tutto il giorno)"
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          {orarioGiorno ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openOrarioDialog(dayStr)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold flex items-center transition"
                              >
                                <Edit className="w-3 h-3 mr-1" /> Modifica
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveOrario(dayStr)}
                                className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                title="Rimuovi orario per questo giorno"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openOrarioDialog(dayStr)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center transition"
                            >
                              <Plus className="w-3 h-3 mr-1 text-amber-400" /> Imposta orario
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Descrizione */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Descrizione Dettagliata *</label>
              <textarea
                rows={4}
                required
                className={inputCls}
                value={draft.descrizione}
                onChange={(e) => set({ descrizione: e.target.value })}
                placeholder="Programma, dettagli, ospiti e informazioni utili..."
              />
            </div>

            {/* Sezione Immagini Obbligatorie: Locandina e Programma/Menù */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Locandina / Copertina (Obbligatoria) */}
              <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800 space-y-2">
                <label className="text-slate-300 font-semibold block text-xs flex items-center justify-between">
                  <span>Locandina / Copertina *</span>
                  {hasCover ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" /> Caricata
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-400 font-semibold">
                      * Obbligatoria
                    </span>
                  )}
                </label>
                <label
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed text-slate-300 cursor-pointer transition bg-[#141d2e]/50 ${
                    !hasCover
                      ? "border-amber-500/60 hover:border-amber-400"
                      : "border-slate-700 hover:border-amber-500"
                  }`}
                >
                  <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs truncate">
                    {cover
                      ? cover.name
                      : draft.immagineCopertina
                      ? "Sostituisci locandina"
                      : "Carica locandina (obbligatoria)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setCover(e.target.files?.[0] || null)}
                  />
                </label>
                {cover ? (
                  <p className="text-[10px] text-emerald-400 font-medium truncate">
                    File selezionato: {cover.name}
                  </p>
                ) : draft.immagineCopertina ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.immagineCopertina}
                    alt="Copertina attuale"
                    className="mt-1.5 h-24 w-full rounded-lg object-cover border border-slate-700"
                  />
                ) : (
                  <p className="text-[10px] text-slate-400">
                    Carica l&apos;immagine principale dell&apos;evento.
                  </p>
                )}
              </div>

              {/* 2. Foto Programma / Menù (Obbligatoria) */}
              <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800 space-y-2">
                <label className="text-slate-300 font-semibold block text-xs flex items-center justify-between">
                  <span>Foto Programma / Menù *</span>
                  {hasProgramma ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" /> Caricato
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-400 font-semibold">
                      * Obbligatoria
                    </span>
                  )}
                </label>
                <label
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed text-slate-300 cursor-pointer transition bg-[#141d2e]/50 ${
                    !hasProgramma
                      ? "border-amber-500/60 hover:border-amber-400"
                      : "border-slate-700 hover:border-amber-500"
                  }`}
                >
                  <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs truncate">
                    {programma
                      ? programma.name
                      : draft.immagineMenu
                      ? "Sostituisci programma"
                      : "Carica foto programma (obbligatoria)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setProgramma(e.target.files?.[0] || null)}
                  />
                </label>
                {programma ? (
                  <p className="text-[10px] text-emerald-400 font-medium truncate">
                    File selezionato: {programma.name}
                  </p>
                ) : draft.immagineMenu ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.immagineMenu}
                    alt="Programma attuale"
                    className="mt-1.5 h-24 w-full rounded-lg object-cover border border-slate-700"
                  />
                ) : (
                  <p className="text-[10px] text-slate-400">
                    Carica la foto con il programma completo o menù.
                  </p>
                )}
              </div>
            </div>

            {/* Opzioni di Accessibilità */}
            <div className="flex items-center gap-6 pt-1 text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={draft.accessibileDisabili}
                  onChange={(e) => set({ accessibileDisabili: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>Accessibile a persone con disabilità</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={draft.opzioniVeg}
                  onChange={(e) => set({ opzioniVeg: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>Opzioni vegetariane / vegane</span>
              </label>
            </div>

            {/* Pulsanti Salvataggio */}
            <div className="flex justify-end gap-2 pt-4 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 rounded-lg bg-[#141d2e] text-slate-300 hover:bg-slate-800 transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving || !isEventAddressLocked || !hasCover || !hasProgramma}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50 flex items-center transition shadow-lg shadow-amber-500/20"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                <span>{saving ? "Pubblicazione..." : editingId ? "Salva modifiche" : "Pubblica su Rook App"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Impostazione Orari (Singolo Giorno o Tutti i Giorni) */}
      {orarioModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-amber-400" />
                  {orarioModal.targetDay
                    ? `Orario per ${formatDataItaliana(orarioModal.targetDay)}`
                    : "Imposta orario per tutti i giorni"}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {orarioModal.targetDay
                    ? "Definisci la fascia oraria di apertura"
                    : `Verrà applicato a tutti i ${giorniCoperti.length} giorni dell'evento`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOrarioModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fascia Oraria Principale */}
            <div className="p-3.5 rounded-xl bg-[#141d2e] border border-slate-700/80 space-y-2.5">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Fascia Oraria Principale
              </span>
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Dalle ore</span>
                  <div className="relative flex items-center">
                    <input
                      type="time"
                      style={{ colorScheme: "dark" }}
                      value={orarioModal.oraInizio1}
                      onChange={(e) => setOrarioModal((prev) => ({ ...prev, oraInizio1: e.target.value }))}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Alle ore</span>
                  <div className="relative flex items-center">
                    <input
                      type="time"
                      style={{ colorScheme: "dark" }}
                      value={orarioModal.oraFine1}
                      onChange={(e) => setOrarioModal((prev) => ({ ...prev, oraFine1: e.target.value }))}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seconda Fascia Oraria (es. pranzo e cena, come nell'app) */}
            {orarioModal.haSecondaFascia ? (
              <div className="p-3.5 rounded-xl bg-[#141d2e] border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    Seconda Fascia Oraria (es. cena)
                  </span>
                  <button
                    type="button"
                    onClick={() => setOrarioModal((prev) => ({ ...prev, haSecondaFascia: false }))}
                    className="text-[10px] text-red-400 hover:text-red-300"
                  >
                    Rimuovi
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Dalle ore</span>
                    <input
                      type="time"
                      style={{ colorScheme: "dark" }}
                      value={orarioModal.oraInizio2}
                      onChange={(e) => setOrarioModal((prev) => ({ ...prev, oraInizio2: e.target.value }))}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Alle ore</span>
                    <input
                      type="time"
                      style={{ colorScheme: "dark" }}
                      value={orarioModal.oraFine2}
                      onChange={(e) => setOrarioModal((prev) => ({ ...prev, oraFine2: e.target.value }))}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOrarioModal((prev) => ({ ...prev, haSecondaFascia: true }))}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Aggiungi seconda fascia oraria (es. pranzo e cena)</span>
              </button>
            )}

            {/* Opzione "Imposta per tutti i giorni" (come nell'app Rook) */}
            {giorniCoperti.length > 1 && (
              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={orarioModal.applicaATutti}
                  onChange={(e) => setOrarioModal((prev) => ({ ...prev, applicaATutti: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span className="text-xs font-semibold text-white">
                  Imposta questo orario per tutti i giorni ({giorniCoperti.length} date)
                </span>
              </label>
            )}

            {/* Footer azioni */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setOrarioModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-lg bg-[#141d2e] text-slate-300 hover:bg-slate-800 transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmOrario}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center space-x-1.5 transition shadow-lg shadow-amber-500/20"
              >
                <Check className="w-4 h-4" />
                <span>
                  {orarioModal.applicaATutti
                    ? "Salva per tutti i giorni"
                    : "Conferma orario"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
