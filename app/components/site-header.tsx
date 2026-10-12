"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  /** Show the live "match" pulse dot next to the label. */
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

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

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

        <div className="flex items-center gap-space-md">
          <div className="hidden md:flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-xs border-[2px] border-black">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container border border-black" />
            <span className="font-code text-code text-on-surface uppercase">
              STATUS: MATCH ACTIVE
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-[2px] border-black">
            <span className="material-symbols-outlined text-on-primary text-[18px]">
              person
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
