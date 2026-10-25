"use client";

import React, { useState, useMemo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { EventoDB } from "@/types";
import {
  Search,
  Flame,
  Edit,
  Trash2,
  CheckCircle,
  EyeOff,
  MapPin,
  Calendar,
  Database,
  ExternalLink,
  History,
} from "lucide-react";
import { getCategoryBadgeClass, formatEventDate, isBoostAttivo, isEventoPassato, extractProvince, normalizeCategory } from "@/lib/utils";

export function EventsManager() {
  const {
    events,
    toggleBooster,
    toggleOscurato,
    saveEventEdit,
    deleteEvent,
    isLoading,
    eventCategoryFilter,
    setEventCategoryFilter,
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState("");
  const selectedCategory = eventCategoryFilter;
  const setSelectedCategory = setEventCategoryFilter;
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modal State
  const [editingEvent, setEditingEvent] = useState<EventoDB | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const categories = [
    "Cibo & Sagre",
    "Musica & Feste",
    "Arte & Cultura",
    "Sport & Movimento",
    "Famiglia & Bambini",
    "Fiere & Mercati",
    "Nuove Aperture",
  ];

  const provinces = ["FI", "PI", "LU", "SI", "AR", "LI", "MS", "GR", "PO", "PT"];

  // Filter logic
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const title = ev.titolo || "";
      const org = ev.organizzatore || "";
      const place = ev.luogo || "";
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        title.toLowerCase().includes(term) ||
        org.toLowerCase().includes(term) ||
        place.toLowerCase().includes(term);

      const matchesCategory =
        selectedCategory === "all" ||
        ev.categoria === selectedCategory ||
        normalizeCategory(ev.categoria) === selectedCategory;
      const matchesProvince =
        selectedProvince === "all" || ev.provincia === selectedProvince;

      const hasBoost = isBoostAttivo(ev);
      const isPast = isEventoPassato(ev);
      const isVisible = !ev.oscurato && !isPast;

      let matchesStatus = true;
      if (selectedStatus === "booster") {
        matchesStatus = hasBoost;
      } else if (selectedStatus === "visibile") {
        matchesStatus = isVisible;
      } else if (selectedStatus === "passato") {
        matchesStatus = isPast;
      } else if (selectedStatus === "oscurato") {
        matchesStatus = ev.oscurato === true;
      }

      return matchesSearch && matchesCategory && matchesProvince && matchesStatus;
    });
  }, [events, searchTerm, selectedCategory, selectedProvince, selectedStatus]);

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    saveEventEdit(editingEvent);
    setEditingEvent(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingId) return;
    deleteEvent(deletingId, deleteReason || "Violazione termini d'uso o richiesta organizzatore");
    setDeletingId(null);
    setDeleteReason("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Gestione & Moderazione Eventi
          </h1>
          <p className="text-sm text-slate-400">
            Dati in tempo reale dall'infrastruttura Firebase di Rook in Toscana.
          </p>
        </div>
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-xs text-slate-400">
            Eventi filtrati: <strong className="text-amber-400">{filteredEvents.length}</strong> su {events.length}
          </span>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium transition"
              title="Mostra tutte le categorie"
            >
              (Filtro attivo: {selectedCategory} ✕)
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca per titolo, organizzatore o comune..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141d2e] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {/* Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#141d2e] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tutte le Categorie (7)</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Provincia */}
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="bg-[#141d2e] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tutte le Province (10)</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Stato */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#141d2e] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tutti gli Stati</option>
            <option value="visibile">Attivo (Visibile in App)</option>
            <option value="passato">Passato (Storico Enti)</option>
            <option value="oscurato">Oscurato / Nascosto</option>
            <option value="booster">⚡ Con Booster Attivo</option>
          </select>
        </div>
      </div>

      {/* Events Table / Card Grid */}
      {filteredEvents.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[#1e293b] bg-[#0f172a]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141d2e] text-slate-400 uppercase text-[11px] font-semibold border-b border-[#1e293b]">
              <tr>
                <th className="px-4 py-3">Evento & Categoria</th>
                <th className="px-4 py-3">Data & Location</th>
                <th className="px-4 py-3">Organizzatore</th>
                <th className="px-4 py-3 text-center">Booster ⚡</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredEvents.map((ev) => {
                const hasBoost = isBoostAttivo(ev);
                const isPast = isEventoPassato(ev);

                return (
                  <tr key={ev.id} className="hover:bg-[#141d2e]/60 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white text-sm line-clamp-1">
                        {ev.titolo || "Evento senza titolo"}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(
                            ev.categoria
                          )}`}
                        >
                          {ev.categoria || "Altro"}
                        </span>
                        {ev.accessibileDisabili && (
                          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1 rounded">
                            ♿ Disabili
                          </span>
                        )}
                        {ev.opzioniVeg && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1 rounded">
                            🌱 Veg
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center text-slate-200">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>{formatEventDate(ev)}</span>
                      </div>
                      <div className="flex items-center text-slate-400 text-[11px] mt-0.5">
                        <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                        <span>{ev.luogo || "Toscana"} ({ev.provincia || "N/D"})</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-200">
                        {ev.organizzatore || "Organizzatore non specificato"}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {ev.idOrganizzatore || ev.id}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleBooster(ev.id)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                          hasBoost
                            ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30"
                            : "bg-[#1e293b] text-slate-400 hover:text-amber-400 hover:bg-[#283548]"
                        }`}
                      >
                        <Flame className={`w-3.5 h-3.5 mr-1 ${hasBoost ? "fill-current" : ""}`} />
                        {hasBoost ? "ATTIVO" : "OFF"}
                      </button>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {isPast ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700/40 text-slate-300 border border-slate-600/50 inline-flex items-center gap-1">
                            <History className="w-3 h-3 text-slate-400" />
                            Passato (Storico)
                          </span>
                          {ev.oscurato && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
                              <EyeOff className="w-2.5 h-2.5 text-red-400" />
                              Oscurato
                            </span>
                          )}
                        </div>
                      ) : !ev.oscurato ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Visibile in App
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/15 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-red-400" />
                          Oscurato / Nascosto
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setEditingEvent({ ...ev })}
                          title="Modifica Rapida"
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => toggleOscurato(ev.id, !ev.oscurato)}
                          title={ev.oscurato ? "Ripristina Visibilità" : "Nascondi dall'app"}
                          className={`p-1.5 rounded-lg transition ${
                            ev.oscurato
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          }`}
                        >
                          {ev.oscurato ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => setDeletingId(ev.id)}
                          title="Elimina Definitivamente"
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
          <Database className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-400">
            Nessun evento trovato in /eventi
          </p>
          <p className="max-w-md mx-auto text-slate-500">
            {events.length === 0
              ? "Il database Firebase non contiene attualmente eventi nel nodo /eventi. Quando un organizzatore pubblicherà un evento dall'app Rook, comparirà qui istantaneamente."
              : "Nessun evento corrisponde ai filtri di ricerca applicati."}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <h2 className="text-lg font-bold text-white">Modifica Dati Evento</h2>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Titolo Evento</label>
                <input
                  type="text"
                  value={editingEvent.titolo || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, titolo: e.target.value })}
                  className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Macro-Categoria</label>
                  <select
                    value={editingEvent.categoria}
                    onChange={(e) => setEditingEvent({ ...editingEvent, categoria: e.target.value })}
                    className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Provincia (dedotta dal luogo)</label>
                  <div className="w-full bg-[#141d2e]/50 border border-slate-800 rounded-lg p-2 text-slate-400">
                    {extractProvince(editingEvent.luogo)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Luogo / Indirizzo</label>
                <input
                  type="text"
                  value={editingEvent.luogo || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, luogo: e.target.value })}
                  placeholder="Es. Piazza della Signoria, Firenze"
                  className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Descrizione</label>
                <textarea
                  rows={3}
                  value={editingEvent.descrizione || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, descrizione: e.target.value })}
                  className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingEvent.accessibileDisabili || false}
                    onChange={(e) => setEditingEvent({ ...editingEvent, accessibileDisabili: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Accessibile Disabili</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingEvent.opzioniVeg || false}
                    onChange={(e) => setEditingEvent({ ...editingEvent, opzioniVeg: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Opzioni Veg</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-lg bg-[#141d2e] text-slate-300 hover:bg-[#1e293b]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Salva in Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-red-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center">
              <Trash2 className="w-5 h-5 text-red-400 mr-2" />
              Conferma Eliminazione da Firebase
            </h3>
            <p className="text-xs text-slate-300">
              L'evento verrà rimosso immediatamente dal database in /eventi e sparirà dall'app Android in tempo reale.
            </p>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Motivazione rimozione</label>
              <input
                type="text"
                placeholder="Es. Evento annullato o non conforme"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full bg-[#141d2e] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 rounded-lg bg-[#141d2e] text-slate-300 text-xs"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-xs"
              >
                Elimina Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
