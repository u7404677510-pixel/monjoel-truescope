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
  onNext: (reponses: Record<string, string>, questions: string[]) => void;
  onBack: () => void;
}

export function StepQuestions({ categorie, onNext, onBack }: Props) {
  const items = QCM_DATA[categorie];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const progress = ((currentIndex + 1) / items.length) * 100;

  const selectOption = (question: string, option: string) => {
    setReponses((prev) => ({ ...prev, [question]: option }));
    setDirection("forward");
    setTimeout(() => {
      if (currentIndex < items.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        const questions = items.map((i) => i.question);
        onNext({ ...reponses, [question]: option }, questions);
      }
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

  return (
    <div className="qcm-container">
      <div className="qcm-progress">
        <div className="qcm-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="qcm-meta">
        <button className="qcm-back" onClick={goBack} type="button">
          ← Retour
        </button>
        <span className="qcm-counter">{currentIndex + 1} / {items.length}</span>
      </div>

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
    </div>
  );
}
