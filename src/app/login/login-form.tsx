"use client";

import { useActionState } from "react";

import { login, type LoginState } from "@/auth/actions";

const INITIAL: LoginState = { error: null };

export function LoginForm({ next, misconfigured }: { next: string; misconfigured: boolean }) {
  const [state, action, pending] = useActionState(login, INITIAL);
  const error =
    state.error ?? (misconfigured ? "Sign-in is not configured. Set STUDIO_PASSWORD on the server." : null);

  return (
    <form className="ohf-login-form" action={action}>
      <input type="hidden" name="next" value={next} />
      <label className="ohf-field">
        <div className="ohf-field-label">Team password</div>
        <input
          className="ohf-input"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          disabled={misconfigured}
        />
      </label>

      {error && (
        <div className="ohf-alert" role="alert">
          <span className="ohf-alert-text">{error}</span>
        </div>
      )}

      <button type="submit" className="ohf-login-submit" disabled={pending || misconfigured}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
