import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const schema = z.object({
  matricula: z.string().min(1, "Matrícula obrigatória").trim(),
  nome: z.string().min(2, "Nome obrigatório").trim(),
  cargo: z.string().trim().nullable().optional(),
  email: z.string().email("E-mail inválido").trim().toLowerCase().nullable().optional().or(z.literal("")),
  telefone: z.string().trim().nullable().optional().or(z.literal("")),
  setorId: z.string().uuid("Selecione o setor"),
  ativo: z.boolean().optional().default(true),
}).transform((d) => ({ ...d, email: d.email || null, telefone: d.telefone || null }));

export async function GET() {
  try {
    const list = await prisma.colaborador.findMany({
      orderBy: { nome: "asc" },
      include: { setor: { select: { nome: true } }, _count: { select: { patrimonios: true } } },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("[COLAB_GET]", e);
    return NextResponse.json({ error: "Erro ao listar colaboradores." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    const colab = await prisma.colaborador.create({ data });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "CREATE", entity: "Colaborador", entityId: colab.id },
    });
    return NextResponse.json(colab, { status: 201 });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: "Dados inválidos", issues: e.flatten()?.fieldErrors }, { status: 400 });
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Matrícula já cadastrada." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar colaborador." }, { status: 500 });
  }
}
