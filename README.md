# Moud 🫧

> Your daily mood tracker. Simple, personal, no account needed.

## Stack

| Layer | Tool |
|-------|------|
| Frontend | HTML/CSS/JS vanilla — GitHub Pages |
| Functions | Vercel (Node.js Edge) |
| Storage | `data.json` dans ce repo (GitHub API) |
| Email | Resend |
| Cron | GitHub Actions |

---

## Setup (étape par étape)

### 1. Créer le repo GitHub

```bash
git clone https://github.com/TON_USERNAME/moud.git
cd moud
```

### 2. Activer GitHub Pages

Settings → Pages → Source : **Deploy from branch** → `main` → `/ (root)`

### 3. Créer un GitHub Personal Access Token (PAT)

Settings → Developer settings → Personal access tokens → Fine-grained tokens

Permissions nécessaires :
- **Contents** : Read and write (pour modifier data.json)

Copie le token → tu en auras besoin dans les étapes suivantes.

### 4. Déployer sur Vercel

```bash
npx vercel
```

Ou importer le repo depuis vercel.com → Import Project.

### 5. Variables d'environnement Vercel

Dans le dashboard Vercel → Settings → Environment Variables :

| Variable | Valeur |
|----------|--------|
| `GITHUB_TOKEN` | Le PAT créé à l'étape 3 |
| `GITHUB_OWNER` | Ton username GitHub |
| `GITHUB_REPO` | `moud` |
| `GITHUB_BRANCH` | `main` |
| `RESEND_API_KEY` | Ta clé API Resend |
| `TO_EMAIL` | Ton adresse email |
| `FROM_EMAIL` | `moud@tondomaine.com` (domaine vérifié dans Resend) |
| `APP_URL` | `https://TON_USERNAME.github.io/moud` |
| `API_URL` | `https://moud.vercel.app` (URL Vercel) |
| `API_SECRET` | Un secret random (ex: `openssl rand -hex 16`) |
| `CRON_SECRET` | Un autre secret random |

### 6. Secrets GitHub Actions

Settings → Secrets and variables → Actions → New repository secret :

| Secret | Valeur |
|--------|--------|
| `API_URL` | URL de ton déploiement Vercel |
| `CRON_SECRET` | Même valeur que dans Vercel |

### 7. Mettre à jour l'URL de l'API dans app.js

Dans `app.js`, remplace les appels `/api/...` par l'URL Vercel complète :

```js
// Cherche les lignes avec fetch('/api/...')
// Remplace par :
await fetch('https://moud.vercel.app/api/log-mood', { ... })
```

### 8. Importer ton historique Daylio

1. Ouvre l'app → onglet Stats → "Import Daylio CSV"
2. Sélectionne ton export Daylio

---

## Tester l'email manuellement

Dans GitHub → Actions → "Send Daily Mood Email" → "Run workflow"

---

## Timezone de l'email

Par défaut : 21h heure de Paris (20:00 UTC en hiver).

Pour l'heure d'été (UTC+2), change dans `.github/workflows/send-email.yml` :
```yaml
- cron: '0 19 * * *'   # 21h en été
```

---

## Format data.json

```json
{
  "moods": [
    { "date": "2026-02-17", "mood": 4, "label": "good" }
  ]
}
```
