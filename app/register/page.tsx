"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/client/api";
import { Alert, Btn, Card, Input, Label, Spinner } from "../components/ui";

type Mode = "captain" | "join";

type RegisterResponse = {
  user: { id: string; name: string; email: string; roll: string };
  teamId: string;
  teamCode: string;
  isCaptain: boolean;
  message?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("captain");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [roll, setRoll] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<RegisterResponse | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const body =
      mode === "captain"
        ? { name, email, password, roll, teamName }
        : { name, email, password, teamCode, roll };
    const res = await apiPost<RegisterResponse>("/api/auth/register", body);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(res.data);
  }

  if (done) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Card className="w-full max-w-[520px] p-space-xl flex flex-col gap-space-lg text-center">
          <div className="self-center w-16 h-16 bg-secondary-container border-[3px] border-black flex items-center justify-center rotate-3">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h1 className="font-headline-md text-headline-md uppercase">You&apos;re in</h1>
          {done.isCaptain ? (
            <>
              <p className="font-body-md text-on-surface-variant">
                Your team is registered. Share this 4-digit code with your three
                teammates so they can join.
              </p>
              <div className="mx-auto px-space-xl py-space-md bg-inverse-surface text-[#f4eeda] border-[3px] border-black font-code text-[44px] tracking-[0.3em]">
                {done.teamCode}
              </div>
            </>
          ) : (
            <p className="font-body-md text-on-surface-variant">
              You joined team <span className="font-code">{done.teamCode}</span>. Once
              all four members are in, wait for the organizer to start the match.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-space-sm justify-center pt-space-sm">
            <Btn onClick={() => router.push("/team")}>Go to my team</Btn>
            <Btn variant="ghost" onClick={() => router.push("/compete")}>
              Go to arena
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
      <Card className="w-full max-w-[560px]">
        <div className="bg-secondary-fixed border-b-[3px] border-black px-space-md py-space-sm flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-secondary-fixed">
            Registration :: Whitelist Only
          </span>
          <span className="px-2 py-0.5 bg-surface-container-lowest border-[1.5px] border-black font-code text-[11px]">
            {mode === "captain" ? "CAPTAIN" : "MEMBER"}
          </span>
        </div>

        <div className="p-space-lg flex flex-col gap-space-lg">
          <div className="grid grid-cols-2 gap-space-xs">
            <button
              type="button"
              onClick={() => setMode("captain")}
              className={`py-space-sm border-[2.5px] border-black font-label-md uppercase transition-all ${
                mode === "captain"
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container-lowest text-on-surface-variant"
              }`}
            >
              Create team
            </button>
            <button
              type="button"
              onClick={() => setMode("join")}
              className={`py-space-sm border-[2.5px] border-black font-label-md uppercase transition-all ${
                mode === "join"
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container-lowest text-on-surface-variant"
              }`}
            >
              Join team
            </button>
          </div>

          <p className="font-body-sm text-on-surface-variant">
            {mode === "captain"
              ? "Start a new squad. You'll get a 4-digit code to share with your three teammates."
              : "Enter the 4-digit code your captain shared, plus your own name, roll number and email."}
          </p>

          {error ? <Alert tone="error">{error}</Alert> : null}

          <form onSubmit={submit} className="flex flex-col gap-space-md">
            {mode === "captain" ? (
              <div className="flex flex-col gap-space-xs">
                <Label hint="optional">Team name</Label>
                <Input
                  placeholder="e.g. The Debuggers"
                  maxLength={40}
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-space-xs">
                <Label hint="4 digits">Team code</Label>
                <Input
                  required
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            )}

            <div className="flex flex-col gap-space-xs">
              <Label>Full name</Label>
              <Input
                required
                placeholder="As printed on your college ID"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-space-xs">
              <Label>Roll number</Label>
              <Input
                required
                placeholder="B25XXXX"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-space-xs">
              <Label>Mail ID</Label>
              <Input
                type="email"
                required
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-space-xs">
              <Label hint="min 6 characters">Password</Label>
              <Input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Btn type="submit" disabled={busy} className="py-space-md mt-space-xs">
              {busy ? <Spinner /> : null}
              {busy
                ? "Registering…"
                : mode === "captain"
                  ? "Create team"
                  : "Join team"}
            </Btn>
          </form>

          <div className="pt-space-md border-t-[2px] border-black/20 flex items-center justify-between">
            <span className="font-body-sm text-on-surface-variant">
              Already registered?
            </span>
            <Link
              href="/login"
              className="font-label-md text-label-md bg-secondary-fixed border-[2px] border-black px-space-md py-space-xs hover:shadow-[3px_3px_0px_#000] transition-all"
            >
              Sign in →
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
