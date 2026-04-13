import { useEffect, useState } from "react";
import { getPendingInterventions, getValidatedInterventions } from "../../lib/firestore";
import type { Intervention, InterventionValidee } from "../../types";

interface TableRow {
  id: string;
  date: string;
  nom: string;
  prenom: string;
  adresse: string;
  categorie: string;
  description: string;
  reponses: string;
  prestations: string;
  prix: number;
  fiabilite: number;
  statut: string;
  photo_url: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  plomberie: "Plomberie",
  serrurerie: "Serrurerie",
  electricite: "Électricité",
};

function formatDate(date: Date | { toDate: () => Date } | undefined): string {
  if (!date) return "—";
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toRow(intervention: Intervention | InterventionValidee, statut: string): TableRow {
  const data = intervention as Record<string, unknown>;
  const contact = (data.contact as { nom?: string; prenom?: string; adresse?: string }) ?? {};

  const reponses = Object.entries(intervention.reponses_clarification || {})
    .map(([q, a]) => `${a}`)
    .join(" · ");

  const prestations = intervention.reponse_ia.lignes_devis
    .map((l) => l.libelle)
    .join(", ");

  return {
    id: intervention.id ?? "",
    date: formatDate(intervention.date),
    nom: contact.nom ?? "—",
    prenom: contact.prenom ?? "—",
    adresse: contact.adresse ?? "—",
    categorie: CATEGORY_LABELS[intervention.categorie] ?? intervention.categorie,
    description: intervention.description_client,
    reponses,
    prestations,
    prix: intervention.reponse_ia.prix_total,
    fiabilite: intervention.reponse_ia.score_fiabilite,
    statut,
    photo_url: intervention.photo_url,
  };
}

export function InterventionsTable() {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"toutes" | "en_attente" | "validée">("toutes");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pending, validated] = await Promise.all([
        getPendingInterventions(),
        getValidatedInterventions(),
      ]);
      const pendingRows = pending.map((i) => toRow(i, "En attente"));
      const validatedRows = validated.map((i) => toRow(i, "Validée"));
      setRows([...pendingRows, ...validatedRows].sort((a, b) => {
        const da = new Date(a.date.split(" ")[0].split("/").reverse().join("-"));
        const db2 = new Date(b.date.split(" ")[0].split("/").reverse().join("-"));
        return db2.getTime() - da.getTime();
      }));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const filtered = filter === "toutes" ? rows : rows.filter((r) => {
    if (filter === "en_attente") return r.statut === "En attente";
    return r.statut === "Validée";
  });

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <div className="section-header">
        <h2>Toutes les demandes <span className="count-label">({filtered.length})</span></h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="grille-filters">
            {(["toutes", "en_attente", "validée"] as const).map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
                type="button"
              >
                {f === "toutes" ? "Toutes" : f === "en_attente" ? "En attente" : "Validées"}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadAll} type="button">
            ↻
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>Aucune demande.</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Client</th>
                <th>Adresse</th>
                <th>Catégorie</th>
                <th>Description</th>
                <th>Réponses</th>
                <th>Prestations IA</th>
                <th>Prix</th>
                <th>Fiabilité</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className={`data-row ${expandedId === row.id ? "expanded" : ""}`}
                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                >
                  <td className="data-cell-photo">
                    {row.photo_url ? (
                      <a href={row.photo_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <img src={row.photo_url} alt="" className="data-thumb" />
                      </a>
                    ) : (
                      <span className="data-thumb-empty">—</span>
                    )}
                  </td>
                  <td className="data-cell-nowrap">{row.date}</td>
                  <td>
                    <span className={`data-status ${row.statut === "Validée" ? "data-status-valid" : "data-status-pending"}`}>
                      {row.statut}
                    </span>
                  </td>
                  <td className="data-cell-nowrap">{row.prenom} {row.nom}</td>
                  <td className="data-cell-address">{row.adresse}</td>
                  <td>
                    <span className={`badge badge-${row.categorie.toLowerCase().replace("é", "e")}`}>
                      {row.categorie}
                    </span>
                  </td>
                  <td className="data-cell-desc">{row.description}</td>
                  <td className="data-cell-resp">{row.reponses || "—"}</td>
                  <td className="data-cell-presta">{row.prestations}</td>
                  <td className="data-cell-prix">{row.prix}€</td>
                  <td>
                    <span
                      className="data-fiabilite"
                      style={{ color: row.fiabilite >= 80 ? "#22c55e" : row.fiabilite >= 50 ? "#e5a00d" : "#c0365e" }}
                    >
                      {row.fiabilite}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
