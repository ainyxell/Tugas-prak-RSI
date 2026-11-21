import {
  AuditLogRepository,
  type CreateAuditLogInput,
} from '../repositories/auditLogRepository.ts';
import type { AuditLogResponseDto } from '../dtos/auditLogDto.ts';

export class AuditLogService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository = new AuditLogRepository(),
  ) {}

  private toDto(row: any): AuditLogResponseDto {
    return {
      id: row.id,
      userId: row.userId,
      userName: row.userName ?? 'Sistem',
      action: row.action,
      targetTable: row.targetTable,
      targetId: row.targetId,
      metadata: row.metadata,
      createdAt: row.createdAt
        ? row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : String(row.createdAt)
        : null,
    };
  }

  async getAllLogs(): Promise<AuditLogResponseDto[]> {
    const rows = await this.auditLogRepository.findAll();
    return rows.map((row) => this.toDto(row));
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

  async recordLogin(user: { id: number; role?: string }): Promise<void> {
    try {
      await this.record({
        userId: user.id,
        action: 'LOGIN',
        targetTable: 'USERS',
        targetId: user.id,
        metadata: { role: user.role },
      });
    } catch (error) {
      console.error('Audit LOGIN gagal dicatat:', error);
    }
  }
}
