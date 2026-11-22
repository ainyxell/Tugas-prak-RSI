import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { auditLogs, users } from '../db/schema.ts';
import type { AuditLogQuery } from '../schemas/auditLogSchema.ts';

export interface CreateAuditLogInput {
  userId: number;
  action: string;
  targetTable: string;
  targetId: number;
  metadata?: string | null;
}

export class AuditLogRepository {
  async findAll() {
    const db = await getDb();
    return db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: users.name,
        userEmail: users.email,
        action: auditLogs.action,
        targetTable: auditLogs.targetTable,
        targetId: auditLogs.targetId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id));
  }

  async findPage(query: AuditLogQuery) {
    const db = await getDb();
    const conditions = [];

    if (query.action) {
      conditions.push(eq(auditLogs.action, query.action));
    }
    if (query.targetTable) {
      conditions.push(eq(auditLogs.targetTable, query.targetTable));
    }
    if (query.targetId !== undefined) {
      conditions.push(eq(auditLogs.targetId, query.targetId));
    }
    if (query.userId !== undefined) {
      conditions.push(eq(auditLogs.userId, query.userId));
    }
    if (query.from) {
      conditions.push(gte(auditLogs.createdAt, new Date(`${query.from}T00:00:00.000Z`)));
    }
    if (query.to) {
      conditions.push(lte(auditLogs.createdAt, new Date(`${query.to}T23:59:59.999Z`)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    const total = Number(countResult[0]?.count ?? 0);

    const offset = (query.page - 1) * query.pageSize;
    const items = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: users.name,
        userEmail: users.email,
        action: auditLogs.action,
        targetTable: auditLogs.targetTable,
        targetId: auditLogs.targetId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .offset(offset)
      .fetch(query.pageSize);

    return { items, total };
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: users.name,
        userEmail: users.email,
        action: auditLogs.action,
        targetTable: auditLogs.targetTable,
        targetId: auditLogs.targetId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.id, id));

    return rows[0] ?? null;
  }

  async create(input: CreateAuditLogInput) {
    const db = await getDb();
    const rows = await db
      .insert(auditLogs)
      .output()
      .values({
        userId: input.userId,
        action: input.action,
        targetTable: input.targetTable,
        targetId: input.targetId,
        metadata: input.metadata ?? null,
      });
    return rows[0];
  }
}
