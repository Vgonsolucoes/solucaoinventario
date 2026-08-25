import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const _base = z.object({
  matricula: z.string().min(1).trim(),
  nome: z.string().min(2).trim(),
  cargo: z.string().trim().nullable().optional(),
  email: z.string().email().trim().toLowerCase().nullable().optional().or(z.literal("")),
  telefone: z.string().trim().nullable().optional().or(z.literal("")),
  setorId: z.string().uuid(),
  ativo: z.boolean().optional(),
});
const schema = _base.transform((d) => ({ ...d, email: d.email || null, telefone: d.telefone || null }));
const schemaPatch = _base.partial().transform((d: any) => ({ ...d, email: (d.email === undefined || d.email === null) ? d.email : (d.email || null), telefone: (d.telefone === undefined || d.telefone === null) ? d.telefone : (d.telefone || null) }));

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const data = schemaPatch.parse(await req.json());
    const updated = await prisma.colaborador.update({ where: { id: params.id }, data });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "UPDATE", entity: "Colaborador", entityId: updated.id },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar colaborador." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const updated = await prisma.colaborador.update({
      where: { id: params.id },
      data: { ativo: false },
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "DELETE_LOGIC", entity: "Colaborador", entityId: updated.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir colaborador." }, { status: 500 });
  }
}
