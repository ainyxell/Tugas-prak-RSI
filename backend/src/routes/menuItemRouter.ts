import { Router } from 'express';
import { MenuItemController } from '../controllers/menuItemController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const menuItemRouter = Router();
const menuItemController = new MenuItemController();

menuItemRouter.get('/', menuItemController.getMenuItems);
menuItemRouter.get('/:id', menuItemController.getMenuItemById);
menuItemRouter.post('/', authenticate, authorize('owner', 'admin'), menuItemController.createMenuItem);
menuItemRouter.put('/:id', authenticate, authorize('owner', 'admin'), menuItemController.updateMenuItem);
menuItemRouter.delete('/:id', authenticate, authorize('owner', 'admin'), menuItemController.deleteMenuItem);

export { menuItemRouter };
