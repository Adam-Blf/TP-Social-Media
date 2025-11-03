// Dependencies
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';

// Core
import config from './config.mjs';
import registerRoutes from './controllers/routes.mjs';
import buildModels from './models/index.mjs';

const Server = class Server {
  constructor() {
    this.app = express();
    this.config = config[process.argv[2]] || config.development;
    this.models = null;
    this.hasSigintHandler = false;
  }

  async dbConnect(uri = this.config.mongodb) {
    try {
      const connection = mongoose.createConnection(uri, {
        autoIndex: true
      });

      connection.on('error', (err) => {
        setTimeout(() => {
          console.log('[ERROR] api dbConnect() -> mongodb error');
          this.dbConnect(uri);
        }, 5000);

        console.error(`[ERROR] api dbConnect() -> ${err}`);
      });

      connection.on('disconnected', () => {
        setTimeout(() => {
          console.log('[DISCONNECTED] api dbConnect() -> mongodb disconnected');
          this.dbConnect(uri);
        }, 5000);
      });

      if (!this.hasSigintHandler) {
        process.on('SIGINT', () => {
          if (this.connect) {
            this.connect.close((error) => {
              if (error) {
                console.error('[ERROR] api dbConnect() close() -> mongodb error', error);
              } else {
                console.log('[CLOSE] api dbConnect() -> mongodb closed');
              }
            });
          }
          console.log('[API END PROCESS] api dbConnect() -> close mongodb connection');
          process.exit(0);
        });
        this.hasSigintHandler = true;
      }

      await connection.asPromise();

      this.connect = connection;
      this.models = buildModels(this.connect);
    } catch (err) {
      console.error(`[ERROR] api dbConnect() -> ${err}`);
    }
  }

  middleware() {
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${res.statusCode}] ${req.method} ${req.originalUrl} - ${duration}ms`);
      });
      next();
    });
    this.app.use(compression());
    this.app.use(cors());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
  }

  routes() {
    // Routes principales
    registerRoutes(this.app, this.models);

    // ➕ Route spéciale pour créer une collection depuis Postman
    this.app.post('/create-collection', async (req, res) => {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Le champ 'name' est requis." });
      }

      try {
        await this.connect.db.createCollection(name);
        return res.status(201).json({ message: `✅ Collection '${name}' créée avec succès dans MongoDB.` });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });

    // Gestion des routes inexistantes
    this.app.use((req, res) => {
      res.status(404).json({
        code: 404,
        message: 'Not Found'
      });
    });

    // Gestion des erreurs générales
    // eslint-disable-next-line no-unused-vars
    this.app.use((err, req, res, next) => {
      console.error('[ERROR] Unhandled application error', err);
      res.status(500).json({
        code: 500,
        message: 'Internal Server Error'
      });
    });
  }

  security() {
    this.app.use(helmet());
    this.app.disable('x-powered-by');
  }

  async run() {
    try {
      await this.dbConnect();
      if (!this.models) {
        throw new Error('Failed to initialize database models.');
      }
      this.security();
      this.middleware();
      this.routes();
      this.app.listen(this.config.port);
    } catch (err) {
      console.error(`[ERROR] Server -> ${err}`);
    }
  }
};

export default Server;
