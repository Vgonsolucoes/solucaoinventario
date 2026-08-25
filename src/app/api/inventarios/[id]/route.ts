import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { InventarioStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const json = await req.json();
    const data: any = {};
    if ("nome" in json) data.nome = json.nome;
    if ("descricao" in json) data.descricao = json.descricao;
    if ("status" in json && Object.values(InventarioStatus).includes(json.status)) {
      data.status = json.status;
      if (json.status === "CONCLUIDO") data.dataFim = new Date();
    }
    if ("setorId" in json) data.setorId = json.setorId || null;
    if ("colaboradorId" in json) data.colaboradorId = json.colaboradorId || null;
    if ("dataFim" in json) data.dataFim = json.dataFim ? new Date(json.dataFim) : null;
    const updated = await prisma.inventario.update({
      where: { id: params.id },
      data,
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "UPDATE", entity: "Inventario", entityId: updated.id },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const s = await verifySession();
  if (!s) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    await prisma.inventario.update({
      where: { id: params.id },
      data: { status: InventarioStatus.CANCELADO },
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: "CANCEL", entity: "Inventario", entityId: params.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao cancelar inventário." }, { status: 500 });
  }
}
