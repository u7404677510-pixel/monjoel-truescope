import { useState } from "react";
import type { Intervention } from "../../types";
import { validateIntervention, rejectIntervention } from "../../lib/firestore";

interface Props {
  intervention: Intervention;
  onStatusChange: (id: string, status: "validée" | "rejetée") => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  plomberie: "Plomberie",
  serrurerie: "Serrurerie",
  electricite: "Électricité",
};

const CATEGORY_ICONS: Record<string, string> = {
  plomberie: "🚿",
  serrurerie: "🔒",
  electricite: "⚡",
};

export function InterventionCard({ intervention, onStatusChange }: Props) {
  const [loading, setLoading] = useState<"validate" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const { id, categorie, description_client, photo_url, reponses_clarification, reponse_ia, date } = intervention;

  const dateStr =
    date instanceof Date
      ? date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : typeof date === "object" && "toDate" in date
      ? (date as { toDate: () => Date }).toDate().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "—";

  const handleValidate = async () => {
    if (!id) return;
    setLoading("validate");
    setError("");
    try {
      await validateIntervention(id);
      onStatusChange(id, "validée");
    } catch {
      setError("Erreur lors de la validation.");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setLoading("reject");
    setError("");
    try {
      await rejectIntervention(id);
      onStatusChange(id, "rejetée");
    } catch {
      setError("Erreur lors du rejet.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="intervention-card">
      {/* Header compact */}
      <div className="card-header-admin" onClick={() => setExpanded((v) => !v)}>
        <div className="card-photo-thumb">
          {photo_url ? (
            <img src={photo_url} alt="" />
          ) : (
            CATEGORY_ICONS[categorie] ?? "🔧"
          )}
        </div>
        <div className="card-meta-admin">
          <div className="card-meta-top">
            <span className="badge badge-{categorie}">{CATEGORY_LABELS[categorie] ?? categorie}</span>
            <span className="card-date">{dateStr}</span>
          </div>
          <div className="card-description-preview">{description_client.slice(0, 100)}…</div>
        </div>
        <div className="card-status-dot" />
        <span className="card-expand-icon">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Body expandable */}
      {expanded && (
        <div className="card-body">
          <div className="card-content-grid">
            {photo_url && (
              <div className="card-photo-wrapper">
                <a href={photo_url} target="_blank" rel="noopener noreferrer">
                  <img src={photo_url} alt="Photo intervention" className="card-photo" />
                </a>
              </div>
            )}

            <div className="card-details">
              <h4>Description</h4>
              <p className="card-description">{description_client}</p>

              {Object.keys(reponses_clarification).length > 0 && (
                <>
                  <h4>Réponses</h4>
                  <ul className="card-reponses">
                    {Object.entries(reponses_clarification).map(([q, a]) => (
                      <li key={q}><strong>{q}</strong><br />{a}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Devis IA preview */}
          <div className="card-devis">
            <h4>Devis proposé par l'IA</h4>
            <div className="phrase-choc-small">"{reponse_ia.phrase_choc}"</div>

            <div className="admin-price-preview" style={{ marginBottom: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div>
                <span className="admin-price-label">Estimation IA</span>
                <span className="admin-price-val">{reponse_ia.prix_total}€</span>
              </div>
              <div>
                <span className="admin-price-label">Fiabilité</span>
                <span className="admin-price-val" style={{ color: reponse_ia.score_fiabilite >= 80 ? "#22c55e" : reponse_ia.score_fiabilite >= 50 ? "#F5C842" : "#c0365e" }}>
                  {reponse_ia.score_fiabilite}%
                </span>
              </div>
            </div>

            <table className="devis-table-small">
              <thead>
                <tr>
                  <th>Prestation</th>
                  <th>Prix</th>
                  <th>Unité</th>
                </tr>
              </thead>
              <tbody>
                {reponse_ia.lignes_devis.map((l, i) => (
                  <tr key={i}>
                    <td>{l.libelle}</td>
                    <td>{l.prix} €</td>
                    <td>{l.unite}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>TOTAL</strong></td>
                  <td><strong>{reponse_ia.prix_total} €</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {error && <p className="field-error">{error}</p>}

          <div className="card-actions">
            <button
              className="btn-validate"
              onClick={handleValidate}
              disabled={loading !== null}
              type="button"
            >
              {loading === "validate" ? "Validation…" : "✓ Valider la réponse"}
            </button>
            <button
              className="btn-reject"
              onClick={handleReject}
              disabled={loading !== null}
              type="button"
            >
              {loading === "reject" ? "Rejet…" : "✕ Rejeter"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
