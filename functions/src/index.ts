import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

const MODEL = "gemini-2.0-flash";

const geminiApiKeySecret = defineSecret("GEMINI_API_KEY");

function getGeminiClient(apiKey: string): GoogleGenerativeAI {
  const key = apiKey.trim();
  if (!key) throw new HttpsError("internal", "GEMINI_API_KEY non configuré. Exécutez: firebase functions:secrets:set GEMINI_API_KEY");
  return new GoogleGenerativeAI(key);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface GrilleLigne {
  id: string;
  categorie: string;
  libelle: string;
  prix: number;
  unite: string;
}

interface InterventionValidee {
  categorie: string;
  description_client: string;
  reponses_clarification: Record<string, string>;
  reponse_ia: {
    phrase_choc: string;
    lignes_devis: Array<{ libelle: string; prix: number; unite: string }>;
    prix_total: number;
  };
}

interface AnalyzeRequest {
  categorie: string;
  description: string;
  reponses: Record<string, string>;
  photoBase64: string;
  photoMimeType: string;
}

interface DevisLigne {
  libelle: string;
  prix: number;
  unite: string;
}

interface Majoration {
  coefficient: number;
  tranche: string;
}

interface AnalyzeResponse {
  phrase_choc: string;
  lignes_devis: DevisLigne[];
  prix_total: number;
  score_fiabilite: number;
  majoration?: Majoration;
}

function getMajoration(): Majoration {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const h = now.getHours();

  if (h >= 7 && h < 20)  return { coefficient: 1.0, tranche: "7h-20h" };
  if (h >= 20 && h < 21) return { coefficient: 1.2, tranche: "20h-21h" };
  if (h >= 21 && h < 22) return { coefficient: 1.3, tranche: "21h-22h" };
  if (h >= 22 && h < 23) return { coefficient: 1.4, tranche: "22h-23h" };
  if (h >= 23)           return { coefficient: 1.5, tranche: "23h-00h" };
  if (h < 2)             return { coefficient: 1.6, tranche: "00h-02h" };
  return                          { coefficient: 1.7, tranche: "02h-07h" };
}

function applyMajoration(result: AnalyzeResponse): AnalyzeResponse {
  const maj = getMajoration();
  if (maj.coefficient === 1.0) {
    return { ...result, majoration: maj };
  }

  const lignes_devis = result.lignes_devis.map((l) => ({
    ...l,
    prix: Math.round(l.prix * maj.coefficient),
  }));
  const prix_total = lignes_devis.reduce((sum, l) => sum + l.prix, 0);

  return { ...result, lignes_devis, prix_total, majoration: maj };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchGrilleTarifaire(categorie: string): Promise<GrilleLigne[]> {
  const snap = await db
    .collection("grille_tarifaire")
    .where("categorie", "==", categorie)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GrilleLigne));
}

async function fetchValidatedExamples(categorie: string, limit = 15): Promise<InterventionValidee[]> {
  const snap = await db
    .collection("interventions_validees")
    .where("categorie", "==", categorie)
    .orderBy("date_validation", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as InterventionValidee);
}

function formatGrille(lignes: GrilleLigne[]): string {
  return lignes
    .map((l) => `- "${l.libelle}" : ${l.prix}€ / ${l.unite}`)
    .join("\n");
}

function formatExamples(examples: InterventionValidee[]): string {
  if (examples.length === 0) return "";
  const lines = examples.map((ex, i) => {
    const devis = ex.reponse_ia.lignes_devis
      .map((l) => `  • ${l.libelle}: ${l.prix}€`)
      .join("\n");
    const reponses = Object.entries(ex.reponses_clarification || {})
      .map(([q, a]) => `${q}: ${a}`)
      .join(", ");
    return `Exemple ${i + 1}:\nDescription: ${ex.description_client}\nRéponses: ${reponses}\nDevis validé:\n${devis}`;
  });
  return `--- INTERVENTIONS VALIDÉES (apprentissage) ---\n${lines.join("\n\n")}\n--- FIN DES EXEMPLES ---`;
}

const SYSTEM_PROMPT = `Tu es un expert en dépannage (plomberie, serrurerie, électricité).

ANALYSE : Analyse en profondeur la photo (si fournie), la description du client et ses réponses aux questions. Identifie les prestations nécessaires et récupère UNIQUEMENT les lignes correspondantes dans la grille tarifaire fournie. Chaque ligne a un prix unique (pas de fourchette).

DÉPLACEMENT OBLIGATOIRE : Tu DOIS TOUJOURS ajouter en première ligne du devis : {"libelle": "Déplacement", "prix": 29, "unite": "forfait"}. Ce frais de déplacement à 29€ est systématique, sans aucune exception, pour toute intervention quelle que soit la catégorie.

PHRASE CHOC : Génère une statistique réelle, courte et impactante selon la catégorie (plomberie → dégâts des eaux, serrurerie → cambriolages, électricité → incendies).

SCORE DE FIABILITÉ : Tu dois évaluer ta confiance globale dans ta réponse (0 à 99, jamais 100).
Ce score dépend de deux facteurs combinés :
1. Ton propre raisonnement : tu analyses toujours la photo, la description, les réponses et la grille tarifaire. C'est ta base.
2. Les interventions validées fournies en exemples : plus il y a d'exemples similaires/identiques à la demande actuelle, plus tu peux t'appuyer dessus et plus ta confiance augmente.

Barème indicatif :
- 0 exemples fournis → tu te bases uniquement sur ton raisonnement → score entre 15 et 40
- Quelques exemples vaguement similaires → score entre 40 et 60
- Plusieurs exemples proches → score entre 60 et 85
- 15 exemples quasi-identiques à cette demande → score entre 90 et 99
Le maximum absolu est 99 (la perfection n'existe pas). Tu n'atteins 99 QUE si les 15 exemples fournis correspondent exactement au même type de problème que la demande actuelle.

Réponds UNIQUEMENT en JSON valide avec ces 4 champs : phrase_choc (string), lignes_devis (array d'objets {libelle, prix, unite}), prix_total (number = somme des prix), score_fiabilite (number entre 0 et 99). Aucun diagnostic, aucune explication.`;

