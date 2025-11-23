/**
 * API configuration
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const API_V1 = `${API_BASE_URL}/api/v1`;

export const API_ENDPOINTS = {
  auth: {
    register: `${API_V1}/auth/register`,
    login: `${API_V1}/auth/login/json`,
    refresh: `${API_V1}/auth/refresh`,
    logout: `${API_V1}/auth/logout`,
    me: `${API_V1}/auth/me`,
  },
  appointments: {
    list: `${API_V1}/appointments`,
    create: `${API_V1}/appointments`,
    update: (id: string) => `${API_V1}/appointments/${id}`,
    delete: (id: string) => `${API_V1}/appointments/${id}`,
  },
} as const;
