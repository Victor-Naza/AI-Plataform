import type { AuthSession, AuthUser } from '../models/Auth';
import { API_BASE_URL, parseErrorResponse } from './api';
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from './authStorage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginCredentials {
  name: string;
}

class AuthService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getStoredAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(await parseErrorResponse(response));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const session = await this.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    setStoredAuthToken(session.token);
    return session;
  }

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const session = await this.request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setStoredAuthToken(session.token);
    return session;
  }

  async restoreSession(): Promise<AuthUser | null> {
    if (!getStoredAuthToken()) {
      return null;
    }

    try {
      const response = await this.request<{ user: AuthUser }>('/auth/me');
      return response.user;
    } catch {
      clearStoredAuthToken();
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      if (getStoredAuthToken()) {
        await this.request('/auth/logout', {
          method: 'POST',
        });
      }
    } finally {
      clearStoredAuthToken();
    }
  }

  clearSession() {
    clearStoredAuthToken();
  }
}

export const authService = new AuthService();
