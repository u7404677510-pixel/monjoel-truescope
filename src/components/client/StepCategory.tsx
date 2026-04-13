import type { Categorie } from "../../types";

interface Props {
  onSelect: (c: Categorie) => void;
}

const CATEGORIES: { id: Categorie; label: string; icon: string; desc: string }[] = [
  { id: "plomberie", label: "Plomberie", icon: "🔧", desc: "Fuite, robinet, canalisation…" },
  { id: "serrurerie", label: "Serrurerie", icon: "🔒", desc: "Porte claquée, serrure, cylindre…" },
  { id: "electricite", label: "Électricité", icon: "⚡", desc: "Panne, disjoncteur, prise…" },
];

export function StepCategory({ onSelect }: Props) {
  return (
    <>
      <div className="section-label">Catégorie</div>
      <div className="cat-grid">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className="cat-card"
            onClick={() => onSelect(cat.id)}
            type="button"
          >
            <span className="cat-icon">{cat.icon}</span>
            <div className="cat-name">{cat.label}</div>
            <div className="cat-desc">{cat.desc}</div>
          </button>
        ))}
      </div>
    </>
  );
}
