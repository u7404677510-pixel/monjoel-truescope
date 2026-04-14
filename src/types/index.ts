export type Categorie = "plomberie" | "serrurerie" | "electricite";

export interface GrilleLigne {
  id?: string;
  categorie: Categorie;
  libelle: string;
  prix: number;
  unite: string;
}

export interface DevisLigne {
  libelle: string;
  prix: number;
  unite: string;
}

export interface Majoration {
  coefficient: number;
  tranche: string;
}

export interface ReponseIA {
  phrase_choc: string;
  lignes_devis: DevisLigne[];
  prix_total: number;
  score_fiabilite: number;
  majoration?: Majoration;
}

export interface ContactInfo {
  nom: string;
  prenom: string;
  adresse: string;
  code_postal: string;
  ville: string;
}

export interface Intervention {
  id?: string;
  date: Date | { toDate: () => Date };
  categorie: Categorie;
  description_client: string;
  photo_url: string;
  reponses_clarification: Record<string, string>;
  contact?: ContactInfo;
  reponse_ia: ReponseIA;
  statut: "en_attente" | "validée" | "rejetée";
}

export interface InterventionValidee extends Intervention {
  statut: "validée";
  date_validation: Date | { toDate: () => Date };
}

export interface FormState {
  categorie: Categorie | null;
  description: string;
  questions: string[];
  reponses: Record<string, string>;
  contact: ContactInfo;
  photo: File | null;
  photoPreview: string | null;
}
