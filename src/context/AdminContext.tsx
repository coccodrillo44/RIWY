"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  EventoDB,
  UtenteDB,
  InfoEnteDB,
  RichiestaOrganizzatoreDB,
  ReportItemDB,
  AuditLogDB,
  FeatureFlagDB,
  AnalyticsDB,
  OrganizerEventDraft,
  CreateOwnEnteData,
  BADGES_DISPONIBILI,
  BadgeDef,
  EventoRespintoModerazione,
  ChatMessageDB,
  CategoriaDB,
  DEFAULT_CATEGORIE_LIST,
  ReviewsStats,
} from "@/types";
import {
  auth,
  devAuth,
  googleProvider,
  prodRtdb,
  devRtdb,
  prodStorage,
  devStorage,
  FirebaseEnv,
} from "@/lib/firebase";
import { processAndUploadEventImage } from "@/lib/imageUtils";
import { geohashEncode } from "@/lib/geohash";
import {
  ref,
  onValue,
  set,
  get,
  update,
  push,
  remove,
} from "firebase/database";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";
import { isAdminEmail } from "@/lib/admins";
import { extractProvince, normalizeCategory, normalizeReportStatus } from "@/lib/utils";

export interface ToastMessage {
  id: number;
  type: "success" | "error" | "info";
  text: string;
}

interface AdminContextType {
  currentUser: User | null;
  adminEmail: string;
  isSuperAdmin: boolean;
  isAuthChecking: boolean;
  accessDenied: boolean;
  isLoading: boolean;
  isLiveConnected: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  eventCategoryFilter: string;
  setEventCategoryFilter: (category: string) => void;
  navigateToEventsWithCategory: (category: string) => void;
  toast: ToastMessage | null;
  dismissToast: () => void;
  // Realtime Live Data Collections
  events: EventoDB[];
  users: UtenteDB[];
  organizers: InfoEnteDB[];
  organizerRequests: RichiestaOrganizzatoreDB[];
  reports: ReportItemDB[];
  auditLogs: AuditLogDB[];
  featureFlags: FeatureFlagDB[];
  analytics: AnalyticsDB;
  onlineUsersCount: number;
  rejectedEvents: EventoRespintoModerazione[];
  categories: CategoriaDB[];
  deletedUsersCount: number;
  reviewsStats: ReviewsStats;
  chatsCount: number;
  communitiesCount: number;
  bozzeCount: number;
  // Actions
  toggleBooster: (eventId: string) => Promise<void>;
  setEventBooster: (eventId: string, scadenzaTimestamp: number, tipo?: string) => Promise<boolean>;
  toggleOscurato: (eventId: string, oscurato: boolean, motivo?: string) => Promise<void>;
  saveEventEdit: (event: EventoDB) => Promise<void>;
  deleteEvent: (eventId: string, motivo: string) => Promise<void>;
  updateUserStatus: (uid: string, nuovoStato: 'attivo' | 'sospeso' | 'bannato' | 'shadowbanned') => Promise<void>;
  deleteUser: (uid: string, motivo?: string) => Promise<boolean>;
  markRejectedEventAsExamined: (id: string) => Promise<void>;
  deleteRejectedEvent: (id: string) => Promise<void>;
  approveOrganizerRequest: (request: RichiestaOrganizzatoreDB) => Promise<void>;
  rejectOrganizerRequest: (idRichiesta: string, motivo: string) => Promise<void>;
  sendChatMessageToEnte: (idEnte: string, testo: string) => Promise<boolean>;
  suspendEnte: (idEnte: string, giorni: number, motivo: string) => Promise<boolean>;
  reactivateEnte: (idEnte: string) => Promise<boolean>;
  deleteEnte: (idEnte: string, motivo: string) => Promise<boolean>;
  toggleEnteVerificato: (idEnte: string, verificato: boolean) => Promise<boolean>;
  toggleBadgeEnte: (idEnte: string, badgeId: string) => Promise<boolean>;
  resolveReport: (reportId: string, categoria: string, note: string, idOrganizzatore?: string) => Promise<void>;
  reopenReport: (reportId: string, categoria: string, idOrganizzatore?: string) => Promise<void>;
  toggleFeatureFlag: (flagId: string) => Promise<void>;
  sendBroadcastPush: (notification: { title: string; body: string; targetProvince?: string; targetCategory?: string }) => Promise<boolean>;
  saveOrganizerEvent: (draft: OrganizerEventDraft, ente: { id: string; nome: string }, cover: File | null, programma: File | null, existingId?: string) => Promise<boolean>;
  createOwnEnte: (data: CreateOwnEnteData) => Promise<boolean>;
  deleteOwnEnte: () => Promise<boolean>;
  reinviaEmailVerificaEnte: (idEnte: string) => Promise<boolean>;
  addCategoria: (data: Partial<CategoriaDB>) => Promise<boolean>;
  updateCategoria: (categoria: CategoriaDB) => Promise<boolean>;
  toggleOscuraCategoria: (id: string, oscurata: boolean) => Promise<boolean>;
  deleteCategoria: (id: string) => Promise<boolean>;
  inizializzaCategorieDefault: () => Promise<boolean>;
  addAuditLog: (log: Omit<AuditLogDB, "id" | "timestamp" | "operatore">) => Promise<void>;
  fetchChatMessages: (chatId: string) => Promise<ChatMessageDB[]>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshData: () => void;
  currentEnv: FirebaseEnv;
  setFirebaseEnv: (env: FirebaseEnv) => void;
  isDevAuthMissing: boolean;
  authenticateDev: () => Promise<void>;
}

const defaultFeatureFlags: FeatureFlagDB[] = [
  {
    id: "ff-1",
    chiave: "manutenzione_globale",
    nome: "Kill Switch Manutenzione Globale",
    descrizione: "Blocca l'accesso a tutta l'app mobile mostrando una schermata di cortesia.",
    attivo: false,
    impatto: "critico",
    categoria: "app",
  },
  {
    id: "ff-2",
    chiave: "creazione_eventi_attiva",
    nome: "Abilita Creazione Eventi Organizzatori",
    descrizione: "Permette agli organizzatori di pubblicare nuovi eventi sull'app.",
    attivo: true,
    impatto: "alto",
    categoria: "eventi",
  },
  {
    id: "ff-3",
    chiave: "chat_supporto_attiva",
    nome: "Sistema Chat & Collaborazioni",
    descrizione: "Attiva la messaggistica bidirezionale istantanea tra utenti e organizzatori.",
    attivo: true,
    impatto: "medio",
    categoria: "chat",
  },
  {
    id: "ff-4",
    chiave: "registrazione_organizzatori",
    nome: "Accetta Nuove Richieste Organizzatore",
    descrizione: "Abilita il form per richiedere il profilo Ente / Organizzatore nell'app.",
    attivo: true,
    impatto: "medio",
    categoria: "auth",
  },
  {
    id: "ff-5",
    chiave: "ai_moderation_shield",
    nome: "Auto-Moderazione AI Preventiva",
    descrizione: "Invia automaticamente testi e immagini a Gemini prima della pubblicazione.",
    attivo: true,
    impatto: "alto",
    categoria: "eventi",
  },
];

const ONLINE_WINDOW_MS = 10 * 60 * 1000;

/** Firebase RTDB rejects `undefined`: strip it (and make the value plain JSON). */
function clean<T>(value: T): T {
  if (value === undefined) return null as unknown as T;
  return JSON.parse(JSON.stringify(value, (_k, v) => (v === undefined ? null : v)));
}

function errText(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return /permission[_ ]denied/i.test(msg)
    ? "Permesso negato dalle regole del database Firebase"
    : msg;
}

