import type {
  ApiResponse,
  AuditLog,
  CreateOwnerInput,
  Flag,
  FlagInput,
  FlagStatus,
  LikeState,
  LoginInput,
  MenuInput,
  MenuItem,
  MenuQuery,
  PasswordInput,
  ProfileInput,
  RegisterInput,
  Review,
  ReviewInput,
  Stall,
  StallInput,
  StallQuery,
  User,
  UserRole,
} from '../types/api.ts';
import { http, tokenStorage } from './http.ts';

const data = <T>(response: { data: ApiResponse<T> }): T => response.data.data;

export async function request<T>(
  url: string,
  config?: Parameters<typeof http.request>[0],
): Promise<T> {
  const response = await http.request<ApiResponse<T>>({ url, ...config });
  return response.data.data;
}

export const authApi = {
  register: (input: RegisterInput) =>
    http
      .post<ApiResponse<{ user: User }>>('/auth/register', input)
      .then((res) => res.data.data.user),
  login: async (input: LoginInput) => {
    const res = await http.post<ApiResponse<{ token: string; user: User }>>(
      '/auth/login',
      input,
    );
    tokenStorage.set(res.data.data.token);
    return res.data.data.user;
  },
  me: () => http.get<ApiResponse<User>>('/auth/me').then(data),
  logout: async () => {
    tokenStorage.clear();
  },
};

export const profileApi = {
  get: () => http.get<ApiResponse<User>>('/profile').then(data),
  update: (input: ProfileInput) =>
    http.put<ApiResponse<User>>('/profile', input).then(data),
  changePassword: (input: PasswordInput) => http.patch('/profile/password', input),
};

export const usersApi = {
  list: (params?: { role?: UserRole; search?: string }) =>
    http.get<ApiResponse<User[]>>('/users', { params }).then(data),
  createOwner: (input: CreateOwnerInput) =>
    http.post<ApiResponse<User>>('/users/owner', input).then(data),
  updateRole: (id: number, role: UserRole) =>
    http.patch<ApiResponse<User>>(`/users/${id}/role`, { role }).then(data),
};

export const stallsApi = {
  list: (params?: StallQuery) =>
    http.get<ApiResponse<Stall[]>>('/stalls', { params }).then(data),
  get: (id: number) =>
    http.get<ApiResponse<Stall>>(`/stalls/${id}`).then(data),
  create: (input: StallInput) =>
    http.post<ApiResponse<Stall>>('/stalls', input).then(data),
  update: (id: number, input: Partial<StallInput>) =>
    http.put<ApiResponse<Stall>>(`/stalls/${id}`, input).then(data),
  remove: (id: number) => http.delete(`/stalls/${id}`),
};

export const menuApi = {
  list: (params?: MenuQuery) =>
    http.get<ApiResponse<MenuItem[]>>('/menu', { params }).then(data),
  get: (id: number) =>
    http.get<ApiResponse<MenuItem>>(`/menu/${id}`).then(data),
  create: (input: MenuInput) =>
    http.post<ApiResponse<MenuItem>>('/menu', input).then(data),
  update: (id: number, input: Partial<MenuInput>) =>
    http.put<ApiResponse<MenuItem>>(`/menu/${id}`, input).then(data),
  remove: (id: number) => http.delete(`/menu/${id}`),
};

export const reviewsApi = {
  byStall: (stallId: number) =>
    http.get<ApiResponse<Review[]>>(`/stalls/${stallId}/reviews`).then(data),
  mine: () => http.get<ApiResponse<Review[]>>('/reviews/mine').then(data),
  manage: () => http.get<ApiResponse<Review[]>>('/reviews/manage').then(data),
  create: (stallId: number, input: ReviewInput) =>
    http.post<ApiResponse<Review>>(`/stalls/${stallId}/reviews`, input).then(data),
  update: (id: number, input: ReviewInput) =>
    http.put<ApiResponse<Review>>(`/reviews/${id}`, input).then(data),
  remove: (id: number) => http.delete(`/reviews/${id}`),
  like: (id: number) =>
    http.post<ApiResponse<LikeState>>(`/reviews/${id}/like`).then(data),
  unlike: (id: number) =>
    http.delete<ApiResponse<LikeState>>(`/reviews/${id}/like`).then(data),
};

export const flagsApi = {
  create: (reviewId: number, input: FlagInput) =>
    http.post<ApiResponse<Flag>>(`/reviews/${reviewId}/flags`, input).then(data),
  list: (status?: FlagStatus) =>
    http.get<ApiResponse<Flag[]>>('/flags', { params: { status } }).then(data),
  updateStatus: (id: number, status: Exclude<FlagStatus, 'pending'>) =>
    http.patch<ApiResponse<Flag>>(`/flags/${id}`, { status }).then(data),
};

export const auditApi = {
  list: () => http.get<ApiResponse<AuditLog[]>>('/audit-logs').then(data),
};

export function getStalls(): Promise<Stall[]> {
  return stallsApi.list();
}

export function getMenus(params?: MenuQuery): Promise<MenuItem[]> {
  return menuApi.list(params);
}

export function getMenuById(id: number): Promise<MenuItem> {
  return menuApi.get(id);
}
