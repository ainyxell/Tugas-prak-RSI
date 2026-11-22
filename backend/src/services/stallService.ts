import {
  StallRepository,
  type FindAllParams,
} from '../repositories/stallRepository.ts';
import { MenuItemRepository } from '../repositories/menuItemRepository.ts';
import { AuditLogService } from './auditLogService.ts';
import type { MenuItemDto } from '../dtos/menuItemDto.ts';
import type { StallResponseDto } from '../dtos/stallDto.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import type { AuthUser } from './tokenService.ts';
import type { CreateStallInput, UpdateStallInput } from '../schemas/stallSchema.ts';

type StallRow = NonNullable<Awaited<ReturnType<StallRepository['findById']>>>;

export class StallService {
  private stallRepository: StallRepository;
  private menuItemRepository: MenuItemRepository;
  private auditLogService: AuditLogService;

  constructor(
    stallRepository: StallRepository = new StallRepository(),
    menuItemRepository: MenuItemRepository = new MenuItemRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.stallRepository = stallRepository;
    this.menuItemRepository = menuItemRepository;
    this.auditLogService = auditLogService;
  }

  private toDto(row: any): StallResponseDto {
    const avgRating = Number(row.avgRating);
    return {
      id: row.id,
      ownerId: row.ownerId,
      ownerName: row.ownerName ?? 'Pemilik',
      name: row.name,
      category: row.category,
      location: row.location,
      description: row.description,
      avgRating,
      reviewCount: row.reviewCount,
      isPopular: avgRating >= 4.7,
      createdAt: row.createdAt ? (row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt)) : null,
    };
  }

  async getAllStalls(params: FindAllParams) {
    const { rows, total } = await this.stallRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getStallById(id: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new NotFoundError('Warung tidak ditemukan');
    return this.toDto(row);
  }

  async getStallMenus(id: number): Promise<MenuItemDto[]> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new NotFoundError('Warung tidak ditemukan');
    return this.menuItemRepository.findByStallId(id);
  }

  async createStall(input: CreateStallInput, ownerId: number, actor?: AuthUser): Promise<StallResponseDto> {
    const row = await this.stallRepository.create({ ...input, ownerId });
    if (!row) throw new NotFoundError('Warung gagal dibuat');
    const created = await this.getStallById(row.id);

    try {
      await this.auditLogService.record({
        userId: actor?.id ?? ownerId,
        action: 'CREATE_STALL',
        targetTable: 'STALLS',
        targetId: row.id,
        metadata: { after: created },
      });
    } catch (error) {
      console.error('Audit CREATE_STALL error:', error);
    }

    return created;
  }

  async updateStall(
    id: number,
    input: UpdateStallInput,
    user: AuthUser,
  ): Promise<StallResponseDto> {
    const current = await this.stallRepository.findById(id);
    if (!current) throw new NotFoundError('Warung tidak ditemukan');

    if (user.role !== 'admin' && current.ownerId !== user.id) {
      throw new ForbiddenError('Kamu hanya bisa mengubah warung milikmu sendiri');
    }

    const row = await this.stallRepository.update(id, input);
    if (!row) throw new NotFoundError('Warung tidak ditemukan');
    const updated = await this.getStallById(id);

    try {
      await this.auditLogService.record({
        userId: user.id,
        action: 'UPDATE_STALL',
        targetTable: 'STALLS',
        targetId: id,
        metadata: { before: current, after: updated },
      });
    } catch (error) {
      console.error('Audit UPDATE_STALL error:', error);
    }

    return updated;
  }

  async deleteStall(id: number, actor?: AuthUser): Promise<StallResponseDto> {
    const existing = await this.getStallById(id);
    const row = await this.stallRepository.remove(id);
    if (!row) throw new NotFoundError('Warung tidak ditemukan');

    if (actor) {
      try {
        await this.auditLogService.record({
          userId: actor.id,
          action: 'DELETE_STALL',
          targetTable: 'STALLS',
          targetId: id,
          metadata: { before: existing },
        });
      } catch (error) {
        console.error('Audit DELETE_STALL error:', error);
      }
    }

    return existing;
  }
}
