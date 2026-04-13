# Configuration TrueScope

Ce document explique comment configurer les clés API et Firebase **sans les stocker dans le code**.

---

## ✅ Déjà fait automatiquement

- `.env` configuré avec ta config Firebase
- `.firebaserc` lié au projet `truescope-7790c`
- Bouton **« Remplir la grille »** dans l’admin (onglet Grille tarifaire) pour charger les prestations par défaut

## 1. Firebase (frontend)

Les identifiants Firebase sont chargés via des variables d'environnement.

1. Copiez `.env.example` en `.env` :
   ```bash
   cp .env.example .env
   ```

2. Récupérez la config dans la [console Firebase](https://console.firebase.google.com) :
   - Projet > Paramètres (engrenage) > Vos applications > Config

3. Remplissez `.env` avec vos valeurs réelles :
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=votre-projet-id
   VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

4. **Important** : `.env` est dans `.gitignore` — ne le commitez jamais.

Sans configuration valide, l'app tourne en **mode démo** (données locales, pas de Firebase).

---

## 2. Clé API Gemini (Cloud Functions)

La clé Gemini est utilisée uniquement côté serveur (Cloud Functions). Elle ne doit **jamais** apparaître dans le frontend.

### Configuration via Firebase Secret Manager

1. Installez Firebase CLI si besoin :
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. Définissez le secret :
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```
   Vous serez invité à saisir votre clé API Gemini. Elle sera stockée dans Google Secret Manager.

3. Déployez les Cloud Functions :
   ```bash
   cd functions
   npm install
   npm run build
   firebase deploy --only functions
   ```

### Obtenir une clé Gemini

1. Allez sur [aistudio.google.com](https://aistudio.google.com)
2. Cliquez sur "Get API key"
3. Créez une clé et copiez-la

---

## 3. Bases de données Firebase

Le projet utilise **Firestore** et **Storage** :

- **Firestore** : collections `interventions_en_attente`, `interventions_validees`, `grille_tarifaire`
- **Storage** : bucket pour les photos des interventions

Aucune config supplémentaire n'est nécessaire — tout est géré par le projet Firebase configuré dans `.env`.

---

---

## Checklist finale (à faire manuellement)

| Étape | Action |
|-------|--------|
| 1 | Créer l’utilisateur admin : Firebase Console → Authentication → Add user → `admin@joel.fr` / `admin123` |
| 2 | Se connecter à l’admin : `/admin/login` avec `admin@joel.fr` / `admin123` |
| 3 | Onglet **Grille tarifaire** → cliquer **« Remplir la grille (données par défaut) »** |
| 4 | Clé Gemini : `firebase functions:secrets:set GEMINI_API_KEY` |
| 5 | Déployer : `cd functions && npm run build && firebase deploy --only functions` |

---

## Résumé

| Élément | Où configurer | Jamais dans le code |
|---------|---------------|---------------------|
| Firebase (API key, project ID, etc.) | `.env` (frontend) | ✅ |
| Clé API Gemini | `firebase functions:secrets:set` | ✅ |
