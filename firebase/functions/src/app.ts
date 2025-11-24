// functions/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import api from './routes';

const app = express();

// ---- CORS ----
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
const allowList = (process.env.CORS_ALLOW_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const origins = new Set([...DEFAULT_ORIGINS, ...allowList]);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // 모바일 앱/서버 간통신 등
    if (origins.has(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: false,
}));

// ---- Security / Perf ----
app.use(helmet({
  contentSecurityPolicy: false, // 페이지는 호스팅에서 CSP 설정 권장
}));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// ---- Health ----
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// ---- API ----
// 최종 URL = https://...cloudfunctions.net/app/api/...
app.use('/api', api);

// ---- 404 ----
app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

export default app;