/** Only the e-mails listed in lib/admins.ts (verified by Google) can enter the panel. */
async function checkIsAdmin(user: User): Promise<boolean> {
  return user.emailVerified && isAdminEmail(user.email);
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentEnv, setCurrentEnvState] = useState<FirebaseEnv>("prod");
  const [devUser, setDevUser] = useState<User | null>(null);

  const rtdb = useMemo(() => (currentEnv === "dev" ? devRtdb : prodRtdb), [currentEnv]);
  const storage = useMemo(() => (currentEnv === "dev" ? devStorage : prodStorage), [currentEnv]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("riwy_active_env");
      if (saved === "dev" || saved === "prod") {
        setCurrentEnvState(saved);
      }
    } catch {}
  }, []);

  const setFirebaseEnv = useCallback((env: FirebaseEnv) => {
    setCurrentEnvState(env);
    try {
      localStorage.setItem("riwy_active_env", env);
    } catch {}
    setIsLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(devAuth, (u) => {
      setDevUser(u);
    });
    return () => unsub();
  }, []);
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>("all");

  const navigateToEventsWithCategory = useCallback((category: string) => {
    setEventCategoryFilter(category);
    setActiveTab("events");
  }, []);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pure Live Realtime State (NO MOCK DATA)
  const [events, setEvents] = useState<EventoDB[]>([]);
  const [users, setUsers] = useState<UtenteDB[]>([]);
  const [organizers, setOrganizers] = useState<InfoEnteDB[]>([]);
  const [organizerRequests, setOrganizerRequests] = useState<RichiestaOrganizzatoreDB[]>([]);
  const [reports, setReports] = useState<ReportItemDB[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDB[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagDB[]>(defaultFeatureFlags);
  const [analytics, setAnalytics] = useState<AnalyticsDB>({
    guestsCount: 0,
    tabViews: {},
  });
  const [rejectedEvents, setRejectedEvents] = useState<EventoRespintoModerazione[]>([]);
  const [categories, setCategories] = useState<CategoriaDB[]>([]);
  const [deletedUsersCount, setDeletedUsersCount] = useState<number>(0);
  const [reviewsStats, setReviewsStats] = useState<ReviewsStats>({ total: 0, average: "0.0" });
  const [chatsCount, setChatsCount] = useState<number>(0);
  const [communitiesCount, setCommunitiesCount] = useState<number>(0);
  const [bozzeCount, setBozzeCount] = useState<number>(0);

  const notify = useCallback((type: ToastMessage["type"], text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), type, text });
    toastTimer.current = setTimeout(() => setToast(null), type === "error" ? 7000 : 3500);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const authenticateDev = useCallback(async () => {
    try {
      await signInWithPopup(devAuth, googleProvider);
      notify("success", "Autenticato con successo su Rook Dev!");
    } catch (e: any) {
      if (e?.code === "auth/popup-closed-by-user" || e?.code === "auth/cancelled-popup-request") return;
      console.error("Dev sign in error:", e);
      notify("error", `Accesso Dev non riuscito: ${errText(e)}`);
    }
  }, [notify]);

  const isDevAuthMissing = currentEnv === "dev" && isSuperAdmin && !devUser;

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // 1. Authentication: only a signed-in (non anonymous) Google account listed in /admins gets in.
  useEffect(() => {
    let isMounted = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      // Sessions left over from the old "auto anonymous login" must not grant access.
      if (!user || user.isAnonymous) {
        if (user?.isAnonymous) {
          try {
            await signOut(auth);
          } catch {
            /* ignore */
          }
        }
        if (!isMounted) return;
        setCurrentUser(null);
        setAdminEmail("");
        setIsSuperAdmin(false);
        setAccessDenied(false);
        setIsLoading(false);
        setIsAuthChecking(false);
        return;
      }

      setIsAuthChecking(true);
      try {
        const ok = await checkIsAdmin(user);
        if (!isMounted) return;
        setCurrentUser(user);
        setAdminEmail(user.email || "");
        setIsSuperAdmin(ok);
        setAccessDenied(!ok);
        if (!ok) setIsLoading(false);
      } catch (e) {
        if (!isMounted) return;
        console.warn("Admin check error:", e);
        setCurrentUser(user);
        setAdminEmail(user.email || "");
        setIsSuperAdmin(false);
        setAccessDenied(true);
        setIsLoading(false);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // 2. Realtime RTDB Subscriptions (only for verified admins)
  useEffect(() => {
    if (!isSuperAdmin) {
      setEvents([]);
      setUsers([]);
      setOrganizers([]);
      setOrganizerRequests([]);
      setReports([]);
      setAuditLogs([]);
      setDeletedUsersCount(0);
      setReviewsStats({ total: 0, average: "0.0" });
      setChatsCount(0);
      setCommunitiesCount(0);
      setBozzeCount(0);
      setIsLiveConnected(false);
      return;
    }

    const unsubs: (() => void)[] = [];
    const fail = (label: string) => (err: Error) => {
      console.warn(`RTDB ${label} error:`, err.message);
      notify("error", `Lettura /${label} non riuscita: ${errText(err)}`);
    };

    try {
      // Eventi listener (/eventi)
      unsubs.push(
        onValue(
          ref(rtdb, "eventi"),
          (snap) => {
            setIsLoading(false);
            if (snap.exists()) {
              const list: EventoDB[] = Object.entries(snap.val() as Record<string, any>).map(
                ([k, v]) => ({
                  ...v,
                  id: k,
                  provincia: v.provincia || extractProvince(v.luogo),
                  categoria: normalizeCategory(v.categoria),
                })
              );
              setEvents(list);
            } else {
              setEvents([]);
            }
          },
          (err) => {
            setIsLoading(false);
            fail("eventi")(err);
          }
        )
      );

      // Utenti listener (/utenti)
      unsubs.push(
        onValue(
          ref(rtdb, "utenti"),
          (snap) => {
            if (snap.exists()) {
              const list: UtenteDB[] = Object.entries(snap.val() as Record<string, any>).map(
                ([k, v]) => ({
                  ...v,
                  firebaseUid: k,
                  email: v.email || "N/D",
                  username: v.username || v.nome || "Utente",
                  provincia: v.provincia || "",
                })
              );
              setUsers(list);
            } else {
              setUsers([]);
            }
          },
          fail("utenti")
        )
      );

      // Enti listener (/enti)
      unsubs.push(
        onValue(
          ref(rtdb, "enti"),
          (snap) => {
            if (snap.exists()) {
              const list: InfoEnteDB[] = Object.entries(snap.val() as Record<string, any>).map(
                ([k, v]) => {
                  const isVerificato = v.verificato === true;
                  const rawBadges = Array.isArray(v.badges)
                    ? v.badges
                    : v.badges && typeof v.badges === "object"
                    ? Object.keys(v.badges).filter((b) => v.badges[b] === true)
                    : [];
                  const badgesList = Array.from(
                    new Set([...rawBadges, ...(isVerificato ? ["VERIFICATO"] : [])])
                  );
                  return {
                    ...v,
                    idEnte: k,
                    verificato: isVerificato,
                    badges: badgesList,
                  };
                }
              );
              setOrganizers(list);
            } else {
              setOrganizers([]);
            }
          },
          fail("enti")
        )
      );

      // Richieste Organizzatori listener (/richieste_organizzatori) — keyed by user UID in the app
      unsubs.push(
        onValue(
          ref(rtdb, "richieste_organizzatori"),
          (snap) => {
            if (snap.exists()) {
              const list: RichiestaOrganizzatoreDB[] = Object.entries(
                snap.val() as Record<string, any>
              ).map(([k, v]) => ({
                ...v,
                idRichiesta: k,
                uidUtente: v.uidUtente || k,
              }));
              setOrganizerRequests(list);
            } else {
              setOrganizerRequests([]);
            }
          },
          fail("richieste_organizzatori")
        )
      );

      // Reports listener (/reports/$category/$reportId) — Android writes IN_ATTESA, idEvento, titoloEvento...
      unsubs.push(
        onValue(
          ref(rtdb, "reports"),
          (snap) => {
            if (snap.exists()) {
              const list: ReportItemDB[] = [];
              Object.entries(snap.val() as Record<string, any>).forEach(([categoryKey, catVal]) => {
                if (typeof catVal !== "object" || catVal === null) return;
                Object.entries(catVal as Record<string, any>).forEach(([repId, r]) => {
                  if (typeof r !== "object" || r === null) return;
                  const isChat =
                    categoryKey === "chats" ||
                    categoryKey === "chat" ||
                    categoryKey === "users" ||
                    categoryKey === "user" ||
                    String(r.tipo || "").toLowerCase() === "chat";
                  const idEv = r.idEvento || (categoryKey === "events" ? (r.targetId || repId) : undefined);
                  const idOrg = r.idOrganizzatore || undefined;
                  const nomeOrg = r.organizzatore || r.nomeOrganizzatore || undefined;
                  const nomeTargetUser = r.nomeSegnalato || r.nomeControparte || undefined;
                  const idTargetUser = r.idSegnalato || r.idControparte || undefined;
                  const idReporterUser = r.idSegnalatore || r.idSegnalante || r.segnalatoreUid || undefined;
                  const nomeReporterUser = r.nomeSegnalatore || r.nomeSegnalante || undefined;
                  const tit =
                    r.titoloEvento ||
                    r.titoloTarget ||
                    r.titolo ||
                    (isChat
                      ? nomeTargetUser
                        ? `Chat con ${nomeTargetUser}`
                        : "Segnalazione Chat"
                      : undefined);
                  const segn =
                    r.emailSegnalante ||
                    r.segnalatoDa ||
                    r.emailUtente ||
                    r.segnalatoreUid ||
                    idReporterUser ||
                    undefined;
                  const det = r.dettaglio || r.descrizione || r.dettagli || undefined;

                  let parsedUltimiMessaggi: string | undefined = undefined;
                  if (typeof r.ultimiMessaggi === "string") {
                    parsedUltimiMessaggi = r.ultimiMessaggi;
                  } else if (Array.isArray(r.ultimiMessaggi)) {
                    parsedUltimiMessaggi = r.ultimiMessaggi
                      .map((m: any) => {
                        if (!m) return "";
                        if (typeof m === "string") return m;
                        const sender = m.nome || m.senderName || m.da || "";
                        const text = m.testo || m.text || m.message || "";
                        return sender ? `${sender}: ${text}` : text;
                      })
                      .filter(Boolean)
                      .join(" | ");
                  } else if (r.ultimiMessaggi && typeof r.ultimiMessaggi === "object") {
                    parsedUltimiMessaggi = r.ultimiMessaggi.testo || r.ultimiMessaggi.text || JSON.stringify(r.ultimiMessaggi);
                  }

                  list.push({
                    ...r,
                    id: String(repId),
                    categoria: categoryKey,
                    targetId: String(r.targetId || r.chatRoomId || r.chatId || r.idEvento || r.idOrganizzatore || repId),
                    idEvento: idEv ? String(idEv) : undefined,
                    titoloEvento: tit ? String(tit) : undefined,
                    titoloTarget: tit ? String(tit) : undefined,
                    idOrganizzatore: idOrg ? String(idOrg) : undefined,
                    organizzatore: nomeOrg ? String(nomeOrg) : undefined,
                    nomeOrganizzatore: nomeOrg ? String(nomeOrg) : undefined,
                    chatRoomId: r.chatRoomId ? String(r.chatRoomId) : r.chatId ? String(r.chatId) : undefined,
                    chatId: r.chatId ? String(r.chatId) : r.chatRoomId ? String(r.chatRoomId) : undefined,
                    idSegnalato: idTargetUser ? String(idTargetUser) : undefined,
                    nomeSegnalato: nomeTargetUser ? String(nomeTargetUser) : undefined,
                    idControparte: r.idControparte ? String(r.idControparte) : undefined,
                    nomeControparte: r.nomeControparte ? String(r.nomeControparte) : undefined,
                    idSegnalatore: idReporterUser ? String(idReporterUser) : undefined,
                    idSegnalante: r.idSegnalante ? String(r.idSegnalante) : undefined,
                    nomeSegnalatore: nomeReporterUser ? String(nomeReporterUser) : undefined,
                    nomeSegnalante: nomeReporterUser ? String(nomeReporterUser) : undefined,
                    ultimiMessaggi: parsedUltimiMessaggi,
                    segnalatoreUid: segn ? String(segn) : undefined,
                    emailSegnalante: r.emailSegnalante ? String(r.emailSegnalante) : undefined,
                    emailUtente: r.emailUtente ? String(r.emailUtente) : undefined,
                    segnalatoDa: r.segnalatoDa ? String(r.segnalatoDa) : undefined,
                    motivo: String(r.motivo || r.titolo || "Nessun motivo"),
                    dettaglio: det ? String(det) : undefined,
                    descrizione: det ? String(det) : undefined,
                    dispositivo: r.dispositivo ? String(r.dispositivo) : undefined,
                    versioneApp: r.versioneApp ? String(r.versioneApp) : undefined,
                    gravita: r.gravita ? String(r.gravita) : undefined,
                    stato: normalizeReportStatus(r.stato),
                  });
                });
              });
              list.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
              setReports(list);
            } else {
              setReports([]);
            }
          },
          fail("reports")
        )
      );

      // Audit Logs listener (/audit_logs)
      unsubs.push(
        onValue(
          ref(rtdb, "audit_logs"),
          (snap) => {
            if (snap.exists()) {
              const list: AuditLogDB[] = Object.entries(snap.val() as Record<string, any>)
                .map(([k, v]) => ({ ...v, id: k }))
                .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
              setAuditLogs(list);
            } else {
              setAuditLogs([]);
            }
          },
          fail("audit_logs")
        )
      );

      // Analytics listener (/analytics)
      unsubs.push(
        onValue(
          ref(rtdb, "analytics"),
          (snap) => {
            if (snap.exists()) {
              const val = snap.val();
              setAnalytics({
                guestsCount: Number(val.guests_count || 0),
                tabViews: val.tab_views || {},
                scrollEvents: val.scroll_events || {},
              });
            }
          },
          fail("analytics")
        )
      );

      // Realtime connection status (.info/connected) — reflects the real socket state
      unsubs.push(
        onValue(ref(rtdb, ".info/connected"), (snap) => {
          setIsLiveConnected(snap.val() === true);
        })
      );

      // Feature Flags listener (/feature_flags)
      unsubs.push(
        onValue(
          ref(rtdb, "feature_flags"),
          (snap) => {
            const val = snap.exists() ? snap.val() : {};
            setFeatureFlags(
              defaultFeatureFlags.map((f) =>
                val[f.chiave] !== undefined ? { ...f, attivo: Boolean(val[f.chiave]) } : f
              )
            );
          },
          fail("feature_flags")
        )
      );

      // Moderazione Respinti (/moderazione_respinti)
      unsubs.push(
        onValue(
          ref(rtdb, "moderazione_respinti"),
          (snap) => {
            if (snap.exists()) {
              const list: EventoRespintoModerazione[] = Object.entries(
                snap.val() as Record<string, any>
              )
                .map(([k, v]) => ({
                  ...v,
                  id: k,
                  timestamp: Number(v.timestamp || 0),
                  letto: Boolean(v.letto),
                }))
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              setRejectedEvents(list);
            } else {
              setRejectedEvents([]);
            }
          },
          fail("moderazione_respinti")
        )
      );

      // Categorie listener (/categorie)
      unsubs.push(
        onValue(
          ref(rtdb, "categorie"),
          (snap) => {
            if (snap.exists()) {
              const val = snap.val() as Record<string, any>;
              const list: CategoriaDB[] = Object.entries(val)
                .map(([k, v]) => ({
                  id: k,
                  nome: v.nome || v.nome_it || k,
                  nome_it: v.nome_it || v.nome || k,
                  nome_en: v.nome_en || "",
                  nome_de: v.nome_de || "",
                  nome_es: v.nome_es || "",
                  nome_fr: v.nome_fr || "",
                  icon_key: v.icon_key || "tag",
                  color_hex: v.color_hex || "#f59e0b",
                  ordine: typeof v.ordine === "number" ? v.ordine : 99,
                  attivo: v.attivo !== false,
                  sottocategorie: Array.isArray(v.sottocategorie) ? v.sottocategorie : [],
                }))
                .sort((a, b) => (a.ordine ?? 99) - (b.ordine ?? 99));
              setCategories(list);
            } else {
              setCategories([]);
            }
          },
          fail("categorie")
        )
      );

      // Utenti Eliminati (Tombstone) listener (/utenti_eliminati)
      unsubs.push(
        onValue(
          ref(rtdb, "utenti_eliminati"),
          (snap) => {
            if (snap.exists()) {
              setDeletedUsersCount(Object.keys(snap.val() as Record<string, any>).length);
            } else {
              setDeletedUsersCount(0);
            }
          },
          () => setDeletedUsersCount(0)
        )
      );

      // Recensioni listener (/recensioni)
      unsubs.push(
        onValue(
          ref(rtdb, "recensioni"),
          (snap) => {
            if (snap.exists()) {
              const val = snap.val() as Record<string, any>;
              let total = 0;
              let sum = 0;
              Object.values(val).forEach((eventReviews) => {
                if (typeof eventReviews === "object" && eventReviews !== null) {
                  Object.values(eventReviews).forEach((rev: any) => {
                    if (typeof rev === "object" && rev !== null) {
                      total++;
                      const rating = Number(rev.rating || rev.voto || rev.stelle || 0);
                      if (rating > 0) sum += rating;
                    }
                  });
                }
              });
              setReviewsStats({
                total,
                average: total > 0 ? (sum / total).toFixed(1) : "0.0",
              });
            } else {
              setReviewsStats({ total: 0, average: "0.0" });
            }
          },
          () => setReviewsStats({ total: 0, average: "0.0" })
        )
      );

      // Chats listener (/chats)
      unsubs.push(
        onValue(
          ref(rtdb, "chats"),
          (snap) => {
            if (snap.exists()) {
              setChatsCount(Object.keys(snap.val() as Record<string, any>).length);
            } else {
              setChatsCount(0);
            }
          },
          () => setChatsCount(0)
        )
      );

      // Communities listener (/communities)
      unsubs.push(
        onValue(
          ref(rtdb, "communities"),
          (snap) => {
            if (snap.exists()) {
              setCommunitiesCount(Object.keys(snap.val() as Record<string, any>).length);
            } else {
              setCommunitiesCount(0);
            }
          },
          () => setCommunitiesCount(0)
        )
      );

      // Bozze Organizzatori listener (/bozze_organizzatori)
      unsubs.push(
        onValue(
          ref(rtdb, "bozze_organizzatori"),
          (snap) => {
            if (snap.exists()) {
              const val = snap.val() as Record<string, any>;
              let totalBozze = 0;
              Object.values(val).forEach((userBozze) => {
                if (typeof userBozze === "object" && userBozze !== null) {
                  totalBozze += Object.keys(userBozze).length;
                }
              });
              setBozzeCount(totalBozze);
            } else {
              setBozzeCount(0);
            }
          },
          () => setBozzeCount(0)
        )
      );
    } catch (e) {
      console.warn("Subscription setup error:", e);
      setIsLoading(false);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [isSuperAdmin, rtdb, refreshKey, notify]);

  // "Online" = users whose app wrote a recent `ultimoAccesso` (real data, no estimation).
  const onlineUsersCount = useMemo(() => {
    const now = Date.now();
    return users.filter((u) => Number(u.ultimoAccesso || 0) > now - ONLINE_WINDOW_MS).length;
  }, [users]);

  // Helper Audit Logger (writes to /audit_logs in Firebase)
  const addAuditLog = useCallback(
    async (logData: Omit<AuditLogDB, "id" | "timestamp" | "operatore">) => {
      const newLog: AuditLogDB = clean({
        id: "aud-" + Date.now(),
        operatore: {
          uid: currentUser?.uid || "",
          email: adminEmail,
          ruolo: "superadmin",
        },
        timestamp: Date.now(),
        ...logData,
      });

      try {
        await push(ref(rtdb, "audit_logs"), newLog);
      } catch (e) {
        console.error("Errore salvataggio audit log:", e);
        notify("error", `Azione eseguita ma audit log non salvato: ${errText(e)}`);
      }
    }, [currentUser, adminEmail, notify, rtdb]);

  const fetchChatMessages = useCallback(
    async (chatId: string): Promise<ChatMessageDB[]> => {
      if (!chatId) return [];
      try {
        const snap = await get(ref(rtdb, `chats/${chatId}/messages`));
        if (!snap.exists()) return [];
        const val = snap.val();
        const msgs: ChatMessageDB[] = Object.entries(val).map(([k, v]: [string, any]) => ({
          id: k,
          chatId: v.chatId || chatId,
          senderId: v.senderId || "",
          senderName: v.senderName || "",
          senderRole: v.senderRole || "UTENTE",
          testo: v.testo || "",
          timestamp: Number(v.timestamp || 0),
        }));
        msgs.sort((a, b) => a.timestamp - b.timestamp);
        return msgs;
      } catch (err) {
        console.error("Errore recupero messaggi chat:", err);
        return [];
      }
    },
    [rtdb]
  );

  // 1. Set / Toggle Booster Manuale
  const setEventBooster = useCallback(
    async (eventId: string, scadenzaTimestamp: number, tipo: string = "GOLD"): Promise<boolean> => {
      const ev = events.find((e) => e.id === eventId);
      if (!ev) return false;

      const isDisattivazione = scadenzaTimestamp <= Date.now();
      const finalScadenza = isDisattivazione ? 0 : scadenzaTimestamp;
      const finalTipo = isDisattivazione ? "" : tipo;

      try {
        await update(ref(rtdb, `eventi/${eventId}`), {
          boostScadenza: finalScadenza,
          boostTipo: finalTipo,
        });

        notify(
          "success",
          isDisattivazione
            ? `Booster disattivato per '${ev.titolo}'`
            : `Booster ${finalTipo} attivato per '${ev.titolo}' fino al ${new Date(finalScadenza).toLocaleString("it-IT")}`
        );

        await addAuditLog({
          azione: isDisattivazione ? "DISATTIVAZIONE_BOOSTER" : "ATTIVAZIONE_BOOSTER",
          targetTipo: "evento",
          targetId: eventId,
          dettagli: isDisattivazione
            ? `Booster rimosso per '${ev.titolo}'`
            : `Booster '${finalTipo}' impostato manualmente fino al ${new Date(finalScadenza).toLocaleString("it-IT")} per '${ev.titolo}'`,
          diffPrima: { boostScadenza: ev.boostScadenza ?? null, boostTipo: ev.boostTipo ?? null },
          diffDopo: { boostScadenza: finalScadenza, boostTipo: finalTipo },
        });
        return true;
      } catch (e) {
        console.error("Errore impostazione booster:", e);
        notify("error", `Booster non modificato: ${errText(e)}`);
        return false;
      }
    },
    [events, addAuditLog, notify, rtdb]
  );

  const toggleBooster = useCallback(
    async (eventId: string) => {
      const ev = events.find((e) => e.id === eventId);
      if (!ev) return;
      const isAttivo = Number(ev.boostScadenza || 0) > Date.now();
      const nextScadenza = isAttivo ? 0 : Date.now() + 86400000 * 7;
      await setEventBooster(eventId, nextScadenza, "GOLD");
    },
    [events, setEventBooster]
  );

  // 2. Toggle Oscurato / Sospeso
  const toggleOscurato = useCallback(
    async (eventId: string, oscurato: boolean, motivo?: string) => {
      const ev = events.find((e) => e.id === eventId);
      if (!ev) return;

      try {
        await set(ref(rtdb, `eventi/${eventId}/oscurato`), oscurato);
        notify("success", oscurato ? "Evento oscurato" : "Evento ripristinato");

        await addAuditLog({
          azione: oscurato ? "OSCURAMENTO_EVENTO" : "RIPRISTINO_EVENTO",
          targetTipo: "evento",
          targetId: eventId,
          dettagli: `${oscurato ? "Oscurato/Nascosto" : "Ripristinato"} evento '${ev.titolo}'. ${motivo ? "Motivo: " + motivo : ""}`,
          diffPrima: { oscurato: ev.oscurato ?? false },
          diffDopo: { oscurato, motivo: motivo ?? null },
        });
      } catch (e) {
        console.error("Errore oscuramento:", e);
        notify("error", `Visibilità non modificata: ${errText(e)}`);
      }
    },
    [events, addAuditLog, notify, rtdb]
  );

  // 3. Save Event Edit — only the fields editable from the panel are written
  //    (never the computed helpers `id`, `provincia`, `comune`).
  const saveEventEdit = useCallback(
    async (edited: EventoDB) => {
      const oldEvent = events.find((e) => e.id === edited.id);
      const pick = (e: Partial<EventoDB> | undefined) => ({
        titolo: e?.titolo ?? "",
        categoria: e?.categoria ?? "",
        luogo: e?.luogo ?? "",
        descrizione: e?.descrizione ?? "",
        accessibileDisabili: e?.accessibileDisabili ?? false,
        opzioniVeg: e?.opzioniVeg ?? false,
      });
      const payload = pick(edited);

      try {
        await update(ref(rtdb, `eventi/${edited.id}`), payload);
        notify("success", "Evento aggiornato");

        await addAuditLog({
          azione: "MODIFICA_DATI_EVENTO",
          targetTipo: "evento",
          targetId: edited.id,
          dettagli: `Aggiornati dati evento '${edited.titolo}'`,
          diffPrima: pick(oldEvent),
          diffDopo: payload,
        });
      } catch (e) {
        console.error("Errore salvataggio evento:", e);
        notify("error", `Evento non salvato: ${errText(e)}`);
      }
    },
    [events, addAuditLog, notify, rtdb]
  );

  // 4. Delete Event
  const deleteEvent = useCallback(
    async (eventId: string, motivo: string) => {
      const ev = events.find((e) => e.id === eventId);
      if (!ev) return;

      try {
        // Audit first: the snapshot of the deleted event is the only way to restore it.
        await addAuditLog({
          azione: "ELIMINAZIONE_EVENTO",
          targetTipo: "evento",
          targetId: eventId,
          dettagli: `Eliminato evento '${ev.titolo}'. Motivo: ${motivo}`,
          diffPrima: ev,
          diffDopo: null,
        });
        await remove(ref(rtdb, `eventi/${eventId}`));
        notify("success", "Evento eliminato");
      } catch (e) {
        console.error("Errore eliminazione evento:", e);
        notify("error", `Evento non eliminato: ${errText(e)}`);
      }
    },
    [events, addAuditLog, notify, rtdb]
  );

  // 5. Update User Status
  const updateUserStatus = useCallback(
    async (uid: string, nuovoStato: 'attivo' | 'sospeso' | 'bannato' | 'shadowbanned') => {
      const u = users.find((usr) => usr.firebaseUid === uid);
      if (!u) return;

      const isSospeso = nuovoStato === "sospeso" || nuovoStato === "bannato";

      try {
        await update(ref(rtdb, `utenti/${uid}`), {
          stato: nuovoStato,
          sospeso: isSospeso,
        });
        notify("success", `Utente impostato su "${nuovoStato}"`);

        await addAuditLog({
          azione: "MODIFICA_STATO_UTENTE",
          targetTipo: "utente",
          targetId: uid,
          dettagli: `Stato utente '${u.username || u.email}' aggiornato in: ${nuovoStato}`,
          diffPrima: { stato: u.stato ?? "attivo", sospeso: u.sospeso ?? false },
          diffDopo: { stato: nuovoStato, sospeso: isSospeso },
        });
      } catch (e) {
        console.error("Errore aggiornamento utente:", e);
        notify("error", `Utente non aggiornato: ${errText(e)}`);
      }
    },
    [users, addAuditLog, notify, rtdb]
  );

  // 5.1 Delete User from database (/utenti/$uid) + Tombstone for Backup Sanitation
  const deleteUser = useCallback(
    async (uid: string, motivo: string = ""): Promise<boolean> => {
      const u = users.find((x) => x.firebaseUid === uid);
      try {
        // 1. Registra nel tombstone per la bonifica post-restore dei backup (GDPR Art. 17)
        await set(ref(rtdb, `utenti_eliminati/${uid}`), {
          uid,
          timestamp: Date.now(),
          dataEliminazione: Date.now(),
          eliminatoDa: adminEmail || "RIWY_ADMIN",
          email: u?.email || "N/D",
          username: u?.username || "Utente",
          motivo: motivo || "Eliminazione manuale da pannello RIWY",
        });

        // 2. Rimuove il profilo attivo
        await remove(ref(rtdb, `utenti/${uid}`));

        // 3. Rimuove i dati accessori collegati all'UID
        await remove(ref(rtdb, `preferiti/${uid}`));
        await remove(ref(rtdb, `organizzatori_seguiti/${uid}`));
        await remove(ref(rtdb, `bozze_organizzatori/${uid}`));

        notify(
          "success",
          `Utente '${u?.username || u?.email || uid}' eliminato definitivamente e registrato in utenti_eliminati per bonifica backup.`
        );

        await addAuditLog({
          azione: "ELIMINAZIONE_UTENTE",
          targetTipo: "utente",
          targetId: uid,
          dettagli: `Utente '${u?.username || u?.email || uid}' rimosso dal database e registrato per bonifica backup. Motivo: ${motivo || "Nessun motivo specificato"}`,
          diffPrima: { username: u?.username, email: u?.email, stato: u?.stato, isEnte: u?.isEnte },
          diffDopo: null,
        });
        return true;
      } catch (e) {
        console.error("Errore eliminazione utente:", e);
        notify("error", `Errore durante l'eliminazione dell'utente: ${errText(e)}`);
        return false;
      }
    },
    [users, adminEmail, addAuditLog, notify, rtdb]
  );

  // 6. Approve Organizer Request — mirrors EventoRepository.accettaRichiestaOrganizzatore
  //    (ente and request are keyed by the requesting user's UID).
  const approveOrganizerRequest = useCallback(
    async (req: RichiestaOrganizzatoreDB) => {
      if (req.stato && req.stato !== "IN_ATTESA") {
        notify("info", "Richiesta già gestita");
        return;
      }
      const uid = req.uidUtente || req.idRichiesta;

      try {
        const user = users.find((u) => u.firebaseUid === uid);
        const enteId = user?.idEnteGestito || uid;
        const enteRef = ref(rtdb, `enti/${enteId}`);
        const existing = await get(enteRef);

        const enteData: Record<string, any> = {
          nomeEnte: req.nomeEnte,
          emailEnte: req.emailEnte || req.emailRichiedente || null,
          telefonoEnte: req.telefonoEnte || null,
          referenteOrg: req.referenteOrg || req.usernameRichiedente || null,
          sedeOrg: req.sedeOrg || null,
          descEnte: req.descEnte || null,
          comuneEnte: req.comuneEnte || null,
          provinciaEnte: req.provinciaEnte || null,
          sitoWeb: req.sitoWeb || null,
          instagram: req.instagram || null,
          facebook: req.facebook || null,
          tiktok: req.tiktok || null,
          linkedin: req.linkedin || null,
        };
        if (!existing.exists()) {
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          const code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
          enteData.enteSince = req.dataRichiesta || new Date().toISOString();
          enteData.idCreatore = uid;
          enteData.passwordStaff = `ROOK-${1000 + Math.floor(Math.random() * 9000)}-${code}`;
          enteData.verificato = false; // Nuovo ente NON parte verificato
        } else {
          enteData.verificato = existing.val().verificato === true;
        }
        await update(enteRef, enteData);

        await update(ref(rtdb, `utenti/${uid}`), {
          isEnte: true,
          ente: true,
          idEnteGestito: enteId,
        });
        await update(ref(rtdb, `richieste_organizzatori/${req.idRichiesta}`), { stato: "APPROVATA" });
        notify("success", `Ente "${req.nomeEnte}" approvato`);

        await addAuditLog({
          azione: "APPROVAZIONE_RICHIESTA_ORGANIZZATORE",
          targetTipo: "ente",
          targetId: enteId,
          dettagli: `Approvata richiesta e promosso utente '${req.emailRichiedente || uid}' per '${req.nomeEnte}'`,
          diffPrima: { stato: req.stato ?? "IN_ATTESA" },
          diffDopo: { stato: "APPROVATA", enteId },
        });
      } catch (e) {
        console.error("Errore approvazione richiesta ente:", e);
        notify("error", `Richiesta non approvata: ${errText(e)}`);
      }
    },
    [users, addAuditLog, notify, rtdb]
  );

  // 7. Reject Organizer Request
  const rejectOrganizerRequest = useCallback(
    async (idRichiesta: string, motivo: string) => {
      try {
        const now = Date.now();
        const req = organizerRequests.find((r) => r.idRichiesta === idRichiesta);
        const uid = req?.uidUtente || idRichiesta;

        await update(ref(rtdb, `richieste_organizzatori/${idRichiesta}`), {
          stato: "RIFIUTATA",
          motivoRifiuto: motivo,
          timestampRifiuto: now,
        });

        // Assicura che l'utente non rimanga flaggato come ente
        if (uid) {
          try {
            await update(ref(rtdb, `utenti/${uid}`), {
              isEnte: false,
              ente: false,
            });
          } catch {
            // Ignora se non necessario
          }
        }

        notify("success", "Richiesta respinta");

        await addAuditLog({
          azione: "RIFIUTO_RICHIESTA_ORGANIZZATORE",
          targetTipo: "ente",
          targetId: idRichiesta,
          dettagli: `Rifiutata richiesta organizzatore. Motivo: ${motivo}`,
          diffPrima: { stato: "IN_ATTESA" },
          diffDopo: { stato: "RIFIUTATA", motivo, timestampRifiuto: now },
        });
      } catch (e) {
        console.error("Errore rifiuto richiesta ente:", e);
        notify("error", `Richiesta non respinta: ${errText(e)}`);
      }
    },
    [organizerRequests, addAuditLog, notify, rtdb]
  );

  // 7a. Send Chat Message to Ente (writes to /chats/admin_${idEnte} and notifies organizer)
  const sendChatMessageToEnte = useCallback(
    async (idEnte: string, testo: string): Promise<boolean> => {
      const ente = organizers.find((o) => o.idEnte === idEnte);
      const text = testo.trim();
      if (!text) {
        notify("error", "Il messaggio non può essere vuoto");
        return false;
      }
      const now = Date.now();
      const chatId = `admin_${idEnte}`;

      try {
        const roomRef = ref(rtdb, `chats/${chatId}`);
        const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
        const newMsgRef = push(messagesRef);
        const msgId = newMsgRef.key || `${now}`;

        const msgPayload = {
          id: msgId,
          chatId,
          senderId: "admin",
          senderName: "Amministrazione Rook",
          senderRole: "ADMIN",
          testo: text,
          timestamp: now,
          tipo: "TESTO",
        };

        const roomPayload = {
          id: chatId,
          tipo: "ADMIN_ORGANIZZATORE",
          idEvento: "",
          titoloEvento: "Assistenza & Supporto Amministrazione",
          dataFineEvento: 0,
          idOrganizzatore: idEnte,
          nomeOrganizzatore: ente?.nomeEnte || "Organizzatore",
          idUtente: ente?.idCreatore || idEnte,
          nomeUtente: ente?.nomeEnte || "Organizzatore",
          ultimoMessaggio: text,
          timestampUltimoMessaggio: now,
          ultimoMittenteId: "admin",
          ultimoMittenteRole: "ADMIN",
          lettoDaUtente: true,
          lettoDaOrganizzatore: false,
          lettoDaAdmin: true,
        };

        await update(roomRef, roomPayload);
        await set(newMsgRef, msgPayload);

        await addAuditLog({
          azione: "INVIO_CHAT_ENTE",
          targetTipo: "ente",
          targetId: idEnte,
          dettagli: `Inviato messaggio in chat a '${ente?.nomeEnte || idEnte}': "${text.slice(0, 80)}"`,
          diffPrima: null,
          diffDopo: { testo: text },
        });

        notify("success", "Messaggio inviato all'ente in chat");
        return true;
      } catch (e) {
        console.error("Errore invio chat ente:", e);
        notify("error", `Invio messaggio non riuscito: ${errText(e)}`);
        return false;
      }
    },
    [organizers, addAuditLog, notify, rtdb]
  );

  // 7b. Suspend Ente for N days (with in-app notification)
  const suspendEnte = useCallback(
    async (idEnte: string, giorni: number, motivo: string): Promise<boolean> => {
      const ente = organizers.find((o) => o.idEnte === idEnte);
      const days = Math.max(1, Math.round(giorni || 1));
      const reason = motivo.trim() || "Verifica amministrativa";
      const now = Date.now();
      const sospesoFino = now + days * 24 * 60 * 60 * 1000;

      try {
        await update(ref(rtdb, `enti/${idEnte}`), {
          sospeso: true,
          sospesoFino,
          motivoSospensione: reason,
        });

        // Aggiorna anche l'utente collegato
        try {
          await update(ref(rtdb, `utenti/${idEnte}`), {
            sospesoEnte: true,
            sospesoFinoEnte: sospesoFino,
            motivoSospensioneEnte: reason,
          });
        } catch (_) {}

        // Invia notifica in-app all'interessato
        const notifRef = push(ref(rtdb, `notifiche_organizzatori/${idEnte}`));
        const notifId = notifRef.key || `notif_${now}`;
        await set(notifRef, {
          idNotifica: notifId,
          tipo: "SOSPENSIONE_ENTE",
          titoloEvento: "Profilo Ente Sospeso",
          nomeMittente: "Amministrazione Rook",
          uidMittente: "admin",
          messaggio: `Il tuo profilo ente '${ente?.nomeEnte || "Organizzatore"}' è stato sospeso per ${days} giorn${days === 1 ? 'o' : 'i'}. Motivo: ${reason}`,
          timestamp: now,
          letta: false,
        });

        await addAuditLog({
          azione: "SOSPENSIONE_ENTE",
          targetTipo: "ente",
          targetId: idEnte,
          dettagli: `Ente '${ente?.nomeEnte || idEnte}' sospeso per ${days} giorni. Motivo: ${reason}`,
          diffPrima: { sospeso: ente?.sospeso ?? false },
          diffDopo: { sospeso: true, sospesoFino, motivo: reason },
        });

        notify("success", `Ente sospeso per ${days} giorni. Notifica inviata in app.`);
        return true;
      } catch (e) {
        console.error("Errore sospensione ente:", e);
        notify("error", `Sospensione fallita: ${errText(e)}`);
        return false;
      }
    },
    [organizers, addAuditLog, notify, rtdb]
  );

  // 7c. Reactivate Ente
  const reactivateEnte = useCallback(
    async (idEnte: string): Promise<boolean> => {
      const ente = organizers.find((o) => o.idEnte === idEnte);
      const now = Date.now();
      try {
        await update(ref(rtdb, `enti/${idEnte}`), {
          sospeso: false,
          sospesoFino: null,
          motivoSospensione: null,
        });

        try {
          await update(ref(rtdb, `utenti/${idEnte}`), {
            sospesoEnte: false,
            sospesoFinoEnte: null,
            motivoSospensioneEnte: null,
          });
        } catch (_) {}

        const notifRef = push(ref(rtdb, `notifiche_organizzatori/${idEnte}`));
        const notifId = notifRef.key || `notif_${now}`;
        await set(notifRef, {
          idNotifica: notifId,
          tipo: "RIATTIVAZIONE_ENTE",
          titoloEvento: "Sospensione Revocata",
          nomeMittente: "Amministrazione Rook",
          uidMittente: "admin",
          messaggio: `La sospensione del profilo '${ente?.nomeEnte || "Organizzatore"}' è stata revocata dall'amministrazione. Puoi tornare a gestire i tuoi eventi.`,
          timestamp: now,
          letta: false,
        });

        await addAuditLog({
          azione: "RIATTIVAZIONE_ENTE",
          targetTipo: "ente",
          targetId: idEnte,
          dettagli: `Revocata la sospensione per l'ente '${ente?.nomeEnte || idEnte}'.`,
          diffPrima: { sospeso: true },
          diffDopo: { sospeso: false },
        });

        notify("success", "Sospensione revocata. Ente riattivato.");
        return true;
      } catch (e) {
        console.error("Errore riattivazione ente:", e);
        notify("error", `Riattivazione fallita: ${errText(e)}`);
        return false;
      }
    },
    [organizers, addAuditLog, notify, rtdb]
  );

  // 7d. Delete Ente (with in-app notification)
  const deleteEnte = useCallback(
    async (idEnte: string, motivo: string): Promise<boolean> => {
      const ente = organizers.find((o) => o.idEnte === idEnte);
      const reason = motivo.trim() || "Chiusura profilo da parte dell'amministrazione";
      const now = Date.now();

      try {
        // Invia notifica in-app prima della rimozione
        const notifRef = push(ref(rtdb, `notifiche_organizzatori/${idEnte}`));
        const notifId = notifRef.key || `notif_${now}`;
        await set(notifRef, {
          idNotifica: notifId,
          tipo: "ELIMINAZIONE_ENTE",
          titoloEvento: "Profilo Ente Eliminato",
          nomeMittente: "Amministrazione Rook",
          uidMittente: "admin",
          messaggio: `Il profilo ente '${ente?.nomeEnte || idEnte}' è stato eliminato dall'amministrazione. Motivo: ${reason}`,
          timestamp: now,
          letta: false,
        });

        // Rimuovi flag da utente
        try {
          await update(ref(rtdb, `utenti/${idEnte}`), {
            isEnte: false,
            ente: false,
            idEnteGestito: "",
          });
        } catch (_) {}

        // Rimuovi nodo ente
        await remove(ref(rtdb, `enti/${idEnte}`));

        await addAuditLog({
          azione: "ELIMINAZIONE_ENTE",
          targetTipo: "ente",
          targetId: idEnte,
          dettagli: `Eliminato ente '${ente?.nomeEnte || idEnte}'. Motivo: ${reason}`,
          diffPrima: ente || null,
          diffDopo: null,
        });

        notify("success", "Ente eliminato con successo. Notifica inviata in app.");
        return true;
      } catch (e) {
        console.error("Errore eliminazione ente:", e);
        notify("error", `Eliminazione non riuscita: ${errText(e)}`);
        return false;
      }
    },
    [organizers, addAuditLog, notify, rtdb]
  );

  // 7e. Toggle Ente Badge (qualsiasi badge della lista assegnabile)
  const toggleBadgeEnte = useCallback(
    async (idEnte: string, badgeId: string): Promise<boolean> => {
      const ente = organizers.find((o) => o.idEnte === idEnte);
      const enteNome = ente?.nomeEnte || idEnte;
      const currentBadges = Array.isArray(ente?.badges) ? [...ente.badges] : [];
      const isCurrentlyPresent = currentBadges.includes(badgeId);
      const newBadges = isCurrentlyPresent
        ? currentBadges.filter((b) => b !== badgeId)
        : [...currentBadges, badgeId];

      const isAdding = !isCurrentlyPresent;
      const badgeInfo = BADGES_DISPONIBILI.find((b) => b.id === badgeId);
      const badgeLabel = badgeInfo?.label || badgeId;
      const now = Date.now();

      try {
        const updates: Record<string, any> = {
          badges: newBadges,
        };
        if (badgeId === "VERIFICATO") {
          updates.verificato = isAdding;
        }

        await update(ref(rtdb, `enti/${idEnte}`), updates);

        // Notifica in-app all'ente per assegnazione o rimozione badge
        const targets = Array.from(new Set([idEnte, ente?.idCreatore].filter(Boolean) as string[]));
        for (let i = 0; i < targets.length; i++) {
          const targetUid = targets[i];
          try {
            const notifRef = push(ref(rtdb, `notifiche_organizzatori/${targetUid}`));
            const notifId = notifRef.key || `notif_${now}_${i}`;
            const tipo = isAdding
              ? (badgeId === "VERIFICATO" ? "ENTE_VERIFICATO" : "BADGE_ASSEGNATO")
              : (badgeId === "VERIFICATO" ? "ENTE_DISVERIFICATO" : "BADGE_RIMOSSO");
            const titolo = isAdding
              ? `Badge Assegnato: ${badgeLabel} 🎖️`
              : `Riconoscimento Aggiornato: ${badgeLabel} ℹ️`;
            const messaggio = isAdding
              ? `Congratulazioni! Il tuo profilo '${enteNome}' ha ricevuto ufficialmente il badge '${badgeLabel}'.`
              : `Il badge '${badgeLabel}' è stato revocato/aggiornato dall'amministrazione per '${enteNome}'.`;

            await set(notifRef, {
              idNotifica: notifId,
              tipo,
              badgeId,
              idBadge: badgeId,
              azioneBadge: isAdding ? "ASSEGNATO" : "RIMOSSO",
              titoloEvento: titolo,
              nomeMittente: "Amministrazione Rook",
              uidMittente: "admin",
              messaggio,
              timestamp: now,
              letta: false,
            });
          } catch (errNotif) {
            console.warn("Errore invio notifica badge all'ente:", errNotif);
          }
        }

        await addAuditLog({
          azione: isAdding ? "AGGIUNTO_BADGE_ENTE" : "RIMOSSO_BADGE_ENTE",
          targetTipo: "ente",
          targetId: idEnte,
          dettagli: `${isAdding ? "Assegnato" : "Revocato"} badge '${badgeLabel}' all'ente '${enteNome}'`,
          diffPrima: { badges: currentBadges },
          diffDopo: { badges: newBadges },
        });

        notify(
          "success",
          isAdding
            ? `Badge "${badgeLabel}" assegnato a "${enteNome}". Notifica inviata in app.`
            : `Badge "${badgeLabel}" rimosso da "${enteNome}".`
        );
        return true;
      } catch (e) {
        console.error("Errore modifica badge ente:", e);
        notify("error", `Operazione fallita: ${errText(e)}`);
        return false;
      }
    },
    [organizers, addAuditLog, notify, rtdb]
  );

  // 7f. Toggle Ente Verificato (retrocompatibilità)
  const toggleEnteVerificato = useCallback(
    async (idEnte: string, verificato: boolean): Promise<boolean> => {
      const ente = organizers.find((o) => o.idEnte === idEnte);
      const currentVerificato = Boolean(ente?.verificato || ente?.badges?.includes("VERIFICATO"));
      if (currentVerificato === verificato) return true;
      return toggleBadgeEnte(idEnte, "VERIFICATO");
    },
    [organizers, toggleBadgeEnte]
  );

  // 8. Resolve Report & Reopen Report
  const resolveReport = useCallback(
    async (reportId: string, categoria: string, note: string, idOrganizzatore?: string) => {
      try {
        const path = categoria ? `reports/${categoria}/${reportId}` : `reports/${reportId}`;
        const updatePayload: Record<string, any> = {
          stato: "RISOLTA",
          risoltoDa: adminEmail,
          risoluzioneNote: note,
          timestampRisoluzione: Date.now(),
        };
        await update(ref(rtdb, path), updatePayload);

        // Se è una segnalazione evento con idOrganizzatore, aggiorna anche il nodo organizzatore
        if (idOrganizzatore) {
          try {
            await update(ref(rtdb, `segnalazioni_organizzatori/${idOrganizzatore}/${reportId}`), updatePayload);
          } catch (_) {}
        }

        notify("success", "Segnalazione contrassegnata come risolta");

        await addAuditLog({
          azione: "RISOLUZIONE_SEGNALAZIONE",
          targetTipo: "segnalazione",
          targetId: reportId,
          dettagli: `Risolta segnalazione in ${categoria || "reports"}. Note: ${note}`,
          diffPrima: { stato: "da_risolvere" },
          diffDopo: { stato: "RISOLTA", note },
        });
      } catch (e) {
        console.error("Errore risoluzione report:", e);
        notify("error", `Segnalazione non risolta: ${errText(e)}`);
      }
    },
    [adminEmail, addAuditLog, notify, rtdb]
  );

  const reopenReport = useCallback(
    async (reportId: string, categoria: string, idOrganizzatore?: string) => {
      try {
        const path = categoria ? `reports/${categoria}/${reportId}` : `reports/${reportId}`;
        const updatePayload: Record<string, any> = {
          stato: "IN_ATTESA",
          risoltoDa: null,
          risoluzioneNote: null,
          timestampRiapertura: Date.now(),
        };
        await update(ref(rtdb, path), updatePayload);

        if (idOrganizzatore) {
          try {
            await update(ref(rtdb, `segnalazioni_organizzatori/${idOrganizzatore}/${reportId}`), updatePayload);
          } catch (_) {}
        }

        notify("success", "Segnalazione riaperta e impostata come 'Da risolvere'");

        await addAuditLog({
          azione: "RIAPERTURA_SEGNALAZIONE",
          targetTipo: "segnalazione",
          targetId: reportId,
          dettagli: `Riaperta segnalazione in ${categoria || "reports"}`,
          diffPrima: { stato: "RISOLTA" },
          diffDopo: { stato: "IN_ATTESA" },
        });
      } catch (e) {
        console.error("Errore riapertura report:", e);
        notify("error", `Operazione non riuscita: ${errText(e)}`);
      }
    },
    [addAuditLog, notify, rtdb]
  );

  // Moderazione AI Shield: Segna come esaminato / da esaminare
  const markRejectedEventAsExamined = useCallback(
    async (id: string) => {
      try {
        const item = rejectedEvents.find((r) => r.id === id);
        const nuovoLetto = item ? !item.letto : true;
        await update(ref(rtdb, `moderazione_respinti/${id}`), {
          letto: nuovoLetto,
          stato: nuovoLetto ? "ESAMINATO" : "RESPINTO",
        });
        await addAuditLog({
          azione: nuovoLetto ? "MODERAZIONE_SEGNA_ESAMINATO" : "MODERAZIONE_SEGNA_NON_LETTO",
          targetTipo: "evento",
          targetId: id,
          dettagli: `Evento respinto ${id} (${item?.titolo || ""}) impostato come ${nuovoLetto ? "ESAMINATO" : "DA ESAMINARE"}`,
        });
        notify(
          "success",
          nuovoLetto
            ? "Evento contrassegnato come esaminato."
            : "Evento contrassegnato come da esaminare."
        );
      } catch (e) {
        console.error("Errore aggiornamento moderazione_respinti:", e);
        notify("error", `Errore aggiornamento: ${errText(e)}`);
      }
    },
    [rejectedEvents, addAuditLog, notify, rtdb]
  );

  // Moderazione AI Shield: Elimina record respinto
  const deleteRejectedEvent = useCallback(
    async (id: string) => {
      try {
        const item = rejectedEvents.find((r) => r.id === id);
        await remove(ref(rtdb, `moderazione_respinti/${id}`));
        await addAuditLog({
          azione: "MODERAZIONE_ELIMINA_RECORD",
          targetTipo: "evento",
          targetId: id,
          dettagli: `Eliminato record moderazione respinta ${id} (${item?.titolo || ""})`,
        });
        notify("success", "Record moderazione eliminato.");
      } catch (e) {
        console.error("Errore eliminazione moderazione_respinti:", e);
        notify("error", `Errore eliminazione: ${errText(e)}`);
      }
    },
    [rejectedEvents, addAuditLog, notify, rtdb]
  );

  // 9. Feature Flag / Kill Switch (state comes back from the /feature_flags listener)
  const toggleFeatureFlag = useCallback(
    async (flagId: string) => {
      const flag = featureFlags.find((f) => f.id === flagId);
      if (!flag) return;
      const nextVal = !flag.attivo;

      try {
        await set(ref(rtdb, `feature_flags/${flag.chiave}`), nextVal);
        notify("success", `${flag.nome}: ${nextVal ? "ATTIVA" : "DISATTIVA"}`);

        await addAuditLog({
          azione: "TOGGLE_FEATURE_FLAG",
          targetTipo: "sistema",
          targetId: flag.chiave,
          dettagli: `Flag '${flag.nome}' impostata a: ${nextVal ? "ATTIVA" : "DISATTIVA"}`,
          diffPrima: { attivo: flag.attivo },
          diffDopo: { attivo: nextVal },
        });
      } catch (e) {
        console.error("Errore toggle feature flag:", e);
        notify("error", `Flag non modificata: ${errText(e)}`);
      }
    },
    [featureFlags, addAuditLog, notify, rtdb]
  );

  // 10. Queue a Broadcast Push Notification (/notifiche_broadcast)
  const sendBroadcastPush = useCallback(
    async (notif: { title: string; body: string; targetProvince?: string; targetCategory?: string }) => {
      try {
        await push(
          ref(rtdb, "notifiche_broadcast"),
          clean({
            ...notif,
            timestamp: Date.now(),
            inviatoDa: adminEmail,
          })
        );

        await addAuditLog({
          azione: "INVIO_NOTIFICA_BROADCAST",
          targetTipo: "sistema",
          targetId: "broadcast",
          dettagli: `Messa in coda notifica: "${notif.title}" a ${notif.targetProvince || "Tutta la Toscana"}`,
          diffPrima: null,
          diffDopo: notif,
        });
        return true;
      } catch (e) {
        console.error("Errore invio broadcast:", e);
        notify("error", `Notifica non accodata: ${errText(e)}`);
        return false;
      }
    },
    [adminEmail, addAuditLog, notify, rtdb]
  );

  // Studio Organizzatore: crea/modifica un evento esattamente come fa AddEvento nell'app.
  const saveOrganizerEvent = useCallback(
    async (
      draft: OrganizerEventDraft,
      ente: { id: string; nome: string },
      cover: File | null,
      programma: File | null,
      existingId?: string
    ) => {
      try {
        const intervalli = draft.date
          .map((d) => {
            const startStr = d.inizio.includes("T") ? d.inizio : `${d.inizio}T00:00:00`;
            const endStr = (d.fine || d.inizio).includes("T") ? (d.fine || d.inizio) : `${d.fine || d.inizio}T23:59:59`;
            return {
              dataInizio: new Date(startStr).getTime(),
              dataFine: new Date(endStr).getTime(),
            };
          })
          .filter((d) => !isNaN(d.dataInizio) && !isNaN(d.dataFine))
          .sort((a, b) => a.dataInizio - b.dataInizio);
        if (intervalli.length === 0) throw new Error("Inserisci almeno una data valida");
        if (!draft.titolo.trim()) throw new Error("Il titolo è obbligatorio");

        const idEvento = existingId || push(ref(rtdb, "eventi")).key;
        if (!idEvento) throw new Error("Impossibile generare l'ID evento");

        let urlCopertina = draft.immagineCopertina;
        if (cover) {
          urlCopertina = await processAndUploadEventImage(
            cover,
            `eventi/${idEvento}/copertina_${Date.now()}.jpg`,
            storage
          );
        }

        let urlMenu = draft.immagineMenu;
        if (programma) {
          urlMenu = await processAndUploadEventImage(
            programma,
            `eventi/${idEvento}/programma_${Date.now()}.jpg`,
            storage
          );
        }

        const prov = draft.provincia.trim().toUpperCase();
        const luogo = `${draft.via.trim().replace(/,$/, "")}, ${draft.comune.trim().replace(/,$/, "")}, ${prov}`.trim();
        const hasCoords = draft.latitudine !== 0 && draft.longitudine !== 0;
        const old = existingId ? events.find((e) => e.id === existingId) : undefined;

        const payload: Record<string, any> = {
          id: idEvento,
          idOrganizzatore: ente.id,
          organizzatore: ente.nome,
          titolo: draft.titolo.trim(),
          data: intervalli[0].dataInizio,
          luogo,
          latitudine: draft.latitudine,
          longitudine: draft.longitudine,
          categoria: draft.categoria.trim(),
          descrizione: draft.descrizione.trim(),
          immagineCopertina: urlCopertina || "",
          immagineMenu: urlMenu || "",
          date: intervalli,
          orariGiornalieri:
            draft.orariGiornalieri && Object.keys(draft.orariGiornalieri).length > 0
              ? draft.orariGiornalieri
              : null,
          geohash: hasCoords ? geohashEncode(draft.latitudine, draft.longitudine) : "",
          opzioniVeg: draft.opzioniVeg,
          accessibileDisabili: draft.accessibileDisabili,
          urlWeb: draft.urlWeb.trim(),
        };
        if (!old) {
          Object.assign(payload, {
            preferito: false,
            mediaValutazioni: 0,
            numeroRecensioni: 0,
            likes: 0,
            boostScadenza: 0,
            boostTipo: "",
            oscurato: false,
            idCoOrganizzatori: [],
            coOrganizzatori: [],
            creatoDaUid: currentUser?.uid || "",
            creatoDaNome: (adminEmail || "Admin").split("@")[0],
          });
        }

        await update(ref(rtdb, `eventi/${idEvento}`), clean(payload));
        notify("success", existingId ? "Evento aggiornato" : "Evento pubblicato nell'app");

        await addAuditLog({
          azione: existingId ? "STUDIO_MODIFICA_EVENTO" : "STUDIO_CREAZIONE_EVENTO",
          targetTipo: "evento",
          targetId: idEvento,
          dettagli: `${existingId ? "Modificato" : "Creato"} evento '${payload.titolo}' per conto di '${ente.nome}'`,
          diffPrima: old ? { titolo: old.titolo, luogo: old.luogo, categoria: old.categoria } : null,
          diffDopo: { titolo: payload.titolo, luogo, categoria: payload.categoria },
        });
        return true;
      } catch (e) {
        console.error("Errore studio organizzatore:", e);
        notify("error", `Evento non salvato: ${errText(e)}`);
        return false;
      }
    },
    [events, currentUser, adminEmail, addAuditLog, notify, rtdb, storage]
  );

  // Crea (o aggiorna) il profilo organizzatore dell'amministratore, con tutti i campi previsti dall'app Rook.
  const createOwnEnte = useCallback(
    async (data: CreateOwnEnteData) => {
      const uid = currentUser?.uid;
      if (!uid) return false;

      // Controllo duplicato nome ente: non possono esistere due enti con lo stesso nome
      const candidateName = data.nomeEnte.trim().toLowerCase();
      const isDuplicateName = organizers.some(
        (o) => o.idEnte !== uid && o.nomeEnte?.trim().toLowerCase() === candidateName
      );
      if (isDuplicateName) {
        notify("error", `Un ente con il nome "${data.nomeEnte.trim()}" esiste già. Scegli un nome diverso.`);
        return false;
      }

      try {
        const enteRef = ref(rtdb, `enti/${uid}`);
        const existing = await get(enteRef);
        const existingData = existing.exists() ? existing.val() : null;
        const oldEmail = (existingData?.emailEnte || "").trim().toLowerCase();
        const newEmail = data.emailEnte.trim().toLowerCase();
        const isEmailChanged = newEmail !== "" && (!existingData || (oldEmail !== "" && newEmail !== oldEmail));

        let tokenVerifica = existingData?.tokenVerificaEmail || null;
        let emailVerificata = existingData?.emailVerificata ?? true;
        let emailInviata = existingData?.emailInviata ?? false;

        if (isEmailChanged) {
          tokenVerifica = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
          emailVerificata = false;
          emailInviata = false;
        }

        const base: Record<string, any> = {
          nomeEnte: data.nomeEnte.trim(),
          referenteOrg: data.referenteOrg.trim(),
          sedeOrg: data.sedeOrg.trim(),
          comuneEnte: data.comuneEnte.trim(),
          provinciaEnte: data.provinciaEnte.trim().toUpperCase(),
          emailEnte: data.emailEnte.trim(),
          emailVerificata: emailVerificata,
          tokenVerificaEmail: tokenVerifica,
          emailInviata: emailInviata,
          telefonoEnte: data.telefonoEnte.trim(),
          descEnte: data.descEnte.trim(),
          sitoWeb: data.sitoWeb?.trim() || null,
          instagram: data.instagram?.trim() || null,
          facebook: data.facebook?.trim() || null,
          tiktok: data.tiktok?.trim() || null,
          linkedin: data.linkedin?.trim() || null,
        };
        if (!existing.exists()) {
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          const code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
          Object.assign(base, {
            enteSince: new Date().toISOString(),
            idCreatore: uid,
            passwordStaff: `ROOK-${1000 + Math.floor(Math.random() * 9000)}-${code}`,
            verificato: false, // Nuovo ente non parte verificato, richiede verifica manuale
          });
        }
        await update(enteRef, clean(base));

        // Se l'amministratore ha già un profilo nell'app, diventa organizzatore anche lì.
        const userSnap = await get(ref(rtdb, `utenti/${uid}`));
        if (userSnap.exists()) {
          await update(ref(rtdb, `utenti/${uid}`), { isEnte: true, ente: true, idEnteGestito: uid });
        }
        notify(
          "success",
          isEmailChanged
            ? `Profilo ente salvato! Abbiamo inviato un'email di verifica a ${data.emailEnte.trim()}.`
            : userSnap.exists()
            ? "Profilo organizzatore aggiornato con successo (sincronizzato con l'app)!"
            : "Ente aggiornato con successo!"
        );
        await addAuditLog({
          azione: "STUDIO_CREAZIONE_ENTE",
          targetTipo: "ente",
          targetId: uid,
          dettagli: `Creato/aggiornato profilo organizzatore '${base.nomeEnte}' per l'amministratore`,
          diffPrima: null,
          diffDopo: { nomeEnte: base.nomeEnte, emailEnte: base.emailEnte, comuneEnte: base.comuneEnte },
        });
        return true;
      } catch (e) {
        console.error("Errore salvataggio ente admin:", e);
        notify("error", `Errore salvataggio ente: ${errText(e)}`);
        return false;
      }
    },
    [currentUser, organizers, addAuditLog, notify, rtdb]
  );

  const deleteOwnEnte = useCallback(async (): Promise<boolean> => {
    const uid = currentUser?.uid;
    if (!uid) {
      notify("error", "Devi aver effettuato l'accesso per compiere questa operazione.");
      return false;
    }
    const ente = organizers.find((o) => o.idEnte === uid);
    if (!ente) {
      notify("error", "Profilo organizzatore non trovato.");
      return false;
    }

    try {
      // 1. Ripristina i membri dello staff associati (se presenti) a utenti normali
      try {
        const staffSnap = await get(ref(rtdb, `enti/${uid}/membriStaff`));
        if (staffSnap.exists()) {
          const staffObj = staffSnap.val() || {};
          for (const staffUid of Object.keys(staffObj)) {
            try {
              await update(ref(rtdb, `utenti/${staffUid}`), {
                isEnte: false,
                ente: false,
                idEnteGestito: "",
              });
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn("Errore reset staff:", err);
      }

      // 2. Rimuovi tutti gli eventi creati da questo ente e le relative recensioni
      const eventsToDelete = events.filter((e) => e.idOrganizzatore === uid || e.creatoDaUid === uid);
      for (const ev of eventsToDelete) {
        try {
          await remove(ref(rtdb, `eventi/${ev.id}`));
          await remove(ref(rtdb, `recensioni/${ev.id}`));
        } catch (err) {
          console.warn(`Errore rimozione evento ${ev.id}:`, err);
        }
      }

      // 3. Rimuovi bozze e notifiche organizzatore
      try {
        await remove(ref(rtdb, `bozze_organizzatori/${uid}`));
        await remove(ref(rtdb, `notifiche_organizzatori/${uid}`));
      } catch (_) {}

      // 4. Rimuovi il profilo ente ufficiale
      await remove(ref(rtdb, `enti/${uid}`));

      // 5. Ripristina il profilo utente come utente base
      try {
        await update(ref(rtdb, `utenti/${uid}`), {
          isEnte: false,
          ente: false,
          idEnteGestito: "",
        });
      } catch (_) {}

      await addAuditLog({
        azione: "STUDIO_ELIMINAZIONE_PROPRIO_ENTE",
        targetTipo: "ente",
        targetId: uid,
        dettagli: `L'organizzatore ha eliminato il proprio account ente '${ente.nomeEnte || uid}' (${eventsToDelete.length} eventi rimossi)`,
        diffPrima: ente,
        diffDopo: null,
      });

      notify("success", "Profilo organizzatore ed eventi collegati eliminati con successo.");
      return true;
    } catch (e) {
      console.error("Errore eliminazione account organizzatore:", e);
      notify("error", `Impossibile eliminare l'account organizzatore: ${errText(e)}`);
      return false;
    }
  }, [currentUser, organizers, events, addAuditLog, notify, rtdb]);

  const reinviaEmailVerificaEnte = useCallback(
    async (idEnte: string) => {
      try {
        const enteRef = ref(rtdb, `enti/${idEnte}`);
        const snap = await get(enteRef);
        if (!snap.exists()) return false;
        const current = snap.val() || {};
        const token = current.tokenVerificaEmail || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
        await update(enteRef, {
          emailVerificata: false,
          emailInviata: false,
          tokenVerificaEmail: token,
          timestampInvioEmail: Date.now(),
        });
        notify("success", `Email di verifica reinviata a ${current.emailEnte || "tuo indirizzo"}!`);
        return true;
      } catch (err) {
        console.error("Errore reinvio email verifica ente:", err);
        notify("error", "Errore durante il reinvio dell'email di verifica.");
        return false;
      }
    },
    [notify, rtdb]
  );

  // --- Gestione Categorie ---
  const addCategoria = useCallback(
    async (data: Partial<CategoriaDB>): Promise<boolean> => {
      try {
        const rawNome = (data.nome || "").trim();
        if (!rawNome) {
          notify("error", "Il nome della categoria è obbligatorio");
          return false;
        }

        const id = (data.id || rawNome)
          .toLowerCase()
          .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "")
          .trim()
          .replace(/\s+/g, "_")
          .substring(0, 40) || `cat_${Date.now()}`;

        const newCat: CategoriaDB = clean({
          id,
          nome: rawNome,
          nome_it: (data.nome_it || rawNome).trim(),
          nome_en: (data.nome_en || "").trim(),
          nome_de: (data.nome_de || "").trim(),
          nome_es: (data.nome_es || "").trim(),
          nome_fr: (data.nome_fr || "").trim(),
          icon_key: (data.icon_key || "tag").trim(),
          color_hex: (data.color_hex || "#f59e0b").trim(),
          ordine: typeof data.ordine === "number" ? data.ordine : categories.length + 1,
          attivo: data.attivo !== false,
          sottocategorie: Array.isArray(data.sottocategorie)
            ? data.sottocategorie.map((s) => s.trim()).filter(Boolean)
            : [],
        });

        await set(ref(rtdb, `categorie/${id}`), newCat);

        await addAuditLog({
          azione: "CREAZIONE_CATEGORIA",
          targetTipo: "sistema",
          targetId: id,
          dettagli: `Creata nuova categoria '${rawNome}' (attivo=${newCat.attivo})`,
          diffPrima: null,
          diffDopo: newCat,
        });

        notify("success", `Categoria '${rawNome}' creata con successo!`);
        return true;
      } catch (err: any) {
        console.error("Errore aggiunta categoria:", err);
        notify("error", `Errore creazione categoria: ${err.message}`);
        return false;
      }
    },
    [categories, addAuditLog, notify, rtdb]
  );

  const updateCategoria = useCallback(
    async (cat: CategoriaDB): Promise<boolean> => {
      try {
        if (!cat.id) return false;
        const cleaned = clean({
          ...cat,
          nome: cat.nome.trim(),
          nome_it: (cat.nome_it || cat.nome).trim(),
          nome_en: (cat.nome_en || "").trim(),
          sottocategorie: Array.isArray(cat.sottocategorie)
            ? cat.sottocategorie.map((s) => s.trim()).filter(Boolean)
            : [],
        });

        const catPrima = categories.find((c) => c.id === cat.id);
        await update(ref(rtdb, `categorie/${cat.id}`), cleaned);

        await addAuditLog({
          azione: "MODIFICA_CATEGORIA",
          targetTipo: "sistema",
          targetId: cat.id,
          dettagli: `Modificata categoria '${cat.nome}'`,
          diffPrima: catPrima || null,
          diffDopo: cleaned,
        });

        notify("success", `Categoria '${cat.nome}' aggiornata.`);
        return true;
      } catch (err: any) {
        console.error("Errore aggiornamento categoria:", err);
        notify("error", `Errore aggiornamento: ${err.message}`);
        return false;
      }
    },
    [categories, addAuditLog, notify, rtdb]
  );

  const toggleOscuraCategoria = useCallback(
    async (id: string, oscurata: boolean): Promise<boolean> => {
      try {
        const cat = categories.find((c) => c.id === id);
        const nuovoStatoAttivo = !oscurata;
        await update(ref(rtdb, `categorie/${id}`), { attivo: nuovoStatoAttivo });

        await addAuditLog({
          azione: oscurata ? "OSCURAMENTO_CATEGORIA" : "RIATTIVAZIONE_CATEGORIA",
          targetTipo: "sistema",
          targetId: id,
          dettagli: oscurata
            ? `Oscurata categoria '${cat?.nome || id}'. Gli eventi esistenti la mantengono ma non potrà più essere scelta per nuovi eventi.`
            : `Riattivata categoria '${cat?.nome || id}'. Disponibile ora per la creazione di nuovi eventi.`,
          diffPrima: { attivo: !nuovoStatoAttivo },
          diffDopo: { attivo: nuovoStatoAttivo },
        });

        notify(
          "success",
          oscurata
            ? `Categoria '${cat?.nome || id}' oscurata. Non sarà più selezionabile per nuovi eventi.`
            : `Categoria '${cat?.nome || id}' riattivata con successo!`
        );
        return true;
      } catch (err: any) {
        console.error("Errore toggle oscuramento categoria:", err);
        notify("error", `Errore: ${err.message}`);
        return false;
      }
    },
    [categories, addAuditLog, notify, rtdb]
  );

  const deleteCategoria = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const cat = categories.find((c) => c.id === id);
        await remove(ref(rtdb, `categorie/${id}`));

        await addAuditLog({
          azione: "ELIMINAZIONE_CATEGORIA",
          targetTipo: "sistema",
          targetId: id,
          dettagli: `Eliminata categoria '${cat?.nome || id}' dal database. Gli eventi esistenti la mantengono.`,
          diffPrima: cat || null,
          diffDopo: null,
        });

        notify("success", `Categoria '${cat?.nome || id}' eliminata dal catalogo.`);
        return true;
      } catch (err: any) {
        console.error("Errore eliminazione categoria:", err);
        notify("error", `Errore eliminazione: ${err.message}`);
        return false;
      }
    },
    [categories, addAuditLog, notify, rtdb]
  );

  const inizializzaCategorieDefault = useCallback(async (): Promise<boolean> => {
    try {
      const updatesMap: Record<string, any> = {};
      for (const c of DEFAULT_CATEGORIE_LIST) {
        updatesMap[`categorie/${c.id}`] = c;
      }
      await update(ref(rtdb), updatesMap);
      await addAuditLog({
        azione: "INIZIALIZZAZIONE_CATEGORIE",
        targetTipo: "sistema",
        targetId: "categorie",
        dettagli: "Inizializzate 10 categorie predefinite sul Realtime Database",
        diffPrima: null,
        diffDopo: DEFAULT_CATEGORIE_LIST,
      });
      notify("success", "10 Categorie predefinite inizializzate con successo!");
      return true;
    } catch (err: any) {
      console.error("Errore inizializzazione categorie:", err);
      notify("error", `Errore: ${err.message}`);
      return false;
    }
  }, [addAuditLog, notify, rtdb]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      try {
        const cred = GoogleAuthProvider.credentialFromResult(res);
        if (cred) {
          await signInWithCredential(devAuth, cred);
        }
      } catch (e) {
        console.warn("Auto-sync devAuth:", e);
      }
    } catch (e: any) {
      if (e?.code === "auth/popup-closed-by-user" || e?.code === "auth/cancelled-popup-request") return;
      console.error("Google sign in error:", e);
      notify("error", `Accesso con Google non riuscito: ${errText(e)}`);
    }
  }, [notify]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      try {
        await signOut(devAuth);
      } catch {}
    } catch (e) {
      console.error("Logout error:", e);
      notify("error", `Uscita non riuscita: ${errText(e)}`);
    }
  }, [notify]);

  // Re-attach all realtime listeners and show the loader until fresh data arrives.
  const refreshData = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        currentUser,
        adminEmail,
        isSuperAdmin,
        isAuthChecking,
        accessDenied,
        isLoading,
        isLiveConnected,
        activeTab,
        setActiveTab,
        eventCategoryFilter,
        setEventCategoryFilter,
        navigateToEventsWithCategory,
        toast,
        dismissToast,
        events,
        users,
        organizers,
        organizerRequests,
        reports,
        auditLogs,
        featureFlags,
        analytics,
        onlineUsersCount,
        deletedUsersCount,
        reviewsStats,
        chatsCount,
        communitiesCount,
        bozzeCount,
        toggleBooster,
        setEventBooster,
        toggleOscurato,
        saveEventEdit,
        deleteEvent,
        updateUserStatus,
        deleteUser,
        approveOrganizerRequest,
        rejectOrganizerRequest,
        sendChatMessageToEnte,
        suspendEnte,
        reactivateEnte,
        deleteEnte,
        toggleEnteVerificato,
        toggleBadgeEnte,
        resolveReport,
        reopenReport,
        toggleFeatureFlag,
        sendBroadcastPush,
        saveOrganizerEvent,
        createOwnEnte,
        deleteOwnEnte,
        reinviaEmailVerificaEnte,
        categories,
        addCategoria,
        updateCategoria,
        toggleOscuraCategoria,
        deleteCategoria,
        inizializzaCategorieDefault,
        rejectedEvents,
        markRejectedEventAsExamined,
        deleteRejectedEvent,
        addAuditLog,
        fetchChatMessages,
        loginWithGoogle,
        logout,
        refreshData,
        currentEnv,
        setFirebaseEnv,
        isDevAuthMissing,
        authenticateDev,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return ctx;
}
