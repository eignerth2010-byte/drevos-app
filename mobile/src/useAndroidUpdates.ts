import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { ANDROID_VERSION_CODE, UPDATE_MANIFEST_URL } from "./project";
import { releaseStorage } from "./releaseStorage";
import {
  AndroidUpdates,
  UpdatePreferences,
  automaticCheckDue,
  parseAndroidRelease,
  parseUpdatePreferences,
} from "./updates";

export function useAndroidUpdates(): AndroidUpdates | null {
  const preferences = useRef<UpdatePreferences>({
    automatic: true,
    lastChecked: 0,
  });
  const alive = useRef(false),
    loaded = useRef(false),
    running = useRef(false);
  const saveTail = useRef<Promise<unknown>>(Promise.resolve());
  const controller = useRef<AbortController | null>(null);
  const [state, setState] = useState<
    Omit<AndroidUpdates, "check" | "setAutomatic">
  >({
    automatic: true,
    ready: false,
    checking: false,
    lastChecked: 0,
    status: "idle",
    available: null,
  });
  function save() {
    const snapshot = JSON.stringify(preferences.current);
    saveTail.current = saveTail.current
      .catch(() => {})
      .then(() => releaseStorage.set("androidUpdates.v1", snapshot));
    void saveTail.current.catch(() => {
      if (alive.current) setState((s) => ({ ...s, status: "settings" }));
    });
  }
  async function check(manual = false) {
    if (
      !alive.current ||
      !loaded.current ||
      running.current ||
      AppState.currentState !== "active" ||
      (!manual && !automaticCheckDue(preferences.current, Date.now()))
    )
      return;
    running.current = true;
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 8000);
    preferences.current = { ...preferences.current, lastChecked: Date.now() };
    save();
    setState((s) => ({
      ...s,
      checking: true,
      lastChecked: preferences.current.lastChecked,
    }));
    try {
      const response = await fetch(UPDATE_MANIFEST_URL, {
        signal: abort.signal,
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (
        !response.ok ||
        (response.url && response.url !== UPDATE_MANIFEST_URL)
      )
        throw new Error("update-network");
      const release = parseAndroidRelease(await response.text());
      if (!alive.current || abort.signal.aborted) return;
      const available =
        release.versionCode > ANDROID_VERSION_CODE ? release : null;
      setState((s) => ({
        ...s,
        available,
        status: available ? "available" : "current",
      }));
    } catch {
      if (alive.current) setState((s) => ({ ...s, status: "network" }));
    } finally {
      clearTimeout(timeout);
      running.current = false;
      if (alive.current) setState((s) => ({ ...s, checking: false }));
    }
  }
  useEffect(() => {
    if (Platform.OS !== "android") return;
    alive.current = true;
    void releaseStorage
      .get("androidUpdates.v1")
      .then((text) => {
        preferences.current = parseUpdatePreferences(text);
        if (alive.current)
          setState((s) => ({ ...s, ...preferences.current, ready: true }));
      })
      .catch(() => {
        preferences.current = { automatic: false, lastChecked: 0 };
        if (alive.current)
          setState((s) => ({
            ...s,
            ...preferences.current,
            ready: true,
            status: "settings",
          }));
      })
      .finally(() => {
        if (alive.current) {
          loaded.current = true;
          void check();
        }
      });
    const listener = AppState.addEventListener("change", (next) => {
      if (next === "active") void check();
      else controller.current?.abort();
    });
    return () => {
      alive.current = false;
      controller.current?.abort();
      listener.remove();
    };
  }, []);
  if (Platform.OS !== "android") return null;
  return {
    ...state,
    check: () => {
      void check(true);
    },
    setAutomatic: (automatic) => {
      if (!loaded.current) return;
      preferences.current = { ...preferences.current, automatic };
      setState((s) => ({ ...s, automatic }));
      save();
      if (automatic) void check();
    },
  };
}
