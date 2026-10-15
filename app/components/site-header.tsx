"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/client/api";

type NavItem = {
  label: string;
  href: string;
  live?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Compete", href: "/compete", live: true },
  { label: "Docs", href: "/docs" },
];

const linkBase =
  "font-label-lg text-label-lg px-space-md py-space-xs border-[2px] transition-all relative flex items-center gap-space-xs";

type MeResponse = {
  authenticated: boolean;
  user?: { id: string; name: string; isCaptain: boolean; disqualified: boolean };
  team?: { name: string; code: string } | null;
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);

  const load = useCallback(async () => {
    const res = await apiGet<MeResponse>("/api/auth/me");
    setMe(res.ok ? res.data : { authenticated: false });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load, pathname]);

  async function logout() {
    await apiPost("/api/auth/logout", {});
    setMe({ authenticated: false });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b-[2.5px] border-black">
      <div className="h-20 max-w-[1400px] mx-auto px-gutter flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-lg">
          <Link
            href="/"
            className="flex items-center gap-space-xs bg-secondary-container px-space-md py-space-xs border-[2px] border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4.5px_4.5px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface uppercase">
              TECH MAFIA
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-space-xs">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`${linkBase} ${
                    active
                      ? "bg-primary-container text-on-surface border-black"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border-transparent"
                  }`}
                >
                  {item.label}
                  {item.live ? (
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse border border-black" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-space-sm">
          <Link
            href="/admin"
            className="hidden md:flex items-center gap-space-xs px-space-sm py-space-xs border-[2px] border-black bg-surface-container-lowest hover:bg-surface-container-high transition-all font-label-sm uppercase"
          >
            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            Organizer
          </Link>

          {me?.authenticated && me.user ? (
            <div className="flex items-center gap-space-sm">
              <Link
                href="/team"
                className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container-lowest border-[2px] border-black font-code text-code"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container border border-black" />
                {me.team?.name ?? me.user.name}
                {me.user.disqualified ? (
                  <span className="text-error font-bold">DQ</span>
                ) : null}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="px-space-sm py-space-xs bg-primary-container border-[2px] border-black font-label-sm uppercase hover:shadow-[3px_3px_0px_#000] transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-space-xs">
              <Link
                href="/login"
                className="px-space-sm py-space-xs bg-surface-container-lowest border-[2px] border-black font-label-sm uppercase hover:bg-surface-container-high transition-all"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-space-sm py-space-xs bg-primary-container border-[2px] border-black font-label-sm uppercase hover:shadow-[3px_3px_0px_#000] transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
