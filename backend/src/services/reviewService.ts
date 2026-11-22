import { ReviewRepository } from '../repositories/reviewRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import { AuditLogService } from './auditLogService.ts';
import type { ReviewResponseDto } from '../dtos/reviewDto.ts';
import { AppError } from '../errors/AppError.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import type { CreateReviewInput } from '../schemas/reviewSchema.ts';

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private stallRepository: StallRepository;
  private auditLogService: AuditLogService;

  constructor(
    reviewRepository: ReviewRepository = new ReviewRepository(),
    stallRepository: StallRepository = new StallRepository(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.reviewRepository = reviewRepository;
    this.stallRepository = stallRepository;
    this.auditLogService = auditLogService;
  }

  private toDto(row: any): ReviewResponseDto {
    return {
      id: row.id,
      stallId: row.stallId,
      stallName: row.stallName ?? 'Warung',
      userId: row.userId,
      userName: row.userName ?? 'Pengguna',
      rating: row.rating,
      comment: row.comment,
      likeCount: row.likeCount ?? 0,
      likedByMe: Boolean(row.likedByMe),
      createdAt: row.createdAt ? (row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt)) : null,
      updatedAt: row.updatedAt ? (row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)) : null,
    };
  }

  async getByStall(stallId: number, currentUserId?: number): Promise<ReviewResponseDto[]> {
    const rows = await this.reviewRepository.findByStallId(stallId, currentUserId);
    return rows.map((r) => this.toDto(r));
  }

  async getMyReviews(userId: number): Promise<ReviewResponseDto[]> {
    const rows = await this.reviewRepository.findByUserId(userId);
    return rows.map((r) => this.toDto(r));
  }

  async getManageReviews(userId: number, role: string): Promise<ReviewResponseDto[]> {
    const rows = await this.reviewRepository.findAllForManage(userId, role);
    return rows.map((r) => this.toDto(r));
  }

  async createReview(
    stallId: number,
    userId: number,
    input: CreateReviewInput,
  ): Promise<ReviewResponseDto> {
    const stall = await this.stallRepository.findById(stallId);
    if (!stall) throw new NotFoundError('Warung tidak ditemukan');

    const existing = await this.reviewRepository.findByStallAndUser(stallId, userId);
    if (existing) {
      throw new AppError(409, 'Kamu sudah pernah memberi review untuk warung ini');
    }

    const row = await this.reviewRepository.create({
      stallId,
      userId,
      rating: input.rating,
      comment: input.comment ?? null,
    });
    if (!row) throw new AppError(500, 'Review gagal disimpan');

    await this.reviewRepository.refreshStallSummary(stallId);

    const full = await this.reviewRepository.findById(row.id);
    const result = this.toDto(full ?? row);

    try {
      await this.auditLogService.record({
        userId,
        action: 'CREATE_REVIEW',
        targetTable: 'REVIEWS',
        targetId: row.id,
        metadata: { after: result },
      });
    } catch (error) {
      console.error('Audit CREATE_REVIEW error:', error);
    }

    return result;
  }

  async updateReview(
    id: number,
    userId: number,
    role: string,
    input: { rating?: number; comment?: string | null },
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundError('Review tidak ditemukan');

    if (role !== 'admin' && review.userId !== userId) {
      throw new ForbiddenError('Kamu hanya bisa mengubah review buatanmu sendiri');
    }

    const row = await this.reviewRepository.update(id, input.rating, input.comment);
    if (!row) throw new NotFoundError('Review tidak ditemukan');

    if (input.rating !== undefined) {
      await this.reviewRepository.refreshStallSummary(review.stallId);
    }

    const full = await this.reviewRepository.findById(id);
    const result = this.toDto(full ?? row);

    try {
      await this.auditLogService.record({
        userId,
        action: 'UPDATE_REVIEW',
        targetTable: 'REVIEWS',
        targetId: id,
        metadata: { before: review, after: result },
      });
    } catch (error) {
      console.error('Audit UPDATE_REVIEW error:', error);
    }

    return result;
  }

  async deleteReview(id: number, userId: number, role: string): Promise<void> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundError('Review tidak ditemukan');

    if (role !== 'admin' && review.userId !== userId) {
      throw new ForbiddenError('Kamu tidak memiliki akses untuk menghapus review ini');
    }

    await this.reviewRepository.delete(id);
    await this.reviewRepository.refreshStallSummary(review.stallId);

    try {
      await this.auditLogService.record({
        userId,
        action: 'DELETE_REVIEW',
        targetTable: 'REVIEWS',
        targetId: id,
        metadata: { before: review },
      });
    } catch (error) {
      console.error('Audit DELETE_REVIEW error:', error);
    }
  }

  async likeReview(reviewId: number, userId: number) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new NotFoundError('Review tidak ditemukan');
    return this.reviewRepository.toggleLike(reviewId, userId, true);
  }

  async unlikeReview(reviewId: number, userId: number) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new NotFoundError('Review tidak ditemukan');
    return this.reviewRepository.toggleLike(reviewId, userId, false);
  }
}
