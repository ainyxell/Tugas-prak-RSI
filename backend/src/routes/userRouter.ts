import { Router } from 'express';
import { UserController } from '../controllers/userController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const userRouter = Router();
const userController = new UserController();

userRouter.get('/', authenticate, authorize('admin'), userController.getUsers);
userRouter.post('/owner', authenticate, authorize('admin'), userController.createOwner);
userRouter.patch('/:id/role', authenticate, authorize('admin'), userController.updateRole);
userRouter.get('/:id', authenticate, userController.getUserById);
userRouter.post('/', userController.createUser);

export { userRouter };
