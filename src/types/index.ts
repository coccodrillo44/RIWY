// Type definitions matching exact Rook Android Database schemas (Entities.kt)

export interface IntervalloDate {
  dataInizio: number;
  dataFine: number;
}

export interface EventoDB {
  id: string;
  idOrganizzatore: string;
  organizzatore: string;
  titolo: string;
  data?: number | string | null;
  luogo?: string;
  latitudine?: number;
  longitudine?: number;
  categoria: string;
  descrizione?: string;
  preferito?: boolean;
  immagineCopertina?: string;
  immagineMenu?: string;
  date?: IntervalloDate[];
  mediaValutazioni?: number;
  numeroRecensioni?: number;
  geohash?: string;
  idCoOrganizzatori?: string[];
  coOrganizzatori?: string[];
  boostScadenza?: number;
  boostTipo?: string;
  opzioniVeg?: boolean;
  accessibileDisabili?: boolean;
  likes?: number;
  urlWeb?: string;
  creatoDaUid?: string;
  creatoDaNome?: string;
  orariGiornalieri?: Record<string, string>;
  oscurato?: boolean;
  // Computed helpers
  provincia?: string;
  comune?: string;
}

export interface UtenteDB {
  firebaseUid: string;
  email: string;
  username?: string;
  telefonoUser?: string;
  isEnte?: boolean;
  avatarId?: string;
  provincia?: string;
  idEnteGestito?: string;
  sospeso?: boolean;
  stato?: 'attivo' | 'sospeso' | 'bannato' | 'shadowbanned';
  paroleChiaveAlert?: string[];
  ultimoAccesso?: number;
}

export interface InfoEnteDB {
  idEnte: string;
  nomeEnte?: string;
  emailEnte?: string;
  telefonoEnte?: string;
  referenteOrg?: string;
  sedeOrg?: string;
  descEnte?: string;
  comuneEnte?: string;
  provinciaEnte?: string;
  sitoWeb?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
  logoEnte?: string;
  enteSince?: string;
  verificato?: boolean;
  badges?: string[];
  emailVerificata?: boolean;
  tokenVerificaEmail?: string;
  emailInviata?: boolean;
  sospeso?: boolean;
  sospesoFino?: number;
  motivoSospensione?: string;
  idCreatore?: string;
}

export interface RichiestaOrganizzatoreDB {
  idRichiesta: string;
  uidUtente: string;
  emailRichiedente?: string;
  usernameRichiedente?: string;
  nomeEnte: string;
  emailEnte?: string;
  telefonoEnte?: string;
  referenteOrg?: string;
  sedeOrg?: string;
  descEnte?: string;
  dataRichiesta?: string;
  timestamp?: number;
  stato?: string; // 'IN_ATTESA' | 'APPROVATA' | 'RIFIUTATA'
  comuneEnte?: string;
  provinciaEnte?: string;
  sitoWeb?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
  emailVerificata?: boolean;
  motivoRifiuto?: string;
}

export interface ReportItemDB {
  id: string;
  categoria?: string;
  tipo?: 'evento' | 'recensione' | 'organizzatore' | 'chat' | 'bug';
  targetId: string;
  titoloTarget?: string;
  idEvento?: string;
  titoloEvento?: string;
  idOrganizzatore?: string;
  organizzatore?: string;
  nomeOrganizzatore?: string;
  segnalatoreUid?: string;
  emailSegnalante?: string;
  emailUtente?: string;
  segnalatoDa?: string;
  motivo: string;
  dettaglio?: string;
  descrizione?: string;
  dettagli?: string;
  dispositivo?: string;
  versioneApp?: string;
  gravita?: string;
  stato?: 'nuovo' | 'in_lavorazione' | 'risolto' | 'rifiutato';
  timestamp?: number;
  risoltoDa?: string;
  risoluzioneNote?: string;
  timestampRisoluzione?: number;
}

export interface AuditLogDB {
  id: string;
  operatore: {
    uid: string;
    email: string;
    ruolo: string;
  };
  azione: string;
  targetTipo: 'evento' | 'utente' | 'ente' | 'sistema' | 'segnalazione';
  targetId: string;
  dettagli: string;
  diffPrima?: any;
  diffDopo?: any;
  timestamp: number;
}

export interface FeatureFlagDB {
  id: string;
  chiave: string;
  nome: string;
  descrizione: string;
  attivo: boolean;
  impatto: 'critico' | 'alto' | 'medio' | 'info';
  categoria: 'app' | 'eventi' | 'auth' | 'chat';
}

export interface AnalyticsDB {
  guestsCount: number;
  tabViews: Record<string, number>;
  scrollEvents?: Record<string, any>;
}

/** Dati del form "Studio Organizzatore" per creare/modificare un evento. */
export interface OrganizerEventDraft {
  titolo: string;
  categoria: string;
  via: string;
  comune: string;
  provincia: string;
  latitudine: number;
  longitudine: number;
  descrizione: string;
  urlWeb: string;
  opzioniVeg: boolean;
  accessibileDisabili: boolean;
  /** Date dell'evento: inizio e fine in formato YYYY-MM-DD */
  date: { inizio: string; fine: string }[];
  /** Orari giornalieri opzionali per ciascuna data (es. "2026-11-01": "19:00 - 23:30") */
  orariGiornalieri?: Record<string, string>;
  immagineCopertina: string;
  immagineMenu: string;
}

/** Dati completi per la creazione del profilo Ente / Organizzatore (allineato all'app Rook). */
export interface CreateOwnEnteData {
  nomeEnte: string;
  referenteOrg: string;
  sedeOrg: string;
  comuneEnte: string;
  provinciaEnte: string;
  emailEnte: string;
  telefonoEnte: string;
  descEnte: string;
  sitoWeb?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
}

export interface BadgeDef {
  id: string;
  label: string;
  icon: string;
  colore: string;
  descrizione: string;
}

export const BADGES_DISPONIBILI: BadgeDef[] = [
  {
    id: "VERIFICATO",
    label: "Organizzatore Verificato",
    icon: "ShieldCheck",
    colore: "blue",
    descrizione: "Spunta blu ufficiale conferita dall'amministrazione dopo verifica identità e affidabilità.",
  },
  {
    id: "TOP_ORGANIZZATORE",
    label: "Top Organizzatore",
    icon: "Award",
    colore: "amber",
    descrizione: "Eccellenza per continuità, eventi di qualità e recensioni altissime della community.",
  },
  {
    id: "COLLABORATORE_DOC",
    label: "Partner di Rete",
    icon: "Users",
    colore: "purple",
    descrizione: "Promotore attivo di collaborazioni e sinergie virtuose con altri enti toscani.",
  },
  {
    id: "VETERANO",
    label: "Veterano Rook",
    icon: "Sparkles",
    colore: "emerald",
    descrizione: "Presenza storica e affidabilità consolidata nel tempo sul territorio.",
  },
  {
    id: "PATROCINATO",
    label: "Patrocinato / Istituzionale",
    icon: "Landmark",
    colore: "indigo",
    descrizione: "Riconoscimento istituzionale o patrocinio da comuni/enti culturali.",
  },
  {
    id: "SOSTENITORE_PRO",
    label: "Sostenitore Pro",
    icon: "Zap",
    colore: "pink",
    descrizione: "Investe con costanza nella visibilità dei propri eventi attraverso promozioni e booster.",
  },
];
