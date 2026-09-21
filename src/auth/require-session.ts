import { cookies } from "next/headers";

import { SESSION_COOKIE, verifySessionToken } from "./session";

export class UnauthorizedError extends Error {
  constructor() {
    super("Your session has ended — reload the page to sign in again");
    this.name = "UnauthorizedError";
  }
}

/** The proxy already turns signed-out requests away; every server action and
    route handler checks again, because a matcher change can silently drop a
    path from the proxy's coverage. */
export async function requireSession(): Promise<void> {
  const jar = await cookies();
  if (!(await verifySessionToken(jar.get(SESSION_COOKIE)?.value))) throw new UnauthorizedError();
}
