/* The studio's one gate: a shared team password, and a signed cookie that
   proves it was entered. Web Crypto only, so the proxy and the server actions
   verify the same token with the same code.

   The signing key is derived from STUDIO_PASSWORD, so changing the password
   signs every existing session out — rotation needs no second secret. */

export const SESSION_COOKIE = "futuru_session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export type AuthMode = "on" | "off" | "misconfigured";

/** Off only in development with no password set; production without one
    fails closed rather than serving the studio to anyone with the URL. */
export function authMode(): AuthMode {
  if (studioPassword()) return "on";
  return process.env.NODE_ENV === "production" ? "misconfigured" : "off";
}

export async function createSessionToken(): Promise<string> {
  const password = studioPassword();
  if (!password) throw new Error("Missing STUDIO_PASSWORD");
  const payload = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE);
  const signature = await crypto.subtle.sign("HMAC", await signingKey(password), encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const mode = authMode();
  if (mode === "off") return true;
  const password = studioPassword();
  if (mode === "misconfigured" || !password || !token) return false;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return false;
  const expires = Number(payload);
  if (!Number.isInteger(expires) || expires * 1000 <= Date.now()) return false;
  const bytes = fromBase64Url(signature);
  if (!bytes) return false;
  return crypto.subtle.verify("HMAC", await signingKey(password), bytes, encode(payload));
}

/** Constant-time: the input is checked by verifying it against the HMAC of the
    real password, so the comparison never short-circuits on the first byte. */
export async function passwordMatches(input: string): Promise<boolean> {
  const password = studioPassword();
  if (!password || !input) return false;
  const key = await signingKey(password);
  const expected = await crypto.subtle.sign("HMAC", key, encode(password));
  return crypto.subtle.verify("HMAC", key, expected, encode(input));
}

function studioPassword(): string | null {
  const password = process.env.STUDIO_PASSWORD?.trim();
  return password ? password : null;
}

function signingKey(password: string) {
  return crypto.subtle.importKey(
    "raw",
    encode(`futuru-studio-session:${password}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function encode(text: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(text);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;
  try {
    const binary = atob(text.replaceAll("-", "+").replaceAll("_", "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}
