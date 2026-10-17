"use client";

import { useCallback, useEffect, useState } from "react";
import { HOST_TOKEN_STORAGE_KEY } from "./config";

/**
 * PRD section 49 — Host API must be authenticated. V1 scaffold uses a
 * single shared bearer token (HOST_TOKEN on the server) entered once by
 * the host and kept in localStorage — swap for real login when the
 * admin/host identity system is designed.
 */
export function useHostToken(): {
  token: string | null;
  /** False until localStorage has been read (avoids flashing the login form). */
  ready: boolean;
  setToken: (value: string) => void;
  clearToken: () => void;
} {
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setTokenState(window.localStorage.getItem(HOST_TOKEN_STORAGE_KEY));
    } catch {
      setTokenState(null);
    }
    setReady(true);
  }, []);

  const setToken = useCallback((value: string) => {
    try {
      window.localStorage.setItem(HOST_TOKEN_STORAGE_KEY, value);
    } catch {
      // Storage blocked: the token still works for this page view.
    }
    setTokenState(value);
  }, []);

  const clearToken = useCallback(() => {
    try {
      window.localStorage.removeItem(HOST_TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    setTokenState(null);
  }, []);

  return { token, ready, setToken, clearToken };
}
