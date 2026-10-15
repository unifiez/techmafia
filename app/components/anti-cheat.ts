"use client";

import { useEffect, useRef } from "react";
import { apiPost } from "@/lib/client/api";

export type ViolationType =
  | "blur"
  | "visibility_hidden"
  | "fullscreen_exit"
  | "copy"
  | "cut"
  | "paste"
  | "context_menu"
  | "devtools"
  | "multi_session";

const CRITICAL: ViolationType[] = [
  "blur",
  "visibility_hidden",
  "fullscreen_exit",
  "devtools",
  "multi_session",
];

export type FairPlayOptions = {
  /** Only enforce while a live match screen is mounted. */
  active: boolean;
  matchId?: string;
  /** Heartbeat cadence in ms (default 5000). */
  heartbeatMs?: number;
  /** Called when the server reports this participant is disqualified. */
  onDisqualified?: (reason: string) => void;
};

/**
 * Fair-play guard for the live match.
 *
 *  - Switching window / tab, leaving fullscreen or opening devtools is an
 *    instant disqualification (reported once, then the server locks the user).
 *  - Copy / cut / paste / right-click are blocked outright and logged.
 *  - A heartbeat keeps presence fresh and surfaces disqualification instantly.
 */
export function useFairPlay({
  active,
  matchId,
  heartbeatMs = 5000,
  onDisqualified,
}: FairPlayOptions) {
  const reported = useRef<Set<string>>(new Set());
  const disqualified = useRef(false);

  useEffect(() => {
    if (!active) return;

    const report = (type: ViolationType, detail: string) => {
      if (disqualified.current) return;
      const key = CRITICAL.includes(type) ? "critical" : type;
      if (reported.current.has(key)) return;
      reported.current.add(key);

      void apiPost<{ disqualified: boolean; message: string }>("/api/violation", {
        type,
        detail,
        matchId,
      }).then((res) => {
        if (res.ok && res.data.disqualified) {
          disqualified.current = true;
          onDisqualified?.(res.data.message);
        }
      });
    };

    const onBlur = () => report("blur", "Window lost focus");
    const onVisibility = () => {
      if (document.hidden) report("visibility_hidden", "Tab hidden");
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) report("fullscreen_exit", "Left fullscreen");
    };
    const block = (type: ViolationType) => (e: Event) => {
      e.preventDefault();
      report(type, "Clipboard blocked");
    };
    const blockContext = (e: Event) => {
      e.preventDefault();
      report("context_menu", "Context menu blocked");
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("copy", block("copy"), true);
    document.addEventListener("cut", block("cut"), true);
    document.addEventListener("paste", block("paste"), true);
    document.addEventListener("contextmenu", blockContext, true);

    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("copy", block("copy"), true);
      document.removeEventListener("cut", block("cut"), true);
      document.removeEventListener("paste", block("paste"), true);
      document.removeEventListener("contextmenu", blockContext, true);
    };
  }, [active, matchId, onDisqualified]);

  useEffect(() => {
    if (!active) return;
    let stop = false;

    const ping = async () => {
      const res = await apiPost<{
        disqualified: boolean;
        disqualification: { reason?: string } | null;
      }>("/api/match/heartbeat", {});
      if (stop) return;
      if (res.ok && res.data.disqualified && !disqualified.current) {
        disqualified.current = true;
        onDisqualified?.(
          res.data.disqualification?.reason ?? "Disqualified (fair-play violation)",
        );
      }
    };

    void ping();
    const id = setInterval(() => void ping(), heartbeatMs);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [active, heartbeatMs, onDisqualified]);
}
