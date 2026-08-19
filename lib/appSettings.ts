import { prisma } from "./db";

/**
 * Registry of admin-editable, non-secret app settings backed by the
 * AppSetting table. Adding a new toggle means: add it here with a
 * default, read it via getAppSetting() where it should take effect, and
 * it shows up in the admin Settings page automatically. Secrets (API
 * keys, SMTP credentials) do NOT belong here — those stay in env vars.
 */
export const APP_SETTINGS_REGISTRY = {
  signupsEnabled: {
    label: "Allow new signups",
    description: "Turn off to stop new accounts from being created. Existing users can still log in.",
    default: true as boolean,
  },
} satisfies Record<string, { label: string; description: string; default: boolean }>;

export type AppSettingKey = keyof typeof APP_SETTINGS_REGISTRY;

export async function getAppSetting(key: AppSettingKey): Promise<boolean> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  if (!row) return APP_SETTINGS_REGISTRY[key].default;
  return typeof row.value === "boolean" ? row.value : APP_SETTINGS_REGISTRY[key].default;
}

export async function getAllAppSettings(): Promise<Record<AppSettingKey, boolean>> {
  const rows = await prisma.appSetting.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const result = {} as Record<AppSettingKey, boolean>;
  for (const key of Object.keys(APP_SETTINGS_REGISTRY) as AppSettingKey[]) {
    const stored = byKey.get(key);
    result[key] = typeof stored === "boolean" ? stored : APP_SETTINGS_REGISTRY[key].default;
  }
  return result;
}
