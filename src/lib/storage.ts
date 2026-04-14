import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { storage } from "./firebase";

const isFirebaseConfigured =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "your-api-key";

export async function compressPhoto(file: File): Promise<{ compressed: File; base64: string; mimeType: string }> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  });

  const base64 = await fileToBase64(compressed);
  return { compressed, base64, mimeType: compressed.type };
}

export async function uploadPhoto(compressed: File): Promise<string> {
  if (!isFirebaseConfigured || !storage) {
    const base64 = await fileToBase64(compressed);
    return `data:${compressed.type};base64,${base64}`;
  }

  const timestamp = Date.now();
  const ext = compressed.name.split(".").pop() ?? "jpg";
  const storageRef = ref(storage, `interventions/${timestamp}.${ext}`);

  await uploadBytes(storageRef, compressed, {
    contentType: compressed.type,
  });

  return await getDownloadURL(storageRef);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
