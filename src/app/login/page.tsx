import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { authMode } from "@/auth/session";
import { BRAND_NAME } from "@/brand";
import { studioFont } from "@/openhiggsfield/font";
import { FuturuMark } from "@/openhiggsfield/futuru-mark";

import { LoginForm } from "./login-form";

import "@/openhiggsfield/openhiggsfield.css";

export const metadata: Metadata = {
  title: "Sign in",
};

/* A signed-in visitor never lands here — the proxy sends them to the studio —
   so the page only has to handle the gate being off or misconfigured. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const mode = authMode();
  if (mode === "off") redirect("/");
  const { next } = await searchParams;

  return (
    <div className={`ohf ${studioFont.variable}`}>
      <main className="ohf-login">
        <div className="ohf-dialog-panel ohf-login-panel">
          <div className="ohf-login-head">
            <div className="ohf-login-brand">
              <FuturuMark size={30} />
              <h1 className="ohf-login-name">{BRAND_NAME}</h1>
            </div>
            <p className="ohf-login-copy">
              Futuru’s studio for image and video generation. Enter the team password to continue.
            </p>
          </div>
          <LoginForm next={typeof next === "string" ? next : ""} misconfigured={mode === "misconfigured"} />
        </div>
      </main>
    </div>
  );
}
