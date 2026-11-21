import express, { type Application } from 'express';
import { sql } from 'drizzle-orm';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import { getDb } from './db/index.ts';
import { authRouter } from './routes/authRouter.ts';
import { stallRouter } from './routes/stallRouter.ts';
import { userRouter } from './routes/userRouter.ts';
import { profileRouter } from './routes/profileRouter.ts';
import { menuItemRouter } from './routes/menuItemRouter.ts';
import { reviewRouter } from './routes/reviewRouter.ts';
import { flagRouter } from './routes/flagRouter.ts';
import { auditLogRouter } from './routes/auditLogRouter.ts';
import { notFoundHandler } from './middlewares/notFound.ts';
import { errorHandler } from './middlewares/errorHandler.ts';
import { openApiDocument } from './docs/openapi.ts';

const app: Application = express();
const PORT: number = 3000;

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (seperti curl/Postman) atau dari localhost manapun
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get('/docs/swagger.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.get('/health', async (_req, res) => {
  const db = await getDb();
  await db.execute(sql`SELECT 1 AS ok`);
  res.status(200).json({ status: 'success', message: 'Server dan database terhubung' });
});

// Helper untuk mendaftarkan router di root (/...), /api/..., dan /api/v1/...
function registerRoute(path: string, router: express.Router) {
  app.use(path, router);
  app.use(`/api${path}`, router);
  app.use(`/api/v1${path}`, router);
}

registerRoute('/auth', authRouter);
registerRoute('/users', userRouter);
registerRoute('/profile', profileRouter);
registerRoute('/stalls', stallRouter);
registerRoute('/menu', menuItemRouter);
registerRoute('/reviews', reviewRouter);
registerRoute('/flags', flagRouter);
registerRoute('/audit-logs', auditLogRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
