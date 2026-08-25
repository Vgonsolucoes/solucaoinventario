import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const pat = await prisma.patrimonio.findUnique({
      where: { id: params.id },
      select: { tombamento: true, descricao: true, qrCodeData: true },
    });
    if (!pat) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const payload = pat.qrCodeData || `patrimonio:${pat.tombamento}`;
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 420,
      margin: 1,
      color: { dark: "#003366", light: "#ffffff" },
    });
    return NextResponse.json({
      ok: true,
      qrcode: dataUrl,
      payload,
      tombamento: pat.tombamento,
      descricao: pat.descricao,
    });
  } catch (e) {
    console.error("[QRCODE_GEN]", e);
    return NextResponse.json({ error: "Erro ao gerar QR Code." }, { status: 500 });
  }
}
