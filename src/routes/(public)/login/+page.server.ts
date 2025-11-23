/**
 * Server-side login handler
 * Handles form submission and sets HTTP-only cookies
 */

import { fail, redirect, type Actions } from "@sveltejs/kit";
import { login } from "@/shared/api/auth";

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get("email");
    const password = data.get("password");

    if (!email || !password) {
      return fail(400, { error: "Email and password are required" });
    }

    // Call login API
    const result = await login({
      email: email.toString(),
      password: password.toString(),
    });

    if (result.error) {
      return fail(401, { error: result.error });
    }

    if (!result.data) {
      return fail(500, { error: "No token received" });
    }

    // Set HTTP-only cookies for tokens
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

    // Redirect to home page
    throw redirect(303, "/");
  },
};
