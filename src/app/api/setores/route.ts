import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório (mínimo 2 caracteres)").trim(),
  descricao: z.string().trim().nullable().optional(),
  ativo: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const list = await prisma.setor.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { colaboradores: true, patrimonios: true } } },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("[SETOR_GET]", e);
    return NextResponse.json({ error: "Erro ao listar setores." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const json = await req.json();
    const data = schema.parse(json);

    const setor = await prisma.setor.create({
      data: {
        nome: data.nome,
        descricao: data.descricao || null,
        ativo: data.ativo ?? true,
      },
    });

    await prisma.auditLog.create({
      data: { userId: s.sub, action: "CREATE", entity: "Setor", entityId: setor.id },
    });
    return NextResponse.json(setor, { status: 201 });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: "Dados inválidos", issues: e.flatten()?.fieldErrors }, { status: 400 });
    return NextResponse.json({ error: "Erro ao criar setor." }, { status: 500 });
  }
}
