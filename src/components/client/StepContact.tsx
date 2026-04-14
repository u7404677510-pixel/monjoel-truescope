import { useState } from "react";
import type { ContactInfo } from "../../types";

interface Props {
  onNext: (contact: ContactInfo) => void;
  onBack: () => void;
}

export function StepContact({ onNext, onBack }: Props) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [ville, setVille] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!nom.trim() || !prenom.trim() || !adresse.trim() || !codePostal.trim() || !ville.trim()) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    setError("");
    onNext({
      nom: nom.trim(),
      prenom: prenom.trim(),
      adresse: adresse.trim(),
      code_postal: codePostal.trim(),
      ville: ville.trim(),
    });
  };

  return (
    <div className="qcm-container">
      <div className="qcm-slide qcm-slide-forward" key="contact">
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
              placeholder="Adresse postale"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
            />
          </div>
          <div className="qcm-field-row">
            <div className="qcm-field">
              <input
                type="text"
                className="qcm-input"
                placeholder="Code postal"
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                inputMode="numeric"
                maxLength={5}
              />
            </div>
            <div className="qcm-field qcm-field-grow">
              <input
                type="text"
                className="qcm-input"
                placeholder="Ville"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <p className="field-error" style={{ marginTop: 12, textAlign: "center" }}>{error}</p>}

        <div className="step-actions" style={{ marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onBack} type="button">
            ← Retour
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} type="button">
            Obtenir mon devis <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
