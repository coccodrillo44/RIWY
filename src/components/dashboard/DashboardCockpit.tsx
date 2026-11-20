"use client";

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import {
  Users,
  CalendarCheck,
  Building2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Flame,
  Zap,
  MapPin,
  Eye,
  EyeOff,
  ArrowUpRight,
  Database,
  Radio,
  Smartphone,
  Plus,
  Trash2,
  Edit2,
  Tag,
  Check,
  X,
  Search,
  Sparkles,
  AlertCircle,
  FolderKanban,
  Star,
  MessageSquare,
  MessagesSquare,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { CategoriaDB } from "@/types";
import { getCategoryBadgeClass, formatDate, formatEventDate, isBoostAttivo, isEventoPassato, normalizeCategory } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, { fill: string; stroke: string; bg: string; text: string }> = {
  "Cibo & Sagre": { fill: "#f59e0b", stroke: "#d97706", bg: "bg-amber-500", text: "text-amber-400" },
  "Musica & Feste": { fill: "#a855f7", stroke: "#9333ea", bg: "bg-purple-500", text: "text-purple-400" },
  "Arte & Cultura": { fill: "#3b82f6", stroke: "#2563eb", bg: "bg-blue-500", text: "text-blue-400" },
  "Sport & Movimento": { fill: "#10b981", stroke: "#059669", bg: "bg-emerald-500", text: "text-emerald-400" },
  "Famiglia & Bambini": { fill: "#ec4899", stroke: "#db2777", bg: "bg-pink-500", text: "text-pink-400" },
  "Fiere & Mercati": { fill: "#eab308", stroke: "#ca8a04", bg: "bg-yellow-500", text: "text-yellow-400" },
  "Nuove Aperture": { fill: "#06b6d4", stroke: "#0891b2", bg: "bg-cyan-500", text: "text-cyan-400" },
  "Sconti & Promozioni": { fill: "#e11d48", stroke: "#be123c", bg: "bg-rose-500", text: "text-rose-400" },
  "Altro": { fill: "#64748b", stroke: "#475569", bg: "bg-slate-500", text: "text-slate-400" },
};

export function DashboardCockpit() {
  const {
    events,
    users,
    organizers,
    organizerRequests,
    reports,
    auditLogs,
    analytics,
    onlineUsersCount,
    deletedUsersCount,
    reviewsStats,
    chatsCount,
    communitiesCount,
    bozzeCount,
    rejectedEvents,
    setActiveTab,
    toggleBooster,
    navigateToEventsWithCategory,
    categories,
    addCategoria,
    updateCategoria,
    toggleOscuraCategoria,
    deleteCategoria,
    inizializzaCategorieDefault,
  } = useAdmin();

  // Gestione Categorie State
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoriaDB | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoriaDB | null>(null);

  const [catForm, setCatForm] = useState({
    nome: "",
    nome_en: "",
    color_hex: "#EA580C",
    icon_key: "tag",
    sottocategorieText: "",
    ordine: 1,
    attivo: true,
  });

  const PRESET_COLORS = [
    "#EA580C",
    "#8B5CF6",
    "#0284C7",
    "#16A34A",
    "#EC4899",
    "#D97706",
    "#0D9488",
    "#E11D48",
    "#7C3AED",
    "#3B82F6",
    "#10B981",
    "#64748B",
  ];

  const getEventCountForCategory = (catName: string) => {
    const q = catName.trim().toLowerCase();
    return events.filter(
      (e) =>
        e.categoria?.trim().toLowerCase() === q ||
        normalizeCategory(e.categoria).trim().toLowerCase() === q
    ).length;
  };

  const filteredCategories = useMemo(() => {
    let list = categories;
    if (categoryStatusFilter === "active") {
      list = list.filter((c) => c.attivo);
    } else if (categoryStatusFilter === "hidden") {
      list = list.filter((c) => !c.attivo);
    }
    const q = categorySearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.nome_en?.toLowerCase().includes(q) ||
          c.sottocategorie?.some((s) => s.toLowerCase().includes(q))
      );
    }
    return list;
  }, [categories, categoryStatusFilter, categorySearch]);

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCatForm({
      nome: "",
      nome_en: "",
      color_hex: "#3B82F6",
      icon_key: "tag",
      sottocategorieText: "",
      ordine: (categories.length || 0) + 1,
      attivo: true,
    });
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (cat: CategoriaDB) => {
    setEditingCategory(cat);
    setCatForm({
      nome: cat.nome,
      nome_en: cat.nome_en || "",
      color_hex: cat.color_hex || "#EA580C",
      icon_key: cat.icon_key || "tag",
      sottocategorieText: (cat.sottocategorie || []).join(", "),
      ordine: cat.ordine ?? 1,
      attivo: cat.attivo,
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const sottos = catForm.sottocategorieText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingCategory) {
      await updateCategoria({
        ...editingCategory,
        nome: catForm.nome.trim(),
        nome_it: catForm.nome.trim(),
        nome_en: catForm.nome_en.trim(),
        color_hex: catForm.color_hex,
        icon_key: catForm.icon_key,
        sottocategorie: sottos,
        ordine: Number(catForm.ordine) || 1,
        attivo: catForm.attivo,
      });
    } else {
      await addCategoria({
        nome: catForm.nome.trim(),
        nome_it: catForm.nome.trim(),
        nome_en: catForm.nome_en.trim(),
        color_hex: catForm.color_hex,
        icon_key: catForm.icon_key,
        sottocategorie: sottos,
        ordine: Number(catForm.ordine) || 1,
        attivo: catForm.attivo,
      });
    }
    setShowCategoryModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    await deleteCategoria(deletingCategory.id);
    setDeletingCategory(null);
  };

  const onlineNow = useMemo(() => {
    const limit = Date.now() - 10 * 60 * 1000;
    return users
      .filter((u) => Number(u.ultimoAccesso || 0) > limit)
      .sort((a, b) => Number(b.ultimoAccesso) - Number(a.ultimoAccesso));
  }, [users]);

  const activeEvents = useMemo(() => events.filter((e) => !e.oscurato && !isEventoPassato(e)), [events]);
  const pastEvents = useMemo(() => events.filter((e) => isEventoPassato(e)), [events]);
  const featuredEvents = useMemo(() => events.filter(isBoostAttivo), [events]);
  const pendingReports = useMemo(
    () => reports.filter((r) => !r.stato || r.stato === "nuovo" || r.stato === "in_lavorazione"),
    [reports]
  );
  const pendingRequests = useMemo(
    () => organizerRequests.filter((r) => !r.stato || r.stato === "IN_ATTESA"),
    [organizerRequests]
  );

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [pieTooltipPos, setPieTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Group and compute Pie Chart slices
  const pieData = useMemo(() => {
    const total = events.length;
    if (total === 0) return { total: 0, slices: [] };

    const counts: Record<string, number> = {};
    events.forEach((ev) => {
      const cat = normalizeCategory(ev.categoria || "Altro");
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const entries = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([categoria, count]) => {
        const percentage = (count / total) * 100;
        const color = CATEGORY_COLORS[categoria] || {
          fill: "#64748b",
          stroke: "#475569",
          bg: "bg-slate-500",
          text: "text-slate-400",
        };
        return {
          categoria,
          count,
          percentage,
          percentStr: `${percentage.toFixed(1)}%`,
          color,
        };
      })
      .sort((a, b) => b.count - a.count);

    let currentAngle = -Math.PI / 2; // Inizio a ore 12
    const slices = entries.map((item) => {
      const sliceAngle = (item.percentage / 100) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = startAngle + sliceAngle / 2;
      currentAngle = endAngle;

      return {
        ...item,
        startAngle,
        endAngle,
        midAngle,
        sliceAngle,
      };
    });

    return { total, slices };
  }, [events]);

  const activeSlice = useMemo(() => {
    if (!hoveredCategory) return null;
    return pieData.slices.find((s) => s.categoria === hoveredCategory) || null;
  }, [hoveredCategory, pieData.slices]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#111927] via-[#141e30] to-[#1c2940] border border-[#22324d] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Rook Realtime Operations
            </span>
            <span className="text-xs text-slate-400">Database Live Toscana</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Plancia di Comando RIWY
          </h1>
          <p className="text-sm text-slate-300">
            Dati in tempo reale dall'infrastruttura Firebase di Rook (nessun dato inventato o simulato).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("broadcast")}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/25"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Notifica Flash</span>
          </button>
          <button
            onClick={() => setActiveTab("feature_flags")}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#283548] text-slate-200 font-medium text-xs border border-slate-700 transition"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Kill Switch</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid: 5 Cards with Online Users Card First! */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* CARD RICHIESTA: Persone Online nell'App in Tempo Reale */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-950/40 to-[#0f172a] border border-emerald-500/50 shadow-lg shadow-emerald-500/10 hover:border-emerald-400 transition relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center">
              <span className="relative flex h-2.5 w-2.5 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Online Adesso
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{onlineUsersCount}</span>
            <span className="text-[11px] font-semibold text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
              LIVE
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {`Accessi negli ultimi 10 min · ${analytics.guestsCount} ospiti totali`}
          </p>
          {onlineNow.length > 0 ? (
            <ul className="mt-2 space-y-1 max-h-24 overflow-y-auto">
              {onlineNow.map((u) => (
                <li key={u.firebaseUid} className="flex items-center justify-between text-[11px] text-slate-200">
                  <span className="truncate">{u.username || u.email}</span>
                  <span className="text-slate-500 shrink-0 ml-2">{formatDate(u.ultimoAccesso, true)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[10px] text-slate-500">Nessun utente connesso (richiede l'app Rook aggiornata).</p>
          )}
        </div>

        {/* Card 2: Utenti Registrati */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("users")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab("users");
            }
          }}
          className="group p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-blue-500/60 hover:bg-[#111c33] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-blue-300 uppercase tracking-wider transition">
              Utenti Registrati
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{users.length}</span>
            <span className="text-[11px] text-blue-400 group-hover:text-blue-300 font-medium flex items-center gap-0.5 transition">
              Gestisci <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-400 transition">
            {users.filter((u) => !u.sospeso && u.stato !== "sospeso" && u.stato !== "bannato").length} attivi · {deletedUsersCount} eliminati (tombstone)
          </p>
        </div>

        {/* Card 3: Eventi a Catalogo */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("events")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab("events");
            }
          }}
          className="group p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-amber-500/60 hover:bg-[#1b1c2e] hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-amber-300 uppercase tracking-wider transition">
              Eventi Catalogo
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 group-hover:scale-105 transition">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{events.length}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-amber-400 flex items-center">
                <Flame className="w-3.5 h-3.5 mr-0.5 fill-current" />
                {featuredEvents.length} Booster
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-400 transition">
            {activeEvents.length} visibili · {pastEvents.length} nello storico · {events.filter((e) => e.accessibileDisabili).length} accessibili
          </p>
        </div>

        {/* Card 4: Organizzatori & Enti */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("organizers")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab("organizers");
            }
          }}
          className="group p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-emerald-500/60 hover:bg-[#10222a] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-emerald-300 uppercase tracking-wider transition">
              Enti & Organizzatori
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:scale-105 transition">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{organizers.length}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-amber-400">
                {pendingRequests.length} In Richiesta
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-400 transition">
            {organizers.filter((o) => o.verificato).length} verificati · {organizers.filter((o) => o.sospeso).length} sospesi
          </p>
        </div>

        {/* Card 5: Segnalazioni */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("reports")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab("reports");
            }
          }}
          className="group p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-red-500/60 hover:bg-[#221623] hover:shadow-lg hover:shadow-red-500/10 transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-red-300 uppercase tracking-wider transition">
              Segnalazioni
            </span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 group-hover:bg-red-500/20 group-hover:scale-105 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{reports.length}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-red-400">
                {pendingReports.length} Da Risolvere
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-400 transition">
            {reports.filter((r) => r.stato === "risolto").length} risolte su {reports.length} ticket
          </p>
        </div>
      </div>

      {/* Second Row: Detailed Ecosystem Stats & Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Recensioni */}
        <div className="p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Recensioni</span>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{reviewsStats.total}</span>
            <span className="text-xs font-semibold text-amber-400">★ {reviewsStats.average}</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">Feedback utenti</p>
        </div>

        {/* Chat attive */}
        <div className="p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Canali Chat</span>
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{chatsCount}</span>
            <span className="text-[10px] text-sky-400 font-medium">Conversazioni</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">Utente ↔ Ente</p>
        </div>

        {/* Communities */}
        <div className="p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Community</span>
            <MessagesSquare className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{communitiesCount}</span>
            <span className="text-[10px] text-purple-400 font-medium">Bacheche</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">Stanze territoriali</p>
        </div>

        {/* Bozze Organizzatori */}
        <div className="p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Bozze Eventi</span>
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{bozzeCount}</span>
            <span className="text-[10px] text-indigo-400 font-medium">In lavorazione</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">Salvate dagli enti</p>
        </div>

        {/* Utenti Eliminati (Tombstone) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("users")}
          className="p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-red-500/40 transition cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Tombstone DR</span>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{deletedUsersCount}</span>
            <span className="text-[10px] text-red-400 font-medium">GDPR Oblio</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">Bonifica backup</p>
        </div>

        {/* Moderazione Respinti */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("ai_moderation")}
          className="p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-rose-500/40 transition cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">AI Shield</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{rejectedEvents.length}</span>
            <span className="text-[10px] text-rose-400 font-medium">{rejectedEvents.filter((r) => !r.letto).length} da esaminare</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">Eventi respinti</p>
        </div>
      </div>

      {/* 1. Card: Distribuzione Eventi per Categorie */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
            <h2 className="text-base font-bold text-white">
              Distribuzione Eventi per Categorie
            </h2>
            <button
              onClick={() => setActiveTab("events")}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center"
            >
              Vedi Tutti <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {events.length > 0 && pieData.slices.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-1">
              {/* Pie Chart SVG Canvas with Tooltip */}
              <div
                className="relative flex items-center justify-center shrink-0 w-[240px] h-[240px]"
                onMouseLeave={() => {
                  setHoveredCategory(null);
                  setPieTooltipPos(null);
                }}
              >
                <svg
                  viewBox="0 0 240 240"
                  className="w-full h-full overflow-visible"
                >
                  <g>
                    {pieData.slices.length === 1 ? (
                      <circle
                        cx="120"
                        cy="120"
                        r="95"
                        fill={pieData.slices[0].color.fill}
                        className="cursor-pointer transition-transform duration-200 hover:scale-105"
                        onClick={() => navigateToEventsWithCategory(pieData.slices[0].categoria)}
                        onMouseEnter={() => {
                          setHoveredCategory(pieData.slices[0].categoria);
                          setPieTooltipPos({ x: 120, y: 120 });
                        }}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                          if (rect) {
                            setPieTooltipPos({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    ) : (
                      pieData.slices.map((slice) => {
                        const cx = 120;
                        const cy = 120;
                        const r = 95;
                        const isHovered = hoveredCategory === slice.categoria;
                        const offset = isHovered ? 8 : 0;
                        const tx = Math.cos(slice.midAngle) * offset;
                        const ty = Math.sin(slice.midAngle) * offset;

                        const x1 = cx + r * Math.cos(slice.startAngle);
                        const y1 = cy + r * Math.sin(slice.startAngle);
                        const x2 = cx + r * Math.cos(slice.endAngle);
                        const y2 = cy + r * Math.sin(slice.endAngle);
                        const largeArc = slice.sliceAngle > Math.PI ? 1 : 0;
                        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                        return (
                          <path
                            key={slice.categoria}
                            d={d}
                            fill={slice.color.fill}
                            stroke="#0f172a"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            style={{
                              transform: `translate(${tx}px, ${ty}px)`,
                              transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s",
                              opacity: hoveredCategory && !isHovered ? 0.55 : 1,
                            }}
                            className="cursor-pointer"
                            onClick={() => navigateToEventsWithCategory(slice.categoria)}
                            onMouseEnter={() => setHoveredCategory(slice.categoria)}
                            onMouseMove={(e) => {
                              const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                              if (rect) {
                                setPieTooltipPos({
                                  x: e.clientX - rect.left,
                                  y: e.clientY - rect.top,
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredCategory(null)}
                          />
                        );
                      })
                    )}
                  </g>
                </svg>

                {/* Floating Tooltip on Hover */}
                {activeSlice && pieTooltipPos && (
                  <div
                    style={{
                      left: `${pieTooltipPos.x}px`,
                      top: `${pieTooltipPos.y}px`,
                      transform: "translate(-50%, -125%)",
                    }}
                    className="pointer-events-none absolute z-30 px-3 py-2 rounded-xl bg-[#090d16]/95 border border-slate-700 shadow-2xl backdrop-blur-md whitespace-nowrap text-xs transition-opacity duration-150"
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-white mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: activeSlice.color.fill }}
                      />
                      <span>{activeSlice.categoria}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Eventi:</span>
                        <strong className="text-white font-mono">{activeSlice.count}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">Percentuale:</span>
                        <strong className="text-amber-400 font-mono font-bold">
                          {activeSlice.percentStr}
                        </strong>
                      </div>
                    </div>
                    <div className="pt-1 mt-1 border-t border-slate-800 text-[10px] text-amber-400 font-medium flex items-center justify-center">
                      Clicca per gestire eventi &rarr;
                    </div>
                  </div>
                )}
              </div>

              {/* Legend & Details Column */}
              <div className="flex-1 w-full space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {pieData.slices.map((slice) => {
                    const isHovered = hoveredCategory === slice.categoria;
                    return (
                      <div
                        key={slice.categoria}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigateToEventsWithCategory(slice.categoria)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigateToEventsWithCategory(slice.categoria);
                          }
                        }}
                        onMouseEnter={() => setHoveredCategory(slice.categoria)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs select-none ${
                          isHovered
                            ? "bg-[#141d2e] border-slate-500 shadow-md scale-[1.02]"
                            : "bg-[#0b1120]/60 border-slate-800/80 hover:border-slate-700 hover:bg-[#141d2e]/50"
                        }`}
                        title={`Clicca per filtrare gli eventi per ${slice.categoria}`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: slice.color.fill }}
                          />
                          <span className={`font-semibold truncate ${isHovered ? "text-white" : "text-slate-300"}`}>
                            {slice.categoria}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {slice.count}
                          </span>
                          <span
                            className="font-bold font-mono text-[11px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${slice.color.fill}20`,
                              color: slice.color.fill,
                            }}
                          >
                            {slice.percentStr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Nessun evento disponibile per calcolare la distribuzione.
            </div>
          )}
      </div>

      {/* 2. Spazio Gestione Categorie Database (TRA la card distribuzione eventi e feed live attività) */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white">
                  Spazio Gestione Categorie Database
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {categories.length} totali
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {categories.filter((c) => c.attivo).length} attive
                </span>
                {categories.some((c) => !c.attivo) && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {categories.filter((c) => !c.attivo).length} oscurate
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggiungi nuove categorie, oscurale o eliminale dal database. Le categorie oscurate o eliminate non saranno più selezionabili per nuovi eventi, mentre gli eventi già pubblicati manterranno la loro categoria assegnata.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {categories.length === 0 && (
              <button
                onClick={inizializzaCategorieDefault}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" /> Inizializza 10 Predefinite
              </button>
            )}
            <button
              onClick={openNewCategoryModal}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition"
            >
              <Plus className="w-4 h-4" /> Nuova Categoria
            </button>
          </div>
        </div>

        {/* Toolbar: Ricerca e Filtri Stato */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Cerca per nome o sottocategoria..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-[#141d2e] border border-[#1e293b] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            {categorySearch && (
              <button
                onClick={() => setCategorySearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Filtra:</span>
            <button
              onClick={() => setCategoryStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                categoryStatusFilter === "all"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Tutte ({categories.length})
            </button>
            <button
              onClick={() => setCategoryStatusFilter("active")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                categoryStatusFilter === "active"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Attive ({categories.filter((c) => c.attivo).length})
            </button>
            <button
              onClick={() => setCategoryStatusFilter("hidden")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                categoryStatusFilter === "hidden"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Oscurate ({categories.filter((c) => !c.attivo).length})
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredCategories.map((cat) => {
              const evCount = getEventCountForCategory(cat.nome);
              const isOscurata = !cat.attivo;
              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all duration-200 ${
                    isOscurata
                      ? "bg-[#101726] border-amber-500/30 shadow-inner"
                      : "bg-[#141d2e] border-[#1e293b] hover:border-slate-700 hover:shadow-lg hover:shadow-black/20"
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Colore + Nome + Badge Stato */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-white text-xs shadow-sm"
                          style={{ backgroundColor: cat.color_hex || "#EA580C" }}
                        >
                          {cat.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-white truncate" title={cat.nome}>
                            {cat.nome}
                          </h3>
                          <p className="text-[11px] text-slate-400 truncate">
                            {cat.nome_en || cat.id}
                          </p>
                        </div>
                      </div>

                      {isOscurata ? (
                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Oscurata
                        </span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Attiva
                        </span>
                      )}
                    </div>

                    {/* Conteggio eventi associati */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <button
                        onClick={() => navigateToEventsWithCategory(cat.nome)}
                        className="hover:text-amber-400 flex items-center gap-1 font-medium transition"
                        title="Vedi eventi di questa categoria"
                      >
                        <span className="font-bold text-white">{evCount}</span> eventi associati
                        <ArrowUpRight className="w-3 h-3 text-slate-500" />
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono">
                        #{cat.ordine ?? 1} • {cat.id}
                      </span>
                    </div>

                    {/* Sottocategorie Tags */}
                    {cat.sottocategorie && cat.sottocategorie.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cat.sottocategorie.map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-1.5 py-0.5 rounded bg-[#1e293b]/70 text-[10px] text-slate-300"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#1e293b] gap-2">
                    <button
                      onClick={() => toggleOscuraCategoria(cat.id, cat.attivo)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                        isOscurata
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30"
                      }`}
                      title={
                        isOscurata
                          ? "Riattiva per permettere di selezionarla nei nuovi eventi"
                          : "Oscura: non sarà più selezionabile per nuovi eventi (quelli esistenti la mantengono)"
                      }
                    >
                      {isOscurata ? (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Riattiva
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Oscura
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openEditCategoryModal(cat)}
                      className="p-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
                      title="Modifica Categoria"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingCategory(cat)}
                      className="p-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition"
                      title="Elimina Categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
            <Tag className="w-6 h-6 mx-auto text-slate-600 mb-1" />
            <p>Nessuna categoria corrisponde ai filtri di ricerca selezionati.</p>
            {categorySearch && (
              <button
                onClick={() => {
                  setCategorySearch("");
                  setCategoryStatusFilter("all");
                }}
                className="text-amber-400 hover:underline text-xs"
              >
                Reimposta filtri
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Grid: Feed Live Attività + Eventi con Booster Attivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 span): Live Stream Audit Feed */}
        <div className="lg:col-span-1 p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
                Feed Live Attività
              </h2>
              <button
                onClick={() => setActiveTab("audit")}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Log Completi
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Eventi intercettati in tempo reale dal database
            </p>

            <div className="space-y-3 mt-4 max-h-[340px] overflow-y-auto pr-1">
              {auditLogs.length > 0 ? (
                auditLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-[#141d2e] border border-[#1e293b] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 font-mono text-[11px]">
                        {log.azione}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-200 line-clamp-2">{log.dettagli}</p>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>Da: {log.operatore?.email || "Admin"}</span>
                      <span className="uppercase text-[9px] px-1 rounded bg-slate-800 text-slate-300">
                        {log.targetTipo}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-1">
                  <Database className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                  <p>In attesa di nuove azioni su /audit_logs...</p>
                  <p className="text-[10px]">Tutte le modifiche al database verranno registrate qui.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Sincronizzazione bidirezionale attiva in tempo reale con Rook.</span>
          </div>
        </div>

        {/* Right Column (2 spans): Featured Events Booster */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Eventi con Booster Attivo ("⚡ In Evidenza")
                </h2>
                <p className="text-xs text-slate-400">
                  Visualizzati in cima alla home dell'app Rook nel carosello dorato
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("events")}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Gestisci Booster
            </button>
          </div>

          {featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl bg-[#141d2e] border border-amber-500/30 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(
                          ev.categoria
                        )}`}
                      >
                        {ev.categoria}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center">
                        <Flame className="w-3 h-3 mr-0.5 fill-current" /> BOOST
                      </span>
                    </div>
                    <h3 className="mt-2 font-bold text-sm text-white line-clamp-1">
                      {ev.titolo}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {ev.luogo || "Toscana"} — {formatEventDate(ev)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1e293b] text-xs">
                    <span className="text-slate-400 flex items-center">
                      <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {ev.numeroRecensioni || 0} recensioni
                    </span>
                    <button
                      onClick={() => toggleBooster(ev.id)}
                      className="px-2 py-1 rounded text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition"
                    >
                      Disattiva
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Nessun evento ha attualmente il Booster dorato attivo. Puoi abilitarlo dalla scheda "Gestione Eventi".
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuova / Modifica Categoria */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingCategory ? "Modifica Categoria" : "Nuova Categoria"}
                </h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={catForm.nome}
                  onChange={(e) => setCatForm({ ...catForm, nome: e.target.value })}
                  placeholder="es. Cibo & Sagre, Tecnologia & Gaming..."
                  className="w-full px-3 py-2 rounded-lg bg-[#141d2e] border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome Inglese (opzionale)
                </label>
                <input
                  type="text"
                  value={catForm.nome_en}
                  onChange={(e) => setCatForm({ ...catForm, nome_en: e.target.value })}
                  placeholder="es. Food & Festivals, Tech & Gaming..."
                  className="w-full px-3 py-2 rounded-lg bg-[#141d2e] border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Colore Hex & Presets */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Colore Identificativo
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={catForm.color_hex}
                    onChange={(e) => setCatForm({ ...catForm, color_hex: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={catForm.color_hex}
                    onChange={(e) => setCatForm({ ...catForm, color_hex: e.target.value })}
                    className="w-28 px-2.5 py-1.5 rounded-lg bg-[#141d2e] border border-slate-700 text-white text-xs font-mono"
                  />
                  <span
                    className="px-2 py-1 rounded text-[10px] font-bold text-white shadow"
                    style={{ backgroundColor: catForm.color_hex }}
                  >
                    Anteprima
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCatForm({ ...catForm, color_hex: c })}
                      className={`w-5 h-5 rounded-md border transition ${
                        catForm.color_hex.toLowerCase() === c.toLowerCase()
                          ? "scale-110 border-white ring-2 ring-amber-400"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Sottocategorie */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Sottocategorie (separate da virgola)
                </label>
                <input
                  type="text"
                  value={catForm.sottocategorieText}
                  onChange={(e) => setCatForm({ ...catForm, sottocategorieText: e.target.value })}
                  placeholder="es. Sagre, Street Food, Degustazioni..."
                  className="w-full px-3 py-2 rounded-lg bg-[#141d2e] border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Verranno usate per il matching automatico degli eventi e per i filtri di ricerca nell'app Rook.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Ordine di Visualizzazione
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={catForm.ordine}
                    onChange={(e) => setCatForm({ ...catForm, ordine: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg bg-[#141d2e] border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Icona Chiave (key)
                  </label>
                  <input
                    type="text"
                    value={catForm.icon_key}
                    onChange={(e) => setCatForm({ ...catForm, icon_key: e.target.value })}
                    placeholder="es. restaurant, tag, music..."
                    className="w-full px-3 py-2 rounded-lg bg-[#141d2e] border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Switch Attivo */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#141d2e] border border-[#1e293b]">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Categoria Attiva
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Se disattivata (oscurata), non apparirà nei moduli di creazione evento ma gli eventi esistenti la manterranno.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={catForm.attivo}
                  onChange={(e) => setCatForm({ ...catForm, attivo: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                >
                  {editingCategory ? "Aggiorna Categoria" : "Crea Categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione Categoria */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Eliminare la categoria?
                </h3>
                <p className="text-xs text-slate-400">
                  {deletingCategory.nome}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-200 space-y-2">
              <p>
                Sei sicuro di voler eliminare definitivamente <strong>"{deletingCategory.nome}"</strong> dal database?
              </p>
              <p className="text-slate-300">
                Gli eventi esistenti (<strong>{getEventCountForCategory(deletingCategory.nome)}</strong> associati) <strong>manterranno comunque la categoria</strong>, ma questa categoria non sarà più disponibile per la creazione di nuovi eventi né sull'app Rook né su RIWY.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingCategory(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 transition"
              >
                Elimina Categoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
