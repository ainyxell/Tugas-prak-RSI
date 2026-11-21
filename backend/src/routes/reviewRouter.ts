import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.ts';
import { FlagController } from '../controllers/flagController.ts';
import { authenticate } from '../middlewares/auth.ts';

const reviewRouter = Router();
const reviewController = new ReviewController();
const flagController = new FlagController();

reviewRouter.get('/mine', authenticate, reviewController.getMyReviews);
reviewRouter.get('/manage', authenticate, reviewController.getManageReviews);
reviewRouter.get('/', reviewController.getByStall);
reviewRouter.post('/', authenticate, reviewController.createReview);
reviewRouter.put('/:id', authenticate, reviewController.updateReview);
reviewRouter.delete('/:id', authenticate, reviewController.deleteReview);

reviewRouter.post('/:id/like', authenticate, reviewController.likeReview);
reviewRouter.delete('/:id/like', authenticate, reviewController.unlikeReview);

reviewRouter.post('/:id/flags', authenticate, flagController.createFlag);

export { reviewRouter };
