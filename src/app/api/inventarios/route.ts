import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { InventarioStatus } from "@prisma/client";

const schema = z.object({
  nome: z.string().min(3, "Nome obrigatório").trim(),
  descricao: z.string().trim().nullable().optional().or(z.literal("")),
  dataInicio: z.string().default(() => new Date().toISOString().slice(0, 10)),
  dataFim: z.string().nullable().optional(),
  status: z.nativeEnum(InventarioStatus).optional().default(InventarioStatus.ABERTO),
  setorId: z.string().uuid().nullable().optional().or(z.literal("")),
  colaboradorId: z.string().uuid().nullable().optional().or(z.literal("")),
}).transform((d) => ({
  ...d,
  descricao: d.descricao || null,
  dataInicio: new Date(d.dataInicio),
  dataFim: d.dataFim ? new Date(d.dataFim) : null,
  setorId: d.setorId || null,
  colaboradorId: d.colaboradorId || null,
}));

export async function GET() {
  try {
    const list = await prisma.inventario.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        setor: { select: { nome: true } },
        colaborador: { select: { nome: true } },
        _count: { select: { itens: true } },
      },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("[INV_GET]", e);
    return NextResponse.json({ error: "Erro ao listar inventários." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    const inv = await prisma.inventario.create({
      data: { ...data, responsavelId: s.sub },
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "CREATE", entity: "Inventario", entityId: inv.id },
    });
    return NextResponse.json(inv, { status: 201 });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: "Dados inválidos", issues: e.flatten()?.fieldErrors }, { status: 400 });
    return NextResponse.json({ error: "Erro ao criar inventário." }, { status: 500 });
  }
}
