import bcrypt from 'bcryptjs';
import {
  UserRepository,
  type CreateUserInput,
  type UserRole,
} from '../repositories/userRepository.ts';
import type { UserResponseDto } from '../dtos/userDto.ts';
import { AppError } from '../errors/AppError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date | null;
};

export class UserService {
  constructor(private userRepository: UserRepository = new UserRepository()) {}

  private toDto(row: UserRow): UserResponseDto {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.createdAt,
    };
  }

  async getAllUsers(params?: { role?: UserRole; search?: string }): Promise<UserResponseDto[]> {
    const rows = await this.userRepository.findAll(params);
    return rows.map((row) => this.toDto(row));
  }

  async getUserById(id: number): Promise<UserResponseDto> {
    const row = await this.userRepository.findById(id);
    if (!row) throw new NotFoundError('User tidak ditemukan');
    return this.toDto(row);
  }

  async createUser(input: CreateUserInput): Promise<UserResponseDto> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, 'Email sudah terdaftar');
    }
    const row = await this.userRepository.create(input);
    if (!row) throw new AppError(500, 'User gagal dibuat');
    return this.toDto(row);
  }

  async createOwner(input: { name: string; email: string; password: string }): Promise<UserResponseDto> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, 'Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const row = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'owner',
    });
    if (!row) throw new AppError(500, 'User gagal dibuat');
    return this.toDto(row);
  }

  async updateUserRole(id: number, role: UserRole): Promise<UserResponseDto> {
    const current = await this.userRepository.findById(id);
    if (!current) throw new NotFoundError('User tidak ditemukan');

    const row = await this.userRepository.updateRole(id, role);
    if (!row) throw new NotFoundError('User tidak ditemukan');
    return this.toDto(row);
  }

  async updateProfile(id: number, input: { name?: string; email?: string }): Promise<UserResponseDto> {
    const current = await this.userRepository.findById(id);
    if (!current) throw new NotFoundError('User tidak ditemukan');

    if (input.email && input.email !== current.email) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing) {
        throw new AppError(409, 'Email sudah digunakan');
      }
    }

    const row = await this.userRepository.update(id, {
      ...(input.name ? { name: input.name } : {}),
      ...(input.email ? { email: input.email } : {}),
    });
    if (!row) throw new NotFoundError('User tidak ditemukan');
    return this.toDto(row);
  }

  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    const current = await this.userRepository.findById(id);
    if (!current) throw new NotFoundError('User tidak ditemukan');

    const isValid = await bcrypt.compare(currentPassword, current.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Password saat ini salah');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, { passwordHash });
  }
}