// ─── Cloud Function: analyzeIntervention ─────────────────────────────────────

export const analyzeIntervention = onCall<AnalyzeRequest>(
  { timeoutSeconds: 120, memory: "512MiB", secrets: [geminiApiKeySecret], invoker: "public" },
  async (request) => {
    const { categorie, description, reponses, photoBase64, photoMimeType } = request.data;

    if (!categorie || !description) {
      throw new HttpsError("invalid-argument", "categorie et description requis");
    }

    const genAI = getGeminiClient(geminiApiKeySecret.value());
    const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: SYSTEM_PROMPT });

    const grille = await fetchGrilleTarifaire(categorie);
    if (grille.length === 0) {
      throw new HttpsError(
        "not-found",
        `Aucune ligne tarifaire pour la catégorie: ${categorie}`
      );
    }

    let examples: InterventionValidee[] = [];
    try {
      examples = await fetchValidatedExamples(categorie, 5);
    } catch {
      // Index composite en cours de construction ou collection vide
    }

    const reponsesText = Object.entries(reponses || {})
      .map(([q, a]) => `- ${q}: ${a}`)
      .join("\n");

    const userTextContent = `Catégorie: ${categorie}
Description du client: ${description}
Réponses aux questions de clarification:
${reponsesText || "Aucune réponse"}

${formatExamples(examples)}

--- GRILLE TARIFAIRE (${categorie}) ---
${formatGrille(grille)}
--- FIN DE LA GRILLE ---

Génère le devis JSON.`;

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (photoBase64 && photoMimeType) {
      parts.push({
        inlineData: {
          mimeType: photoMimeType,
          data: photoBase64,
        },
      });
    }

    parts.push({ text: userTextContent });

    const response = await model.generateContent(parts);
    const rawText = response.response.text();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new HttpsError("internal", "L'IA n'a pas retourné de JSON valide");
    }

    const result: AnalyzeResponse = JSON.parse(jsonMatch[0]);

    if (!result.phrase_choc || !Array.isArray(result.lignes_devis) || typeof result.prix_total !== "number" || typeof result.score_fiabilite !== "number") {
      throw new HttpsError("internal", "Structure JSON invalide retournée par l'IA");
    }

    result.score_fiabilite = Math.max(0, Math.min(99, Math.round(result.score_fiabilite)));

    return applyMajoration(result);
  }
);

// ─── Cloud Function: generateQuestions ───────────────────────────────────────

interface QuestionsRequest {
  categorie: string;
  description?: string;
}

interface QuestionsResponse {
  questions: string[];
}

export const generateQuestions = onCall<QuestionsRequest>(
  { timeoutSeconds: 60, memory: "256MiB", secrets: [geminiApiKeySecret], invoker: "public" },
  async (request): Promise<QuestionsResponse> => {
    const { categorie, description } = request.data;

    if (!categorie) {
      throw new HttpsError("invalid-argument", "categorie requis");
    }

    const genAI = getGeminiClient(geminiApiKeySecret.value());
    const model = genAI.getGenerativeModel({ model: MODEL });

    const prompt = `Tu es un expert en dépannage (${categorie}). 
${description ? `Le client décrit son problème ainsi : "${description}"` : `La catégorie choisie est : ${categorie}`}

Génère exactement 4 questions simples et courtes, comme si tu parlais à quelqu'un au téléphone. Pas de jargon technique. Des questions directes que tout le monde comprend. Elles doivent aider à identifier les prestations nécessaires.

Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères. Exemple : ["Question 1 ?", "Question 2 ?", "Question 3 ?", "Question 4 ?"]`;

    const response = await model.generateContent(prompt);
    const rawText = response.response.text();

    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { questions: getDefaultQuestions(categorie) };
    }

    const questions: string[] = JSON.parse(jsonMatch[0]);
    return { questions: questions.slice(0, 5) };
  }
);

function getDefaultQuestions(categorie: string): string[] {
  const defaults: Record<string, string[]> = {
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
  return defaults[categorie] ?? [
    "C'est quoi le problème exactement ?",
    "Ça a commencé quand ?",
    "Vous avez déjà essayé de réparer ?",
    "Il y a d'autres soucis avec ?",
  ];
}
