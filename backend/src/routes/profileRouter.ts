import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate, getUser } from '../middlewares/auth.ts';
import { UserService } from '../services/userService.ts';

const profileRouter = Router();
const userService = new UserService();

profileRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getUser(req);
      const profile = await userService.getUserById(user.id);
      res.status(200).json({ status: 'success', data: profile });
    } catch (error) {
      next(error);
    }
  },
);

profileRouter.put(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getUser(req);
      const profile = await userService.updateProfile(user.id, req.body);
      res.status(200).json({ status: 'success', data: profile });
    } catch (error) {
      next(error);
    }
  },
);

profileRouter.patch(
  '/password',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getUser(req);
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(user.id, currentPassword, newPassword);
      res.status(200).json({
        status: 'success',
        message: 'Password berhasil diubah',
      });
    } catch (error) {
      next(error);
    }
  },
);

export { profileRouter };

