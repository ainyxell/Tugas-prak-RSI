import type { Request, Response } from 'express';
import { AuditLogService } from '../services/auditLogService.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { AuditLogQuery } from '../schemas/auditLogSchema.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';

export class AuditLogController {
  constructor(private auditLogService: AuditLogService = new AuditLogService()) {}

  getLogs = async (req: Request, res: Response): Promise<void> => {
    const query = getValidated<AuditLogQuery>(res, 'query');
    const result = await this.auditLogService.getLogs(query);
    res.status(200).json({ status: 'success', data: result });
  };

  getAll = this.getLogs;

  getLogById = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      throw new NotFoundError('Catatan audit tidak ditemukan');
    }
    const log = await this.auditLogService.getLogById(id);
    res.status(200).json({ status: 'success', data: log });
  };

  createLog = async (req: Request, res: Response): Promise<void> => {
    const log = await this.auditLogService.createLog(req.body);
    res.status(201).json({ status: 'success', data: log });
  };
}
