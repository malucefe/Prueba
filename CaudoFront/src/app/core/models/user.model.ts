export interface User {
  id: string;
  nombre: string;
  email: string;
  // Optional because legacy payloads (e.g. /auth/login) and older local
  // state may predate HU-19; the API always returns both fields.
  role?: 'user' | 'admin';
  isActive?: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface CreateUserRequest {
  nombre: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserRequest {
  nombre?: string;
  email?: string;
  role?: 'user' | 'admin';
}
