import { and, avg, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { likes, reviews, stalls, users } from '../db/schema.ts';

export interface CreateReviewParams {
  stallId: number;
  userId: number;
  rating: number;
  comment: string | null;
}

export class ReviewRepository {
  async findByStallAndUser(stallId: number, userId: number) {
    const db = await getDb();
    const rows = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.stallId, stallId), eq(reviews.userId, userId)));
    return rows[0];
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db
      .select({
        id: reviews.id,
        stallId: reviews.stallId,
        stallName: stalls.name,
        userId: reviews.userId,
        userName: users.name,
        rating: reviews.rating,
        comment: reviews.comment,
        likeCount: reviews.likeCount,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
      .leftJoin(stalls, eq(reviews.stallId, stalls.id))
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.id, id));
    return rows[0];
  }

  async findByStallId(stallId: number, currentUserId?: number) {
    const db = await getDb();
    const rows = await db
      .select({
        id: reviews.id,
        stallId: reviews.stallId,
        stallName: stalls.name,
        userId: reviews.userId,
        userName: users.name,
        rating: reviews.rating,
        comment: reviews.comment,
        likeCount: reviews.likeCount,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
      .leftJoin(stalls, eq(reviews.stallId, stalls.id))
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.stallId, stallId))
      .orderBy(desc(reviews.id));

    let likedReviewIds = new Set<number>();
    if (currentUserId && rows.length > 0) {
      const reviewIds = rows.map((r) => r.id);
      const userLikes = await db
        .select({ reviewId: likes.reviewId })
        .from(likes)
        .where(
          and(
            eq(likes.userId, currentUserId),
            inArray(likes.reviewId, reviewIds),
          ),
        );
      likedReviewIds = new Set(userLikes.map((l) => l.reviewId));
    }

    return rows.map((row) => ({
      ...row,
      likedByMe: likedReviewIds.has(row.id),
    }));
  }

  async findByUserId(userId: number) {
    const db = await getDb();
    const rows = await db
      .select({
        id: reviews.id,
        stallId: reviews.stallId,
        stallName: stalls.name,
        userId: reviews.userId,
        userName: users.name,
        rating: reviews.rating,
        comment: reviews.comment,
        likeCount: reviews.likeCount,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
      .leftJoin(stalls, eq(reviews.stallId, stalls.id))
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.id));

    return rows.map((row) => ({ ...row, likedByMe: false }));
  }

  async findAllForManage(userId: number, role: string) {
    const db = await getDb();
    const query = db
      .select({
        id: reviews.id,
        stallId: reviews.stallId,
        stallName: stalls.name,
        userId: reviews.userId,
        userName: users.name,
        rating: reviews.rating,
        comment: reviews.comment,
        likeCount: reviews.likeCount,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
      .leftJoin(stalls, eq(reviews.stallId, stalls.id))
      .leftJoin(users, eq(reviews.userId, users.id))
      .orderBy(desc(reviews.id));

    if (role === 'admin') {
      const rows = await query;
      return rows.map((row) => ({ ...row, likedByMe: false }));
    }

    // Owner: filter by stalls owned by this user
    const rows = await query.where(eq(stalls.ownerId, userId));
    return rows.map((row) => ({ ...row, likedByMe: false }));
  }

  async create(params: CreateReviewParams) {
    const db = await getDb();
    const rows = await db
      .insert(reviews)
      .output()
      .values({
        stallId: params.stallId,
        userId: params.userId,
        rating: params.rating,
        comment: params.comment,
        likeCount: 0,
      });
    return rows[0];
  }

  async update(id: number, rating?: number, comment?: string | null) {
    const db = await getDb();
    const rows = await db
      .update(reviews)
      .set({
        ...(rating !== undefined ? { rating } : {}),
        ...(comment !== undefined ? { comment } : {}),
      })
      .where(eq(reviews.id, id))
      .output();
    return rows[0];
  }

  async delete(id: number) {
    const db = await getDb();
    // Delete likes and flags for this review first
    await db.delete(likes).where(eq(likes.reviewId, id));
    const rows = await db.delete(reviews).where(eq(reviews.id, id)).output();
    return rows[0];
  }

  async refreshStallSummary(stallId: number) {
    const db = await getDb();

    const stats = await db
      .select({
        total: count(),
        average: avg(sql<number>`cast(${reviews.rating} as decimal(10, 4))`),
      })
      .from(reviews)
      .where(eq(reviews.stallId, stallId));

    const total = Number(stats[0]?.total ?? 0);
    const average = Number(stats[0]?.average ?? 0);

    const updated = await db
      .update(stalls)
      .set({ reviewCount: total, avgRating: average.toFixed(2) })
      .where(eq(stalls.id, stallId))
      .output();

    return updated[0];
  }

  async toggleLike(reviewId: number, userId: number, isLike: boolean) {
    const db = await getDb();
    const existing = await db
      .select()
      .from(likes)
      .where(and(eq(likes.reviewId, reviewId), eq(likes.userId, userId)));

    if (isLike) {
      if (existing.length === 0) {
        await db.insert(likes).values({ reviewId, userId });
      }
    } else {
      if (existing.length > 0) {
        await db.delete(likes).where(eq(likes.id, existing[0].id));
      }
    }

    // Refresh likeCount on review
    const likeStats = await db
      .select({ total: count() })
      .from(likes)
      .where(eq(likes.reviewId, reviewId));
    const likeCount = Number(likeStats[0]?.total ?? 0);

    await db
      .update(reviews)
      .set({ likeCount })
      .where(eq(reviews.id, reviewId));

    return { reviewId, liked: isLike, likeCount };
  }
}
