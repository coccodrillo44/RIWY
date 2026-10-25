import { storage } from "./firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Converte e comprime un file immagine (locandina o menu) in formato JPEG ottimizzato.
 * Ridimensionando a max 1200px di lato e qualità 0.75, l'immagine risultante
 * occupa circa 70-130 KB, garantendo salvataggi istantanei sia su RTDB che su Storage.
 */
export async function compressImageToDataUrl(
  file: File,
  maxDimension = 1200,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        resolve("");
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedDataUrl);
            return;
          }
        } catch {
          /* Fallback a data URL originale */
        }
        resolve(src);
      };

      img.onerror = () => {
        resolve(src);
      };

      img.src = src;
    };

    reader.onerror = () => {
      resolve("");
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Carica o converte l'immagine dell'evento.
 * Segue esattamente l'architettura dell'app mobile Rook (EventoRepository.kt):
 * 1. Comprime l'immagine in locale per ridurre il peso da svariati MB a <130 KB.
 * 2. Tenta l'upload su Firebase Storage con timeout rigido di 2.5 secondi (impedendo al browser
 *    di restare bloccato per 10 minuti in tentativi di retry se Storage non è attivo o ha CORS).
 * 3. Se Storage risponde con successo, restituisce l'URL di download.
 * 4. Se Storage va in timeout o errore (404/CORS), applica il fallback Base64 compresso,
 *    identico al formato già utilizzato da Rook per tutti gli eventi.
 */
export async function processAndUploadEventImage(
  file: File,
  storagePath: string
): Promise<string> {
  const dataUrl = await compressImageToDataUrl(file);
  if (!dataUrl) return "";

  try {
    const sRef = storageRef(storage, storagePath);

    // Ricostruisce un Blob compresso per l'eventuale upload su Storage
    const base64Data = dataUrl.split(",")[1];
    if (base64Data) {
      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: "image/jpeg" });

      const uploadTask = uploadBytes(sRef, blob, { contentType: "image/jpeg" });
      const timeoutTask = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout caricamento Storage")), 2500)
      );

      await Promise.race([uploadTask, timeoutTask]);
      const downloadUrl = await getDownloadURL(sRef);
      if (downloadUrl) {
        return downloadUrl;
      }
    }
  } catch (e) {
    console.warn(
      `[ImageUpload] Storage non disponibile o timeout (${storagePath}). Applicato fallback Base64 come in Rook:`,
      e
    );
  }

  return dataUrl;
}
