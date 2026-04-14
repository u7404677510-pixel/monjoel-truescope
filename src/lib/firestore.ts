import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Categorie, GrilleLigne, Intervention, InterventionValidee, ReponseIA } from "../types";

const isFirebaseConfigured =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "your-api-key";

// ─── Grille Tarifaire ─────────────────────────────────────────────────────────

export async function getGrilleTarifaire(categorie?: Categorie): Promise<GrilleLigne[]> {
  if (!isFirebaseConfigured || !db) return [];
  const ref = collection(db, "grille_tarifaire");
  const q = categorie ? query(ref, where("categorie", "==", categorie)) : query(ref);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GrilleLigne));
}

export async function addGrilleLigne(ligne: Omit<GrilleLigne, "id">): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase non configuré. Configurez .env");
  const ref = await addDoc(collection(db, "grille_tarifaire"), ligne);
  return ref.id;
}

export async function updateGrilleLigne(id: string, data: Partial<GrilleLigne>): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase non configuré. Configurez .env");
  await updateDoc(doc(db, "grille_tarifaire", id), data);
}

export async function deleteGrilleLigne(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase non configuré. Configurez .env");
  await deleteDoc(doc(db, "grille_tarifaire", id));
}

// ─── Interventions en attente ─────────────────────────────────────────────────

export async function saveIntervention(data: {
  categorie: Categorie;
  description_client: string;
  photo_url: string;
  reponses_clarification: Record<string, string>;
  contact?: { nom: string; prenom: string; adresse: string; code_postal: string; ville: string };
  reponse_ia: ReponseIA;
}): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    console.log("[DEMO] Intervention sauvegardee localement :", data);
    return "demo-" + Date.now();
  }
  const ref = await addDoc(collection(db, "interventions_en_attente"), {
    ...data,
    date: serverTimestamp(),
    statut: "en_attente",
  });
  return ref.id;
}

export async function getPendingInterventions(): Promise<Intervention[]> {
  if (!isFirebaseConfigured || !db) return [];
  const q = query(
    collection(db, "interventions_en_attente"),
    where("statut", "==", "en_attente"),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    date: (d.data().date as Timestamp)?.toDate?.() ?? new Date(),
  } as Intervention));
}

// ─── Validation / Rejet ───────────────────────────────────────────────────────
// Validées → stockées dans interventions_validees (base permanente)
// Rejetées → supprimées définitivement

export async function validateIntervention(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase non configuré. Configurez .env");
  const srcRef = doc(db, "interventions_en_attente", id);
  const snap = await getDoc(srcRef);
  if (!snap.exists()) throw new Error("Intervention introuvable");

  const data = snap.data();

  // Copier dans la base permanente des interventions validées
  await addDoc(collection(db, "interventions_validees"), {
    ...data,
    statut: "validée",
    date_validation: serverTimestamp(),
  });

  // Supprimer de la file d'attente (éviter les doublons)
  await deleteDoc(srcRef);
}

export async function rejectIntervention(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase non configuré. Configurez .env");
  // Supprimer définitivement (les rejetées ne sont pas conservées)
  await deleteDoc(doc(db, "interventions_en_attente", id));
}

// ─── Interventions validées (base permanente) ─────────────────────────────────

export async function getValidatedInterventions(): Promise<InterventionValidee[]> {
  if (!isFirebaseConfigured || !db) return [];
  const q = query(
    collection(db, "interventions_validees"),
    orderBy("date_validation", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    date: (d.data().date as Timestamp)?.toDate?.() ?? new Date(),
    date_validation: (d.data().date_validation as Timestamp)?.toDate?.() ?? new Date(),
  } as InterventionValidee));
}

// ─── RAG : exemples validés par catégorie ──────────────────────────────────────

export async function getValidatedExamples(
  categorie: Categorie,
  limitCount = 15
): Promise<InterventionValidee[]> {
  if (!isFirebaseConfigured || !db) return [];
  const q = query(
    collection(db, "interventions_validees"),
    where("categorie", "==", categorie),
    orderBy("date_validation", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InterventionValidee));
}

// ─── Comptage interventions validees par categorie (pour la jauge de precision) ─

