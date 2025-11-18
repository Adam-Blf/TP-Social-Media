# API Social Media / Social Media API

[🇫🇷 Version Française](#version-française) | [🇬🇧 English Version](#english-version)

---

## <a name="version-française"></a>🇫🇷 Version Française

### Aperçu

Cette API REST propulse un réseau social évènementiel inspiré des besoins de Facebook. Elle gère les utilisateurs, les groupes, les événements ainsi que les fonctionnalités annexes : fils de discussion, albums photo, sondages, billetterie, liste de courses et covoiturage.

L'ensemble des routes échange des payloads JSON et s'exécute sur Express + Mongoose. La base de données attendue est MongoDB Atlas.

Une documentation détaillée de chaque endpoint est disponible dans [`docs/api.md`](docs/api.md).

### 🛠️ Stack Technologique

| Composant | Technologie | Objectif |
|-----------|-------------|----------|
| **Framework** | Express.js 4.19+ | Serveur REST API |
| **Base de données** | MongoDB + Mongoose 8.4+ | Stockage NoSQL et ODM |
| **Sécurité** | helmet, express-rate-limit, CORS | Protection headers, limitation débit, origines |
| **Variables d'env** | dotenv 16.4+ | Gestion configuration sensible |
| **Qualité Code** | ESLint (Airbnb) | Règles de style JavaScript |
| **Langage** | Node.js 18+ (ES modules) | Runtime JavaScript |

### Démarrage Rapide

#### Prérequis
- Node.js 18+
- npm 9+
- Accès à un cluster MongoDB (Atlas ou local)

#### Configuration

1. Copiez `.env.example` vers `.env` :
   ```bash
   cp .env.example .env
   ```

2. Éditez `.env` avec vos valeurs :
   ```env
   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/social-media
   ADMIN_API_TOKEN=votre-token-securise-ici
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   PORT=3000
   NODE_ENV=development
   ```

#### Installation des Dépendances

```bash
npm install
```

#### Lancement en Développement

```bash
npm run dev
```

Le script exécute ESLint puis démarre le serveur sur le port configuré (3000 par défaut).

#### Lancement en Production

```bash
npm run prod
```

### Architecture

- `index.mjs` : point d'entrée qui instancie le serveur
- `src/server.mjs` : initialisation d'Express, connexion MongoDB, sécurité, middlewares et routing
- `src/config.mjs` : gestion des variables d'environnement avec validation
- `src/models/` : schémas Mongoose (utilisateurs, groupes, événements, billets, votes, etc.)
- `src/controllers/` : routeurs Express, chacun spécialisé sur un domaine métier
- `src/utils/` : helpers communs (gestion des erreurs, validation, etc.)

### 🔒 Sécurité

#### Implémentée

- **Rate Limiting** : 100 requêtes/15 min par IP (configurable via `RATE_LIMIT_MAX` et `RATE_LIMIT_WINDOW_MS`)
- **CORS Restreint** : origines autorisées uniquement (liste blanche dans `ALLOWED_ORIGINS`)
- **Token Admin** : endpoint `/create-collection` protégé par `ADMIN_API_TOKEN` (header `x-admin-token`)
- **Helmet** : headers de sécurité HTTP automatiques
- **Validation Environnement** : variables critiques vérifiées au démarrage

#### Bonnes Pratiques

- **Ne jamais commiter `.env`** : ajoutez-le à `.gitignore`
- **Utiliser des tokens forts** : générez `ADMIN_API_TOKEN` avec au moins 32 caractères aléatoires
- **HTTPS en production** : utilisez un reverse proxy (Nginx, Caddy) ou un service cloud avec SSL/TLS
- **Limitez les origines CORS** : ne mettez que les domaines de confiance dans `ALLOWED_ORIGINS`

### Qualité & Scripts

- `npm run lint` : s'assure que le code respecte les règles ESLint (Airbnb base)
- `npm run dev` : lint + démarrage du serveur en environnement de développement
- `npm run prod` : démarrage en mode production

> ℹ️ Sous Windows avec WSL, exécuter les commandes depuis une invite WSL (`/home/...`) évite les erreurs liées aux chemins UNC.

### Tests avec Postman

- Importer la collection `docs/mysocial-local.postman_collection.json` dans Postman
- Mettre à jour les identifiants (`ObjectId`) au fur et à mesure des créations (utiliser l'onglet *Tests* pour automatiser le stockage si besoin)
- Tous les endpoints sont listés dans [`docs/api.md`](docs/api.md) avec les payloads attendus

### Documentation API

Consultez [`docs/api.md`](docs/api.md) pour la description exhaustive : paramètres, validations et exemples de réponse pour chaque ressource.

---

## <a name="english-version"></a>🇬🇧 English Version

### Overview

This REST API powers an event-focused social network inspired by Facebook's needs. It manages users, groups, events, and additional features: discussion threads, photo albums, polls, ticketing, shopping lists, and carpooling.

All routes exchange JSON payloads and run on Express + Mongoose. The expected database is MongoDB Atlas.

Detailed documentation for each endpoint is available in [`docs/api.md`](docs/api.md).

### 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Express.js 4.19+ | REST API server |
| **Database** | MongoDB + Mongoose 8.4+ | NoSQL storage and ODM |
| **Security** | helmet, express-rate-limit, CORS | Header protection, rate limiting, origin control |
| **Environment** | dotenv 16.4+ | Sensitive configuration management |
| **Code Quality** | ESLint (Airbnb) | JavaScript style rules |
| **Language** | Node.js 18+ (ES modules) | JavaScript runtime |

### Quick Start

#### Prerequisites
- Node.js 18+
- npm 9+
- Access to a MongoDB cluster (Atlas or local)

#### Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/social-media
   ADMIN_API_TOKEN=your-secure-token-here
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   PORT=3000
   NODE_ENV=development
   ```

#### Install Dependencies

```bash
npm install
```

#### Launch in Development

```bash
npm run dev
```

The script runs ESLint then starts the server on the configured port (default 3000).

#### Launch in Production

```bash
npm run prod
```

### Architecture

- `index.mjs`: entry point that instantiates the server
- `src/server.mjs`: Express initialization, MongoDB connection, security, middlewares, and routing
- `src/config.mjs`: environment variable management with validation
- `src/models/`: Mongoose schemas (users, groups, events, tickets, votes, etc.)
- `src/controllers/`: Express routers, each specialized in a business domain
- `src/utils/`: common helpers (error handling, validation, etc.)

### 🔒 Security

#### Implemented

- **Rate Limiting**: 100 requests/15 min per IP (configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`)
- **Restricted CORS**: only authorized origins (whitelist in `ALLOWED_ORIGINS`)
- **Admin Token**: `/create-collection` endpoint protected by `ADMIN_API_TOKEN` (header `x-admin-token`)
- **Helmet**: automatic HTTP security headers
- **Environment Validation**: critical variables checked at startup

#### Best Practices

- **Never commit `.env`**: add it to `.gitignore`
- **Use strong tokens**: generate `ADMIN_API_TOKEN` with at least 32 random characters
- **HTTPS in production**: use a reverse proxy (Nginx, Caddy) or cloud service with SSL/TLS
- **Limit CORS origins**: only put trusted domains in `ALLOWED_ORIGINS`

### Quality & Scripts

- `npm run lint`: ensures code complies with ESLint rules (Airbnb base)
- `npm run dev`: lint + server startup in development environment
- `npm run prod`: production mode startup

> ℹ️ On Windows with WSL, run commands from a WSL prompt (`/home/...`) to avoid UNC path errors.

### Testing with Postman

- Import collection `docs/mysocial-local.postman_collection.json` into Postman
- Update identifiers (`ObjectId`) as you create resources (use *Tests* tab to automate storage if needed)
- All endpoints are listed in [`docs/api.md`](docs/api.md) with expected payloads

### API Documentation

Refer to [`docs/api.md`](docs/api.md) for exhaustive description: parameters, validations, and response examples for each resource.

### 📄 License

This project is open source. See LICENSE file for details.

---

**Built for event-driven social networking**

For issues or feature requests, open an issue on the project repository.
