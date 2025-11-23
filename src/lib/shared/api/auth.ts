/**
 * Authentication API client
 * Integrates with FastAPI backend using JWT tokens stored in HTTP-only cookies
 */

import { API_ENDPOINTS } from "@/shared/config/api";
import type { User, LoginRequest, RegisterRequest, Token } from "@/shared/types/auth";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Login user with backend API
 * Tokens will be stored in HTTP-only cookies by the server
 */
export async function login(credentials: LoginRequest): Promise<ApiResponse<Token>> {
  try {
    const response = await fetch(API_ENDPOINTS.auth.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      credentials: "include", // Include cookies in request
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || "Failed to login" };
    }

    const data: Token = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Register new user
 */
export async function register(userData: RegisterRequest): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(API_ENDPOINTS.auth.register, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || "Failed to register" };
    }

    const data: User = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(API_ENDPOINTS.auth.me, {
      credentials: "include",
    });

    if (!response.ok) {
      return { error: "Not authenticated" };
    }

    const data: User = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(API_ENDPOINTS.auth.logout, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      return { error: "Failed to logout" };
    }

    return { data: undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Server-side: Verify access token by calling /auth/me
 * Used in hooks.server.ts
 */
export async function verifyAccessToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(API_ENDPOINTS.auth.me, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Server-side: Refresh access token
 * Used in hooks.server.ts
 */
export async function refreshAccessToken(refreshToken: string): Promise<ApiResponse<Token>> {
  try {
    const response = await fetch(API_ENDPOINTS.auth.refresh, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return { error: "Failed to refresh token" };
    }

    const data: Token = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Network error" };
  }
}
