# API Social Media

## Aperçu
Cette API REST propulse un réseau social évènementiel inspiré des besoins de Facebook. Elle gère les utilisateurs, les groupes, les événements ainsi que les fonctionnalités annexes : fils de discussion, albums photo, sondages, billetterie, liste de courses et covoiturage.

L’ensemble des routes échange des payloads JSON et s’exécute sur Express + Mongoose. La base de données attendue est MongoDB Atlas (voir `src/config.mjs`).

Une documentation détaillée de chaque endpoint est disponible dans [`docs/api.md`](docs/api.md).

## Démarrage rapide

1. **Prérequis**
   - Node.js 18+
   - npm 9+
   - Accès à un cluster MongoDB

2. **Configuration**
   - Mettre à jour `src/config.mjs` avec vos chaînes de connexion MongoDB et le port souhaité.

3. **Installation des dépendances**
   ```bash
   npm install
   ```

4. **Lancement en développement**
   ```bash
   npm run dev
   ```
   Le script exécute ESLint puis démarre le serveur sur le port configuré (3000 par défaut).

5. **Lancement en production**
   ```bash
   npm run prod
   ```

## Architecture

- `index.mjs` : point d’entrée qui instancie le serveur.
- `src/server.mjs` : initialisation d’Express, connexion MongoDB, sécurité, middlewares et routing.
- `src/models` : schémas Mongoose (utilisateurs, groupes, événements, billets, votes, etc.).
- `src/controllers` : routeurs Express, chacun spécialisé sur un domaine métier.
- `src/utils` : helpers communs (gestion des erreurs, validation, etc.).

## Qualité & scripts

- `npm run lint` : s’assure que le code respecte les règles ESLint (Airbnb base).
- `npm run dev` : lint + démarrage du serveur en environnement de développement.
- `npm run prod` : démarrage en mode production.

> ℹ️ Sous Windows avec WSL, exécuter les commandes depuis une invite WSL (`/home/...`) évite les erreurs liées aux chemins UNC.

### Tests avec Postman

- Importer l’environnement `docs/postman-environment.json` dans Postman pour disposer des variables (`baseUrl`, `userAdminId`, `eventId`, etc.).
- Mettre à jour les identifiants (`ObjectId`) au fur et à mesure des créations (utiliser l’onglet *Tests* pour automatiser le stockage si besoin).
- Tous les endpoints sont listés dans [`docs/api.md`](docs/api.md) avec les payloads attendus.

## Documentation API

Consultez [`docs/api.md`](docs/api.md) pour la description exhaustive : paramètres, validations et exemples de réponse pour chaque ressource.
