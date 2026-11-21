export interface AuditLogResponseDto {
  id: number;
  userId: number;
  userName?: string;
  action: string;
  targetTable: string;
  targetId: number;
  metadata: string | null;
  createdAt: string | null;
}
