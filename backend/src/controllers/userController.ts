import type { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/userService.ts';
import type { UserRole } from '../repositories/userRepository.ts';

export class UserController {
  constructor(private userService: UserService = new UserService()) {}

  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = req.query.role as UserRole | undefined;
      const search = req.query.search as string | undefined;
      const users = await this.userService.getAllUsers({ role, search });
      res.status(200).json({ status: 'success', data: users });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getUserById(Number(req.params.id));
      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  createOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.createOwner(req.body);
      res.status(201).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.updateUserRole(
        Number(req.params.id),
        req.body.role as UserRole,
      );
      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };
}
