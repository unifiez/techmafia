"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/client/api";
import { Alert, Btn, Card, Input, Label, Spinner } from "../components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await apiPost("/api/auth/login", { email, password });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/compete");
    router.refresh();
  }

  return (
    <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
      <Card className="w-full max-w-[520px]">
        <div className="bg-secondary-fixed border-b-[3px] border-black px-space-md py-space-sm flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="w-3 h-3 rounded-full bg-primary-container border-[1.5px] border-black inline-block" />
            <span className="w-3 h-3 rounded-full bg-secondary-container border-[1.5px] border-black inline-block" />
            <span className="w-3 h-3 rounded-full bg-surface-container-lowest border-[1.5px] border-black inline-block" />
          </div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-secondary-fixed">
            Auth Gate :: Portal-01
          </span>
          <span className="px-2 py-0.5 bg-surface-container-lowest border-[1.5px] border-black font-code text-[11px]">
            TM
          </span>
        </div>

        <form onSubmit={submit} className="p-space-xl flex flex-col gap-space-lg">
          <div className="flex flex-col items-center gap-space-sm text-center">
            <div className="w-14 h-14 bg-primary-container border-[2.5px] border-black flex items-center justify-center -rotate-3">
              <span className="material-symbols-outlined text-on-primary-container text-[28px]">
                shield_person
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg uppercase tracking-tight">
              Welcome Back
            </h1>
            <p className="font-body-md text-on-surface-variant">
              Sign in with the email and password you registered.
            </p>
          </div>

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="flex flex-col gap-space-xs">
            <Label hint="workspace email">Mail ID</Label>
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-space-xs">
            <Label>Password</Label>
            <Input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Btn type="submit" disabled={busy} className="py-space-md">
            {busy ? <Spinner /> : null}
            {busy ? "Authenticating…" : "Continue"}
          </Btn>

          <div className="pt-space-md border-t-[2px] border-black/20 flex flex-col sm:flex-row items-center justify-between gap-space-sm">
            <span className="font-body-sm text-on-surface-variant">
              No account yet?
            </span>
            <Link
              href="/register"
              className="font-label-md text-label-md bg-secondary-fixed border-[2px] border-black px-space-md py-space-xs hover:shadow-[3px_3px_0px_#000] transition-all"
            >
              Register →
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
