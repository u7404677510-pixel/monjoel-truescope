import { useState } from "react";
import type { Categorie } from "../../types";

interface Props {
  categorie: Categorie;
  initialValue?: string;
  onNext: (description: string) => void;
  onBack: () => void;
}

const PLACEHOLDERS: Record<Categorie, string> = {
  plomberie: "Ex: Mon robinet de cuisine fuit au niveau du joint, l'eau goutte en continu depuis hier matin…",
  serrurerie: "Ex: Ma porte d'entrée ne ferme plus correctement, la serrure semble bloquée depuis ce matin…",
  electricite: "Ex: Mon disjoncteur différentiel disjoncte dès que j'allume les lumières du salon…",
};

export function StepDescription({ categorie, initialValue = "", onNext, onBack }: Props) {
  const [description, setDescription] = useState(initialValue);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (description.trim().length < 10) {
      setError("Veuillez décrire votre problème en au moins 10 caractères.");
      return;
    }
    setError("");
    onNext(description.trim());
  };

  return (
    <>
      <div className="field-group">
        <div className="field-label">
          <span className="required" />
          Décrivez votre problème le plus simplement possible
        </div>
        <textarea
          className="field-textarea"
          placeholder={PLACEHOLDERS[categorie]}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={1000}
        />
        <div className="field-meta">
          <span className="field-error">{error}</span>
          <span className="char-count">{description.length}/1000</span>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack} type="button">
          ← Retour
        </button>
        <button className="btn btn-primary" onClick={handleNext} type="button">
          Continuer <span className="btn-arrow">→</span>
        </button>
      </div>
    </>
  );
}
