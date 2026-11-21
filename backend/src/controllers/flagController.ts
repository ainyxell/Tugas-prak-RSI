import type { NextFunction, Request, Response } from 'express';
import { FlagService } from '../services/flagService.ts';
import { getUser } from '../middlewares/auth.ts';

export class FlagController {
  constructor(private flagService: FlagService = new FlagService()) {}

  getFlags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as 'pending' | 'resolved' | 'dismissed' | undefined;
      const flags = await this.flagService.getAllFlags(status);
      res.status(200).json({ status: 'success', data: flags });
    } catch (error) {
      next(error);
    }
  };

  createFlag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewId = Number(req.params.id || req.params.reviewId || req.body.reviewId);
      const user = getUser(req);
      const flag = await this.flagService.createFlag({
        reviewId,
        reportedBy: user.id,
        reason: req.body.reason,
      });
      res.status(201).json({ status: 'success', data: flag });
    } catch (error) {
      next(error);
    }
  };

  updateFlagStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const flag = await this.flagService.updateFlagStatus(id, req.body.status);
      res.status(200).json({ status: 'success', data: flag });
    } catch (error) {
      next(error);
    }
  };
}
