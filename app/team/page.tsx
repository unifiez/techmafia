"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/client/api";
import { Alert, Btn, Card, Input, Spinner } from "../components/ui";

type TeamView = {
  hasTeam: boolean;
  team?: {
    id: string;
    name: string;
    code: string;
    college: string;
    status: string;
    flagged: boolean;
    isCaptain: boolean;
    members: {
      name: string;
      roll: string;
      memberIndex: number;
      joined: boolean;
      online: boolean;
      isSelf: boolean | "" | undefined;
    }[];
  };
};

export default function TeamPage() {
  const router = useRouter();
  const [data, setData] = useState<TeamView | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await apiGet<TeamView>("/api/team");
    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      setError(res.error);
      return;
    }
    setData(res.data);
    if (res.data.team) setName(res.data.team.name);
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => void load(), 8000);
    const t = setTimeout(() => void load(), 0);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, [load]);

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await apiPatch<{ name: string }>("/api/team", { name });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage("Team name updated.");
    void load();
  }

  if (error && !data) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Spinner />
      </div>
    );
  }

  if (!data.hasTeam || !data.team) {
    return (
      <div className="flex-1 flex items-center justify-center px-gutter py-space-xl">
        <Card className="max-w-[520px] p-space-xl flex flex-col gap-space-md text-center">
          <h1 className="font-headline-md text-headline-md uppercase">No team yet</h1>
          <p className="font-body-md text-on-surface-variant">
            Create a team as captain or join one with a 4-digit code.
          </p>
          <div className="flex justify-center gap-space-sm pt-space-sm">
            <Btn onClick={() => router.push("/register")}>Register</Btn>
            <Btn variant="ghost" onClick={() => router.push("/compete")}>
              Arena
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  const team = data.team;
  const joined = team.members.filter((m) => m.joined).length;

  return (
    <div className="max-w-[1000px] mx-auto w-full px-gutter py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <span className="font-code text-code text-on-surface-variant uppercase">
            Team code {team.code} · {team.college || "College n/a"}
          </span>
          <h1 className="font-headline-lg text-headline-lg uppercase tracking-tight">
            {team.name}
          </h1>
        </div>
        <div className="flex items-center gap-space-sm">
          <span
            className={`px-space-sm py-space-xs border-[2.5px] border-black font-code text-label-md uppercase ${
              team.status === "ready" || team.status === "in_match"
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-surface-container-high text-on-surface-variant"
            }`}
          >
            {team.status.replace("_", " ")}
          </span>
          {team.flagged ? (
            <span className="px-space-sm py-space-xs border-[2.5px] border-error bg-error-container text-on-error-container font-code text-label-md uppercase">
              Flagged
            </span>
          ) : null}
        </div>
      </div>

      {team.flagged ? (
        <Alert tone="error">
          This team has been flagged by the organizer. A fair-play violation was
          recorded. Speak to the organizers.
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-space-lg">
        <Card className="p-space-lg flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm uppercase">
              Roster · {joined}/4 joined
            </h2>
          </div>
          <div className="flex flex-col gap-space-sm">
            {team.members.map((m) => (
              <div
                key={m.memberIndex}
                className="flex items-center justify-between gap-space-sm px-space-md py-space-sm bg-surface-container-low border-[2.5px] border-black"
              >
                <div className="flex items-center gap-space-md">
                  <div
                    className={`w-9 h-9 border-[2px] border-black flex items-center justify-center font-code font-bold ${
                      m.joined
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {m.memberIndex + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md uppercase">
                      {m.name}
                      {m.isSelf ? (
                        <span className="ml-2 text-primary">(you)</span>
                      ) : null}
                    </span>
                    <span className="font-code text-body-sm text-on-surface-variant">
                      {m.roll}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm">
                  {m.joined ? (
                    <span className="flex items-center gap-1 font-code text-body-sm">
                      <span
                        className={`w-2.5 h-2.5 rounded-full border border-black ${
                          m.online ? "bg-[#4ade80]" : "bg-surface-dim"
                        }`}
                      />
                      {m.memberIndex === 0 ? "captain" : "member"}
                    </span>
                  ) : (
                    <span className="font-code text-body-sm text-on-surface-variant">
                      awaiting join
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-space-lg">
          <Card className="p-space-lg flex flex-col gap-space-xs items-center text-center">
            <span className="font-label-md text-label-md uppercase text-on-surface-variant">
              Team code
            </span>
            <div className="px-space-lg py-space-sm bg-inverse-surface text-[#f4eeda] border-[3px] border-black font-code text-[40px] tracking-[0.25em]">
              {team.code}
            </div>
            <span className="font-body-sm text-on-surface-variant">
              Share with teammates to join.
            </span>
          </Card>

          {team.isCaptain ? (
            <Card className="p-space-lg flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md uppercase">
                Rename team
              </span>
              <form onSubmit={rename} className="flex flex-col gap-space-sm">
                <Input
                  value={name}
                  minLength={2}
                  maxLength={40}
                  onChange={(e) => setName(e.target.value)}
                />
                <Btn type="submit" variant="secondary" disabled={saving}>
                  {saving ? <Spinner /> : null} Save
                </Btn>
              </form>
              {message ? <Alert tone="ok">{message}</Alert> : null}
            </Card>
          ) : null}

          <Btn onClick={() => router.push("/compete")} className="py-space-md">
            Enter arena →
          </Btn>
          <Link
            href="/leaderboard"
            className="text-center font-label-md text-label-md underline underline-offset-4 decoration-2"
          >
            View leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
