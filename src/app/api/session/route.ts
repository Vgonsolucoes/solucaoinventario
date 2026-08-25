import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { ok: false, user: null },
        { status: 401 },
      );
    }
    return NextResponse.json({
      ok: true,
      user: {
        id: session.sub,
        kind: session.kind || "USER",
        email: session.email,
        name: session.name,
        role: session.role,
        setoresPermitidosIds: session.setoresPermitidosIds || [],
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, user: null, error: "Erro interno" },
      { status: 500 },
    );
  }
}
