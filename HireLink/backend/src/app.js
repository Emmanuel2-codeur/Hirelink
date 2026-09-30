import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env, supabaseConfigured } from './config/env.js';
import routes from './routes/index.js';
import { openapi } from './openapi.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

export const app = express();
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
if (env.nodeEnv !== 'test') app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', service: 'hirelink-api', supabase: supabaseConfigured, ai: Boolean(env.geminiKey || env.openaiKey), time: new Date().toISOString() }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);
