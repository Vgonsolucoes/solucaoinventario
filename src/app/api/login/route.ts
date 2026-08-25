import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido").trim().toLowerCase(),
  password: z.string().min(4, "Senha mínima de 4 caracteres"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    // 1) Tenta User (admin / usuário interno)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      if (!user.active) {
        return NextResponse.json(
          { error: "E-mail ou senha incorretos." },
          { status: 401 },
        );
      }
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return NextResponse.json(
          { error: "E-mail ou senha incorretos." },
          { status: 401 },
        );
      }

      await createSession({
        id: user.id,
        kind: "USER",
        email: user.email,
        name: user.name,
        role: user.role,
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          entity: "User",
          entityId: user.id,
          details: { success: true, kind: "USER" },
        },
      });

      return NextResponse.json({
        ok: true,
        kind: "USER",
        user: { id: user.id, name: user.name, email: user.email, role: user.role, setoresPermitidosIds: [] as string[] },
      });
    }

    // 2) Tenta Colaborador (senha cadastrada no cadastro de Colaboradores)
    if (!email) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }
    const colab = await prisma.colaborador.findFirst({
      where: { email },
      include: { setoresPermitidos: { select: { id: true } } },
    });

    if (!colab || !colab.ativo || !colab.passwordHash) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    const matchColab = await bcrypt.compare(password, colab.passwordHash);
    if (!matchColab) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    const setoresPermitidosIds = colab.setoresPermitidos.map((s) => s.id);
    // Garante que o setor principal também está nos permitidos (conveniência)
    if (colab.setorId && !setoresPermitidosIds.includes(colab.setorId)) {
      setoresPermitidosIds.push(colab.setorId);
    }

    await createSession({
      id: colab.id,
      kind: "COLABORADOR",
      email: colab.email || "",
      name: colab.nome,
      role: "USER",
      setoresPermitidosIds,
    });

    await prisma.auditLog.create({
      data: {
        action: "LOGIN",
        entity: "Colaborador",
        entityId: colab.id,
        details: { success: true, kind: "COLABORADOR", setoresPermitidosIds },
      },
    });

    return NextResponse.json({
      ok: true,
      kind: "COLABORADOR",
      user: {
        id: colab.id,
        name: colab.nome,
        email: colab.email || "",
        role: "USER",
        matricula: colab.matricula,
        setoresPermitidosIds,
      },
    });
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
