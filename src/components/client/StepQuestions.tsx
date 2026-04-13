import { useState } from "react";
import type { Categorie } from "../../types";

interface QCMItem {
  question: string;
  options: string[];
}

const QCM_DATA: Record<Categorie, QCMItem[]> = {
  serrurerie: [
    { question: "Votre porte est-elle verrouillée ou simplement claquée ?", options: ["Claquée", "Verrouillée", "Difficile à dire"] },
    { question: "Quel type de porte est concerné ?", options: ["Porte d'entrée", "Porte intérieure", "Autre"] },
    { question: "Êtes-vous actuellement à l'extérieur ?", options: ["Oui", "Non", "Un proche est à l'intérieur"] },
    { question: "Constatez-vous des dégâts sur la serrure ?", options: ["Oui", "Non", "Difficile à voir"] },
  ],
  plomberie: [
    { question: "Quel est le type de problème ?", options: ["Une fuite", "Un bouchon", "Une panne d'eau chaude"] },
    { question: "Quelle pièce est concernée ?", options: ["Cuisine", "Salle de bain / WC", "Autre pièce"] },
    { question: "Type de logement ?", options: ["Maison", "Appartement", "Local professionnel"] },
    { question: "Avez-vous coupé l'arrivée d'eau ?", options: ["Oui", "Non", "Je ne sais pas"] },
  ],
  electricite: [
    { question: "Que constatez-vous exactement ?", options: ["Plus de lumière", "Prises hors service", "Coupure totale"] },
    { question: "Le disjoncteur a-t-il sauté ?", options: ["Oui", "Non", "Je ne sais pas"] },
    { question: "La panne concerne-t-elle une seule pièce ?", options: ["Une seule pièce", "Plusieurs pièces", "Tout le logement"] },
    { question: "Percevez-vous une odeur de brûlé ?", options: ["Oui", "Non", "Pas certain"] },
  ],
};

interface Props {
  categorie: Categorie;
  onNext: (reponses: Record<string, string>, questions: string[], contact: { nom: string; prenom: string; adresse: string }) => void;
  onBack: () => void;
}

export function StepQuestions({ categorie, onNext, onBack }: Props) {
  const items = QCM_DATA[categorie];
  const totalSteps = items.length + 1; // QCM questions + contact form

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [contactError, setContactError] = useState("");

  const isContactStep = currentIndex >= items.length;
  const progress = ((currentIndex + 1) / totalSteps) * 100;

  const selectOption = (question: string, option: string) => {
    setReponses((prev) => ({ ...prev, [question]: option }));
    setDirection("forward");
    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
    }, 250);
  };

  const goBack = () => {
    if (currentIndex === 0) {
      onBack();
      return;
    }
    setDirection("backward");
    setCurrentIndex((i) => i - 1);
  };

  const handleSubmitContact = () => {
    if (!nom.trim() || !prenom.trim() || !adresse.trim()) {
      setContactError("Merci de remplir tous les champs.");
      return;
    }
    setContactError("");
    const questions = items.map((i) => i.question);
    onNext(reponses, questions, { nom: nom.trim(), prenom: prenom.trim(), adresse: adresse.trim() });
  };

  return (
    <div className="qcm-container">
      {/* Progress bar */}
      <div className="qcm-progress">
        <div className="qcm-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="qcm-meta">
        <button className="qcm-back" onClick={goBack} type="button">
          ← Retour
        </button>
        <span className="qcm-counter">{currentIndex + 1} / {totalSteps}</span>
      </div>

      {/* QCM questions */}
      {!isContactStep && (
        <div className={`qcm-slide qcm-slide-${direction}`} key={currentIndex}>
          <h3 className="qcm-question">{items[currentIndex].question}</h3>
          <div className="qcm-options">
            {items[currentIndex].options.map((option) => {
              const isSelected = reponses[items[currentIndex].question] === option;
              return (
                <button
                  key={option}
                  className={`qcm-option ${isSelected ? "selected" : ""}`}
                  onClick={() => selectOption(items[currentIndex].question, option)}
                  type="button"
                >
                  <span className="qcm-option-text">{option}</span>
                  <span className="qcm-option-check">{isSelected ? "✓" : ""}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact form */}
      {isContactStep && (
        <div className={`qcm-slide qcm-slide-${direction}`} key="contact">
          <h3 className="qcm-question">Vos coordonnées</h3>
          <p className="qcm-subtitle">Pour que Joël puisse vous recontacter</p>

          <div className="qcm-form">
            <div className="qcm-field">
              <input
                type="text"
                className="qcm-input"
                placeholder="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                autoFocus
              />
            </div>
            <div className="qcm-field">
              <input
                type="text"
                className="qcm-input"
                placeholder="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
            <div className="qcm-field">
              <input
                type="text"
                className="qcm-input"
                placeholder="Adresse complète"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
              />
            </div>
          </div>

          {contactError && <p className="field-error" style={{ marginTop: 12, textAlign: "center" }}>{contactError}</p>}

          <button className="btn btn-primary" onClick={handleSubmitContact} type="button" style={{ marginTop: 24 }}>
            Continuer <span className="btn-arrow">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
