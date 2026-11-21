import { and, eq, like, or, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { users } from '../db/schema.ts';

export type UserRole = 'admin' | 'owner' | 'customer';

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export class UserRepository {
  async findAll(params?: { role?: UserRole; search?: string }) {
    const db = await getDb();
    const conditions: SQL[] = [];

    if (params?.role) {
      conditions.push(eq(users.role, params.role));
    }

    if (params?.search) {
      conditions.push(
        or(
          like(users.name, `%${params.search}%`),
          like(users.email, `%${params.search}%`),
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(users.id);
  }

  async findByEmail(email: string) {
    const db = await getDb();
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0];
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0];
  }

  async create(input: CreateUserInput) {
    const db = await getDb();
    const rows = await db
      .insert(users)
      .output()
      .values({
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
      });
    return rows[0];
  }

  async updateRole(id: number, role: UserRole) {
    const db = await getDb();
    const rows = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .output();
    return rows[0];
  }

  async update(id: number, data: { name?: string; email?: string; passwordHash?: string }) {
    const db = await getDb();
    const rows = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .output();
    return rows[0];
  }
}
