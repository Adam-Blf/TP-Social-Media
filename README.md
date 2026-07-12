![version](https://img.shields.io/badge/version-1.0.1-DC0A2D?style=flat-square) ![node](https://img.shields.io/badge/node-20-141418?style=flat-square) ![license](https://img.shields.io/badge/license-MIT-424242?style=flat-square) ![type](https://img.shields.io/badge/type-api-4CAF50?style=flat-square)

# TP Social Media

<!-- adam-badges:start -->
[![commits](https://img.shields.io/github/commit-activity/t/Adam-Blf/TP-Social-Media?color=001329&label=commits&style=flat-square)](https://github.com/Adam-Blf/TP-Social-Media/commits) [![visites](https://hits.sh/github.com/Adam-Blf/TP-Social-Media.svg?style=flat-square&label=visites&color=001329)](https://hits.sh/github.com/Adam-Blf/TP-Social-Media/) [![last commit](https://img.shields.io/github/last-commit/Adam-Blf/TP-Social-Media?color=D4A437&style=flat-square&label=dernier%20push)](https://github.com/Adam-Blf/TP-Social-Media/commits) [![top language](https://img.shields.io/github/languages/top/Adam-Blf/TP-Social-Media?style=flat-square)](https://github.com/Adam-Blf/TP-Social-Media) [![license](https://img.shields.io/github/license/Adam-Blf/TP-Social-Media?style=flat-square&color=D4A437)](LICENSE)
<!-- adam-badges:end -->


![Status](https://img.shields.io/badge/status-academic-blue)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Render](https://img.shields.io/badge/deploy-Render-46E3B7?logo=render&logoColor=white)

Backend REST d'une API reseau social. TP Efrei, stack Node.js + Express + MongoDB avec securite et validation.

## Architecture

```mermaid
flowchart TB
    CLIENT["Client HTTP<br/>fetch - Postman"]
    ENTRY["index.mjs<br/>entry point - bootstrap"]
    SERVER["server.mjs<br/>Express - helmet - cors - rate-limit"]
    ROUTES["routes.mjs<br/>enregistrement des routes"]
    CTRL["controllers/<br/>users - groups - events - albums - polls"]
    VALID["validators.mjs<br/>express-validator"]
    MODELS["models/<br/>Mongoose - user - event - poll - ticket"]
    MONGO["MongoDB<br/>via Mongoose 7"]

    CLIENT --> ENTRY
    ENTRY --> SERVER
    SERVER --> ROUTES
    ROUTES --> CTRL
    CTRL --> VALID
    CTRL --> MODELS
    MODELS --> MONGO
```

## Stack

- Node.js 20 (ES modules)
- Express 4 + body-parser + compression
- MongoDB via Mongoose 7
- Securite - helmet + cors + express-rate-limit + express-validator
- dotenv pour la configuration
- Deploiement - Render (voir `render.yaml`)

## Structure

- `api/` - source de l'API Express
  - `index.mjs` - entry point
  - `src/` - routes, controllers, models, middlewares
  - `public/` - assets statiques
  - `docs/` - documentation API
- `render.yaml` - config deploiement Render (plan free)

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

- `POST /auth/register` - creation compte
- `POST /auth/login` - authentification
- `GET /posts` - liste des posts
- `POST /posts` - creation post
- Validation via express-validator, rate-limiting actif

## Licence

MIT

---

<p align="center">
  <sub>Par <a href="https://adam.beloucif.com">Adam Beloucif</a> - Data Engineer & Fullstack Developer - <a href="https://github.com/Adam-Blf">GitHub</a> - <a href="https://www.linkedin.com/in/adambeloucif/">LinkedIn</a></sub>
</p>


## Star History

<a href="https://www.star-history.com/?repos=Adam-Blf%2FTP-Social-Media&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=Adam-Blf/TP-Social-Media&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=Adam-Blf/TP-Social-Media&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=Adam-Blf/TP-Social-Media&type=date&legend=top-left" />
 </picture>
</a>
