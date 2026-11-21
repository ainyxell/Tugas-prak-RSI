import { Router } from 'express';
import { FlagController } from '../controllers/flagController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const flagRouter = Router();
const flagController = new FlagController();

flagRouter.get('/', authenticate, authorize('admin'), flagController.getFlags);
flagRouter.patch('/:id', authenticate, authorize('admin'), flagController.updateFlagStatus);
flagRouter.put('/:id', authenticate, authorize('admin'), flagController.updateFlagStatus);

export { flagRouter };
