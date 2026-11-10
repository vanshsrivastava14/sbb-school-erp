"use server";

import { redirect } from "next/navigation";
import { getUserByEmail, logAudit } from "@/lib/db/store";
import { verifyPassword } from "@/lib/auth/passwords";
import { createSessionCookie, clearSessionCookie, getSession } from "@/lib/auth/session";

export interface LoginResult {
  error?: string;
  success?: boolean;
}

export async function loginAction(prevState: LoginResult | undefined, formData: FormData): Promise<LoginResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectPath = formData.get("redirect") as string | null;

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  const user = await getUserByEmail(email);
  if (!user || !user.isActive) {
    return { error: "Invalid email or account is inactive." };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Incorrect password. Please try again." };
  }

  await createSessionCookie({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });

  await logAudit(user.id, user.fullName, "USER_LOGIN", "users", user.id, `User logged in with role: ${user.role}`);

  if (redirectPath && redirectPath.startsWith("/")) {
    redirect(redirectPath);
  } else if (user.role === "admin") {
    redirect("/admin");
  } else {
    redirect("/teacher");
  }
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await logAudit(session.userId, session.fullName, "USER_LOGOUT", "users", session.userId, "User logged out");
  }
  await clearSessionCookie();
  redirect("/login");
}
