import { desc, eq } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { flags, reviews, stalls, users } from '../db/schema.ts';

export class FlagRepository {
  async findAll(status?: 'pending' | 'resolved' | 'dismissed') {
    const db = await getDb();
    const query = db
      .select({
        id: flags.id,
        reviewId: flags.reviewId,
        reportedBy: flags.reportedBy,
        reporterName: users.name,
        reviewComment: reviews.comment,
        stallId: reviews.stallId,
        stallName: stalls.name,
        reason: flags.reason,
        status: flags.status,
        createdAt: flags.createdAt,
      })
      .from(flags)
      .leftJoin(users, eq(flags.reportedBy, users.id))
      .leftJoin(reviews, eq(flags.reviewId, reviews.id))
      .leftJoin(stalls, eq(reviews.stallId, stalls.id))
      .orderBy(desc(flags.id));

    if (status) {
      return query.where(eq(flags.status, status));
    }

    return query;
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db
      .select({
        id: flags.id,
        reviewId: flags.reviewId,
        reportedBy: flags.reportedBy,
        reporterName: users.name,
        reviewComment: reviews.comment,
        stallId: reviews.stallId,
        stallName: stalls.name,
        reason: flags.reason,
        status: flags.status,
        createdAt: flags.createdAt,
      })
      .from(flags)
      .leftJoin(users, eq(flags.reportedBy, users.id))
      .leftJoin(reviews, eq(flags.reviewId, reviews.id))
      .leftJoin(stalls, eq(reviews.stallId, stalls.id))
      .where(eq(flags.id, id));
    return rows[0];
  }

  async create(input: { reviewId: number; reportedBy: number; reason?: string | null }) {
    const db = await getDb();
    const rows = await db
      .insert(flags)
      .output()
      .values({
        reviewId: input.reviewId,
        reportedBy: input.reportedBy,
        reason: input.reason ?? null,
        status: 'pending',
      });
    return rows[0];
  }

  async updateStatus(id: number, status: 'pending' | 'resolved' | 'dismissed') {
    const db = await getDb();
    const rows = await db.update(flags).set({ status }).where(eq(flags.id, id)).output();
    return rows[0];
  }
}
