import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package2,
  Users,
  Building2,
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const [
    totalPatrimonios,
    totalColaboradores,
    totalSetores,
    totalCategorias,
    totalInventarios,
    inventariosEmAndamento,
    inventariosConcluidos,
  ] = await Promise.all([
    prisma.patrimonio.count({ where: { ativo: true } }),
    prisma.colaborador.count({ where: { ativo: true } }),
    prisma.setor.count({ where: { ativo: true } }),
    prisma.categoria.count({ where: { ativo: true } }),
    prisma.inventario.count(),
    prisma.inventario.count({ where: { status: "EM_ANDAMENTO" } }),
    prisma.inventario.count({ where: { status: "CONCLUIDO" } }),
  ]);

  const recentes = await prisma.patrimonio.findMany({
    where: { ativo: true },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      categoria: { select: { nome: true } },
      setor: { select: { nome: true } },
      colaborador: { select: { nome: true } },
    },
  });

  const cards = [
    {
      title: "Patrimônios Ativos",
      value: totalPatrimonios.toLocaleString("pt-BR"),
      desc: "Bens cadastrados e ativos",
      icon: Package2,
      href: "/dashboard/patrimonios",
      tone: "bg-solucao-blue/10 text-solucao-blue",
    },
    {
      title: "Colaboradores",
      value: totalColaboradores.toLocaleString("pt-BR"),
      desc: "Responsáveis cadastrados",
      icon: Users,
      href: "/dashboard/colaboradores",
      tone: "bg-solucao-orange/10 text-solucao-orange",
    },
    {
      title: "Setores",
      value: totalSetores.toLocaleString("pt-BR"),
      desc: "Departamentos ativos",
      icon: Building2,
      href: "/dashboard/setores",
      tone: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Categorias",
      value: totalCategorias.toLocaleString("pt-BR"),
      desc: "Tipos de patrimônio",
      icon: Tag,
      href: "/dashboard/categorias",
      tone: "bg-violet-500/10 text-violet-600",
    },
    {
      title: "Inventários Totais",
      value: totalInventarios.toLocaleString("pt-BR"),
      desc: "Histórico completo",
      icon: ClipboardList,
      href: "/dashboard/inventarios",
      tone: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Em Andamento",
      value: inventariosEmAndamento.toLocaleString("pt-BR"),
      desc: "Inventários abertos",
      icon: TrendingUp,
      href: "/dashboard/inventarios",
      tone: "bg-amber-500/10 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-solucao-blue">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral do patrimônio da Solução Equipamentos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-solucao-blue hover:bg-solucao-blue/90">
            <Link href="/dashboard/patrimonios/new">
              <Package2 className="w-4 h-4 mr-2" />
              Novo Patrimônio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/inventarios/new">
              <ClipboardList className="w-4 h-4 mr-2" />
              Novo Inventário
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.title}
              href={c.href}
              className="transition-transform hover:-translate-y-0.5"
            >
              <Card className="h-full border-0 shadow-sm hover:shadow-md">
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {c.title}
                    </CardTitle>
                  </div>
                  <div className={`p-2 rounded-lg ${c.tone}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-solucao-blue">
                    {c.value}
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {c.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Patrimônios Recentes</CardTitle>
                <CardDescription>
                  Últimos bens adicionados ao sistema
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/patrimonios">Ver todos</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                Nenhum patrimônio cadastrado ainda.
              </div>
            ) : (
              <div className="divide-y">
                {recentes.map((p) => (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        <span className="text-solucao-orange mr-2">
                          #{p.tombamento}
                        </span>
                        {p.descricao}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.categoria?.nome}
                        {p.setor?.nome ? ` · ${p.setor.nome}` : ""}
                        {p.colaborador?.nome ? ` · Resp.: ${p.colaborador.nome}` : ""}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {estadoLabel(p.estado)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Status Inventários</CardTitle>
            <CardDescription>Resumo rápido das contagens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <StatusRow
                icon={CheckCircle2}
                color="text-emerald-600"
                label="Concluídos"
                value={inventariosConcluidos}
              />
              <StatusRow
                icon={TrendingUp}
                color="text-amber-600"
                label="Em Andamento"
                value={inventariosEmAndamento}
              />
              <StatusRow
                icon={ClipboardList}
                color="text-solucao-blue"
                label="Total"
                value={totalInventarios}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusRow({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof CheckCircle2;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-semibold text-lg text-solucao-blue">
        {value.toLocaleString("pt-BR")}
      </span>
    </div>
  );
}

function estadoLabel(e: string) {
  switch (e) {
    case "NOVO":
      return "Novo";
    case "BOM":
      return "Bom";
    case "REGULAR":
      return "Regular";
    case "RUIM":
      return "Ruim";
    case "INSERVIVEL":
      return "Inservível";
    case "DESCARTADO":
      return "Descartado";
    default:
      return e;
  }
}
