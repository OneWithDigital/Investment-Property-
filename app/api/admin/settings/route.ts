import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { APP_SETTINGS_REGISTRY, getAllAppSettings, type AppSettingKey } from "@/lib/appSettings";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const values = await getAllAppSettings();
  const settings = (Object.keys(APP_SETTINGS_REGISTRY) as AppSettingKey[]).map((key) => ({
    key,
    label: APP_SETTINGS_REGISTRY[key].label,
    description: APP_SETTINGS_REGISTRY[key].description,
    value: values[key],
  }));

  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const key = body?.key;
  const value = body?.value;

  if (typeof key !== "string" || !(key in APP_SETTINGS_REGISTRY)) {
    return NextResponse.json({ error: "Unknown setting key." }, { status: 400 });
  }
  if (typeof value !== "boolean") {
    return NextResponse.json({ error: "value must be a boolean." }, { status: 400 });
  }

  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  return NextResponse.json({ key, value });
}
