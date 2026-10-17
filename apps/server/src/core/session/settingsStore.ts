import type { SessionSettings } from "@tebak-kata/shared";
import { prisma } from "../db.js";

const SESSION_SETTINGS_ID = "session-settings";

/** Persists the host-editable session settings so a server restart keeps them. */
export const settingsStore = {
  async load(): Promise<Partial<SessionSettings> | null> {
    try {
      const row = await prisma.appSetting.findUnique({ where: { id: SESSION_SETTINGS_ID } });
      return row ? (JSON.parse(row.valueJson) as Partial<SessionSettings>) : null;
    } catch (err) {
      console.error("[settings] failed to load stored settings, using defaults:", err);
      return null;
    }
  },

  async save(settings: SessionSettings): Promise<void> {
    const valueJson = JSON.stringify(settings);
    try {
      await prisma.appSetting.upsert({
        where: { id: SESSION_SETTINGS_ID },
        create: { id: SESSION_SETTINGS_ID, valueJson },
        update: { valueJson },
      });
    } catch (err) {
      console.error("[settings] failed to persist settings:", err);
    }
  },
};