export async function getValidatedCounts(): Promise<Record<Categorie, number>> {
  if (!isFirebaseConfigured || !db) {
    return { plomberie: 0, serrurerie: 0, electricite: 0 };
  }

  const categories: Categorie[] = ["plomberie", "serrurerie", "electricite"];
  const counts: Record<string, number> = {};

  for (const cat of categories) {
    const q = query(
      collection(db, "interventions_validees"),
      where("categorie", "==", cat)
    );
    const snap = await getDocs(q);
    counts[cat] = snap.size;
  }

  return counts as Record<Categorie, number>;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export async function seedGrilleTarifaire(): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase non configuré. Configurez .env");
  const firestore = db;
  const existing = await getDocs(collection(firestore, "grille_tarifaire"));
  if (!existing.empty) {
    console.log("Grille tarifaire deja remplie");
    return;
  }

  const lignes: Omit<GrilleLigne, "id">[] = [
    // Déplacement (obligatoire pour toutes les catégories)
    { categorie: "serrurerie", libelle: "Déplacement", prix: 29, unite: "forfait" },
    { categorie: "plomberie", libelle: "Déplacement", prix: 29, unite: "forfait" },
    { categorie: "electricite", libelle: "Déplacement", prix: 29, unite: "forfait" },

    // Serrurerie
    { categorie: "serrurerie", libelle: "Ouverture avec radio", prix: 129, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Ouverture avec perçage simple", prix: 179, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Ouverture avec perçage blindé", prix: 339, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Ouverture porte intérieur", prix: 159, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Ouverture de boîte aux lettres", prix: 129, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Ouverture spécialisée pour clef à gorge", prix: 289, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Pose d'un cylindre type européen", prix: 39, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Pose d'un cylindre type blindé", prix: 49, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Pose d'un caréné", prix: 339, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Pose d'un système 3 points", prix: 129, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Changement de porte d'entrée en bois", prix: 209, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Changement de porte d'entrée en métal", prix: 209, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Changement de porte d'entrée en PVC", prix: 209, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Changement de porte d'intérieur en PVC", prix: 159, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Pose d'un monopoint d'intérieur", prix: 59, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Pose d'un monopoint d'entrée", prix: 59, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Changement de cylindre bloc type Mottura", prix: 179, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Pose du verrou", prix: 89, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Pose d'une serrure sans souci", prix: 89, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Pose d'une serrure de boîte aux lettres", prix: 89, unite: "forfait" },
    { categorie: "serrurerie", libelle: "Pose d'une poignée Yona", prix: 89, unite: "forfait" },

    // Plomberie
    { categorie: "plomberie", libelle: "Remplacement robinet", prix: 189, unite: "forfait" },
    { categorie: "plomberie", libelle: "Remplacement robinet toilettes", prix: 109, unite: "forfait" },
    { categorie: "plomberie", libelle: "Remplacement de tuyau PVC", prix: 89, unite: "forfait" },
    { categorie: "plomberie", libelle: "Remplacement de tuyau cuivre", prix: 149, unite: "forfait" },
    { categorie: "plomberie", libelle: "Remplacement de chasse d'eau (flotteur)", prix: 89, unite: "forfait" },
    { categorie: "plomberie", libelle: "Remplacement de chasse d'eau (complet)", prix: 129, unite: "forfait" },
    { categorie: "plomberie", libelle: "Remplacement de réservoir de toilettes", prix: 179, unite: "forfait" },
    { categorie: "plomberie", libelle: "Remplacement des toilettes sur pied", prix: 319, unite: "forfait" },
    { categorie: "plomberie", libelle: "Changement de siphon", prix: 109, unite: "forfait" },
    { categorie: "plomberie", libelle: "Recherche de fuite par caméra thermique (standard)", prix: 269, unite: "forfait" },
    { categorie: "plomberie", libelle: "Débouchage manuel", prix: 129, unite: "forfait" },
    { categorie: "plomberie", libelle: "Débouchage par camion", prix: 590, unite: "forfait" },
    { categorie: "plomberie", libelle: "Changement de ballon (petit)", prix: 209, unite: "forfait" },
    { categorie: "plomberie", libelle: "Changement de ballon (moyen)", prix: 239, unite: "forfait" },
    { categorie: "plomberie", libelle: "Changement de ballon (grand)", prix: 269, unite: "forfait" },
    { categorie: "plomberie", libelle: "Remplacement réducteur de pression", prix: 119, unite: "forfait" },
    { categorie: "plomberie", libelle: "Désembouage (standard)", prix: 389, unite: "forfait" },
    { categorie: "plomberie", libelle: "Création arrivée d'eau", prix: 259, unite: "forfait" },
    { categorie: "plomberie", libelle: "Recherche de fuite par caméra thermique (approfondie)", prix: 349, unite: "forfait" },
    { categorie: "plomberie", libelle: "Désembouage (complet)", prix: 509, unite: "forfait" },
    { categorie: "plomberie", libelle: "Purge", prix: 169, unite: "forfait" },

    // Électricité
    { categorie: "electricite", libelle: "Recherche de panne", prix: 159, unite: "forfait" },
    { categorie: "electricite", libelle: "Remplacement interrupteur", prix: 119, unite: "forfait" },
    { categorie: "electricite", libelle: "Remplacement prise", prix: 109, unite: "forfait" },
    { categorie: "electricite", libelle: "Remplacement tableau électrique complet", prix: 399, unite: "forfait" },
    { categorie: "electricite", libelle: "Pose d'un détecteur de fumée", prix: 209, unite: "forfait" },
    { categorie: "electricite", libelle: "Branchement prise spécialisée", prix: 229, unite: "forfait" },
    { categorie: "electricite", libelle: "Installation VMC", prix: 349, unite: "forfait" },
  ];

  const batch = lignes.map((l) => addDoc(collection(firestore, "grille_tarifaire"), l));
  await Promise.all(batch);
  console.log(`${lignes.length} lignes tarifaires inserees`);
}
