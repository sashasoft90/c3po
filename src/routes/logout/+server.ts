/**
 * Logout API endpoint
 *
 * NOTE: In +server.ts endpoints, we can call backend API directly since this is
 * server-side code that won't be rendered. The shared API functions in
 * @/shared/api/* are primarily for client-side use.
 */

import { redirect, type RequestHandler } from "@sveltejs/kit";
import { logout as logoutApi } from "@/shared/api/auth";

export const POST: RequestHandler = async ({ cookies, fetch }) => {
  const accessToken = cookies.get("access_token");

  if (accessToken) {
    await logoutApi(accessToken, fetch);
  }

  // Delete cookies regardless of API result
  cookies.delete("access_token", { path: "/" });
  cookies.delete("refresh_token", { path: "/" });

  // Redirect to login page
  throw redirect(302, "/login");
};
