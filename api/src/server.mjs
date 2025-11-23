// Dependencies
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core
import config from './config.mjs';
import registerRoutes from './controllers/routes.mjs';
import buildModels from './models/index.mjs';

const Server = class Server {
  constructor() {
    this.app = express();
    this.config = config;
    this.models = null;
    this.hasSigintHandler = false;
  }

  async dbConnect(uri = this.config.mongodbUri) {
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
    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${res.statusCode}] ${req.method} ${req.originalUrl} - ${duration}ms`);
      });
      next();
    });

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimit.windowMinutes * 60 * 1000,
      max: this.config.rateLimit.max,
      message: { error: 'Too many requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // CORS configuration
    const corsOptions = this.config.corsAllowedOrigins.length > 0
      ? {
          origin: (origin, callback) => {
            if (!origin || this.config.corsAllowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          },
          credentials: true
        }
      : {}; // Allow all origins in development

    this.app.use(cors(corsOptions));
    this.app.use(compression());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
    
    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  routes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        environment: this.config.nodeEnv,
        timestamp: new Date().toISOString()
      });
    });

    // Routes principales
    registerRoutes(this.app, this.models);

    // Admin-protected collection creation endpoint
    if (this.config.adminApiToken) {
      this.app.post('/create-collection', async (req, res) => {
        const { name } = req.body;
        const token = req.headers['x-admin-token'];

        if (!token || token !== this.config.adminApiToken) {
          return res.status(403).json({ error: 'Forbidden: invalid or missing admin token' });
        }

        if (!name || typeof name !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(name)) {
          return res.status(400).json({ error: "Invalid collection name. Use alphanumeric characters, hyphens, and underscores only." });
        }

        try {
          await this.connect.db.createCollection(name);
          return res.status(201).json({ message: `Collection '${name}' created successfully.` });
        } catch (err) {
          return res.status(500).json({ error: err.message });
        }
      });
    }

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
      this.app.listen(this.config.port, () => {
        console.log(`[SERVER] Running in ${this.config.nodeEnv} mode on port ${this.config.port}`);
        console.log(`[SERVER] MongoDB: ${this.config.mongodbUri.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@')}`);
        console.log(`[SERVER] Admin endpoint: ${this.config.adminApiToken ? 'enabled' : 'disabled'}`);
      });
    } catch (err) {
      console.error(`[ERROR] Server -> ${err}`);
      process.exit(1);
    }
  }
};

export default Server;
