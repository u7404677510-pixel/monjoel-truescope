import type { Categorie, ReponseIA } from "../../types";

interface Props {
  reponseIA: ReponseIA;
  categorie: Categorie;
  onReset: () => void;
}

const CATEGORY_LABELS: Record<Categorie, string> = {
  plomberie: "Plomberie",
  serrurerie: "Serrurerie",
  electricite: "Électricité",
};

const JOEL_PHONE = "tel:+33141691008";

export function ResultPage({ reponseIA, categorie, onReset }: Props) {
  const { phrase_choc, lignes_devis, prix_total, majoration } = reponseIA;

  return (
    <div className="result-page">
      {/* Phrase choc */}
      <div className="phrase-choc">
        <div className="phrase-choc-label">Le saviez-vous ?</div>
        <div className="phrase-choc-text">{phrase_choc}</div>
      </div>

      {/* Devis */}
      <div className="devis-card">
        <div className="devis-header">
          <h3 className="devis-title">Votre estimation de prix</h3>
          <span className="devis-badge">{CATEGORY_LABELS[categorie]}</span>
        </div>

        {lignes_devis.map((ligne, idx) => (
          <div key={idx} className="devis-line" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid var(--grey-light)" }}>
            <span className="devis-line-name" style={{ flex: 1, fontSize: 14, color: "var(--dark)" }}>{ligne.libelle}</span>
            <span className="devis-line-unit" style={{ fontSize: 11, color: "var(--grey-text)", background: "var(--grey-light)", padding: "2px 8px", borderRadius: 6, margin: "0 16px" }}>{ligne.unite}</span>
            <span className="devis-line-price" style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600, color: "var(--purple-deep)", whiteSpace: "nowrap" }}>{ligne.prix}€</span>
          </div>
        ))}

        <div className="devis-total">
          <span className="devis-total-label">Total estimé TTC</span>
          <span className="devis-total-price">{prix_total}€</span>
        </div>

        {majoration && majoration.coefficient > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 28px", background: "rgba(245,200,66,0.08)", borderRadius: 8, margin: "8px 20px 0" }}>
            <span style={{ fontSize: 16 }}>🕐</span>
            <span style={{ fontSize: 12, color: "var(--dark)" }}>
              Majoration horaire <strong>×{majoration.coefficient}</strong> appliquée (tranche {majoration.tranche})
            </span>
          </div>
        )}

      </div>

      {/* CTA */}
      <a href={JOEL_PHONE} className="btn-contact">
        <div className="phone-icon">📞</div>
        <div className="btn-contact-text">
          Contacter Joël
          <span className="btn-contact-sub">Réponse sous 15 min · Intervention rapide</span>
        </div>
      </a>

      <button className="btn btn-text" onClick={onReset} type="button" style={{ margin: "0 auto" }}>
        Faire une autre demande
      </button>
    </div>
  );
}
