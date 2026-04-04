import type { Language, PageSize } from './common';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  language: Language;
  defaultPageSize: PageSize | null;
  defaultInstrumentId: string | null;
  avatarUrl: string | null;
  scheduledDeletionAt: string | null;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  language: Language;
  defaultPageSize: PageSize | null;
  defaultInstrumentId: string | null;
}

export interface ValidationErrorResponse {
  errors: Record<string, string[]>;
}

export interface BusinessErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
