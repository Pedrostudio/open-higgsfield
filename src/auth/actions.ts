"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  authMode,
  createSessionToken,
  passwordMatches,
} from "./session";

export type LoginState = { error: string | null };

/* A wrong guess costs this long, so the form cannot be hammered at line rate. */
const FAILED_ATTEMPT_DELAY_MS = 800;

export async function login(_previous: LoginState, form: FormData): Promise<LoginState> {
  const mode = authMode();
  if (mode === "off") redirect("/");
  if (mode === "misconfigured") {
    return { error: "Sign-in is not configured. Set STUDIO_PASSWORD on the server." };
  }

  const password = form.get("password");
  if (typeof password !== "string" || !(await passwordMatches(password))) {
    await new Promise((resolve) => setTimeout(resolve, FAILED_ATTEMPT_DELAY_MS));
    return { error: "That password is not right." };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(), SESSION_COOKIE_OPTIONS);
  redirect(safeNext(form.get("next")));
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  redirect("/login");
}

/** Only a same-origin path survives, so the login page cannot be turned into
    an open redirect. */
function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/login") || value.includes("\\")) return "/";
  return value;
}
