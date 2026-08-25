import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { PatrimonioEstado } from "@prisma/client";

const _base = z.object({
  tombamento: z.string().min(1).trim(),
  descricao: z.string().min(3).trim(),
  numeroSerie: z.string().trim().nullable().optional().or(z.literal("")),
  modelo: z.string().trim().nullable().optional().or(z.literal("")),
  marca: z.string().trim().nullable().optional().or(z.literal("")),
  valorCompra: z.coerce.number().nullable().optional(),
  dataCompra: z.string().nullable().optional(),
  estado: z.nativeEnum(PatrimonioEstado).optional(),
  observacao: z.string().trim().nullable().optional().or(z.literal("")),
  categoriaId: z.string().uuid(),
  setorId: z.string().uuid(),
  colaboradorId: z.string().uuid().nullable().optional().or(z.literal("")),
  ativo: z.boolean().optional(),
});
const schema = _base.transform((d) => ({
  ...d,
  numeroSerie: d.numeroSerie || null,
  modelo: d.modelo || null,
  marca: d.marca || null,
  observacao: d.observacao || null,
  colaboradorId: d.colaboradorId || null,
  dataCompra: d.dataCompra ? new Date(d.dataCompra) : null,
  qrCodeData: d.tombamento ? `patrimonio:${d.tombamento}` : undefined,
}));
const schemaPatch = _base.partial().transform((d: any) => ({
  ...d,
  numeroSerie: (d.numeroSerie === undefined || d.numeroSerie === null) ? d.numeroSerie : (d.numeroSerie || null),
  modelo: (d.modelo === undefined || d.modelo === null) ? d.modelo : (d.modelo || null),
  marca: (d.marca === undefined || d.marca === null) ? d.marca : (d.marca || null),
  observacao: (d.observacao === undefined || d.observacao === null) ? d.observacao : (d.observacao || null),
  colaboradorId: (d.colaboradorId === undefined || d.colaboradorId === null) ? d.colaboradorId : (d.colaboradorId || null),
  dataCompra: (d.dataCompra === undefined || d.dataCompra === null) ? d.dataCompra : new Date(d.dataCompra),
  qrCodeData: d.tombamento ? `patrimonio:${d.tombamento}` : undefined,
}));

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const p = await prisma.patrimonio.findUnique({
      where: { id: params.id },
      include: {
        categoria: true,
        setor: true,
        colaborador: true,
      },
    });
    if (!p) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    return NextResponse.json(p);
  } catch {
    return NextResponse.json({ error: "Erro." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const data = schemaPatch.parse(await req.json());
    const atual = await prisma.patrimonio.findUnique({
      where: { id: params.id },
      select: { setorId: true, colaboradorId: true },
    });
    const updated = await prisma.patrimonio.update({
      where: { id: params.id },
      data,
    });
    if (atual && (data.setorId || data.colaboradorId)) {
      await prisma.historicoLocal.create({
        data: {
          patrimonioId: params.id,
          setorAnteriorId: atual.setorId,
          setorNovoId: data.setorId || atual.setorId,
          colaboradorAnteriorId: atual.colaboradorId,
          colaboradorNovoId:
            (data.colaboradorId ?? atual.colaboradorId) || undefined,
          motivo: "Atualização de cadastro",
          movimentadoById: s.sub,
        },
      });
    }
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "UPDATE", entity: "Patrimonio", entityId: updated.id },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATRIM_PATCH]", e);
    return NextResponse.json({ error: "Erro ao atualizar patrimônio." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const updated = await prisma.patrimonio.update({
      where: { id: params.id },
      data: { ativo: false, estado: PatrimonioEstado.DESCARTADO },
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "DELETE_LOGIC", entity: "Patrimonio", entityId: updated.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir patrimônio." }, { status: 500 });
  }
}
