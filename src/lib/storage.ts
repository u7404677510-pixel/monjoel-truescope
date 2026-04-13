import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { storage } from "./firebase";

const isFirebaseConfigured =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "your-api-key";

export async function compressAndUploadPhoto(file: File): Promise<{ url: string; base64: string; mimeType: string }> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });

  const base64 = await fileToBase64(compressed);

  if (!isFirebaseConfigured || !storage) {
    // Mode demo : retourner un data URL au lieu d'uploader sur Firebase Storage
    const dataUrl = `data:${compressed.type};base64,${base64}`;
    return { url: dataUrl, base64, mimeType: compressed.type };
  }

  const timestamp = Date.now();
  const ext = compressed.name.split(".").pop() ?? "jpg";
  const storageRef = ref(storage, `interventions/${timestamp}.${ext}`);

  await uploadBytes(storageRef, compressed, {
    contentType: compressed.type,
  });

  const url = await getDownloadURL(storageRef);

  return { url, base64, mimeType: compressed.type };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Retirer le prefixe data URL (data:image/jpeg;base64,)
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
