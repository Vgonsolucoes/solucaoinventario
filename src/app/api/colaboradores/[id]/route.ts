import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
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
  password: z.string().trim().optional().or(z.literal("")),
  setoresPermitidosIds: z.array(z.string().uuid()).optional(),
});
const schema = _base.transform((d) => ({ ...d, email: d.email || null, telefone: d.telefone || null, password: d.password || undefined }));
const schemaPatch = _base.partial().transform((d: any) => ({
  ...d,
  email: (d.email === undefined || d.email === null) ? d.email : (d.email || null),
  telefone: (d.telefone === undefined || d.telefone === null) ? d.telefone : (d.telefone || null),
  password: d.password || undefined,
}));

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const data = schemaPatch.parse(await req.json());

    const updateData: any = {};
    if (data.matricula !== undefined) updateData.matricula = data.matricula;
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.cargo !== undefined) updateData.cargo = data.cargo;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.telefone !== undefined) updateData.telefone = data.telefone;
    if (data.setorId !== undefined) updateData.setorId = data.setorId;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);

    if (data.setoresPermitidosIds) {
      const ids = Array.from(new Set(data.setoresPermitidosIds)) as string[];
      updateData.setoresPermitidos = {
        set: ids.map((id) => ({ id })),
      };
    }

    const updated = await prisma.colaborador.update({
      where: { id: params.id },
      data: updateData,
      include: { setoresPermitidos: { select: { id: true, nome: true } } },
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "UPDATE", entity: "Colaborador", entityId: updated.id, details: { setoresPermitidosIds: data.setoresPermitidosIds || null, senhaAlterada: !!data.password } },
    });
    return NextResponse.json({ ...updated, passwordHash: undefined });
  } catch (e) {
    console.error("[COLAB_PATCH]", e);
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
