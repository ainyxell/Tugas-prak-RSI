import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLogController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { validate } from '../middlewares/validate.ts';
import { auditLogQuerySchema } from '../schemas/auditLogSchema.ts';

const auditLogRouter = Router();
const auditLogController = new AuditLogController();

// Riwayat audit hanya untuk admin. Tidak ada endpoint ubah/hapus: audit
// bersifat append-only supaya jejaknya tidak bisa dimanipulasi dari aplikasi.
auditLogRouter.get(
  '/',
  authenticate,
  authorize('admin'),
  validate(auditLogQuerySchema, 'query'),
  auditLogController.getLogs,
);

auditLogRouter.get(
  '/:id',
  authenticate,
  authorize('admin'),
  auditLogController.getLogById,
);

auditLogRouter.post(
  '/',
  authenticate,
  authorize('admin'),
  auditLogController.createLog,
);

export { auditLogRouter };
