import { Types } from "mongoose";
import type { IMatch, MatchModule, MatchPhase } from "../models";
import { phaseDuration } from "./config";
import { moduleKeys, replaceModuleBody } from "./code";

export const C_HEADER = "";

/** Build per-module metadata from a template, assigning authors round-robin. */
export function buildMatchModules(
  template: string,
  members: { userId: string; memberIndex: number }[],
  titles: Record<string, string> = {},
): MatchModule[] {
  const keys = moduleKeys(template);
  return keys.map((key, i) => {
    const member = members[i % (members.length || 1)];
    return {
      key,
      title: titles[key] ?? key.toUpperCase(),
      authorUserId: member ? new Types.ObjectId(member.userId) : undefined,
      authorMemberIndex: member?.memberIndex,
      repairUserId: member ? new Types.ObjectId(member.userId) : undefined,
      placeholder: "",
    };
  });
}

/**
 * Enforce the author→next-member rotation: every module is repaired by a
 * DIFFERENT teammate than the one who authored it.
 */
export function rotateModules(
  modules: MatchModule[],
  members: { userId: string; memberIndex: number }[],
): void {
  if (members.length === 0) return;
  const byIndex = new Map(members.map((m) => [m.memberIndex, m.userId]));
  const ordered = [...members].sort((a, b) => a.memberIndex - b.memberIndex);
  for (const mod of modules) {
    const authorIdx = ordered.findIndex((m) => m.userId === String(mod.authorUserId));
    const base = authorIdx === -1 ? ordered.findIndex((m) => m.memberIndex === mod.authorMemberIndex) : authorIdx;
    const next = ordered[(base + 1) % ordered.length];
    mod.repairUserId = new Types.ObjectId(next.userId);
  }
  void byIndex;
}

export function phaseEndsAt(config: IMatch["config"], phase: MatchPhase, from = new Date()): Date {
  const seconds = phaseDuration(config, phase);
  return new Date(from.getTime() + seconds * 1000);
}

const AUTO_PHASES: MatchPhase[] = ["briefing", "coding", "attack", "repair", "testing"];

export function isAutoPhase(phase: MatchPhase): boolean {
  return AUTO_PHASES.includes(phase);
}

const NEXT: Record<string, MatchPhase> = {
  lobby: "briefing",
  briefing: "coding",
  coding: "attack",
  attack: "repair",
  repair: "testing",
  testing: "complete",
  complete: "complete",
};

export function nextPhaseOf(phase: MatchPhase): MatchPhase {
  return NEXT[phase] ?? "complete";
}

/**
 * Apply the side effects of entering a phase on a (mutable) match document.
 * Called by both the admin "advance" action and the timer auto-advance.
 */
export function enterPhase(
  match: {
    phase: MatchPhase;
    phaseStartedAt: Date;
    phaseEndsAt: Date;
    config: IMatch["config"];
    code: { baseline: string; current: string };
    modules: MatchModule[];
    startedAt?: Date;
    endedAt?: Date;
  },
  next: MatchPhase,
  coderMembers: { userId: string; memberIndex: number }[],
  now = new Date(),
): void {
  if (next === "attack") {
    // Freeze the coder team's baseline the moment the attack window opens.
    match.code.baseline = match.code.current;
  }
  if (next === "repair" && match.config.rotateRepairs) {
    rotateModules(match.modules, coderMembers);
  }
  if (next === "coding" && !match.startedAt) {
    match.startedAt = now;
  }
  if (next === "complete") {
    match.endedAt = now;
  }
  match.phase = next;
  match.phaseStartedAt = now;
  match.phaseEndsAt = isAutoPhase(next) ? phaseEndsAt(match.config, next, now) : now;
}

/**
 * Fast-forward a match through any expired timed phases.
 * Returns true when the phase changed.
 */
export function syncPhases(
  match: {
    phase: MatchPhase;
    phaseStartedAt: Date;
    phaseEndsAt: Date;
    config: IMatch["config"];
    code: { baseline: string; current: string };
    modules: MatchModule[];
    startedAt?: Date;
    endedAt?: Date;
  },
  coderMembers: { userId: string; memberIndex: number }[],
  now = new Date(),
): boolean {
  let changed = false;
  let guard = 0;
  while (
    isAutoPhase(match.phase) &&
    match.phaseEndsAt.getTime() <= now.getTime() &&
    guard++ < 10
  ) {
    const next = nextPhaseOf(match.phase);
    enterPhase(match, next, coderMembers, now);
    changed = true;
    if (next === "complete") break;
  }
  return changed;
}

/**
 * Validate a repair edit: the user may only change modules assigned to them,
 * and only during the repair phase.
 */
export function checkRepairPermissions(
  match: { modules: MatchModule[] },
  userId: string,
  changed: string[],
): { allowed: boolean; reason?: string } {
  if (changed.length === 0) {
    return { allowed: false, reason: "nothing changed" };
  }
  for (const key of changed) {
    const mod = match.modules.find((m) => m.key === key);
    if (!mod) return { allowed: false, reason: `unknown module ${key}` };
    if (String(mod.repairUserId) !== String(userId)) {
      return {
        allowed: false,
        reason: `module ${key} is not assigned to you for repair`,
      };
    }
  }
  return { allowed: true };
}

/** Blank every fenced body in a template (used to reset a match). */
export function stripBodies(template: string): string {
  let out = template;
  for (const key of moduleKeys(template)) out = replaceModuleBody(out, key, "");
  return out;
}
