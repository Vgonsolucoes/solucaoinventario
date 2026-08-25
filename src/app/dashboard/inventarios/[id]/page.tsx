"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, Loader2, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Inv = {
  id: string; nome: string; descricao: string | null; status: string;
  dataInicio: string | Date; dataFim: string | Date | null;
  setor: { nome: string } | null; colaborador: { nome: string } | null;
  _count: { itens: number };
};

export default function InventarioDetailPage({ params }: { params: { id: string } }) {
  const [inv, setInv] = useState<Inv | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const r = await fetch("/api/inventarios");
      if (r.ok) {
        const arr = await r.json();
        setInv(arr.find((x: Inv) => x.id === params.id) || null);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mr-2"/>Carregando...
    </div>
  );
  if (!inv) return (
    <div className="space-y-3">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/inventarios"><ArrowLeft className="w-4 h-4 mr-1"/>Voltar</Link>
      </Button>
      <Card><CardContent className="py-10 text-center text-muted-foreground">Inventário não encontrado.</CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/inventarios"><ArrowLeft className="w-4 h-4 mr-1"/>Voltar</Link>
          </Button>
          <h1 className="text-2xl font-bold text-solucao-blue flex items-center gap-2 mt-1">
            <ClipboardList className="w-6 h-6"/> {inv.nome}
          </h1>
          <p className="text-sm text-muted-foreground">{inv.descricao || "Sem descrição."}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={statusCls(inv.status)}>{statusLbl(inv.status)}</Badge>
          <Button asChild className="bg-solucao-orange hover:bg-solucao-orange/90">
            <Link href="/dashboard/qrcode">Abrir Leitor QR</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Mini title="Itens Lidos" valor={inv._count.itens} icon={<Package2 className="w-5 h-5"/>} />
        <Mini title="Setor" valor={inv.setor?.nome || "Todos"} />
        <Mini title="Responsável" valor={inv.colaborador?.nome || "—"} />
        <Mini title="Início" valor={new Date(inv.dataInicio).toLocaleDateString("pt-BR")} />
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Itens do Inventário</CardTitle>
          <CardDescription>
            Para começar a contagem, clique em &quot;Abrir Leitor QR&quot; e aponte para as etiquetas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center text-muted-foreground text-sm">
            Integração de itens está pronta para expansão. Navegue até a leitura QR para começar a
            associar os patrimônios.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Mini({ title, valor, icon }: { title: string; valor: string | number; icon?: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="py-5 flex items-start gap-3">
        {icon && <div className="text-solucao-orange">{icon}</div>}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="font-semibold text-lg truncate" title={String(valor)}>{valor}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function statusLbl(s: string) {
  return s === "ABERTO" ? "Aberto" : s === "EM_ANDAMENTO" ? "Em andamento" :
    s === "PAUSADO" ? "Pausado" : s === "CONCLUIDO" ? "Concluído" : "Cancelado";
}
function statusCls(s: string) {
  return s === "ABERTO" ? "bg-slate-200/60 text-slate-700" :
    s === "EM_ANDAMENTO" ? "bg-blue-100 text-blue-700 border-blue-200" :
    s === "PAUSADO" ? "bg-amber-100 text-amber-700 border-amber-200" :
    s === "CONCLUIDO" ? "bg-emerald-600 text-white" :
    "bg-rose-100 text-rose-700 border-rose-200";
}
