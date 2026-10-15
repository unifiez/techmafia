"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const BASE_BTN =
  "inline-flex items-center justify-center gap-2 border-[2.5px] border-black font-label-md uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANTS: Record<string, string> = {
  primary:
    "bg-primary-container text-on-primary-container hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
  secondary:
    "bg-secondary-container text-on-secondary-container hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
  dark: "bg-inverse-surface text-[#f4eeda] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
  ghost:
    "bg-surface-container-lowest text-on-surface hover:bg-surface-container-high",
  danger:
    "bg-error text-on-error hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
};

export function Btn({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS }) {
  return (
    <button className={`${BASE_BTN} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Input({
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-space-md py-space-sm bg-surface-container-lowest text-on-surface font-code text-code border-[2.5px] border-black focus:outline-none focus:shadow-[4px_4px_0px_#000] focus:-translate-x-[1px] focus:-translate-y-[1px] transition-all placeholder:text-outline ${className}`}
      {...rest}
    />
  );
}

export function Select({
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-space-md py-space-sm bg-surface-container-lowest text-on-surface font-code text-code border-[2.5px] border-black focus:outline-none ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Label({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-space-sm">
      <span className="font-label-md text-label-md text-on-surface uppercase">
        {children}
      </span>
      {hint ? (
        <span className="font-code text-body-sm text-on-surface-variant">{hint}</span>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-surface-container-lowest border-[3px] border-black ${className}`}>
      {children}
    </div>
  );
}

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "ok" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "bg-error-container text-on-error-container border-error",
    ok: "bg-secondary-container text-on-secondary-container border-black",
    info: "bg-tertiary-fixed text-on-tertiary-fixed border-black",
  };
  return (
    <div className={`px-space-md py-space-sm border-[2.5px] font-code text-body-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <span className="material-symbols-outlined animate-spin text-[18px]">
      progress_activity
    </span>
  );
}
