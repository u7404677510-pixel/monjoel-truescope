# Devis IA Dépannage

Application web de génération automatique de devis pour la plomberie, serrurerie et électricité, propulsée par Google Gemini.

## Stack

- **Frontend** : React + Vite + TypeScript
- **Backend / BDD** : Firebase (Firestore + Storage + Auth + Cloud Functions)
- **IA** : Google Gemini (`gemini-2.5-flash`)

## Démarrage rapide

### 1. Créer le projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Créer un nouveau projet
3. Activer **Firestore Database** (mode production)
4. Activer **Storage**
5. Activer **Authentication** → méthode Email/mot de passe
6. Créer un compte admin dans Authentication → Users
7. Aller dans Project Settings → Copier la config SDK Web

### 2. Configurer les variables d'environnement

Copier `.env.example` vers `.env` et remplir :

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet-id
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Configurer la clé API Gemini (Cloud Functions)

```bash
# Définir la clé API pour les Cloud Functions
firebase functions:secrets:set GEMINI_API_KEY
# Entrer votre clé AIza...
```

### 4. Initialiser Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase use votre-projet-id
```

### 5. Déployer les règles Firestore et les Cloud Functions

```bash
# Déployer les règles
firebase deploy --only firestore:rules,storage

# Compiler et déployer les Cloud Functions
cd functions && npm run build && cd ..
firebase deploy --only functions
```

### 6. Alimenter la grille tarifaire

Au premier lancement de l'application, la grille tarifaire est automatiquement remplie avec des données exemples si elle est vide. Cela se fait depuis la page admin (onglet "Grille tarifaire").

### 7. Lancer l'application en développement

```bash
npm install
npm run dev
```

Accéder à `http://localhost:3000`

## Pages

| URL | Description |
|---|---|
| `/` | Formulaire client (4 étapes) |
| `/admin/login` | Connexion admin |
| `/admin` | Dashboard admin |

## Fonctionnement

### Parcours client (4 étapes)
1. **Catégorie** — Plomberie / Serrurerie / Électricité
2. **Description** — Texte libre du problème
3. **Questions** — 4 questions générées dynamiquement par l'IA selon la description
4. **Photo** — Upload avec compression automatique (max 1 MB)

### Résultat
- Phrase choc statistique (générée par l'IA selon la catégorie)
- Tableau de devis avec lignes de la grille tarifaire
- Prix min / max + total estimé
- Bouton "Contacter Joël"

### Interface admin
- Liste des interventions en attente avec photo + description + devis IA
- **Valider** → copié dans `interventions_validees` (utilisé pour l'apprentissage)
- **Rejeter** → marqué comme rejeté (non utilisé pour l'apprentissage)
- Gestion CRUD de la grille tarifaire

### Apprentissage (RAG)
À chaque analyse, les 15 dernières interventions validées de la même catégorie sont injectées dans le prompt Gemini comme exemples. Plus l'admin valide, plus l'IA devient précise.

## Structure Firestore

```
grille_tarifaire/
  { categorie, libelle, prix_min, prix_max, unite }

interventions_en_attente/
  { date, categorie, description_client, photo_url,
    reponses_clarification, reponse_ia, statut }

interventions_validees/
  { ...même champs, statut: "validée", date_validation }
```

## Structure du projet

```
src/
├── components/
│   ├── client/        # Étapes du formulaire + page résultat
│   └── admin/         # Cards interventions + grille tarifaire + route guard
├── pages/             # ClientForm, AdminLogin, AdminDashboard
├── lib/               # firebase.ts, firestore.ts, storage.ts, gemini.ts
├── hooks/             # useAuth.ts
├── types/             # Types TypeScript partagés
└── styles/            # CSS global

functions/src/
└── index.ts           # analyzeIntervention + generateQuestions (Cloud Functions)
```

## Personnalisation

### Changer le numéro de Joël
Dans `src/components/client/ResultPage.tsx`, modifier la constante `JOEL_PHONE` :
```ts
const JOEL_PHONE = "tel:+33600000000";
```

### Changer la région Firebase Functions
Dans `src/lib/firebase.ts` et `functions/src/index.ts` :
```ts
getFunctions(app, "europe-west1")  // adapter selon votre région
setGlobalOptions({ region: "europe-west1" })
```

## Déploiement production

```bash
npm run build
firebase deploy
```
