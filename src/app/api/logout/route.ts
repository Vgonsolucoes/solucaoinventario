import { NextResponse } from "next/server";
import { destroySession, requireSession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();
  } catch {
    // ignora
  }
  return NextResponse.json({ ok: true });
}
