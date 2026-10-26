# 🏰 RIWY — Rook Intelligent Web Yard (SuperAdmin Dashboard)

Piattaforma web moderna per il **controllo totale** dell'app mobile **Rook (Eventi in Toscana)**.  
Costruita con **Next.js 14**, **Tailwind CSS**, **Lucide Icons** e collegata direttamente a **Firebase (Realtime Database Europe-West1, Auth, Storage, FCM)** del progetto `cosafare-c0e33`.

---

## 🚀 Avvio Rapido

### 1. In Sviluppo Locale (PC)
Requisito: avere installato **Node.js** (v18 o superiore).

Fai doppio clic sul file (installerà le dipendenze in automatico al primo avvio):
```
avvia_sviluppo.bat
```
Oppure da terminale:
```bash
npm install
npm run dev
```
Il sito si aprirà automaticamente su: **`http://localhost:3000`**

### 2. Pubblicazione su Firebase Hosting
Fai doppio clic sul file:
```
pubblica_firebase.bat
```
Oppure da terminale:
```bash
npm run build
firebase deploy --only hosting
```
L'URL online è:
👉 **`https://cosafare-c0e33.web.app`**

---

## 📌 Funzionalità Incluse nel Pannello RIWY

### 1. 📊 Dashboard Cockpit
- Contatori live di eventi attivi, utenti registrati, organizzatori verificati e segnalazioni pendenti.
- Distribuzione percentuali e conteggi per le **7 Macro-Categorie della Toscana** (*Cibo & Sagre, Musica & Feste, Arte & Cultura, Sport & Movimento, Famiglia & Bambini, Fiere & Mercati, Nuove Aperture*).
- Sezione dedicata agli eventi con **Booster Dorato Attivo** ("⚡ In Evidenza").
- Feed streaming delle ultime interazioni in tempo reale.

### 2. 🎪 Gestione & Moderazione Eventi (`/eventi`)
- Filtri immediati per categoria, provincia (10 province toscane) e stato.
- Attivazione/disattivazione del Booster ("In Evidenza") con 1 clic.
- Finestra modale di modifica rapida di titolo, data, orario, luogo, coordinate e flag accessibilità (disabili, vegan).
- Rimozione eventi con motivazione inoltrata all'organizzatore.

### 3. 👥 Gestione Utenti (`/utenti`)
- Anagrafica iscritti con ricerca per email, nome e città.
- Scheda utente con elenco delle **Parole Chiave Alert** salvate (per le notifiche automatiche).
- Azioni istantanee: **Sospendi**, **Banna**, **Shadowbanning (Silenzioso)** e **Modalità Impersonazione**.

### 4. 🏛️ Organizzatori & Enti Territoriali (`/enti`)
- Gestione richieste di registrazione in attesa di convalida.
- Assegnazione del badge **"Verificato"** visibile in app.
- Verifica Partita IVA, recapiti telefonici ed email ufficiali.

### 5. 📜 Audit Log & Time Machine Diff Viewer ("La Scatola Nera")
- Registrazione immutabile di ogni singola azione compiuta sull'app (chi, cosa, quando, IP).
- **Visual Diff Viewer**: confronto visivo a due colonne (rosso = stato prima, verde = stato applicato dopo).

### 6. 🚨 Centro Segnalazioni & Moderazione Ticket (`/reports`)
- Gestione dei ticket inviati dalla community per eventi ingannevoli, recensioni o spam.
- Workflow di risoluzione con note di archiviazione.

### 7. 🗺️ Mappa Live & Distribuzione Territoriale
- Radar geografico interattivo sulle 10 province della Toscana (FI, PI, LU, SI, AR, LI, GR, PO, PT, MS).
- Monitoraggio della concentrazione di eventi e hotspot territoriali.

### 8. ⚡ Kill Switch & Feature Flags
- Interruttori di emergenza per disattivare o attivare sezioni dell'app al volo:
  - *Manutenzione Globale App*
  - *Abilitazione Creazione Nuovi Eventi*
  - *Sistema Chat & Collaborazioni*
  - *Accetta Nuove Registrazioni Organizzatori*
  - *Auto-Moderazione AI*

### 9. 📢 Notifiche Broadcast FCM
- Compositore di notifiche push per smartphone.
- Segmentazione per tutta la Toscana o per singola provincia/categoria.
- Anteprima in tempo reale della scheda notifica Android M3.

### 10. 🛡️ AI Moderation Shield (Gemini)
- Scanner intelligente preventivo per testi, descrizioni e locandine per prevenire eventi abusivi o spam prima della pubblicazione.

---

## 🔒 Sicurezza & Accessi

- Connessione protetta con **Firebase Auth**.
- Verifica whitelist sul nodo `/admins` e Custom Claims (`admin: true`, `superadmin: true`).
- Protezione totale contro accessi non autorizzati.
