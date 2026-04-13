import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getPendingInterventions, getValidatedInterventions } from "../lib/firestore";
import { DashboardOverview } from "../components/admin/DashboardOverview";
import { InterventionCard } from "../components/admin/InterventionCard";
import { InterventionCardValidated } from "../components/admin/InterventionCardValidated";
import { GrilleTarifaireManager } from "../components/admin/GrilleTarifaire";
import { PrecisionGauge } from "../components/admin/PrecisionGauge";
import { InterventionsTable } from "../components/admin/InterventionsTable";
import type { Intervention, InterventionValidee } from "../types";

type AdminTab = "dashboard" | "tableau" | "interventions" | "historique" | "grille" | "precision";

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [validated, setValidated] = useState<InterventionValidee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [error, setError] = useState("");
  const [gaugeKey, setGaugeKey] = useState(0);

  useEffect(() => {
    if (!user) { navigate("/admin/login"); return; }
    loadInterventions();
  }, [user]);

  const loadInterventions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPendingInterventions();
      setInterventions(data);
    } catch {
      setError("Erreur lors du chargement des interventions.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistorique = async () => {
    setLoadingHistorique(true);
    try {
      const data = await getValidatedInterventions();
      setValidated(data);
    } catch {
      setValidated([]);
    } finally {
      setLoadingHistorique(false);
    }
  };

  const handleStatusChange = (id: string, status: "validée" | "rejetée") => {
    // Validée → stockée dans interventions_validees, rejetée → supprimée
    setInterventions((prev) => prev.filter((i) => i.id !== id));
    if (status === "validée") setGaugeKey((k) => k + 1);
  };

  const pending = interventions.filter((i) => i.statut === "en_attente");

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="logo-area">
          <img src={`${import.meta.env.BASE_URL}logo-joel.svg`} alt="Joël" className="logo-img" />
          <span className="logo-divider" />
          <span className="logo-tech">TrueScope</span>
          <span className="nav-tag">Admin</span>
        </div>
        <div className="admin-header-right">
          <span className="admin-email">{user?.email}</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} type="button">
            Déconnexion
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button
          className={`admin-tab ${tab === "dashboard" ? "active" : ""}`}
          onClick={() => setTab("dashboard")}
          type="button"
        >
          📊 Vue d'ensemble
        </button>
        <button
          className={`admin-tab ${tab === "tableau" ? "active" : ""}`}
          onClick={() => setTab("tableau")}
          type="button"
        >
          Toutes les demandes
        </button>
        <button
          className={`admin-tab ${tab === "interventions" ? "active" : ""}`}
          onClick={() => setTab("interventions")}
          type="button"
        >
          En attente
          {pending.length > 0 && <span className="tab-badge">{pending.length}</span>}
        </button>
        <button
          className={`admin-tab ${tab === "historique" ? "active" : ""}`}
          onClick={() => { setTab("historique"); loadHistorique(); }}
          type="button"
        >
          Historique validées
        </button>
        <button
          className={`admin-tab ${tab === "grille" ? "active" : ""}`}
          onClick={() => setTab("grille")}
          type="button"
        >
          Grille tarifaire
        </button>
        <button
          className={`admin-tab ${tab === "precision" ? "active" : ""}`}
          onClick={() => setTab("precision")}
          type="button"
        >
          Précision IA
        </button>
      </nav>

      <main className="admin-main">
        {tab === "dashboard" && (
          <DashboardOverview interventions={interventions} />
        )}

        {tab === "tableau" && <InterventionsTable />}

        {tab === "interventions" && (
          <div>
            <div className="section-header">
              <h2>
                En attente
                {pending.length > 0 && <span className="tab-badge" style={{ marginLeft: 8 }}>{pending.length}</span>}
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={loadInterventions} type="button">
                ↻ Actualiser
              </button>
            </div>

            {error && <p className="field-error">{error}</p>}

            {loading ? (
              <div className="loading-spinner" />
            ) : pending.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✅</span>
                <p>Aucune intervention en attente.</p>
              </div>
            ) : (
              <div className="interventions-list">
                {pending.map((intervention) => (
                  <InterventionCard
                    key={intervention.id}
                    intervention={intervention}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "historique" && (
          <div>
            <div className="section-header">
              <h2>Interventions validées</h2>
              <button className="btn btn-secondary btn-sm" onClick={loadHistorique} type="button">
                ↻ Actualiser
              </button>
            </div>

            {loadingHistorique ? (
              <div className="loading-spinner" />
            ) : validated.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <p>Aucune intervention validée pour le moment.</p>
              </div>
            ) : (
              <div className="interventions-list">
                {validated.map((intervention) => (
                  <InterventionCardValidated key={intervention.id} intervention={intervention} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "grille" && <GrilleTarifaireManager />}

        {tab === "precision" && <PrecisionGauge key={gaugeKey} />}
      </main>
    </div>
  );
}
