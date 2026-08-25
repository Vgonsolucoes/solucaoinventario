import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório").trim(),
  descricao: z.string().trim().nullable().optional(),
  ativo: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const list = await prisma.categoria.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { patrimonios: true } } },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("[CATEGORIA_GET]", e);
    return NextResponse.json({ error: "Erro ao listar categorias." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    const cat = await prisma.categoria.create({ data });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "CREATE", entity: "Categoria", entityId: cat.id },
    });
    return NextResponse.json(cat, { status: 201 });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: "Dados inválidos", issues: e.flatten()?.fieldErrors }, { status: 400 });
    return NextResponse.json({ error: "Erro ao criar categoria." }, { status: 500 });
  }
}
