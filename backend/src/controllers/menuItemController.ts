import type { NextFunction, Request, Response } from 'express';
import { MenuItemService } from '../services/menuItemService.ts';

export class MenuItemController {
  constructor(private menuItemService: MenuItemService = new MenuItemService()) {}

  getMenuItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stallId = req.query.stallId ? Number(req.query.stallId) : undefined;
      const items = await this.menuItemService.getAllMenuItems(stallId);
      res.status(200).json({ status: 'success', data: items });
    } catch (error) {
      next(error);
    }
  };

  getMenuItemById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await this.menuItemService.getMenuItemById(Number(req.params.id));
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  createMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await this.menuItemService.createMenuItem(req.body);
      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  updateMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await this.menuItemService.updateMenuItem(Number(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  deleteMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await this.menuItemService.deleteMenuItem(Number(req.params.id));
      res.status(200).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };
}
