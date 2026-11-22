import {
  AuditLogRepository,
  type CreateAuditLogInput,
} from '../repositories/auditLogRepository.ts';
import type {
  AuditLogItemDto,
  AuditLogListResponseDto,
  AuditLogResponseDto,
} from '../dtos/auditLogDto.ts';
import type { AuditLogQuery } from '../schemas/auditLogSchema.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';

export class AuditLogService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository = new AuditLogRepository(),
  ) {}

  private toDto(row: any): AuditLogItemDto {
    let parsedMetadata = row.metadata;
    if (typeof row.metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(row.metadata);
      } catch {
        parsedMetadata = row.metadata;
      }
    }

    return {
      id: row.id,
      userId: row.userId,
      userName: row.userName ?? null,
      userEmail: row.userEmail ?? null,
      action: row.action,
      targetTable: row.targetTable,
      targetId: row.targetId,
      metadata: parsedMetadata,
      createdAt: row.createdAt
        ? row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : String(row.createdAt)
        : new Date().toISOString(),
    };
  }

  async getAllLogs(): Promise<AuditLogResponseDto[]> {
    const rows = await this.auditLogRepository.findAll();
    return rows.map((row) => this.toDto(row));
  }

  async getLogs(query: AuditLogQuery): Promise<AuditLogListResponseDto> {
    const { items, total } = await this.auditLogRepository.findPage(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);
    return {
      items: items.map((item: any) => this.toDto(item)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
      },
    };
  }

  async getLogById(id: number): Promise<AuditLogItemDto> {
    const row = await this.auditLogRepository.findById(id);
    if (!row) {
      throw new NotFoundError('Catatan audit tidak ditemukan');
    }
    return this.toDto(row);
  }

  async createLog(input: CreateAuditLogInput): Promise<AuditLogResponseDto> {
    const row = await this.auditLogRepository.create(input);
    if (!row) throw new Error('AUDIT_LOG_NOT_FOUND');
    return this.toDto(row);
  }

  async record(entry: {
    userId: number;
    action: string;
    targetTable: string;
    targetId: number;
    metadata?: unknown;
  }): Promise<void> {
    await this.createLog({
      userId: entry.userId,
      action: entry.action,
      targetTable: entry.targetTable,
      targetId: entry.targetId,
      metadata:
        entry.metadata !== undefined && entry.metadata !== null
          ? typeof entry.metadata === 'string'
            ? entry.metadata
            : JSON.stringify(entry.metadata)
          : null,
    });
  }

  async recordLogin(
    user: { id: number; role?: string },
    requestInfo?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    try {
      await this.record({
        userId: user.id,
        action: 'LOGIN',
        targetTable: 'USERS',
        targetId: user.id,
        metadata: {
          role: user.role,
          ip_address: requestInfo?.ipAddress || 'unknown',
          user_agent: requestInfo?.userAgent || 'unknown',
          result: 'success',
        },
      });
    } catch (error) {
      console.error('Audit LOGIN gagal dicatat:', error);
    }
  }

  async recordLogout(
    user: { id: number; role?: string },
    requestInfo?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    try {
      await this.record({
        userId: user.id,
        action: 'LOGOUT',
        targetTable: 'USERS',
        targetId: user.id,
        metadata: {
          role: user.role,
          ip_address: requestInfo?.ipAddress || 'unknown',
          user_agent: requestInfo?.userAgent || 'unknown',
          result: 'success',
        },
      });
    } catch (error) {
      console.error('Audit LOGOUT gagal dicatat:', error);
    }
  }
}
