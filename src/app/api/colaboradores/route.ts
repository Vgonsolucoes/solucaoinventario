import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
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
  password: z.string().min(4, "Senha mínima de 4 caracteres").trim().optional().or(z.literal("")),
  setoresPermitidosIds: z.array(z.string().uuid()).optional().default([]),
}).transform((d) => ({
  ...d,
  email: d.email || null,
  telefone: d.telefone || null,
  password: d.password || undefined,
  setoresPermitidosIds: d.setoresPermitidosIds || [],
}));

export async function GET() {
  try {
    const list = await prisma.colaborador.findMany({
      orderBy: { nome: "asc" },
      include: {
        setor: { select: { id: true, nome: true } },
        setoresPermitidos: { select: { id: true, nome: true } },
        _count: { select: { patrimonios: true } },
      },
    });
    return NextResponse.json(list.map((c) => ({
      id: c.id, matricula: c.matricula, nome: c.nome, cargo: c.cargo, email: c.email,
      telefone: c.telefone, ativo: c.ativo,
      setor: { id: c.setor.id, nome: c.setor.nome },
      setoresPermitidos: c.setoresPermitidos,
      _count: c._count,
    })));
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
    const setIds = Array.from(new Set(data.setoresPermitidosIds || [])) as string[];

    const created = await prisma.colaborador.create({
      data: {
        matricula: data.matricula,
        nome: data.nome,
        cargo: data.cargo,
        email: data.email,
        telefone: data.telefone,
        setorId: data.setorId,
        ativo: data.ativo,
        passwordHash: data.password ? await bcrypt.hash(data.password, 12) : null,
        setoresPermitidos: {
          connect: setIds.map((id) => ({ id })),
        },
      },
      include: { setoresPermitidos: { select: { id: true, nome: true } } },
    });

    await prisma.auditLog.create({
      data: { userId: s.sub, action: "CREATE", entity: "Colaborador", entityId: created.id, details: { setoresPermitidos: setIds } },
    });

    return NextResponse.json({ ...created, passwordHash: undefined }, { status: 201 });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: "Dados inválidos", issues: e.flatten()?.fieldErrors }, { status: 400 });
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Matrícula já cadastrada." }, { status: 409 });
    }
    console.error("[COLAB_POST]", e);
    return NextResponse.json({ error: "Erro ao criar colaborador." }, { status: 500 });
  }
}
