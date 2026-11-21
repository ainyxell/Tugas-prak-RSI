import { FlagRepository } from '../repositories/flagRepository.ts';
import type { FlagResponseDto } from '../dtos/flagDto.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';

export class FlagService {
  constructor(private flagRepository: FlagRepository = new FlagRepository()) {}

  private toDto(row: any): FlagResponseDto {
    return {
      id: row.id,
      reviewId: row.reviewId,
      reportedBy: row.reportedBy,
      reporterName: row.reporterName ?? 'Pelapor',
      reviewComment: row.reviewComment ?? null,
      stallId: row.stallId ?? 0,
      stallName: row.stallName ?? 'Warung',
      reason: row.reason,
      status: row.status,
      createdAt: row.createdAt ? (row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt)) : null,
    };
  }

  async getAllFlags(status?: 'pending' | 'resolved' | 'dismissed'): Promise<FlagResponseDto[]> {
    const rows = await this.flagRepository.findAll(status);
    return rows.map((row) => this.toDto(row));
  }

  async createFlag(input: { reviewId: number; reportedBy: number; reason?: string | null }): Promise<FlagResponseDto> {
    const row = await this.flagRepository.create(input);
    const full = await this.flagRepository.findById(row.id);
    return this.toDto(full ?? row);
  }

  async updateFlagStatus(id: number, status: 'pending' | 'resolved' | 'dismissed'): Promise<FlagResponseDto> {
    const row = await this.flagRepository.updateStatus(id, status);
    if (!row) throw new NotFoundError('Flag tidak ditemukan');
    const full = await this.flagRepository.findById(id);
    return this.toDto(full ?? row);
  }
}
