import type { ApiResponse } from "./appointments";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

const STORAGE_KEY = "c3po_auth_token";
const USER_KEY = "c3po_user";

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Save auth token and user to localStorage
 */
function saveAuth(token: string, user: User): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear auth data from localStorage
 */
export function clearAuth(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Login user
 * TODO: Replace with real API call to POST /api/v1/auth/login
 */
export async function login(data: LoginRequest): Promise<ApiResponse<User>> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    // Mock user for demo
    const user: User = {
      id: crypto.randomUUID(),
      email: data.email,
      name: data.email.split("@")[0],
    };

    const token = crypto.randomUUID();
    saveAuth(token, user);

    return { data: user };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to login" };
  }
}

/**
 * Register user
 * TODO: Replace with real API call to POST /api/v1/auth/register
 */
export async function register(data: RegisterRequest): Promise<ApiResponse<User>> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const user: User = {
      id: crypto.randomUUID(),
      email: data.email,
      name: data.name,
    };

    const token = crypto.randomUUID();
    saveAuth(token, user);

    return { data: user };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to register" };
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  clearAuth();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}
