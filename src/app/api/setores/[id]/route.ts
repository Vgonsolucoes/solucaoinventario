import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const schema = z.object({
  nome: z.string().min(2).trim(),
  descricao: z.string().trim().nullable().optional(),
  ativo: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const data = schema.partial().parse(await req.json());
    const updated = await prisma.setor.update({
      where: { id: params.id },
      data,
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "UPDATE", entity: "Setor", entityId: updated.id },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    return NextResponse.json({ error: "Erro ao atualizar setor." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    // Não apaga fisicamente, apenas inativa
    const updated = await prisma.setor.update({
      where: { id: params.id },
      data: { ativo: false },
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "DELETE_LOGIC", entity: "Setor", entityId: updated.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir setor." }, { status: 500 });
  }
}
