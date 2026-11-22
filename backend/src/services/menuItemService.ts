import {
  MenuItemRepository,
  type CreateMenuItemInput,
} from '../repositories/menuItemRepository.ts';
import { AuditLogService } from './auditLogService.ts';
import type { MenuItemResponseDto } from '../dtos/menuItemDto.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';

export class MenuItemService {
  private menuItemRepository: MenuItemRepository;
  private auditLogService: AuditLogService;

  constructor(
    menuItemRepository: MenuItemRepository = new MenuItemRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.menuItemRepository = menuItemRepository;
    this.auditLogService = auditLogService;
  }

  private toDto(row: any): MenuItemResponseDto {
    return {
      id: row.id,
      stallId: row.stallId,
      name: row.name,
      price: row.price,
      isAvailable: Boolean(row.isAvailable),
      ...(row.stallName !== undefined ? { stallName: row.stallName } : {}),
    };
  }

  async getAllMenuItems(stallId?: number): Promise<MenuItemResponseDto[]> {
    const rows = await this.menuItemRepository.findAllWithStall(stallId);
    return rows.map((row) => this.toDto(row));
  }

  async getMenuItemById(id: number): Promise<MenuItemResponseDto> {
    const row = await this.menuItemRepository.findById(id);
    if (!row) throw new NotFoundError('Menu item tidak ditemukan');
    return this.toDto(row);
  }

  async createMenuItem(input: CreateMenuItemInput, userId?: number): Promise<MenuItemResponseDto> {
    const row = await this.menuItemRepository.create(input);
    if (!row) throw new NotFoundError('Menu item tidak ditemukan');
    const full = await this.menuItemRepository.findById(row.id);
    const result = this.toDto(full ?? row);

    if (userId) {
      try {
        await this.auditLogService.record({
          userId,
          action: 'CREATE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: row.id,
          metadata: { after: result },
        });
      } catch (error) {
        console.error('Audit CREATE_MENU error:', error);
      }
    }

    return result;
  }

  async updateMenuItem(
    id: number,
    input: Partial<CreateMenuItemInput>,
    userId?: number,
  ): Promise<MenuItemResponseDto> {
    const existing = await this.getMenuItemById(id);
    const row = await this.menuItemRepository.update(id, input);
    if (!row) throw new NotFoundError('Menu item tidak ditemukan');
    const full = await this.menuItemRepository.findById(id);
    const result = this.toDto(full ?? row);

    if (userId) {
      try {
        await this.auditLogService.record({
          userId,
          action: 'UPDATE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: id,
          metadata: { before: existing, after: result },
        });
      } catch (error) {
        console.error('Audit UPDATE_MENU error:', error);
      }
    }

    return result;
  }

  async deleteMenuItem(id: number, userId?: number): Promise<MenuItemResponseDto> {
    const existing = await this.getMenuItemById(id);
    const row = await this.menuItemRepository.remove(id);
    if (!row) throw new NotFoundError('Menu item tidak ditemukan');

    if (userId) {
      try {
        await this.auditLogService.record({
          userId,
          action: 'DELETE_MENU',
          targetTable: 'MENU_ITEMS',
          targetId: id,
          metadata: { before: existing },
        });
      } catch (error) {
        console.error('Audit DELETE_MENU error:', error);
      }
    }

    return existing;
  }
}
