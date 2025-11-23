/**
 * SvelteKit server hooks for authentication
 * Handles JWT token validation and automatic refresh
 */

import { redirect, type Handle } from "@sveltejs/kit";
import { verifyAccessToken, refreshAccessToken } from "@/shared/api/auth";
import type { Cookies } from "@sveltejs/kit";

const PUBLIC_PATHS = ["/login"];

/**
 * Check if user is authenticated by validating access token
 */
async function isAuthenticated(cookies: Cookies): Promise<boolean> {
  const accessToken = cookies.get("access_token");

  if (!accessToken) {
    return false;
  }

  return verifyAccessToken(accessToken);
}

/**
 * Try to refresh access token using refresh token
 */
async function tryRefreshToken(cookies: Cookies): Promise<boolean> {
  const refreshToken = cookies.get("refresh_token");

  if (!refreshToken) {
    return false;
  }

  const result = await refreshAccessToken(refreshToken);

  if (result.error || !result.data) {
    return false;
  }

  // Update cookies with new tokens
  cookies.set("access_token", result.data.access_token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutes
  });

  cookies.set("refresh_token", result.data.refresh_token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return true;
}

export const handle: Handle = async ({ event, resolve }) => {
  const { url, cookies } = event;
  const isPublicPath = PUBLIC_PATHS.includes(url.pathname);

  // Check authentication
  let authenticated = await isAuthenticated(cookies);

  // If not authenticated, try to refresh token
  if (!authenticated) {
    authenticated = await tryRefreshToken(cookies);
  }

  // Redirect logic
  if (!authenticated && !isPublicPath) {
    // Not authenticated and trying to access protected route
    throw redirect(302, "/login");
  }

  if (authenticated && isPublicPath) {
    // Authenticated and trying to access login page
    throw redirect(302, "/");
  }

  // Store auth state in locals for use in load functions
  event.locals.user = authenticated ? { authenticated: true } : null;

  return resolve(event);
};
