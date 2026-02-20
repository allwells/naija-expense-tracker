"use client";

import { useEffect, useRef, useState } from "react";
import { IconWifi, IconWifiOff, IconLoader2, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type ConnectionPhase =
  | "online"
  | "offline"
  | "reconnecting"
  | "server-unreachable";

interface ConnectionState {
  phase: ConnectionPhase;
  message: string;
  attempt: number;
}

const HEALTH_URL = "/api/health";
const RETRY_INTERVAL_MS = 8_000; // 8 s between probes
const MAX_FAST_RETRIES = 3; // first N retries log attempt count

function buildState(phase: ConnectionPhase, attempt: number): ConnectionState {
  const messages: Record<ConnectionPhase, string> = {
    online: "Back online",
    offline: "No internet connection — check your network",
    reconnecting:
      attempt <= MAX_FAST_RETRIES
        ? `Reconnecting… (attempt ${attempt})`
        : "Still trying to reconnect…",
    "server-unreachable":
      "Connected to network but server is unreachable — retrying",
  };
  return { phase, message: messages[phase], attempt };
}

async function probeServer(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function ConnectionStatusBar() {
  const [state, setState] = useState<ConnectionState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  const clearTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const scheduleRetry = (currentAttempt: number) => {
    clearTimer();
    retryTimerRef.current = setTimeout(() => {
      runCheck(currentAttempt + 1);
    }, RETRY_INTERVAL_MS);
  };

  const runCheck = async (attempt: number) => {
    attemptRef.current = attempt;

    // 1. Check navigator.onLine first — no network at all
    if (!navigator.onLine) {
      setState(buildState("offline", attempt));
      scheduleRetry(attempt);
      return;
    }

    // 2. Device claims to be online — probe the server
    setState(buildState("reconnecting", attempt));

    const reached = await probeServer();

    if (reached) {
      // Server reachable → we are fully online
      setState(buildState("online", attempt));
      clearTimer();
      // Auto-hide the "Back online" bar after 3 s
      retryTimerRef.current = setTimeout(() => {
        setState(null);
        setDismissed(false);
      }, 3_000);
    } else {
      // Device says online but server not reachable
      setState(buildState("server-unreachable", attempt));
      scheduleRetry(attempt);
    }
  };

  // ── Event listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleOffline = () => {
      clearTimer();
      attemptRef.current = 1;
      setDismissed(false);
      setState(buildState("offline", 1));
      scheduleRetry(1);
    };

    const handleOnline = () => {
      // Browser thinks we're back — confirm by probing the server
      clearTimer();
      attemptRef.current = 1;
      setDismissed(false);
      runCheck(1);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!state || dismissed || state.phase === "online") {
    // If phase is "online" we briefly show the success bar (handled by timeout above)
    if (state?.phase !== "online") return null;
  }

  const isOnline = state.phase === "online";
  const isReconnecting = state.phase === "reconnecting";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-0 inset-x-0 z-[9999]",
        "flex items-center justify-between gap-3 px-4 py-2",
        "text-xs font-medium",
        "border-b transition-colors duration-300",
        isOnline
          ? "bg-emerald-950/95 border-emerald-800 text-emerald-200"
          : "bg-destructive/95 border-destructive text-destructive-foreground",
      )}
    >
      {/* Left: icon + message */}
      <div className="flex items-center gap-2 min-w-0">
        {isOnline ? (
          <IconWifi className="size-3.5 shrink-0" />
        ) : isReconnecting ? (
          <IconLoader2 className="size-3.5 shrink-0 animate-spin" />
        ) : (
          <IconWifiOff className="size-3.5 shrink-0" />
        )}
        <span className="truncate">{state.message}</span>
      </div>

      {/* Right: dismiss (only for error states) */}
      {!isOnline && (
        <button
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <IconX className="size-3.5" />
        </button>
      )}
    </div>
  );
}
