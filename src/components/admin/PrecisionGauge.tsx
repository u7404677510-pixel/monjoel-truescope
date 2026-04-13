import { useEffect, useState } from "react";
import type { Categorie } from "../../types";
import { getValidatedCounts } from "../../lib/firestore";

const CATEGORY_META: Record<Categorie, { label: string; icon: string }> = {
  plomberie: { label: "Plomberie", icon: "🔧" },
  serrurerie: { label: "Serrurerie", icon: "🔒" },
  electricite: { label: "Électricité", icon: "⚡" },
};

export function PrecisionGauge() {
  const [counts, setCounts] = useState<Record<Categorie, number>>({
    plomberie: 0,
    serrurerie: 0,
    electricite: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getValidatedCounts()
      .then(setCounts)
      .finally(() => setLoading(false));
  }, []);

  const totalValidated = counts.plomberie + counts.serrurerie + counts.electricite;

  if (loading) {
    return (
      <div className="gauge-card">
        <div className="loading-spinner" style={{ margin: "20px auto" }} />
      </div>
    );
  }

  return (
    <div className="gauge-card">
      <div className="gauge-header">
        <div>
          <h3 className="gauge-title">Apprentissage de l'IA</h3>
          <p className="gauge-subtitle">
            La fiabilité est calculée dynamiquement à chaque demande selon la similarité des interventions validées
          </p>
        </div>
      </div>

      <div className="gauge-info-box" style={{ background: "rgba(112,85,167,0.06)", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "var(--dark)", margin: 0, lineHeight: 1.6 }}>
          À chaque nouvelle demande, l'IA analyse la photo, la description et les réponses du client.
          Elle compare ensuite avec les <strong>{totalValidated}</strong> intervention{totalValidated > 1 ? "s" : ""} validée{totalValidated > 1 ? "s" : ""} pour évaluer sa confiance.
          Plus les exemples validés sont similaires à la demande, plus le score de fiabilité augmente (max 99%).
        </p>
      </div>

      <div className="gauge-categories">
        {(Object.entries(CATEGORY_META) as [Categorie, { label: string; icon: string }][]).map(
          ([cat, meta]) => {
            const count = counts[cat];
            return (
              <div key={cat} className="gauge-cat-item">
                <div className="gauge-cat-header">
                  <span className="gauge-cat-icon">{meta.icon}</span>
                  <span className="gauge-cat-name">{meta.label}</span>
                  <span className="gauge-cat-count" style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: "var(--purple-deep)" }}>
                    {count} validée{count > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="gauge-bar-bg small">
                  <div
                    className="gauge-bar-fill"
                    style={{
                      width: count === 0 ? "0%" : `${Math.min(count * 4, 100)}%`,
                      background: count >= 15 ? "#22c55e" : count >= 5 ? "#7055A7" : "#F5C842",
                    }}
                  />
                </div>
              </div>
            );
          }
        )}
      </div>

      {totalValidated === 0 && (
        <p className="gauge-hint">
          Validez des interventions pour que l'IA puisse s'appuyer sur des exemples réels et augmenter sa fiabilité.
        </p>
      )}
    </div>
  );
}
