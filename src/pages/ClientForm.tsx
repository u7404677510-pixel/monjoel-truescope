import { useState } from "react";
import type { Categorie, ContactInfo, ReponseIA } from "../types";
import { StepCategory } from "../components/client/StepCategory";
import { StepQuestions } from "../components/client/StepQuestions";
import { StepPhoto } from "../components/client/StepPhoto";
import { StepDescription } from "../components/client/StepDescription";
import { StepContact } from "../components/client/StepContact";
import { ResultPage } from "../components/client/ResultPage";
import { analyzeIntervention } from "../lib/gemini";
import { saveIntervention } from "../lib/firestore";
import { compressPhoto, uploadPhoto } from "../lib/storage";

type Step = "category" | "questions" | "photo" | "description" | "contact" | "analyzing" | "result" | "error";

interface FormData {
  categorie: Categorie | null;
  description: string;
  questions: string[];
  reponses: Record<string, string>;
  contact: ContactInfo;
  photo: File | null;
  photoPreview: string | null;
}

const STEP_LABELS = ["Catégorie", "Questions", "Photo", "Description", "Coordonnées"];
const STEP_INDEX: Record<Step, number> = {
  category: 0,
  questions: 1,
  photo: 2,
  description: 3,
  contact: 4,
  analyzing: 5,
  result: 5,
  error: 5,
};

const CARD_TITLES: Record<string, { title: string; subtitle: string }> = {
  category: { title: "Quel est votre problème ?", subtitle: "Sélectionnez une catégorie et décrivez la situation" },
  questions: { title: "Quelques précisions", subtitle: "Ces infos permettent un devis plus précis" },
  photo: { title: "Photo du problème", subtitle: "Une image aide l'IA à mieux analyser" },
  description: { title: "Décrivez la situation", subtitle: "Plus de détails nous aident à mieux diagnostiquer" },
  contact: { title: "Vos coordonnées", subtitle: "Pour que Joël puisse vous recontacter" },
};

