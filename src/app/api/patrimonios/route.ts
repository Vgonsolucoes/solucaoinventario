import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { PatrimonioEstado } from "@prisma/client";

const schema = z.object({
  tombamento: z.string().min(1, "Tombamento obrigatório").trim(),
  descricao: z.string().min(3, "Descrição obrigatória").trim(),
  numeroSerie: z.string().trim().nullable().optional().or(z.literal("")),
  modelo: z.string().trim().nullable().optional().or(z.literal("")),
  marca: z.string().trim().nullable().optional().or(z.literal("")),
  valorCompra: z.coerce.number().nullable().optional(),
  dataCompra: z.string().nullable().optional(),
  estado: z.nativeEnum(PatrimonioEstado).optional().default(PatrimonioEstado.BOM),
  observacao: z.string().trim().nullable().optional().or(z.literal("")),
  categoriaId: z.string().uuid("Selecione a categoria"),
  setorId: z.string().uuid("Selecione o setor"),
  colaboradorId: z.string().uuid().nullable().optional().or(z.literal("")),
  ativo: z.boolean().optional().default(true),
}).transform((d) => ({
  ...d,
  numeroSerie: d.numeroSerie || null,
  modelo: d.modelo || null,
  marca: d.marca || null,
  observacao: d.observacao || null,
  colaboradorId: d.colaboradorId || null,
  dataCompra: d.dataCompra ? new Date(d.dataCompra) : null,
}));

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase();
    const list = await prisma.patrimonio.findMany({
      where: {
        ativo: true,
        ...(q ? {
          OR: [
            { tombamento: { contains: q } },
            { descricao: { contains: q, mode: "insensitive" } },
            { numeroSerie: { contains: q, mode: "insensitive" } },
            { marca: { contains: q, mode: "insensitive" } },
            { modelo: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        categoria: { select: { nome: true } },
        setor: { select: { nome: true } },
        colaborador: { select: { nome: true } },
      },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("[PATRIM_GET]", e);
    return NextResponse.json({ error: "Erro ao listar patrimônios." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    const qrCodeData = `patrimonio:${data.tombamento}`;
    const pat = await prisma.patrimonio.create({
      data: { ...data, qrCodeData },
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "CREATE", entity: "Patrimonio", entityId: pat.id },
    });
    return NextResponse.json(pat, { status: 201 });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: "Dados inválidos", issues: e.flatten()?.fieldErrors }, { status: 400 });
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Tombamento já cadastrado." }, { status: 409 });
    }
    console.error("[PATRIM_POST]", e);
    return NextResponse.json({ error: "Erro ao criar patrimônio." }, { status: 500 });
  }
}
