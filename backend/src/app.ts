import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { rootRouter } from './routes';
import { errorHandler } from './middlewares/errorHandler';

export function createApp(): Application {
  const app = express();

  // Global Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', rootRouter);

  // Serve static assets in production if frontend build exists
  const candidatePaths = [
    path.resolve(__dirname, '../../frontend/dist'),
    path.resolve(__dirname, '../frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
  ];

  const frontendDistPath = candidatePaths.find(p => fs.existsSync(p));

  if (frontendDistPath) {
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }

  // Centralized Error Handler Middleware (must be after routes)
  app.use(errorHandler);

  return app;
}
