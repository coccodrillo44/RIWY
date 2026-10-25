"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useAdmin } from "@/context/AdminContext";
import {
  MapPin,
  Flame,
  Database,
  Calendar,
  ArrowUpRight,
  Check,
  X,
  Compass,
  Building2,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { getCategoryBadgeClass, formatEventDate, isBoostAttivo } from "@/lib/utils";
import confiniToscanaData from "@/lib/confini_toscana.json";

// API Key Google Maps condivisa con Rook App
const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "AIzaSyAtihbYGpKKWtqQ6J7j0bHhBsZyZACtjZU";

// Limiti geografici Toscana
const TOSCANA_BOUNDS = {
  north: 44.48,
  south: 42.20,
  east: 12.40,
  west: 9.68,
};
const CENTRO_TOSCANA = { lat: 43.45, lng: 11.15 };

interface ProvinceConfini {
  bbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  polygons: number[][][]; // array di ring [lat, lng][]
}

type ConfiniMap = Record<string, ProvinceConfini>;
const confiniMap = confiniToscanaData as unknown as ConfiniMap;

function getProvinceConfini(sigla: string): ProvinceConfini | null {
  const data = confiniToscanaData as any;
  if (!data) return null;
  const s = sigla.trim().toUpperCase();
  if (data[s]) return data[s];
  if (data.default && data.default[s]) return data.default[s];
  return null;
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (typeof window.google !== "undefined" && window.google.maps) {
    return Promise.resolve();
  }
  const existingScript = document.getElementById("google-maps-script");
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", (e) => reject(e));
      if (typeof window.google !== "undefined" && window.google.maps) resolve();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

function getCategoryVisuals(categoria?: string, hasBoost?: boolean) {
  const norm = (categoria || "").trim().toLowerCase();

  if (hasBoost) {
    return {
      color: "#FF9500", // Arancio Caldo Boost
      iconPath: `<path d="M7 2v11h3v9l7-12h-4l4-8z"/>`, // Saetta / Booster
    };
  }

  if (norm.includes("cibo") || norm.includes("sagre")) {
    return {
      color: "#FF9500", // Arancio Caldo
      iconPath: `<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>`, // Posate / Ristorante
    };
  }
  if (norm.includes("street food")) {
    return {
      color: "#E66000", // Arancio Vermiglio
      iconPath: `<path d="M1 21.99V21h15.03v.99c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1zm15.03-7c0-8-15.03-8-15.03 0h15.03zM1.02 17h15v2h-15z"/>`, // Fast Food
    };
  }
  if (norm.includes("musica") || norm.includes("feste") || norm.includes("musicali")) {
    return {
      color: "#5267D4", // Blu Indaco
      iconPath: `<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>`, // Nota Musicale
    };
  }
  if (norm.includes("folklore") || norm.includes("feste e folklore")) {
    return {
      color: "#FFCB00", // Giallo Solare
      iconPath: `<path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z"/>`, // Stella / Festa
    };
  }
  if (norm.includes("arte") || norm.includes("cultura") || norm.includes("artistici")) {
    return {
      color: "#C4467A", // Rosa Lampone
      iconPath: `<path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.23 19.64 10.57 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-4.5 9c-.83 0-1.5-.67-1.5-1.5S6.67 9 7.5 9s1.5.67 1.5 1.5S8.33 12 7.5 12zm3-4C9.67 8 9 7.33 9 6.5S9.67 5 10.5 5s1.5.67 1.5 1.5S11.33 8 10.5 8zm3 0c-.83 0-1.5-.67-1.5-1.5S12.67 5 13.5 5s1.5.67 1.5 1.5S14.33 8 13.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>`, // Tavolozza Arte
    };
  }
  if (norm.includes("sport") || norm.includes("movimento") || norm.includes("sportivi")) {
    return {
      color: "#0095DD", // Azzurro Cielo
      iconPath: `<path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1c1.92-.47 3.39-2.05 3.61-4.06C19.08 11.53 21 9.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>`, // Trofeo / Sport
    };
  }
  if (norm.includes("famiglia") || norm.includes("bambini") || norm.includes("giostre")) {
    return {
      color: "#FFCB00", // Giallo Solare
      iconPath: `<path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm7 7h-4V7h-2v2H7c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h1v4h4v-4h2v4h4v-4h1c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2z"/>`, // Famiglia
    };
  }
  if (norm.includes("fiere") || norm.includes("mercati")) {
    return {
      color: "#00539F", // Blu Oceano
      iconPath: `<path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>`, // Vetrina / Mercato
    };
  }
  if (norm.includes("nuove")) {
    return {
      color: "#D90429", // Corallo Aperture
      iconPath: `<path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>`, // Negozio / Nuove Aperture
    };
  }
  if (norm.includes("biblioteca")) {
    return {
      color: "#2D6A4F", // Verde Biblioteca
      iconPath: `<path d="M12 11.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55 2.36-2.19 5.52-3.55 9-3.55V8c-3.48 0-6.64 1.35-9 3.55zM12 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z"/>`, // Biblioteca
    };
  }
  if (norm.includes("religio")) {
    return {
      color: "#7B2CBF", // Viola Religioso
      iconPath: `<path d="M18 12.22V9l-5-2.5V5h2V3h-2V1h-2v2H9v2h2v1.5L6 9v3.22L2 14v8h8v-3c0-1.1.9-2 2-2s2 .9 2 2v3h8v-8l-4-1.78zM12 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>`, // Religione
    };
  }

  return {
    color: "#00539F", // Blu Oceano predefinito
    iconPath: `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>`,
  };
}

// Genera l'icona personalizzata del marker (testa arrotondata + punta + icona categoria interna bianca)
function buildCategoryMarkerSvg(color: string, iconPath: string, isBoost: boolean) {
  const width = isBoost ? 40 : 36;
  const height = isBoost ? 48 : 44;
  const strokeColor = isBoost ? "#FFFBEB" : "#FFFFFF";
  const strokeWidth = isBoost ? 2.5 : 2;

  // Profilo coordinato del pin (identico a MarkerPinCategoria dell'app Rook)
  const pathD = isBoost
    ? "M 9 2 L 31 2 A 7 7 0 0 1 38 9 L 38 29 A 7 7 0 0 1 31 36 L 25 36 L 20 46 L 15 36 L 9 36 A 7 7 0 0 1 2 29 L 2 9 A 7 7 0 0 1 9 2 Z"
    : "M 8 2 L 28 2 A 6 6 0 0 1 34 8 L 34 26 A 6 6 0 0 1 28 32 L 22.5 32 L 18 42 L 13.5 32 L 8 32 A 6 6 0 0 1 2 26 L 2 8 A 6 6 0 0 1 8 2 Z";

  const gTransform = isBoost
    ? 'transform="translate(11, 7) scale(0.75)"'
    : 'transform="translate(9, 6) scale(0.75)"';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="p-sh" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.32"/>
    </filter>
  </defs>
  <g filter="url(#p-sh)">
    <path d="${pathD}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
    <g ${gTransform} fill="#FFFFFF">
      ${iconPath}
    </g>
  </g>
</svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    width,
    height,
    anchorX: isBoost ? 20 : 18,
    anchorY: isBoost ? 46 : 42,
  };
}

export function TuscanyMapViewer() {
  const { events, toggleBooster, setActiveTab } = useAdmin();
  // Provincia attiva (all'inizio nessuna provincia selezionata)
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  // Stati Google Maps
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const provincesData = [
    { sigla: "FI", nome: "Firenze", lat: 43.77, lng: 11.25, badge: "Hub Principale" },
    { sigla: "PI", nome: "Pisa", lat: 43.71, lng: 10.40, badge: "Costiera & Entroterra" },
    { sigla: "LU", nome: "Lucca", lat: 43.84, lng: 10.50, badge: "Comics & Mura" },
    { sigla: "SI", nome: "Siena", lat: 43.31, lng: 11.33, badge: "Chianti & Val d'Orcia" },
    { sigla: "AR", nome: "Arezzo", lat: 43.46, lng: 11.88, badge: "Antiquariato & Valli" },
    { sigla: "LI", nome: "Livorno", lat: 43.55, lng: 10.31, badge: "Costa & Arcipelago" },
    { sigla: "GR", nome: "Grosseto", lat: 42.76, lng: 11.11, badge: "Maremma" },
    { sigla: "PO", nome: "Prato", lat: 43.88, lng: 11.09, badge: "Distretto & Cultura" },
    { sigla: "PT", nome: "Pistoia", lat: 43.93, lng: 10.91, badge: "Montagna Pistoiese" },
    { sigla: "MS", nome: "Massa-Carrara", lat: 44.03, lng: 10.14, badge: "Apuane & Marmo" },
  ];

  // Conteggio eventi per ciascuna provincia
  const provinceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((ev) => {
      const p = (ev.provincia || "N/D").trim().toUpperCase();
      counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }, [events]);

  const selectedProvinceObj = useMemo(
    () => (selectedProvince ? provincesData.find((p) => p.sigla === selectedProvince) || null : null),
    [selectedProvince]
  );

  // Eventi della SOLA provincia selezionata (se nessuna selezionata, array vuoto per la card sotto)
  const displayedEvents = useMemo(() => {
    if (!selectedProvince) return [];
    return events.filter((ev) => {
      const p = (ev.provincia || "N/D").trim().toUpperCase();
      return p === selectedProvince;
    });
  }, [events, selectedProvince]);

  // Eventi da visualizzare su Google Maps (se provincia selezionata, solo quelli; altrimenti tutti gli eventi toscani)
  const mapEvents = useMemo(() => {
    if (selectedProvince) return displayedEvents;
    return events;
  }, [selectedProvince, displayedEvents, events]);

  // Inizializzazione Google Maps in MODALITÀ CHIARA (Light Mode nativa)
  useEffect(() => {
    let isCancelled = false;

    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (isCancelled || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const map = new google.maps.Map(mapContainerRef.current, {
            center: CENTRO_TOSCANA,
            zoom: 8.2,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            backgroundColor: "#f8fafc",
          });

          // Chiudi infoWindow al clic sulla mappa
          map.addListener("click", () => {
            if (infoWindowRef.current) {
              infoWindowRef.current.close();
            }
          });

          mapInstanceRef.current = map;
        }

        setMapLoaded(true);
      })
      .catch((err) => {
        console.error("Errore caricamento Google Maps:", err);
        if (!isCancelled) setMapError("Impossibile caricare Google Maps.");
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Funzione per centrare e animare la telecamera sui confini provinciali o regionali
  const centerCameraOnProvince = (sigla: string | null) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (sigla) {
      const confini = getProvinceConfini(sigla);
      if (confini && confini.bbox) {
        const bounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(confini.bbox.minLat, confini.bbox.minLng),
          new google.maps.LatLng(confini.bbox.maxLat, confini.bbox.maxLng)
        );
        const center = bounds.getCenter();
        map.panTo(center);
        map.fitBounds(bounds, { top: 35, right: 35, bottom: 35, left: 35 });
        return;
      }

      // Fallback hub coordinate
      const provObj = provincesData.find((p) => p.sigla === sigla);
      if (provObj) {
        map.panTo({ lat: provObj.lat, lng: provObj.lng });
        map.setZoom(9.5);
        return;
      }
    }

    // Deselezionato: ripristina la visuale completa della Toscana
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(TOSCANA_BOUNDS.south, TOSCANA_BOUNDS.west),
      new google.maps.LatLng(TOSCANA_BOUNDS.north, TOSCANA_BOUNDS.east)
    );
    map.panTo(CENTRO_TOSCANA);
    map.fitBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 });
  };

  // Effetto: confini provincia in blu elettrico e telecamera animate (esattamente come in Rook App)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Rimuovi poligoni esistenti
    polygonsRef.current.forEach((poly) => poly.setMap(null));
    polygonsRef.current = [];

    if (selectedProvince) {
      const confini = getProvinceConfini(selectedProvince);

      if (confini && confini.polygons) {
        // Disegna i poligoni del confine provinciale in blu elettrico con bagliore trasparente
        confini.polygons.forEach((ring) => {
          const polygon = new google.maps.Polygon({
            paths: ring.map(([lat, lng]) => ({ lat, lng })),
            strokeColor: "#0066FF", // Blu elettrico identico a Rook App
            strokeOpacity: 0.95,
            strokeWeight: 3.5,
            fillColor: "#0066FF",
            fillOpacity: 0.16, // Bagliore interno 16%
            clickable: false,
            zIndex: 10,
            map,
          });
          polygonsRef.current.push(polygon);
        });
      }
    }

    // Centra e anima la telecamera
    centerCameraOnProvince(selectedProvince);
  }, [selectedProvince, mapLoaded]);

  // Effetto: Rendering dei Marker degli eventi sulla mappa
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Rimuovi vecchi marker
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    mapEvents.forEach((ev, idx) => {
      let lat = ev.latitudine;
      let lng = ev.longitudine;

      // Coordinate di fallback determinate in base alla provincia se non presenti
      if (!lat || !lng || lat === 0 || lng === 0) {
        const provObj = provincesData.find(
          (p) => p.sigla === (ev.provincia || "").trim().toUpperCase()
        );
        const baseLat = provObj ? provObj.lat : 43.77;
        const baseLng = provObj ? provObj.lng : 11.25;
        const angle = (idx * 137.5 * Math.PI) / 180;
        const radius = 0.015 + (idx % 4) * 0.012;
        lat = baseLat + Math.cos(angle) * radius;
        lng = baseLng + Math.sin(angle) * radius;
      }

      const hasBoost = isBoostAttivo(ev);
      const visuals = getCategoryVisuals(ev.categoria, hasBoost);
      const iconInfo = buildCategoryMarkerSvg(visuals.color, visuals.iconPath, hasBoost);

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: `${ev.titolo} - ${ev.luogo || ev.provincia || "Toscana"}`,
        icon: {
          url: iconInfo.url,
          scaledSize: new google.maps.Size(iconInfo.width, iconInfo.height),
          anchor: new google.maps.Point(iconInfo.anchorX, iconInfo.anchorY),
        },
        zIndex: hasBoost ? 30 : 15,
      });

      marker.addListener("click", () => {
        setHoveredEventId(ev.id);
        if (!infoWindowRef.current) {
          infoWindowRef.current = new google.maps.InfoWindow({
            minWidth: 280,
            maxWidth: 340,
          });
        }

        const infoContent = `
          <div style="background:#ffffff; color:#0f172a; padding:16px 18px; border-radius:14px; font-family:ui-sans-serif,system-ui,sans-serif; min-width:280px; max-width:340px; box-sizing:border-box;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;">
              <span style="font-size:12px; font-weight:800; color:${visuals.color}; text-transform:uppercase; letter-spacing:0.6px; background:${visuals.color}15; padding:3px 9px; border-radius:6px; border:1px solid ${visuals.color}35;">
                ${ev.categoria || "Evento"}
              </span>
              ${hasBoost ? '<span style="font-size:11px; font-weight:800; background:#ff9500; color:#ffffff; padding:3px 8px; border-radius:6px; box-shadow:0 2px 6px rgba(255,149,0,0.35);">⚡ BOOSTER ATTIVO</span>' : ''}
            </div>

            <div style="font-size:17px; font-weight:800; color:#0f172a; line-height:1.35; margin-bottom:8px;">
              ${ev.titolo}
            </div>

            <div style="font-size:13px; font-weight:600; color:#334155; margin-bottom:5px; display:flex; align-items:center; gap:6px;">
              <span style="font-size:15px;">📍</span>
              <span>${ev.luogo || ev.provincia || "Toscana"}</span>
            </div>

            <div style="font-size:13px; font-weight:500; color:#475569; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
              <span style="font-size:14px;">📅</span>
              <span>${formatEventDate(ev)}</span>
            </div>

            ${(ev.accessibileDisabili || ev.opzioniVeg) ? `
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:10px;">
                ${ev.accessibileDisabili ? '<span style="font-size:11px; font-weight:600; color:#1d4ed8; background:#eff6ff; border:1px solid #dbeafe; padding:2px 7px; border-radius:5px;">♿ Accessibile</span>' : ''}
                ${ev.opzioniVeg ? '<span style="font-size:11px; font-weight:600; color:#047857; background:#ecfdf5; border:1px solid #a7f3d0; padding:2px 7px; border-radius:5px;">🌱 Veg</span>' : ''}
              </div>
            ` : ''}

            <div style="font-size:12px; color:#64748b; border-top:1px solid #e2e8f0; padding-top:8px; display:flex; align-items:center; gap:6px;">
              <span style="font-size:13px;">🏢</span>
              <span>Organizzatore: <strong style="color:#1e293b; font-weight:700;">${ev.organizzatore || "N/D"}</strong></span>
            </div>
          </div>
        `;

        infoWindowRef.current.setContent(infoContent);
        infoWindowRef.current.open(map, marker);
      });

      markersRef.current.set(ev.id, marker);
    });
  }, [mapEvents, mapLoaded]);

  // Effetto: sincronizzazione hover dalla tabella al marker sulla mappa (leggero rimbalzo)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    markersRef.current.forEach((marker, id) => {
      if (id === hoveredEventId) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
          if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
          }
        }, 1400);
      } else {
        marker.setAnimation(null);
      }
    });
  }, [hoveredEventId, mapLoaded]);

  // Handler per ripristinare la vista di tutta la Toscana
  const handleResetCamera = () => {
    setSelectedProvince(null);
    centerCameraOnProvince(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <MapPin className="w-6 h-6 mr-2 text-amber-400" />
            Mappa Live & Distribuzione Territoriale Toscana
          </h1>
          <p className="text-sm text-slate-400">
            Fai clic su una provincia a destra per isolarla sulla mappa con i confini in blu elettrico (clicca di nuovo per deselezionarla).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedProvince && selectedProvinceObj ? (
            <>
              <span className="text-xs text-slate-400">
                Provincia attiva:{" "}
                <strong className="text-amber-400 font-mono text-sm">
                  {selectedProvinceObj.nome} ({selectedProvinceObj.sigla})
                </strong>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#141d2e] border border-slate-700 text-slate-300">
                {displayedEvents.length} {displayedEvents.length === 1 ? "evento" : "eventi"}
              </span>
              <button
                onClick={() => {
                  setSelectedProvince(null);
                  centerCameraOnProvince(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                title="Deseleziona provincia"
              >
                <X className="w-3.5 h-3.5" />
                Deseleziona
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-slate-400">
                Panoramica: <strong className="text-slate-300 font-mono text-sm">Tutta la Toscana</strong>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#141d2e] border border-slate-700 text-slate-300">
                {events.length} eventi totali
              </span>
            </>
          )}
        </div>
      </div>

      {/* Due Colonne Principali: Metà Sinistra (Google Maps interattiva) & Metà Destra (Card delle 10 Province) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Metà Sinistra: Card Google Maps Live Toscana (estesa per lungo) */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c1322] via-[#0f182c] to-[#14213d] border border-[#1e293b] flex flex-col justify-between min-h-[580px] relative overflow-hidden shadow-2xl">
          {/* Header Google Maps Card */}
          <div className="flex items-center justify-between z-10 pb-4 border-b border-[#1e293b]/70">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                {selectedProvince && selectedProvinceObj
                  ? `Mappa: ${selectedProvinceObj.nome} (${selectedProvinceObj.sigla})`
                  : "Mappa: Regione Toscana (Panoramica)"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Tasto Reset Vista */}
              <button
                onClick={handleResetCamera}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                title="Ripristina visuale Toscana"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Google Maps in Modalità Chiara */}
          <div className="my-3 flex-1 min-h-[420px] rounded-xl overflow-hidden border border-[#1e293b] relative shadow-inner bg-slate-100">
            {/* Google Map Div */}
            <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

            {/* Spinner caricamento se non ancora pronta */}
            {!mapLoaded && !mapError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                <span className="text-xs text-slate-600 font-medium">
                  Caricamento Google Maps Toscana...
                </span>
              </div>
            )}

            {mapError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-30 p-4 text-center">
                <MapPin className="w-8 h-8 text-rose-500 mb-2" />
                <span className="text-xs text-rose-600 font-medium">{mapError}</span>
              </div>
            )}
          </div>

          {/* Footer Google Maps Card */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-3 border-t border-[#1e293b]/80 z-10 gap-2">
            <div className="flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {selectedProvince && selectedProvinceObj
                  ? `Hub ${selectedProvinceObj.nome}: ${selectedProvinceObj.lat}° N, ${selectedProvinceObj.lng}° E`
                  : "Baricentro Toscana: 43.45° N, 11.15° E"}
              </span>
            </div>
            <span className="text-emerald-400 font-medium">
              {mapEvents.length} {mapEvents.length === 1 ? "evento su mappa" : "eventi su mappa"}
            </span>
          </div>
        </div>

        {/* Metà Destra: Le Card delle 10 Province Toscane */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex flex-col justify-between space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-amber-400" />
                Seleziona Provincia (10)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tocca una card per isolarla sulla mappa o toccala nuovamente per deselezionarla.
              </p>
            </div>
            {selectedProvince && (
              <button
                onClick={() => {
                  setSelectedProvince(null);
                  centerCameraOnProvince(null);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium flex items-center gap-1"
                title="Azzera la selezione provinciale"
              >
                <X className="w-3 h-3" />
                Deseleziona
              </button>
            )}
          </div>

          {/* Griglia a 2 colonne con le 10 province */}
          <div className="grid grid-cols-2 gap-3">
            {provincesData.map((p) => {
              const count = provinceCounts[p.sigla] || 0;
              const isSelected = selectedProvince === p.sigla;

              return (
                <button
                  key={p.sigla}
                  onClick={() => {
                    const next = selectedProvince === p.sigla ? null : p.sigla;
                    setSelectedProvince(next);
                    centerCameraOnProvince(next);
                  }}
                  title={isSelected ? `Fai clic per deselezionare ${p.nome}` : `Fai clic per selezionare ${p.nome}`}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/60 scale-[1.02]"
                      : "bg-[#141d2e] border-slate-800 hover:border-slate-700 hover:bg-[#182337] text-slate-300"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xl text-amber-400">
                      {p.sigla}
                    </span>
                    {!isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0f172a] border border-slate-700 text-slate-300">
                        {count} {count === 1 ? "evento" : "eventi"}
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 font-bold text-base sm:text-lg text-white tracking-wide">
                    {p.nome}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-[#141d2e] border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Stato selezione:</span>
            {selectedProvince && selectedProvinceObj ? (
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 font-bold">{selectedProvinceObj.nome}</span>
                <button
                  onClick={() => {
                    setSelectedProvince(null);
                    centerCameraOnProvince(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white underline"
                >
                  (deseleziona)
                </button>
              </div>
            ) : (
              <span className="text-slate-500 italic">Nessuna provincia selezionata (Visualizzazione panoramica)</span>
            )}
          </div>
        </div>
      </div>

      {/* Sotto queste due colonne: Dettagli immediati degli eventi della provincia cliccata */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-4 shadow-xl">
        {/* Header Sezione Eventi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div>
            {selectedProvince && selectedProvinceObj ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-amber-500 text-slate-950">
                    {selectedProvinceObj.sigla}
                  </span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Eventi in Provincia di {selectedProvinceObj.nome}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#141d2e] border border-slate-700 text-amber-400">
                      {displayedEvents.length} {displayedEvents.length === 1 ? "evento" : "eventi"}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Dettagli completi in tempo reale per la provincia di {selectedProvinceObj.nome}.
                </p>
              </>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Dettagli Eventi Provinciali
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Seleziona una provincia dalle card in alto a destra per visualizzarne subito i dettagli.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedProvince && (
              <button
                onClick={() => {
                  setSelectedProvince(null);
                  centerCameraOnProvince(null);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                title="Deseleziona provincia"
              >
                <X className="w-3.5 h-3.5" />
                Deseleziona
              </button>
            )}
            {/* Tasto Mostra Tutti (porta a Gestione Eventi) */}
            <button
              onClick={() => setActiveTab("events")}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20 shrink-0"
              title="Apri la pagina completa Gestione Eventi"
            >
              Mostra tutti
              <ArrowUpRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Tabella a righe o placeholder se deselezionato */}
        {selectedProvince && selectedProvinceObj ? (
          displayedEvents.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[#1e293b] bg-[#0c1322]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#141d2e] text-slate-400 uppercase text-[11px] font-semibold border-b border-[#1e293b]">
                  <tr>
                    <th className="px-4 py-3">Evento & Categoria</th>
                    <th className="px-4 py-3">Data & Orario</th>
                    <th className="px-4 py-3">Luogo Specifico</th>
                    <th className="px-4 py-3">Organizzatore Responsabile</th>
                    <th className="px-4 py-3 text-center">Booster ⚡</th>
                    <th className="px-4 py-3 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {displayedEvents.map((ev) => {
                    const hasBoost = isBoostAttivo(ev);
                    const isHovered = hoveredEventId === ev.id;

                    return (
                      <tr
                        key={ev.id}
                        className={`transition ${
                          isHovered ? "bg-[#182337]" : "hover:bg-[#141d2e]/60"
                        }`}
                        onMouseEnter={() => setHoveredEventId(ev.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                      >
                        {/* Evento & Categoria */}
                        <td className="px-4 py-3 max-w-[260px]">
                          <div className="font-bold text-white text-sm line-clamp-1">
                            {ev.titolo || "Evento senza titolo"}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(
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

                        {/* Data & Orario */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-slate-200">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            <span>{formatEventDate(ev)}</span>
                          </div>
                        </td>

                        {/* Luogo Specifico */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-slate-200">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            <span>
                              {ev.luogo || selectedProvinceObj.nome} (
                              <strong className="text-amber-400 font-mono">
                                {ev.provincia || selectedProvinceObj.sigla}
                              </strong>
                              )
                            </span>
                          </div>
                        </td>

                        {/* Organizzatore Responsabile */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="flex items-center space-x-1.5 text-slate-200 font-medium truncate">
                            <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{ev.organizzatore || "N/D"}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block pl-4">
                            {ev.idOrganizzatore || ev.id}
                          </span>
                        </td>

                        {/* Booster Toggle */}
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

                        {/* Azioni */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setActiveTab("events")}
                            className="px-3 py-1.5 rounded-lg bg-[#141d2e] border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-medium inline-flex items-center gap-1 transition"
                            title="Gestisci in Gestione Eventi"
                          >
                            Gestisci
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
              <Database className="w-6 h-6 mx-auto text-slate-600 mb-1" />
              <p className="text-sm font-semibold text-slate-400">
                Nessun evento presente per la provincia di {selectedProvinceObj.nome}
              </p>
              <p className="text-slate-500 max-w-sm mx-auto">
                Seleziona una provincia diversa tra le 10 card in alto a destra per esplorarne gli eventi.
              </p>
            </div>
          )
        ) : (
          <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-3">
            <MapPin className="w-8 h-8 mx-auto text-amber-400/80 mb-1" />
            <h4 className="text-base font-bold text-white">Nessuna provincia selezionata</h4>
            <p className="text-slate-400 max-w-md mx-auto">
              Fai clic su una delle 10 province in alto a destra per visualizzarne i confini blu elettrico su Google Maps e consultarne subito i dettagli completi qui sotto.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setActiveTab("events")}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
              >
                Vedi tutti gli eventi in Gestione Eventi
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}