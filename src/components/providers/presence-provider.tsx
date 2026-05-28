"use client";

import { useEffect, useRef } from "react";
import axios from "axios";

const IDLE_AFTER_MS = 60_000;
const HEARTBEAT_MS = 60_000;
const ACTIVITY_THROTTLE_MS = 15_000;

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
  const idleTimeoutRef = useRef<number | null>(null);
  const isIdleRef = useRef(false);
  const lastSentAtRef = useRef<number>(0);

  useEffect(() => {
    const setOnline = async () => {
      await axios.post("/api/presence").catch(() => undefined);
    };

    const setIdle = async () => {
      isIdleRef.current = true;
      await axios.patch("/api/presence", { status: "IDLE" }).catch(() => undefined);
    };

    const setOffline = async () => {
      // Best-effort on exit. Prefer sendBeacon, fallback to keepalive fetch.
      try {
        if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
          navigator.sendBeacon("/api/presence/offline");
          return;
        }
      } catch {
        // ignore
      }
      try {
        void fetch("/api/presence/offline", { method: "POST", keepalive: true });
      } catch {
        // ignore
      }
    };

    const registerActivity = async () => {
      const now = Date.now();
      if (now - lastSentAtRef.current < ACTIVITY_THROTTLE_MS) {
        if (idleTimeoutRef.current) {
          window.clearTimeout(idleTimeoutRef.current);
        }
        idleTimeoutRef.current = window.setTimeout(setIdle, IDLE_AFTER_MS);
        return;
      }
      lastSentAtRef.current = now;

      if (isIdleRef.current) {
        isIdleRef.current = false;
        await axios.patch("/api/presence", { status: "ONLINE" }).catch(() => undefined);
      } else {
        await axios.post("/api/presence").catch(() => undefined);
      }

      if (idleTimeoutRef.current) {
        window.clearTimeout(idleTimeoutRef.current);
      }
      idleTimeoutRef.current = window.setTimeout(setIdle, IDLE_AFTER_MS);
    };

    const onVisibilityChange = async () => {
      if (document.hidden) {
        isIdleRef.current = true;
        await axios.patch("/api/presence", { status: "IDLE" }).catch(() => undefined);
      } else {
        await registerActivity();
      }
    };

    void setOnline();
    void registerActivity();

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    const throttledActivity = () => void registerActivity();

    events.forEach((event) => window.addEventListener(event, throttledActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", setOffline);
    window.addEventListener("beforeunload", setOffline);

    const heartbeat = window.setInterval(() => {
      if (!document.hidden) {
        axios.post("/api/presence").catch(() => undefined);
      }
    }, HEARTBEAT_MS);

    return () => {
      events.forEach((event) => window.removeEventListener(event, throttledActivity));
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", setOffline);
      window.removeEventListener("beforeunload", setOffline);
      if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
      window.clearInterval(heartbeat);
    };
  }, []);

  return <>{children}</>;
};

