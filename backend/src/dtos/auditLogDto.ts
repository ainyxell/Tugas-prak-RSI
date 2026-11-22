export interface AuditLogItemDto {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  action: string;
  targetTable: string;
  targetId: number;
  metadata: unknown;
  createdAt: string;
}

export type AuditLogResponseDto = AuditLogItemDto;

export interface AuditLogPaginationDto {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuditLogListResponseDto {
  items: AuditLogItemDto[];
  pagination: AuditLogPaginationDto;
}
