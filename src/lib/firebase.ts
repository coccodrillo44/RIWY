import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";
import { getStorage, FirebaseStorage } from "firebase/storage";

export type FirebaseEnv = "prod" | "dev";

function decodeFallback(b64: string): string {
  try {
    if (typeof atob === "function") return atob(b64);
    if (typeof Buffer !== "undefined") return Buffer.from(b64, "base64").toString("utf-8");
  } catch {}
  return "";
}

const DEFAULT_KEY_PROD = decodeFallback("QUl6YVN5Q1FBUU9uWkVnYmx4Nk1pdXQ1Y3lSS3RicFU4YWZRTHhj");
const DEFAULT_KEY_DEV = decodeFallback("QUl6YVN5Q1NGcVM5b3IxUUJlMTNmZGMxY1VoYUlKbHF1X0F3NG9J");

export const PROD_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULT_KEY_PROD,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cosafare-c0e33.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://cosafare-c0e33-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cosafare-c0e33",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cosafare-c0e33.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "147784768241",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:147784768241:web:riwy-admin",
};

export const DEV_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_DEV_API_KEY || DEFAULT_KEY_DEV,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_DEV_AUTH_DOMAIN || "rook-dev-ed702.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DEV_DATABASE_URL || "https://rook-dev-ed702-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_DEV_PROJECT_ID || "rook-dev-ed702",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_DEV_STORAGE_BUCKET || "rook-dev-ed702.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_DEV_MESSAGING_SENDER_ID || "665095904720",
  appId: process.env.NEXT_PUBLIC_FIREBASE_DEV_APP_ID || "1:665095904720:web:riwy-dev",
};

function getOrCreateApp(name: string, config: typeof PROD_CONFIG): FirebaseApp {
  const existing = getApps().find((a) => a.name === name);
  if (existing) return existing;
  return initializeApp(config, name);
}

// Inizializza l'app di produzione con nome di default "[DEFAULT]"
export const prodApp = getApps().find((a) => a.name === "[DEFAULT]") || initializeApp(PROD_CONFIG);
// Inizializza l'app di sviluppo con nome "DEV"
export const devApp = getOrCreateApp("DEV", DEV_CONFIG);

export const app = prodApp;

export const auth = getAuth(prodApp);
export const devAuth = getAuth(devApp);

export const prodRtdb = getDatabase(prodApp);
export const devRtdb = getDatabase(devApp);

export const prodStorage = getStorage(prodApp);
export const devStorage = getStorage(devApp);

// Default retrocompatibile
export const rtdb = prodRtdb;
export const storage = prodStorage;

export const googleProvider = new GoogleAuthProvider();

export function getFirebaseEnvInstances(env: FirebaseEnv = "prod"): {
  app: FirebaseApp;
  auth: Auth;
  rtdb: Database;
  storage: FirebaseStorage;
} {
  if (env === "dev") {
    return {
      app: devApp,
      auth: devAuth,
      rtdb: devRtdb,
      storage: devStorage,
    };
  }
  return {
    app: prodApp,
    auth,
    rtdb: prodRtdb,
    storage: prodStorage,
  };
}
