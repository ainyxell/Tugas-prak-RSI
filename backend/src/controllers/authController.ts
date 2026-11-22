import type { Request, Response } from 'express';
import { AuthService } from '../services/authService.ts';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService = new AuthService()) {
    this.authService = authService;
  }

  register = async (_req: Request, res: Response): Promise<void> => {
    const body = getValidated<RegisterInput>(res, 'body');
    const user = await this.authService.register(body);
    res.status(201).json({ status: 'success', data: { user } });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const body = getValidated<LoginInput>(res, 'body');
    const requestInfo = {ipAddress: req.ip || 'unknown',userAgent: req.get('user-agent') || 'unknown',};
    const data = await this.authService.login(body, requestInfo);
    res.status(200).json({ status: 'success', data });
  };

  getMe = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    res.status(200).json({ status: 'success', data: user });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);

    const requestInfo = {
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
    };

    await this.authService.logout(user, requestInfo);

    res.status(200).json({
      status: 'success',
      message: 'Logout berhasil',
    });
  };
}