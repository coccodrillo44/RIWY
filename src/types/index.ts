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
  timestampRifiuto?: number;
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
  chatRoomId?: string;
  chatId?: string;
  idSegnalato?: string;
  nomeSegnalato?: string;
  idControparte?: string;
  nomeControparte?: string;
  idSegnalatore?: string;
  idSegnalante?: string;
  nomeSegnalatore?: string;
  nomeSegnalante?: string;
  ultimiMessaggi?: any;
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

export interface ChatMessageDB {
  id: string;
  chatId?: string;
  senderId: string;
  senderName?: string;
  senderRole?: 'UTENTE' | 'ORGANIZZATORE' | 'ADMIN' | string;
  testo: string;
  timestamp: number;
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

export interface EventoRespintoModerazione {
  id: string;
  titolo: string;
  descrizione?: string;
  organizzatore: string;
  idOrganizzatore?: string;
  motivoRifiuto: string;
  campoViolato?: "NESSUNO" | "TITOLO" | "DESCRIZIONE" | "COPERTINA" | "PROGRAMMA" | string;
  urlCopertina?: string;
  urlProgramma?: string;
  timestamp: number;
  letto?: boolean;
  stato?: "RESPINTO" | "ESAMINATO" | string;
}

export interface CategoriaDB {
  id: string;
  nome: string;
  nome_it?: string;
  nome_en?: string;
  nome_de?: string;
  nome_es?: string;
  nome_fr?: string;
  icon_key?: string;
  color_hex?: string;
  ordine?: number;
  attivo: boolean;
  sottocategorie?: string[];
}

export const DEFAULT_CATEGORIE_LIST: CategoriaDB[] = [
  {
    id: "cibo_sagre",
    nome: "Cibo & Sagre",
    nome_it: "Cibo & Sagre",
    nome_en: "Food & Festivals",
    icon_key: "restaurant",
    color_hex: "#EA580C",
    ordine: 1,
    attivo: true,
    sottocategorie: ["Sagre", "Street Food", "Cibo & Sagre"],
  },
  {
    id: "musica_feste",
    nome: "Musica & Feste",
    nome_it: "Musica & Feste",
    nome_en: "Music & Parties",
    icon_key: "music_note",
    color_hex: "#8B5CF6",
    ordine: 2,
    attivo: true,
    sottocategorie: ["Eventi Musicali", "Feste e Folklore", "Musica & Feste"],
  },
  {
    id: "arte_cultura",
    nome: "Arte & Cultura",
    nome_it: "Arte & Cultura",
    nome_en: "Art & Culture",
    icon_key: "palette",
    color_hex: "#0284C7",
    ordine: 3,
    attivo: true,
    sottocategorie: ["Eventi Artistici", "Eventi in Biblioteca", "Eventi Religiosi", "Arte & Cultura"],
  },
  {
    id: "sport_movimento",
    nome: "Sport & Movimento",
    nome_it: "Sport & Movimento",
    nome_en: "Sports & Fitness",
    icon_key: "sports_soccer",
    color_hex: "#16A34A",
    ordine: 4,
    attivo: true,
    sottocategorie: ["Eventi Sportivi", "Sport & Movimento"],
  },
  {
    id: "famiglia_bambini",
    nome: "Famiglia & Bambini",
    nome_it: "Famiglia & Bambini",
    nome_en: "Family & Kids",
    icon_key: "child_care",
    color_hex: "#EC4899",
    ordine: 5,
    attivo: true,
    sottocategorie: ["Per Bambini", "Giostre", "Famiglia & Bambini"],
  },
  {
    id: "fiere_mercati",
    nome: "Fiere & Mercati",
    nome_it: "Fiere & Mercati",
    nome_en: "Fairs & Markets",
    icon_key: "storefront",
    color_hex: "#D97706",
    ordine: 6,
    attivo: true,
    sottocategorie: ["Fiere e Mercati", "Fiere & Mercati"],
  },
  {
    id: "nuove_aperture",
    nome: "Nuove Aperture",
    nome_it: "Nuove Aperture",
    nome_en: "New Openings",
    icon_key: "store",
    color_hex: "#0D9488",
    ordine: 7,
    attivo: true,
    sottocategorie: ["Nuove Aperture"],
  },
  {
    id: "sconti_promozioni",
    nome: "Sconti & Promozioni",
    nome_it: "Sconti & Promozioni",
    nome_en: "Discounts & Promos",
    icon_key: "local_offer",
    color_hex: "#E11D48",
    ordine: 8,
    attivo: true,
    sottocategorie: ["Sconti", "Promozioni", "Sconti & Promozioni"],
  },
  {
    id: "discoteche",
    nome: "Discoteche",
    nome_it: "Discoteche",
    nome_en: "Clubs & Discos",
    icon_key: "nightlife",
    color_hex: "#7C3AED",
    ordine: 9,
    attivo: true,
    sottocategorie: ["Club", "Discoteche"],
  },
  {
    id: "salute_sociale",
    nome: "Salute & Sociale",
    nome_it: "Salute & Sociale",
    nome_en: "Health & Social",
    icon_key: "volunteer_activism",
    color_hex: "#0D9488",
    ordine: 10,
    attivo: true,
    sottocategorie: ["Salute", "Sociale", "Volontariato", "Salute & Sociale"],
  },
];

export interface ReviewsStats {
  total: number;
  average: string;
}

export interface SystemCounters {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  shadowbannedUsers: number;
  deletedUsers: number;
  onlineUsers: number;
  guestsCount: number;

  totalEvents: number;
  activeEvents: number;
  pastEvents: number;
  boostedEvents: number;
  accessibleEvents: number;
  vegEvents: number;
  rejectedEvents: number;

  totalOrganizers: number;
  verifiedOrganizers: number;
  pendingRequests: number;
  suspendedOrganizers: number;

  totalReviews: number;
  averageRating: string;
  totalChats: number;
  totalCommunities: number;
  totalBozze: number;

  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
}
