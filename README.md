![version](https://img.shields.io/badge/version-1.0.1-DC0A2D?style=flat-square) ![node](https://img.shields.io/badge/node-20-141418?style=flat-square) ![license](https://img.shields.io/badge/license-MIT-424242?style=flat-square) ![type](https://img.shields.io/badge/type-api-4CAF50?style=flat-square)

# TP Social Media

![Status](https://img.shields.io/badge/status-academic-blue)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Render](https://img.shields.io/badge/deploy-Render-46E3B7?logo=render&logoColor=white)

Backend REST d'une API reseau social. TP Efrei, stack Node.js + Express + MongoDB avec securite et validation.

## Stack

- Node.js 20 (ES modules)
- Express 4 + body-parser + compression
- MongoDB via Mongoose 7
- Securite · helmet + cors + express-rate-limit + express-validator
- dotenv pour la configuration
- Deploiement · Render (voir `render.yaml`)

## Structure

- `api/` · source de l'API Express
  - `index.mjs` · entry point
  - `src/` · routes, controllers, models, middlewares
  - `public/` · assets statiques
  - `docs/` · documentation API
- `render.yaml` · config deploiement Render (plan free)

## Lancement

```bash
git clone https://github.com/Adam-Blf/TP-Social-Media
cd TP-Social-Media/api
npm install
cp .env.example .env   # puis renseigner MONGO_URI
npm run dev            # lint + dev
npm run prod           # production
```

## Endpoints principaux

- `POST /auth/register` · creation compte
- `POST /auth/login` · authentification
- `GET /posts` · liste des posts
- `POST /posts` · creation post
- Validation via express-validator, rate-limiting actif

## Licence

MIT

---

<p align="center">
  <sub>Par <a href="https://adam.beloucif.com">Adam Beloucif</a> · Data Engineer & Fullstack Developer · <a href="https://github.com/Adam-Blf">GitHub</a> · <a href="https://www.linkedin.com/in/adambeloucif/">LinkedIn</a></sub>
</p>
