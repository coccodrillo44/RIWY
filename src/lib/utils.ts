import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { EventoDB } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns whether an event's boost is currently active
 * Identical to Rook Android logic: boostScadenza > System.currentTimeMillis()
 */
export function isBoostAttivo(event: EventoDB): boolean {
  if (!event.boostScadenza) return false;
  return Number(event.boostScadenza) > Date.now();
}

/**
 * Determines whether an event is in the past (concluded / stored in storico).
 * Identical to Rook's DateUtils.isEventoPassato logic:
 * An event is past if all its intervals (or single date) end strictly before today.
 */
export function isEventoPassato(event: EventoDB, referenceDate = new Date()): boolean {
  const todayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  const rawDate = event.date as unknown;
  const intervals: { dataInizio: number; dataFine: number }[] = Array.isArray(rawDate)
    ? rawDate
    : rawDate && typeof rawDate === "object"
    ? Object.values(rawDate as Record<string, { dataInizio: number; dataFine: number }>)
    : [];

  if (intervals.length > 0) {
    return intervals.every((inv) => {
      const endTimestamp = Number(inv.dataFine || inv.dataInizio || 0);
      if (!endTimestamp) return false;
      const d = new Date(endTimestamp);
      const endDayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      return endDayStart < todayStart;
    });
  }

  if (event.data) {
    const num = Number(event.data);
    if (!isNaN(num) && num > 0) {
      const d = new Date(num);
      const eventDayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      return eventDayStart < todayStart;
    }
  }

  return false;
}

/**
 * Extracts and formats human-readable date string from Rook's event model
 * Handles: Long epoch millis, date string, or date interval array
 */
export function formatEventDate(event: EventoDB): string {
  // Firebase may return a sparse array as an object: normalise before sorting
  const rawDate = event.date as unknown;
  const intervals: { dataInizio: number; dataFine: number }[] = Array.isArray(rawDate)
    ? rawDate
    : rawDate && typeof rawDate === "object"
    ? Object.values(rawDate as Record<string, { dataInizio: number; dataFine: number }>)
    : [];
  if (intervals.length > 0) {
    const sorted = [...intervals].sort((a, b) => a.dataInizio - b.dataInizio);
    const first = sorted[0];
    if (first.dataInizio === first.dataFine) {
      return formatDate(first.dataInizio, false);
    }
    return `${formatDate(first.dataInizio, false)} - ${formatDate(first.dataFine, false)}`;
  }

  if (event.data) {
    if (typeof event.data === "number") {
      return formatDate(event.data, false);
    }
    // String number check
    const num = Number(event.data);
    if (!isNaN(num) && num > 100000000) {
      return formatDate(num, false);
    }
    return String(event.data);
  }

  return "Data non specificata";
}

export function formatDate(timestamp: number | string | undefined | null, includeTime = true): string {
  if (!timestamp) return "N/D";
  const num = typeof timestamp === "number" ? timestamp : Number(timestamp);
  const date = !isNaN(num) ? new Date(num) : new Date(timestamp);
  
  if (isNaN(date.getTime())) return String(timestamp);

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return new Intl.DateTimeFormat("it-IT", options).format(date);
}

/**
 * Normalizes categories according to Rook's 7 macro-groups
 */
export function normalizeCategory(cat: string | undefined): string {
  if (!cat) return "Altro";
  const trimmed = cat.trim().toLowerCase();

  if (
    trimmed === "sagre" ||
    trimmed === "street food" ||
    trimmed.includes("cibo") ||
    trimmed.includes("sagra") ||
    trimmed.includes("vino") ||
    trimmed.includes("degustazione")
  ) {
    return "Cibo & Sagre";
  }
  if (
    trimmed.includes("musica") ||
    trimmed.includes("festa") ||
    trimmed.includes("feste") ||
    trimmed.includes("concerto") ||
    trimmed.includes("dj")
  ) {
    return "Musica & Feste";
  }
  if (
    trimmed.includes("arte") ||
    trimmed.includes("cultura") ||
    trimmed.includes("mostra") ||
    trimmed.includes("teatro") ||
    trimmed.includes("museo")
  ) {
    return "Arte & Cultura";
  }
  if (
    trimmed.includes("sport") ||
    trimmed.includes("movimento") ||
    trimmed.includes("corsa") ||
    trimmed.includes("bici") ||
    trimmed.includes("trekking")
  ) {
    return "Sport & Movimento";
  }
  if (
    trimmed.includes("famiglia") ||
    trimmed.includes("bambini") ||
    trimmed.includes("bimbi") ||
    trimmed.includes("ragazzi")
  ) {
    return "Famiglia & Bambini";
  }
  if (
    trimmed.includes("fiera") ||
    trimmed.includes("fiere") ||
    trimmed.includes("mercato") ||
    trimmed.includes("mercatino") ||
    trimmed.includes("antiquariato")
  ) {
    return "Fiere & Mercati";
  }
  if (
    trimmed.includes("apertura") ||
    trimmed.includes("inaugurazione") ||
    trimmed.includes("nuova apertura")
  ) {
    return "Nuove Aperture";
  }

  return cat;
}

export function getCategoryBadgeClass(category: string | undefined): string {
  const norm = normalizeCategory(category);
  switch (norm) {
    case "Cibo & Sagre":
      return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    case "Musica & Feste":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "Arte & Cultura":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "Sport & Movimento":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "Famiglia & Bambini":
      return "bg-pink-500/15 text-pink-400 border-pink-500/30";
    case "Fiere & Mercati":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "Nuove Aperture":
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    default:
      return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  }
}

/**
 * Extracts Province from location string if not present
 */
export function extractProvince(luogo: string | undefined, defaultProv?: string): string {
  if (defaultProv) return defaultProv.toUpperCase();
  if (!luogo) return "N/D";
  const upper = luogo.toUpperCase();
  const provs = ["FI", "PI", "LU", "SI", "AR", "LI", "MS", "GR", "PO", "PT"];
  for (const p of provs) {
    if (upper.includes(`(${p})`) || upper.includes(` ${p} `) || upper.endsWith(` ${p}`)) {
      return p;
    }
  }
  if (upper.includes("FIRENZE")) return "FI";
  if (upper.includes("PISA")) return "PI";
  if (upper.includes("LUCCA")) return "LU";
  if (upper.includes("SIENA")) return "SI";
  if (upper.includes("AREZZO")) return "AR";
  if (upper.includes("LIVORNO")) return "LI";
  if (upper.includes("GROSSETO")) return "GR";
  if (upper.includes("PRATO")) return "PO";
  if (upper.includes("PISTOIA")) return "PT";
  if (upper.includes("MASSA") || upper.includes("CARRARA")) return "MS";
  // Unknown location: do not inflate Florence's numbers
  return "N/D";
}

/**
 * Maps the report states written by the Android app (IN_ATTESA, ...) and by the panel
 * to the panel's internal states.
 */
export function normalizeReportStatus(stato: string | undefined | null): "nuovo" | "in_lavorazione" | "risolto" | "rifiutato" {
  const s = (stato || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!s || s === "nuovo" || s === "in_attesa" || s === "nuova") return "nuovo";
  if (s === "in_lavorazione") return "in_lavorazione";
  if (s.startsWith("rifiut") || s === "respinta" || s === "respinto") return "rifiutato";
  return "risolto";
}
