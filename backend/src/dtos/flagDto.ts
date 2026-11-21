export interface FlagResponseDto {
  id: number;
  reviewId: number;
  reportedBy: number;
  reporterName?: string;
  reviewComment?: string | null;
  stallId?: number;
  stallName?: string;
  reason: string | null;
  status: string;
  createdAt: string | null;
}