export function ClientForm() {
  const [step, setStep] = useState<Step>("category");
  const [formData, setFormData] = useState<FormData>({
    categorie: null,
    description: "",
    questions: [],
    reponses: {},
    contact: { nom: "", prenom: "", adresse: "", code_postal: "", ville: "" },
    photo: null,
    photoPreview: null,
  });
  const [result, setResult] = useState<ReponseIA | null>(null);
  const [analyzeError, setAnalyzeError] = useState("");

  const handleCategorySelect = (categorie: Categorie) => {
    setFormData((prev) => ({ ...prev, categorie }));
    setStep("questions");
  };

  const handleQuestionsNext = (reponses: Record<string, string>, questions: string[]) => {
    setFormData((prev) => ({ ...prev, reponses, questions }));
    setStep("photo");
  };

  const handlePhotoNext = (photo: File, photoPreview: string) => {
    setFormData((prev) => ({ ...prev, photo, photoPreview }));
    setStep("description");
  };

  const handleDescriptionNext = (description: string) => {
    setFormData((prev) => ({ ...prev, description }));
    setStep("contact");
  };

  const handleContactNext = async (contact: ContactInfo) => {
    setFormData((prev) => ({ ...prev, contact }));
    setStep("analyzing");
    setAnalyzeError("");

    try {
      let photoBase64 = "";
      let photoMimeType = "";
      let compressedFile: File | null = null;

      if (formData.photo) {
        const result = await compressPhoto(formData.photo);
        photoBase64 = result.base64;
        photoMimeType = result.mimeType;
        compressedFile = result.compressed;
      }

      const [reponseIA, photo_url] = await Promise.all([
        analyzeIntervention({
          categorie: formData.categorie!,
          description: formData.description,
          reponses: formData.reponses,
          photoBase64,
          photoMimeType,
        }),
        compressedFile
          ? uploadPhoto(compressedFile).catch(() => "")
          : Promise.resolve(""),
      ]);

      await saveIntervention({
        categorie: formData.categorie!,
        description_client: formData.description,
        photo_url,
        reponses_clarification: formData.reponses,
        contact,
        reponse_ia: reponseIA,
      });

      setResult(reponseIA);
      setStep("result");
    } catch (err) {
      console.error("Analyze/save error:", err);
      setAnalyzeError("Une erreur s'est produite lors de l'analyse. Veuillez réessayer.");
      setStep("error");
    }
  };

  const reset = () => {
    setFormData({ categorie: null, description: "", questions: [], reponses: {}, contact: { nom: "", prenom: "", adresse: "", code_postal: "", ville: "" }, photo: null, photoPreview: null });
    setResult(null);
    setAnalyzeError("");
    setStep("category");
  };

  const currentStepIndex = STEP_INDEX[step];
  const showFormUI = !["analyzing", "result", "error"].includes(step);
  const cardInfo = CARD_TITLES[step] ?? CARD_TITLES.category;

  return (
    <div className="client-page">
      {/* Nav */}
      <nav className="site-nav">
        <div className="logo-area">
          <img src={`${import.meta.env.BASE_URL}logo-joel.svg`} alt="Joël" className="logo-img" />
          <span className="logo-divider" />
          <span className="logo-tech">TrueScope</span>
        </div>
        
      </nav>

      <div className="client-page-center">
      {showFormUI && (
        <>
          {/* Hero */}
          <div className="hero">
            <img src={`${import.meta.env.BASE_URL}logo-joel.svg`} alt="TrueScope" className="hero-logo" />
            <h1>Joël vous donne un prix fixe<span className="hero-period">,</span> <span>sans surprise</span><span className="hero-period">.</span></h1>
            <p>Décrivez votre panne en 2 minutes. Obtenez un devis immédiat.</p>
          </div>

          {/* Stepper */}
          <div className="stepper">
            {STEP_LABELS.map((label, idx) => (
              <div key={label} style={{ display: "contents" }}>
                {idx > 0 && <div className={`step-line ${idx <= currentStepIndex ? "done" : ""}`} />}
                <div className={`step-item ${idx === currentStepIndex ? "active" : ""} ${idx < currentStepIndex ? "done" : ""}`}>
                  <div className="step-num">{idx < currentStepIndex ? "✓" : idx + 1}</div>
                  <span className="step-label">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Contenu principal */}
      <div className="client-main">
        {showFormUI ? (
          <div className="main-card">
            <div className="card-header">
              <h2>{cardInfo.title}</h2>
              <p>{cardInfo.subtitle}</p>
            </div>
            <div className="card-body">
              {step === "category" && <StepCategory onSelect={handleCategorySelect} />}

              {step === "questions" && formData.categorie && (
                <StepQuestions
                  categorie={formData.categorie}
                  onNext={handleQuestionsNext}
                  onBack={() => setStep("category")}
                />
              )}

              {step === "photo" && (
                <StepPhoto
                  initialPhoto={formData.photo}
                  initialPreview={formData.photoPreview}
                  onNext={handlePhotoNext}
                  onBack={() => setStep("questions")}
                />
              )}

              {step === "description" && formData.categorie && (
                <StepDescription
                  categorie={formData.categorie}
                  initialValue={formData.description}
                  onNext={handleDescriptionNext}
                  onBack={() => setStep("photo")}
                />
              )}

              {step === "contact" && (
                <StepContact
                  onNext={handleContactNext}
                  onBack={() => setStep("description")}
                />
              )}
            </div>
          </div>
        ) : (
          <>
            {step === "analyzing" && (
              <div className="analyzing-screen">
                <div className="analyzing-animation">
                  <div className="analyzing-spinner" />
                  <div className="analyzing-pulse" />
                </div>
                <h2>Analyse en cours…</h2>
                <p>Notre IA examine votre problème et prépare votre devis.</p>
                <div className="analyzing-steps">
                  <span>📤 Upload de la photo</span>
                  <span>🔍 Analyse du problème</span>
                  <span>💰 Consultation de la grille tarifaire</span>
                  <span>📋 Génération du devis</span>
                </div>
              </div>
            )}

            {step === "error" && (
              <div className="error-screen">
                <div className="error-icon">⚠️</div>
                <h2>Une erreur s'est produite</h2>
                <p>{analyzeError}</p>
                <button className="btn btn-primary" onClick={() => setStep("contact")} type="button">
                  ← Réessayer
                </button>
              </div>
            )}

            {step === "result" && result && formData.categorie && (
              <ResultPage reponseIA={result} categorie={formData.categorie} onReset={reset} />
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
}
