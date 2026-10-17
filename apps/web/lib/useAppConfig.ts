"use client";

import { useEffect, useState } from "react";
import { api, type AppConfig } from "./api";

let pending: Promise<AppConfig | null> | null = null;

/**
 * Fetches `/api/config` once per page load and shares the result between
 * components (topbar + game controls). `failed` lets callers stop waiting
 * when the server is unreachable instead of blocking forever.
 */
export function useAppConfig(): { config: AppConfig | null; failed: boolean } {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    pending ??= api.getConfig().catch(() => {
      pending = null;
      return null;
    });
    void pending.then((result) => {
      if (!active) return;
      if (result) setConfig(result);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return { config, failed };
}
