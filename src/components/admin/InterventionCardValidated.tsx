import { useState } from "react";
import type { InterventionValidee } from "../../types";

interface Props {
  intervention: InterventionValidee;
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

export function InterventionCardValidated({ intervention }: Props) {
  const [expanded, setExpanded] = useState(false);

  const { categorie, description_client, photo_url, reponses_clarification, reponse_ia, date_validation } = intervention;

  const dateStr =
    date_validation instanceof Date
      ? date_validation.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : typeof date_validation === "object" && "toDate" in date_validation
      ? (date_validation as { toDate: () => Date }).toDate().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "—";

  return (
    <div className="intervention-card">
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
            <span className={`badge badge-${categorie}`}>{CATEGORY_LABELS[categorie] ?? categorie}</span>
            <span className="card-date">{dateStr}</span>
          </div>
          <div className="card-description-preview">{description_client.slice(0, 100)}…</div>
        </div>
        <span className="card-expand-icon">{expanded ? "▲" : "▼"}</span>
      </div>

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
          <div className="card-devis">
            <h4>Devis validé</h4>
            <div className="phrase-choc-small">"{reponse_ia.phrase_choc}"</div>
            <div className="admin-price-preview" style={{ marginBottom: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div>
                <span className="admin-price-label">Estimation</span>
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
        </div>
      )}
    </div>
  );
}
