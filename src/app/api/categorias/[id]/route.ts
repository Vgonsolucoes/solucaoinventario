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
    const updated = await prisma.categoria.update({ where: { id: params.id }, data });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "UPDATE", entity: "Categoria", entityId: updated.id },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar categoria." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const updated = await prisma.categoria.update({
      where: { id: params.id },
      data: { ativo: false },
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "DELETE_LOGIC", entity: "Categoria", entityId: updated.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir categoria." }, { status: 500 });
  }
}
