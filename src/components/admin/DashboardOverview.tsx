import { useEffect, useState } from "react";
import { getValidatedCounts } from "../../lib/firestore";
import type { Intervention } from "../../types";

interface Props {
  interventions: Intervention[];
}

const COST_PER_ANALYSIS = 0.003;
const COST_PER_QUESTIONS = 0.0005;
const COST_PER_REQUEST = COST_PER_ANALYSIS + COST_PER_QUESTIONS;

export function DashboardOverview({ interventions }: Props) {
  const [totalValidated, setTotalValidated] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getValidatedCounts()
      .then((counts) => {
        const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
        setTotalValidated(total);
      })
      .finally(() => setLoading(false));
  }, []);

  const pending = interventions.filter((i) => i.statut === "en_attente").length;

  const pctLabel = totalValidated;

  const totalRequests = pending + totalValidated;
  const estimatedCostEur = totalRequests * COST_PER_REQUEST;
  const estimatedCostDisplay = estimatedCostEur < 1
    ? `${(estimatedCostEur * 100).toFixed(0)}c`
    : `${estimatedCostEur.toFixed(2)}€`;

  return (
    <div className="overview">
      {/* Stats grid */}
      <div className="overview-grid">
        <div className="stat-card-lg">
          <div className="stat-card-lg-icon" style={{ background: "rgba(245,200,66,0.15)" }}>⏳</div>
          <span className="stat-card-lg-value">{pending}</span>
          <span className="stat-card-lg-label">En attente</span>
        </div>

        <div className="stat-card-lg">
          <div className="stat-card-lg-icon" style={{ background: "rgba(34,197,94,0.12)" }}>✓</div>
          <span className="stat-card-lg-value">{totalValidated}</span>
          <span className="stat-card-lg-label">Validées</span>
        </div>

        <div className="stat-card-lg">
          <div className="stat-card-lg-icon" style={{ background: "rgba(112,85,167,0.08)" }}>📊</div>
          <span className="stat-card-lg-value">{loading ? "…" : totalRequests}</span>
          <span className="stat-card-lg-label">Total demandes</span>
        </div>

        <div className="stat-card-lg">
          <div className="stat-card-lg-icon" style={{ background: "rgba(112,85,167,0.08)" }}>💰</div>
          <span className="stat-card-lg-value">{loading ? "…" : estimatedCostDisplay}</span>
          <span className="stat-card-lg-label">Coût API estimé</span>
        </div>
      </div>

      {/* 2 colonnes : jauge globale + cout API */}
      <div className="overview-row">
        {/* Jauge globale simplifiee */}
        <div className="overview-card">
          <div className="overview-card-header">
            <h3>Apprentissage IA</h3>
            <span className="overview-card-tag">
              {totalValidated} intervention{totalValidated > 1 ? "s" : ""} validée{totalValidated > 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="loading-spinner" style={{ margin: "20px auto" }} />
          ) : (
            <div className="overview-gauge">
              <div className="overview-gauge-ring">
                <svg viewBox="0 0 120 120" className="gauge-svg">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--grey-light)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="url(#gaugeGrad)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(pctLabel * 7, 314)} 314`}
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7055A7" />
                      <stop offset="100%" stopColor="#9E76EC" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="overview-gauge-center">
                  <span className="overview-gauge-pct">{pctLabel}</span>
                  <span className="overview-gauge-label">validées</span>
                </div>
              </div>
              <p className="overview-gauge-hint">
                La fiabilité est calculée dynamiquement à chaque demande. Plus il y a d'interventions validées similaires, plus le score augmente (max 99%).
              </p>
            </div>
          )}
        </div>

        {/* Cout API */}
        <div className="overview-card">
          <div className="overview-card-header">
            <h3>Coût API Gemini</h3>
            <span className="overview-card-tag">gemini-2.5-flash</span>
          </div>

          <div className="api-cost-section">
            <div className="api-cost-total">
              <span className="api-cost-value">{estimatedCostDisplay}</span>
              <span className="api-cost-label">coût estimé total</span>
            </div>

            <div className="api-cost-breakdown">
              <div className="api-cost-line">
                <span className="api-cost-line-label">Analyses IA (photo + devis)</span>
                <span className="api-cost-line-detail">{totalRequests} × ~0.3c</span>
                <span className="api-cost-line-value">{(totalRequests * COST_PER_ANALYSIS).toFixed(3)}€</span>
              </div>
            </div>

            <div className="api-cost-rates">
              <p>Tarifs indicatifs basés sur gemini-2.5-flash :</p>
              <ul>
                <li>~0.3c par analyse (photo + grille + RAG)</li>
                <li>~0.05c par génération de questions</li>
                <li>~0.35c par demande complète</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
