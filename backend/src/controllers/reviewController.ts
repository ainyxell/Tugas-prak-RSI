import type { NextFunction, Request, Response } from 'express';
import { ReviewService } from '../services/reviewService.ts';
import { getUser } from '../middlewares/auth.ts';
import { verifyToken } from '../services/tokenService.ts';

export class ReviewController {
  private reviewService: ReviewService;

  constructor(reviewService: ReviewService = new ReviewService()) {
    this.reviewService = reviewService;
  }

  getByStall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stallId = Number(req.params.id || req.params.stallId || req.query.stallId);
      // Optional authentication check for likedByMe
      let currentUserId: number | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (payload) currentUserId = payload.id;
      }

      const reviews = await this.reviewService.getByStall(stallId, currentUserId);
      res.status(200).json({ status: 'success', data: reviews });
    } catch (error) {
      next(error);
    }
  };

  getMyReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getUser(req);
      const reviews = await this.reviewService.getMyReviews(user.id);
      res.status(200).json({ status: 'success', data: reviews });
    } catch (error) {
      next(error);
    }
  };

  getManageReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getUser(req);
      const reviews = await this.reviewService.getManageReviews(user.id, user.role);
      res.status(200).json({ status: 'success', data: reviews });
    } catch (error) {
      next(error);
    }
  };

  createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stallId = Number(req.params.id || req.params.stallId || req.body.stallId);
      const user = getUser(req);
      const data = await this.reviewService.createReview(stallId, user.id, req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  updateReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const user = getUser(req);
      const data = await this.reviewService.updateReview(id, user.id, user.role, req.body);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const user = getUser(req);
      await this.reviewService.deleteReview(id, user.id, user.role);
      res.status(200).json({ status: 'success', message: 'Review berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  };

  likeReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const user = getUser(req);
      const data = await this.reviewService.likeReview(id, user.id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  unlikeReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const user = getUser(req);
      const data = await this.reviewService.unlikeReview(id, user.id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };
}
