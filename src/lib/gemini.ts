import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { Categorie, Majoration, ReponseIA } from "../types";

interface AnalyzeRequest {
  categorie: Categorie;
  description: string;
  reponses: Record<string, string>;
  photoBase64: string;
  photoMimeType: string;
}

interface QuestionsResponse {
  questions: string[];
}

const isFirebaseConfigured =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "your-api-key";

// ─── Questions par defaut (fallback quand les Cloud Functions ne sont pas disponibles) ───

const QUESTIONS_PAR_DEFAUT: Record<Categorie, string[]> = {
  plomberie: [
    "Quelle pièce est concernée ?",
    "Y a-t-il une fuite active en ce moment ?",
    "Type de logement ?",
    "Avez-vous coupé l'arrivée d'eau ?",
  ],
  serrurerie: [
    "Votre porte est-elle verrouillée ou simplement claquée ?",
    "Quel type de porte est concerné ?",
    "Êtes-vous actuellement à l'extérieur ?",
    "Constatez-vous des dégâts sur la serrure ?",
  ],
  electricite: [
    "Que constatez-vous exactement ?",
    "Le disjoncteur a-t-il sauté ?",
    "La panne concerne-t-elle une seule pièce ?",
    "Percevez-vous une odeur de brûlé ?",
  ],
};

// ─── Reponse IA de demo (fallback) ──────────────────────────────────────────

const DEMO_RESPONSES: Record<Categorie, ReponseIA> = {
  plomberie: {
    phrase_choc: "800 000 dégâts des eaux sont déclarés chaque année en France.",
    lignes_devis: [
      { libelle: "Déplacement", prix: 29, unite: "forfait" },
      { libelle: "Remplacement robinet", prix: 189, unite: "forfait" },
    ],
    prix_total: 218,
    score_fiabilite: 32,
  },
  serrurerie: {
    phrase_choc: "1 cambriolage sur 3 exploite une serrure défaillante.",
    lignes_devis: [
      { libelle: "Déplacement", prix: 29, unite: "forfait" },
      { libelle: "Ouverture avec radio", prix: 129, unite: "forfait" },
    ],
    prix_total: 158,
    score_fiabilite: 28,
  },
  electricite: {
    phrase_choc: "25 % des incendies domestiques sont d'origine électrique.",
    lignes_devis: [
      { libelle: "Déplacement", prix: 29, unite: "forfait" },
      { libelle: "Recherche de panne", prix: 159, unite: "forfait" },
    ],
    prix_total: 188,
    score_fiabilite: 25,
  },
};

function getDemoMajoration(): Majoration {
  const h = new Date().getHours();
  if (h >= 7 && h < 20)  return { coefficient: 1.0, tranche: "7h-20h" };
  if (h >= 20 && h < 21) return { coefficient: 1.2, tranche: "20h-21h" };
  if (h >= 21 && h < 22) return { coefficient: 1.3, tranche: "21h-22h" };
  if (h >= 22 && h < 23) return { coefficient: 1.4, tranche: "22h-23h" };
  if (h >= 23)           return { coefficient: 1.5, tranche: "23h-00h" };
  if (h < 2)             return { coefficient: 1.6, tranche: "00h-02h" };
  return                          { coefficient: 1.7, tranche: "02h-07h" };
}

function applyDemoMajoration(resp: ReponseIA): ReponseIA {
  const maj = getDemoMajoration();
  if (maj.coefficient === 1.0) return { ...resp, majoration: maj };
  const lignes_devis = resp.lignes_devis.map((l) => ({ ...l, prix: Math.round(l.prix * maj.coefficient) }));
  const prix_total = lignes_devis.reduce((s, l) => s + l.prix, 0);
  return { ...resp, lignes_devis, prix_total, score_fiabilite: resp.score_fiabilite, majoration: maj };
}

// ─── Fonctions exportees ────────────────────────────────────────────────────

export async function analyzeIntervention(params: AnalyzeRequest): Promise<ReponseIA> {
  if (!isFirebaseConfigured || !functions) {
    await new Promise((r) => setTimeout(r, 2500));
    return applyDemoMajoration(DEMO_RESPONSES[params.categorie]);
  }

  const fn = httpsCallable<AnalyzeRequest, ReponseIA>(functions, "analyzeIntervention", { timeout: 120000 });
  const result = await fn(params);
  return result.data;
}

export async function generateQuestions(
  categorie: Categorie,
  _description?: string
): Promise<string[]> {
  if (!isFirebaseConfigured || !functions) {
    // Mode demo : retourner les questions par defaut apres un petit delai
    await new Promise((r) => setTimeout(r, 800));
    return QUESTIONS_PAR_DEFAUT[categorie];
  }

  try {
    const fn = httpsCallable<{ categorie: Categorie; description?: string }, QuestionsResponse>(
      functions,
      "generateQuestions"
    );
    const result = await fn({ categorie, description: _description });
    return result.data.questions;
  } catch {
    return QUESTIONS_PAR_DEFAUT[categorie];
  }
}
