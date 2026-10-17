import { ApiError } from "./api";

/** User-facing message for a failed API call. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message && !/fetch/i.test(error.message)) return error.message;
  return fallback;
}
