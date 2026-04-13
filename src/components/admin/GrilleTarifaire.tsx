import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Categorie, GrilleLigne } from "../../types";
import {
  getGrilleTarifaire,
  addGrilleLigne,
  updateGrilleLigne,
  deleteGrilleLigne,
  seedGrilleTarifaire,
} from "../../lib/firestore";

const CATEGORIES: Categorie[] = ["plomberie", "serrurerie", "electricite"];
const CATEGORY_LABELS: Record<Categorie, string> = {
  plomberie: "Plomberie",
  serrurerie: "Serrurerie",
  electricite: "Électricité",
};

type FormValues = Omit<GrilleLigne, "id">;

export function GrilleTarifaireManager() {
  const [lignes, setLignes] = useState<GrilleLigne[]>([]);
  const [filterCat, setFilterCat] = useState<Categorie | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: { categorie: "plomberie", unite: "forfait", prix: 0, libelle: "" },
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getGrilleTarifaire();
      setLignes(data);
    } catch {
      setError("Erreur lors du chargement de la grille.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filterCat === "all" ? lignes : lignes.filter((l) => l.categorie === filterCat);

  const openEdit = (ligne: GrilleLigne) => {
    setEditingId(ligne.id ?? null);
    setValue("categorie", ligne.categorie);
    setValue("libelle", ligne.libelle);
    setValue("prix", ligne.prix);
    setValue("unite", ligne.unite);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingId(null);
    reset({ categorie: "plomberie", unite: "forfait", prix: 0, libelle: "" });
    setError("");
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    setError("");
    try {
      if (editingId) {
        await updateGrilleLigne(editingId, data);
      } else {
        await addGrilleLigne(data);
      }
      await load();
      handleClose();
    } catch {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette ligne tarifaire ?")) return;
    try {
      await deleteGrilleLigne(id);
      setLignes((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  const handleSeed = async () => {
    if (!confirm("Remplir la grille avec les prestations par défaut (plomberie, serrurerie, électricité) ?")) return;
    setSeeding(true);
    setError("");
    try {
      await seedGrilleTarifaire();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du remplissage.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="grille-manager">
      <div className="grille-header">
        <h2>Grille tarifaire</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {lignes.length === 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSeed}
              disabled={seeding}
              type="button"
            >
              {seeding ? "Remplissage…" : "Remplir la grille (données par défaut)"}
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} type="button">
            + Ajouter
          </button>
        </div>
      </div>

      <div className="grille-filters">
        <button
          className={`filter-btn ${filterCat === "all" ? "active" : ""}`}
          onClick={() => setFilterCat("all")}
          type="button"
        >
          Toutes
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`filter-btn ${filterCat === c ? "active" : ""}`}
            onClick={() => setFilterCat(c)}
            type="button"
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {error && <p className="field-error">{error}</p>}

      {loading ? (
        <div className="loading-spinner" />
      ) : (
        <div className="grille-table-wrapper">
          <table className="grille-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Libellé</th>
                <th>Prix</th>
                <th>Unité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ligne) => (
                <tr key={ligne.id}>
                  <td>
                    <span className={`badge badge-${ligne.categorie}`}>
                      {CATEGORY_LABELS[ligne.categorie]}
                    </span>
                  </td>
                  <td>{ligne.libelle}</td>
                  <td>{ligne.prix} €</td>
                  <td>{ligne.unite}</td>
                  <td className="table-actions">
                    <button className="btn-icon" onClick={() => openEdit(ligne)} type="button">✏️</button>
                    <button className="btn-icon" onClick={() => handleDelete(ligne.id!)} type="button">🗑️</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--grey-text)" }}>
                    Aucune ligne tarifaire.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "Modifier la ligne" : "Nouvelle ligne tarifaire"}</h3>
              <button className="modal-close" onClick={handleClose} type="button">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
              <div className="field-group">
                <label className="field-label">Catégorie</label>
                <select className="field-select" {...register("categorie", { required: true })}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Libellé</label>
                <input
                  className="field-input"
                  {...register("libelle", { required: "Libellé requis" })}
                  placeholder="Ex: Remplacement robinet standard"
                />
                {errors.libelle && <span className="field-error">{errors.libelle.message}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">Prix (€)</label>
                <input
                  type="number"
                  className="field-input"
                  {...register("prix", { required: true, valueAsNumber: true, min: 0 })}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Unité</label>
                <input
                  className="field-input"
                  {...register("unite", { required: true })}
                  placeholder="forfait, unité, heure…"
                />
              </div>

              {error && <p className="field-error">{error}</p>}

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={handleClose} type="button">
                  Annuler
                </button>
                <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "auto", padding: "12px 24px" }}>
                  {submitting ? "Enregistrement…" : editingId ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
