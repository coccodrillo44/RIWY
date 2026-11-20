"use client";

import React, { useState, useMemo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { RichiestaOrganizzatoreDB, InfoEnteDB, BADGES_DISPONIBILI, BadgeDef } from "@/types";
import {
  Building2,
  BadgeCheck,
  XCircle,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Database,
  Globe,
  Instagram,
  Facebook,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
  Send,
  AlertTriangle,
  Award,
  Sparkles,
  Users,
  Landmark,
  Zap,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  BarChart2,
  TrendingUp,
  Trophy,
  Crown,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

function renderBadgeIcon(iconName: string, className = "w-3 h-3") {
  switch (iconName) {
    case "ShieldCheck":
      return <BadgeCheck className={className} />;
    case "Award":
      return <Award className={className} />;
    case "Users":
      return <Users className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    case "Landmark":
      return <Landmark className={className} />;
    case "Zap":
      return <Zap className={className} />;
    default:
      return <BadgeCheck className={className} />;
  }
}

function getBadgeColorClasses(color: string, isPill = true) {
  switch (color) {
    case "blue":
      return isPill
        ? "bg-blue-500/15 text-blue-400 border-blue-500/40"
        : "text-blue-400";
    case "amber":
      return isPill
        ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
        : "text-amber-400";
    case "purple":
      return isPill
        ? "bg-purple-500/15 text-purple-400 border-purple-500/40"
        : "text-purple-400";
    case "emerald":
      return isPill
        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
        : "text-emerald-400";
    case "indigo":
      return isPill
        ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/40"
        : "text-indigo-400";
    case "pink":
      return isPill
        ? "bg-pink-500/15 text-pink-400 border-pink-500/40"
        : "text-pink-400";
    default:
      return isPill
        ? "bg-slate-700/50 text-slate-300 border-slate-600"
        : "text-slate-300";
  }
}

export function OrganizersManager() {
  const {
    organizers,
    organizerRequests,
    events,
    communities,
    approveOrganizerRequest,
    rejectOrganizerRequest,
    sendChatMessageToEnte,
    suspendEnte,
    reactivateEnte,
    deleteEnte,
    toggleEnteVerificato,
    toggleBadgeEnte,
  } = useAdmin();

  // Menu Gestione Badge
  const [openBadgesMenuOrgId, setOpenBadgesMenuOrgId] = useState<string | null>(null);

  // Reject Request Modal
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Chat Modal
  const [chatOrg, setChatOrg] = useState<InfoEnteDB | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [isSubmittingChat, setIsSubmittingChat] = useState(false);

  // Suspend Modal
  const [suspendOrg, setSuspendOrg] = useState<InfoEnteDB | null>(null);
  const [suspendDays, setSuspendDays] = useState<number>(7);
  const [suspendReason, setSuspendReason] = useState("");
  const [isSubmittingSuspend, setIsSubmittingSuspend] = useState(false);

  // Reactivate Modal
  const [reactivateOrg, setReactivateOrg] = useState<InfoEnteDB | null>(null);
  const [isSubmittingReactivate, setIsSubmittingReactivate] = useState(false);

  // Delete Modal
  const [deleteOrg, setDeleteOrg] = useState<InfoEnteDB | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const pendingRequests = useMemo(() => {
    return organizerRequests.filter(
      (o) => !o.stato || o.stato === "IN_ATTESA" || o.stato === "IN_ATTESA_VERIFICA_EMAIL"
    );
  }, [organizerRequests]);

  const [showDetailedStats, setShowDetailedStats] = useState(true);

  const orgStats = useMemo(() => {
    const totalOrgs = organizers.length;

    // 1. Divisione per province
    const provinceCounts: Record<string, number> = {};
    let verificatiCount = 0;
    let conLogoCount = 0;
    let conSocialCount = 0;
    let sospesiCount = 0;

    organizers.forEach((org) => {
      const prov = org.provinciaEnte?.trim();
      if (prov) {
        provinceCounts[prov] = (provinceCounts[prov] || 0) + 1;
      } else {
        provinceCounts["Non specificata"] = (provinceCounts["Non specificata"] || 0) + 1;
      }

      if (org.verificato) verificatiCount++;
      if (org.logoEnte && org.logoEnte.trim().length > 0) conLogoCount++;
      if (org.instagram || org.facebook || org.tiktok || org.linkedin || org.sitoWeb) conSocialCount++;
      if (org.sospeso) sospesiCount++;
    });

    const sortedProvinces = Object.entries(provinceCounts).sort((a, b) => b[1] - a[1]);

    // 2. Numero di eventi per organizzatore
    const eventsByOrg: Record<string, number> = {};
    organizers.forEach((org) => {
      eventsByOrg[org.idEnte] = 0;
    });

    let totalEventsFromRegisteredOrgs = 0;

    events.forEach((ev) => {
      const matchingOrg = organizers.find(
        (o) =>
          (ev.idOrganizzatore &&
            (o.idEnte.toLowerCase() === ev.idOrganizzatore.toLowerCase() ||
              (o.idCreatore && o.idCreatore.toLowerCase() === ev.idOrganizzatore.toLowerCase()))) ||
          (ev.organizzatore && o.nomeEnte && o.nomeEnte.toLowerCase() === ev.organizzatore.toLowerCase())
      );

      if (matchingOrg) {
        eventsByOrg[matchingOrg.idEnte] = (eventsByOrg[matchingOrg.idEnte] || 0) + 1;
        totalEventsFromRegisteredOrgs++;
      }
    });

    const orgsWithEvents = organizers
      .map((org) => ({
        org,
        eventCount: eventsByOrg[org.idEnte] || 0,
      }))
      .sort((a, b) => b.eventCount - a.eventCount);

    const avgEventsPerOrg = totalOrgs > 0 ? (totalEventsFromRegisteredOrgs / totalOrgs).toFixed(1) : "0.0";
    const orgsWithAtLeastOneEvent = orgsWithEvents.filter((item) => item.eventCount > 0).length;

    // 3. Chi ha community con più iscritti
    const enrichedCommunities = (communities || [])
      .map((comm) => {
        const matchingOrg = organizers.find(
          (o) =>
            (comm.idOrganizzatore &&
              (o.idEnte.toLowerCase() === comm.idOrganizzatore.toLowerCase() ||
                (o.idCreatore && o.idCreatore.toLowerCase() === comm.idOrganizzatore.toLowerCase()))) ||
            (comm.nomeOrganizzatore && o.nomeEnte && o.nomeEnte.toLowerCase() === comm.nomeOrganizzatore.toLowerCase())
        );
        const membersCount = comm.membersCount || (comm.membri ? Object.keys(comm.membri).length : 0);
        return {
          comm,
          matchingOrg,
          membersCount,
        };
      })
      .sort((a, b) => b.membersCount - a.membersCount);

    const topCommunity = enrichedCommunities[0] || null;
    const totalCommunityMembers = enrichedCommunities.reduce((acc, c) => acc + c.membersCount, 0);
    const avgMembersPerCommunity =
      enrichedCommunities.length > 0 ? Math.round(totalCommunityMembers / enrichedCommunities.length) : 0;

    return {
      totalOrgs,
      verificatiCount,
      conLogoCount,
      conSocialCount,
      sospesiCount,
      pendingCount: pendingRequests.length,
      sortedProvinces,
      totalEventsFromRegisteredOrgs,
      avgEventsPerOrg,
      orgsWithAtLeastOneEvent,
      topOrgsByEvents: orgsWithEvents.slice(0, 5),
      topCommunity,
      topCommunities: enrichedCommunities.slice(0, 5),
      totalCommunityMembers,
      avgMembersPerCommunity,
      totalCommunitiesCount: communities ? communities.length : 0,
    };
  }, [organizers, events, communities, pendingRequests]);

  const handleConfirmReject = () => {
    if (!rejectId) return;
    rejectOrganizerRequest(rejectId, rejectReason || "Dati o requisiti non conformi");
    setRejectId(null);
    setRejectReason("");
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatOrg || !chatMessage.trim()) return;
    setIsSubmittingChat(true);
    const ok = await sendChatMessageToEnte(chatOrg.idEnte, chatMessage);
    setIsSubmittingChat(false);
    if (ok) {
      setChatOrg(null);
      setChatMessage("");
    }
  };

  const handleConfirmSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendOrg) return;
    setIsSubmittingSuspend(true);
    const ok = await suspendEnte(suspendOrg.idEnte, suspendDays, suspendReason);
    setIsSubmittingSuspend(false);
    if (ok) {
      setSuspendOrg(null);
      setSuspendReason("");
      setSuspendDays(7);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!reactivateOrg) return;
    setIsSubmittingReactivate(true);
    const ok = await reactivateEnte(reactivateOrg.idEnte);
    setIsSubmittingReactivate(false);
    if (ok) {
      setReactivateOrg(null);
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteOrg) return;
    setIsSubmittingDelete(true);
    const ok = await deleteEnte(deleteOrg.idEnte, deleteReason);
    setIsSubmittingDelete(false);
    if (ok) {
      setDeleteOrg(null);
      setDeleteReason("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Gestione Organizzatori & Enti
          </h1>
          <p className="text-sm text-slate-400">
            Dati in tempo reale degli enti registrati e richieste in attesa di approvazione per l&apos;app Rook.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-[#141d2e] border border-slate-800 text-slate-300">
            Totale Enti: <strong className="text-white">{orgStats.totalOrgs}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
            Verificati: <strong>{orgStats.verificatiCount}</strong>
          </span>
          {orgStats.pendingCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
              In Attesa: <strong>{orgStats.pendingCount}</strong>
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            Community: <strong>{orgStats.totalCommunitiesCount}</strong>
          </span>
        </div>
      </div>

      {/* Sezione Statistiche Enti */}
      <div className="rounded-2xl bg-[#0f172a] border border-[#1e293b] overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#141d2e] via-[#0f172a] to-[#141d2e] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Statistiche Organizzatori & Community
                <span className="text-[11px] font-normal text-slate-400">
                  (Province, eventi per organizzatore e community più seguite)
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={() => setShowDetailedStats(!showDetailedStats)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/40 hover:bg-slate-800 transition-colors border border-slate-700/50"
          >
            <span>{showDetailedStats ? "Comprimi" : "Espandi"}</span>
            {showDetailedStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showDetailedStats && (
          <div className="p-5 space-y-5">
            {/* 4 KPI Cards Rapide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Totale Enti */}
              <div className="p-4 rounded-xl bg-[#141d2e]/80 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Enti Registrati</span>
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{orgStats.totalOrgs}</div>
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Verificati (Blu): <strong className="text-blue-300">{orgStats.verificatiCount}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>In Attesa: <strong className="text-amber-300">{orgStats.pendingCount}</strong></span>
                </div>
              </div>

              {/* Card 2: Eventi per Organizzatore */}
              <div className="p-4 rounded-xl bg-[#141d2e]/80 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Eventi per Organizzatore</span>
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400">{orgStats.avgEventsPerOrg}</span>
                  <span className="text-xs text-slate-400">media eventi/ente</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Totale: <strong className="text-white">{orgStats.totalEventsFromRegisteredOrgs}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>Attivi con eventi: <strong className="text-amber-300">{orgStats.orgsWithAtLeastOneEvent}</strong></span>
                </div>
              </div>

              {/* Card 3: Iscritti Community */}
              <div className="p-4 rounded-xl bg-[#141d2e]/80 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Community & Iscritti</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {orgStats.totalCommunityMembers}
                  <span className="text-xs font-normal text-slate-400 ml-1.5">iscritti totali</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Community: <strong className="text-emerald-300">{orgStats.totalCommunitiesCount}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>Media iscritti: <strong className="text-slate-200">{orgStats.avgMembersPerCommunity}</strong></span>
                </div>
              </div>

              {/* Card 4: Presenza Digitale */}
              <div className="p-4 rounded-xl bg-[#141d2e]/80 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Presenza Digitale</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-300">
                  {orgStats.totalOrgs > 0 ? Math.round((orgStats.conSocialCount / orgStats.totalOrgs) * 100) : 0}%
                  <span className="text-xs font-normal text-slate-400 ml-1.5">con social/web</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Con Logo: <strong className="text-slate-200">{orgStats.conLogoCount}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>Sospesi: <strong className="text-red-400">{orgStats.sospesiCount}</strong></span>
                </div>
              </div>
            </div>

            {/* 3 Pannelli Dettagliati: Province, Eventi per Org, Community Più Iscritte */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Pannello 1: Divisione per Province */}
              <div className="p-4 rounded-xl bg-[#141d2e]/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Divisione Enti per Provincia
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {orgStats.totalOrgs} enti
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-3">
                    Distribuzione degli enti accreditati per provincia della Toscana.
                  </p>

                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {orgStats.sortedProvinces.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Nessun ente presente</p>
                    ) : (
                      orgStats.sortedProvinces.map(([prov, count]) => {
                        const pct = orgStats.totalOrgs > 0 ? Math.round((count / orgStats.totalOrgs) * 100) : 0;
                        return (
                          <div
                            key={prov}
                            className="p-2 rounded-lg bg-[#0f172a]/70 border border-slate-800/60"
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${prov === "Non specificata" ? "bg-slate-600" : "bg-amber-400"}`} />
                                {prov}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                <strong className="text-white">{count}</strong> ent{count === 1 ? "e" : "i"} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  prov === "Non specificata" ? "bg-slate-600" : "bg-gradient-to-r from-amber-500 to-amber-300"
                                }`}
                                style={{ width: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Territorio Toscano</span>
                  <span>Province coperte: <strong className="text-white">{orgStats.sortedProvinces.filter(([p]) => p !== "Non specificata").length}</strong></span>
                </div>
              </div>

              {/* Pannello 2: Numero di Eventi per Organizzatore */}
              <div className="p-4 rounded-xl bg-[#141d2e]/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Eventi per Organizzatore
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Media: {orgStats.avgEventsPerOrg}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-3">
                    Classifica degli organizzatori con il maggior numero di eventi pubblicati.
                  </p>

                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {orgStats.topOrgsByEvents.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Nessun evento associato ad enti</p>
                    ) : (
                      orgStats.topOrgsByEvents.map((item, idx) => {
                        const maxCount = orgStats.topOrgsByEvents[0]?.eventCount || 1;
                        const pct = Math.round((item.eventCount / (maxCount || 1)) * 100);
                        return (
                          <div
                            key={item.org.idEnte}
                            className="p-2 rounded-lg bg-[#0f172a]/70 border border-slate-800/60"
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-slate-200 flex items-center gap-1.5 truncate max-w-[180px]">
                                <span className="text-[10px] font-mono text-slate-500 w-3">#{idx + 1}</span>
                                {item.org.nomeEnte || "Senza nome"}
                                {item.org.verificato && (
                                  <BadgeCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                )}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px] shrink-0">
                                <strong className="text-white">{item.eventCount}</strong> event{item.eventCount === 1 ? "o" : "i"}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                                style={{ width: `${Math.max(pct, item.eventCount > 0 ? 5 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Attivi con eventi: <strong className="text-emerald-400">{orgStats.orgsWithAtLeastOneEvent}</strong></span>
                  <span>Senza eventi: <strong className="text-slate-500">{orgStats.totalOrgs - orgStats.orgsWithAtLeastOneEvent}</strong></span>
                </div>
              </div>

              {/* Pannello 3: Chi ha Community con più Iscritti */}
              <div className="p-4 rounded-xl bg-[#141d2e]/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Community con Più Iscritti
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Top Community
                    </span>
                  </div>

                  {/* Spotlight Top #1 Community */}
                  {orgStats.topCommunity ? (
                    <div className="p-3 mb-3 rounded-xl bg-gradient-to-r from-emerald-500/15 via-[#0f172a] to-transparent border border-emerald-500/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          Community #1 per Iscritti
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
                          {orgStats.topCommunity.membersCount} iscritt{orgStats.topCommunity.membersCount === 1 ? "o" : "i"}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">
                        {orgStats.topCommunity.comm.nomeCommunity || `Community di ${orgStats.topCommunity.comm.nomeOrganizzatore || "Organizzatore"}`}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        Organizzatore: <span className="text-slate-200 font-medium">{orgStats.topCommunity.comm.nomeOrganizzatore || orgStats.topCommunity.matchingOrg?.nomeEnte || "Non specificato"}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 mb-3 rounded-xl bg-[#0f172a] border border-slate-800 text-xs text-slate-500 text-center">
                      Nessuna community creata
                    </div>
                  )}

                  {/* Altre Top Community */}
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {orgStats.topCommunities.slice(1).map((item, idx) => (
                      <div
                        key={item.comm.idCommunity}
                        className="p-2 rounded-lg bg-[#0f172a]/70 border border-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div className="truncate max-w-[180px]">
                          <div className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-slate-500">#{idx + 2}</span>
                            {item.comm.nomeCommunity || item.comm.nomeOrganizzatore || "Community"}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.comm.nomeOrganizzatore || item.matchingOrg?.nomeEnte || ""}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#141d2e] border border-slate-700 font-mono text-[11px] text-emerald-400 font-semibold shrink-0">
                          {item.membersCount} iscritti
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Totale Iscritti: <strong className="text-emerald-400">{orgStats.totalCommunityMembers}</strong></span>
                  <span>Community Create: <strong className="text-white">{orgStats.totalCommunitiesCount}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pending Approval Section */}
      {pendingRequests.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <h2 className="text-base font-bold text-white">
              Richieste di Registrazione in Attesa ({pendingRequests.length})
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Questi utenti hanno richiesto di diventare organizzatori ufficiali. L&apos;approvazione assegna il badge e abilita la pubblicazione eventi in app.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.idRichiesta}
                className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-white">{req.nomeEnte}</h3>
                      <p className="text-xs text-amber-400 font-medium">
                        Richiesta da: {req.usernameRichiedente || req.emailRichiedente || req.uidUtente}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        req.stato === "IN_ATTESA_VERIFICA_EMAIL"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {req.stato === "IN_ATTESA_VERIFICA_EMAIL"
                        ? "ATTESA VERIFICA EMAIL"
                        : "EMAIL VERIFICATA"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                    {req.descEnte || "Nessuna descrizione specificata"}
                  </p>

                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{req.comuneEnte || req.sedeOrg || "Toscana"} {req.provinciaEnte ? `(${req.provinciaEnte})` : ""}</span>
                    </div>
                    {req.emailEnte && (
                      <div className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{req.emailEnte}</span>
                      </div>
                    )}
                    {req.telefonoEnte && (
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{req.telefonoEnte}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1e293b]">
                  <button
                    onClick={() => setRejectId(req.idRichiesta)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition"
                  >
                    Respingi
                  </button>
                  <button
                    onClick={() => approveOrganizerRequest(req)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20"
                  >
                    Approva Ente
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified / Approved Organizers Table */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white">Elenco Enti Registrati</h2>
        {organizers.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-[#1e293b] bg-[#0f172a]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#141d2e] text-slate-400 uppercase text-[11px] font-semibold border-b border-[#1e293b]">
                <tr>
                  <th className="px-4 py-3">Nome Ente</th>
                  <th className="px-4 py-3">Sede / Territorio</th>
                  <th className="px-4 py-3">Contatti</th>
                  <th className="px-4 py-3 text-center">Stato / Badge</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {organizers.map((org) => (
                  <tr key={org.idEnte} className="hover:bg-[#141d2e]/60 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white text-sm flex items-center">
                        {org.nomeEnte || "Ente senza nome"}
                        <BadgeCheck className="w-4 h-4 ml-1.5 text-blue-400" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {org.descEnte || org.referenteOrg || ""}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {org.comuneEnte || org.sedeOrg || "Toscana"}{" "}
                      {org.provinciaEnte ? `(${org.provinciaEnte})` : ""}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-300 text-[11px]">{org.emailEnte || "Nessuna email"}</div>
                      <div className="text-[10px] text-slate-400">{org.telefonoEnte || ""}</div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5 relative">
                        {org.sospeso && (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              SOSPESO
                            </span>
                            {org.sospesoFino && (
                              <span className="text-[9px] text-amber-300/80 mt-0.5">
                                fino al {formatDate(org.sospesoFino, false)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Badge Attivi dell'Organizzatore */}
                        <div className="flex flex-wrap items-center justify-center gap-1 max-w-[220px]">
                          {(() => {
                            const badgesOrg = org.badges || (org.verificato ? ["VERIFICATO"] : []);
                            if (badgesOrg.length === 0) {
                              return (
                                <span className="text-[10px] text-slate-500 italic">
                                  Nessun badge
                                </span>
                              );
                            }
                            return badgesOrg.map((bId) => {
                              const bDef = BADGES_DISPONIBILI.find((d) => d.id === bId);
                              const label = bDef?.label || bId;
                              const colorClass = getBadgeColorClasses(bDef?.colore || "blue", true);
                              return (
                                <span
                                  key={bId}
                                  title={`${label}: ${bDef?.descrizione || ""}`}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${colorClass} cursor-default`}
                                >
                                  {renderBadgeIcon(bDef?.icon || "ShieldCheck", "w-3 h-3")}
                                  <span>{label}</span>
                                </span>
                              );
                            });
                          })()}
                        </div>

                        {/* Pulsante Gestisci / Assegna Badge */}
                        <div className="relative mt-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenBadgesMenuOrgId(
                                openBadgesMenuOrgId === org.idEnte ? null : org.idEnte
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
                          >
                            <Plus className="w-3 h-3 text-cyan-400" />
                            <span>Gestisci Badge</span>
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </button>

                          {/* Dropdown Popover Assegnazione Badge */}
                          {openBadgesMenuOrgId === org.idEnte && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenBadgesMenuOrgId(null)}
                              />
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 z-50 text-left">
                                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                                  <span className="text-[11px] font-bold text-slate-200">
                                    Badge Assegnabili ({org.nomeEnte})
                                  </span>
                                  <button
                                    onClick={() => setOpenBadgesMenuOrgId(null)}
                                    className="text-slate-400 hover:text-slate-200"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                  {BADGES_DISPONIBILI.map((badge) => {
                                    const badgesOrg = org.badges || (org.verificato ? ["VERIFICATO"] : []);
                                    const isAssigned = badgesOrg.includes(badge.id);

                                    return (
                                      <div
                                        key={badge.id}
                                        onClick={() => toggleBadgeEnte(org.idEnte, badge.id)}
                                        className={`flex items-start justify-between gap-2 p-1.5 rounded-lg cursor-pointer transition ${
                                          isAssigned
                                            ? "bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800"
                                            : "hover:bg-slate-800/40 border border-transparent"
                                        }`}
                                      >
                                        <div className="flex items-start gap-1.5">
                                          <div
                                            className={`p-1 rounded mt-0.5 ${getBadgeColorClasses(
                                              badge.colore,
                                              true
                                            )}`}
                                          >
                                            {renderBadgeIcon(badge.icon, "w-3.5 h-3.5")}
                                          </div>
                                          <div>
                                            <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                                              {badge.label}
                                              {isAssigned && (
                                                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                                  Attivo
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[9px] text-slate-400 leading-tight">
                                              {badge.descrizione}
                                            </div>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded transition shrink-0 ${
                                            isAssigned
                                              ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                                              : "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25"
                                          }`}
                                        >
                                          {isAssigned ? "Rimuovi" : "Assegna"}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Contatta in Chat */}
                        <button
                          onClick={() => {
                            setChatOrg(org);
                            setChatMessage("");
                          }}
                          title="Invia messaggio in chat all'ente"
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:scale-105 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        {/* Sospendi / Riattiva */}
                        {org.sospeso ? (
                          <button
                            onClick={() => setReactivateOrg(org)}
                            title="Revoca sospensione e riattiva ente"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 transition"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSuspendOrg(org);
                              setSuspendDays(7);
                              setSuspendReason("");
                            }}
                            title="Sospendi ente per N giorni"
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:scale-105 transition"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Elimina */}
                        <button
                          onClick={() => {
                            setDeleteOrg(org);
                            setDeleteReason("");
                          }}
                          title="Elimina definitivamente ente"
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:scale-105 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2 bg-[#0f172a]">
            <Database className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">
              Nessun ente presente
            </p>
            <p className="max-w-md mx-auto text-slate-500">
              Non appena un organizzatore viene registrato o approvato dalle richieste, comparirà qui con tutti i recapiti.
            </p>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-red-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center">
              <XCircle className="w-5 h-5 text-red-400 mr-2" />
              Respingi Richiesta Ente
            </h3>
            <p className="text-xs text-slate-300">
              L&apos;esito del rifiuto verrà registrato nel sistema e l&apos;utente non riceverà il badge da organizzatore.
            </p>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Motivo del Rifiuto</label>
              <input
                type="text"
                placeholder="Es. Dati non verificabili o requisiti mancanti"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectId(null)}
                className="px-3 py-1.5 rounded-lg bg-[#141d2e] text-slate-300 text-xs"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-xs"
              >
                Conferma Rifiuto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Message Modal */}
      {chatOrg && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-base">
                <MessageCircle className="w-5 h-5" />
                <span>Messaggio in Chat all&apos;Ente</span>
              </div>
              <button
                onClick={() => setChatOrg(null)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#141d2e] border border-slate-800">
              <span className="text-xs text-slate-400 block">Destinatario</span>
              <span className="text-sm font-bold text-white">{chatOrg.nomeEnte || "Organizzatore"}</span>
              <span className="text-xs text-slate-400 block mt-0.5">{chatOrg.emailEnte || chatOrg.comuneEnte || ""}</span>
            </div>

            <form onSubmit={handleSendChat} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Messaggio dell&apos;Amministrazione
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Scrivi qui il messaggio da inviare nella chat ufficiale dell'app..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="w-full bg-[#141d2e] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Il messaggio comparirà nella stanza di chat con l&apos;amministrazione e invierà una notifica push in app all&apos;organizzatore.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setChatOrg(null)}
                  disabled={isSubmittingChat}
                  className="px-4 py-2 rounded-xl bg-[#141d2e] hover:bg-[#1a253a] text-slate-300 text-xs font-semibold transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingChat || !chatMessage.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-lg shadow-blue-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingChat ? "Invio in corso..." : "Invia Messaggio in Chat"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Confirmation & Days Modal */}
      {suspendOrg && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-base">
                <PauseCircle className="w-5 h-5" />
                <span>Sospensione Ente</span>
              </div>
              <button
                onClick={() => setSuspendOrg(null)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
              Stai per sospendere l&apos;ente <strong className="text-white">{suspendOrg.nomeEnte}</strong>. Durante la sospensione, l&apos;organizzatore non potrà pubblicare nuovi eventi e riceverà una notifica in app su smartphone.
            </div>

            <form onSubmit={handleConfirmSuspend} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Durata della sospensione (in giorni)
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  {[3, 7, 15, 30, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSuspendDays(d)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                        suspendDays === d
                          ? "bg-amber-500 text-slate-950 border-amber-500"
                          : "bg-[#141d2e] text-slate-400 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {d} gg
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    required
                    value={suspendDays}
                    onChange={(e) => setSuspendDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#141d2e] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">giorni</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Motivo della sospensione (verrà inviato nella notifica all&apos;ente)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Es. Mancato rispetto linee guida o verifiche amministrative in corso..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full bg-[#141d2e] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setSuspendOrg(null)}
                  disabled={isSubmittingSuspend}
                  className="px-4 py-2 rounded-xl bg-[#141d2e] hover:bg-[#1a253a] text-slate-300 text-xs font-semibold transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSuspend || !suspendReason.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-lg shadow-amber-500/20"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>{isSubmittingSuspend ? "Sospensione in corso..." : `Conferma Sospensione (${suspendDays} gg)`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reactivate Confirmation Modal */}
      {reactivateOrg && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-base">
              <PlayCircle className="w-5 h-5" />
              <span>Revoca Sospensione Ente</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Vuoi revocare anticipatamente la sospensione per l&apos;ente <strong className="text-white">{reactivateOrg.nomeEnte}</strong>?
              L&apos;organizzatore potrà tornare a pubblicare eventi e riceverà una notifica in app su smartphone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setReactivateOrg(null)}
                disabled={isSubmittingReactivate}
                className="px-4 py-2 rounded-xl bg-[#141d2e] text-slate-300 text-xs font-semibold"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmReactivate}
                disabled={isSubmittingReactivate}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>{isSubmittingReactivate ? "Riattivazione..." : "Conferma Riattivazione"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOrg && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-red-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Elimina Definitivamente Ente</span>
              </div>
              <button
                onClick={() => setDeleteOrg(null)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 leading-relaxed">
              Attenzione: stai per eliminare definitivamente il profilo dell&apos;ente <strong className="text-white">{deleteOrg.nomeEnte}</strong>. I permessi di organizzatore verranno rimossi dall&apos;utente associato. All&apos;interessato verrà recapitata una notifica in app su smartphone.
            </div>

            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Motivo dell&apos;eliminazione (verrà comunicato nella notifica all&apos;ente)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Es. Violazione ripetuta dei termini, account non legittimo o richiesta di chiusura..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full bg-[#141d2e] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setDeleteOrg(null)}
                  disabled={isSubmittingDelete}
                  className="px-4 py-2 rounded-xl bg-[#141d2e] hover:bg-[#1a253a] text-slate-300 text-xs font-semibold transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDelete || !deleteReason.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-lg shadow-red-600/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isSubmittingDelete ? "Eliminazione in corso..." : "Elimina Definitivamente Ente"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
