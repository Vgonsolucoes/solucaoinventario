"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  Plus,
  Loader2,
  Search,
  PlayCircle,
  CheckCircle2,
  XCircle,
  PauseCircle,
  ListTodo,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { InventarioStatus } from "@prisma/client";

const schema = z.object({
  nome: z.string().min(3, "Nome obrigatório (mínimo 3)"),
  descricao: z.string().optional(),
  dataInicio: z.string().default(new Date().toISOString().slice(0, 10)),
  dataFim: z.string().optional(),
  status: z.nativeEnum(InventarioStatus).default(InventarioStatus.ABERTO),
  setorId: z.string().uuid().or(z.literal("")).optional(),
  colaboradorId: z.string().uuid().or(z.literal("")).optional(),
}).transform(d => ({
  ...d,
  setorId: d.setorId || null,
  colaboradorId: d.colaboradorId || null,
  dataFim: d.dataFim || null,
}));

type Form = z.infer<typeof schema>;
type Opt = { id: string; nome: string };
type Inv = {
  id: string; nome: string; descricao: string | null; status: InventarioStatus;
  dataInicio: string | Date; dataFim: string | Date | null;
  setor: Opt | null; colaborador: Opt | null;
  _count: { itens: number };
};

export default function InventariosPage() {
  const [list, setList] = useState<Inv[]>([]);
  const [setores, setSetores] = useState<Opt[]>([]);
  const [colaboradores, setColaboradores] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "", descricao: "", dataInicio: new Date().toISOString().slice(0, 10),
      status: InventarioStatus.ABERTO, setorId: "", colaboradorId: "",
    },
  });
  const [status, setorId, colabId, dataInicio, dataFim] = [
    watch("status"), watch("setorId"), watch("colaboradorId"), watch("dataInicio"), watch("dataFim"),
  ];

  async function load() {
    setLoading(true);
    const [i, s, c] = await Promise.all([
      fetch("/api/inventarios").then(r => r.ok ? r.json() : []),
      fetch("/api/setores").then(r => r.ok ? r.json() : []),
      fetch("/api/colaboradores").then(r => r.ok ? r.json() : []),
    ]);
    setList(i);
    setSetores(s.filter((x: any) => x.ativo));
    setColaboradores(c.filter((x: any) => x.ativo));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    reset({
      nome: "", descricao: "",
      dataInicio: new Date().toISOString().slice(0, 10),
      status: InventarioStatus.ABERTO, setorId: "", colaboradorId: "",
    });
    setOpen(true);
  }

  async function onSubmit(data: Form) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, setorId: data.setorId || null, colaboradorId: data.colaboradorId || null }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro.");
      toast.success("Inventário criado!");
      setOpen(false);
      load();
    } catch (e: any) { toast.error(e.message || "Erro."); }
    finally { setSubmitting(false); }
  }

  async function setStatus(id: string, s: InventarioStatus) {
    const r = await fetch(`/api/inventarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    if (r.ok) { toast.success(`Status atualizado para ${statusLabel(s)}.`); load(); }
    else toast.error("Erro ao atualizar status.");
  }

  const filtered = list.filter(i =>
    (i.nome + " " + (i.descricao || "") + " " + (i.setor?.nome || "") + " " + (i.colaborador?.nome || ""))
      .toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-solucao-blue flex items-center gap-2">
            <ClipboardList className="w-6 h-6" /> Inventários
          </h1>
          <p className="text-sm text-muted-foreground">Contagens e levantamentos de patrimônios.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar inventário..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9"/>
          </div>
          <Button className="bg-solucao-blue hover:bg-solucao-blue/90" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2"/>Novo Inventário
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/qrcode"><ListTodo className="w-4 h-4 mr-2"/>Leitura QR</Link>
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{filtered.length} inventário(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2"/>Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhum inventário criado. Clique em &quot;Novo Inventário&quot;.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.nome}</TableCell>
                      <TableCell>{i.setor?.nome || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{i.colaborador?.nome || "-"}</TableCell>
                      <TableCell className="text-sm">{new Date(i.dataInicio).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{i._count.itens}</TableCell>
                      <TableCell><Badge variant={badgeVariant(i.status)} className={badgeClass(i.status)}>{statusLabel(i.status)}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="Abrir">
                            <Link href={`/dashboard/inventarios/${i.id}`}><Eye className="w-4 h-4"/></Link>
                          </Button>
                          {i.status === InventarioStatus.ABERTO && (
                            <Button variant="ghost" size="icon" title="Iniciar contagem" onClick={()=>setStatus(i.id, InventarioStatus.EM_ANDAMENTO)}>
                              <PlayCircle className="w-4 h-4 text-emerald-600"/>
                            </Button>
                          )}
                          {i.status === InventarioStatus.EM_ANDAMENTO && (
                            <Button variant="ghost" size="icon" title="Concluir" onClick={()=>setStatus(i.id, InventarioStatus.CONCLUIDO)}>
                              <CheckCircle2 className="w-4 h-4 text-blue-700"/>
                            </Button>
                          )}
                          {(i.status === InventarioStatus.ABERTO || i.status === InventarioStatus.EM_ANDAMENTO) && (
                            <Button variant="ghost" size="icon" title="Pausar" onClick={()=>setStatus(i.id, InventarioStatus.PAUSADO)}>
                              <PauseCircle className="w-4 h-4 text-amber-600"/>
                            </Button>
                          )}
                          {i.status !== InventarioStatus.CANCELADO && i.status !== InventarioStatus.CONCLUIDO && (
                            <Button variant="ghost" size="icon" title="Cancelar" onClick={()=>{
                              if (confirm("Cancelar este inventário?")) setStatus(i.id, InventarioStatus.CANCELADO);
                            }}>
                              <XCircle className="w-4 h-4 text-destructive"/>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={o=>!o&&setOpen(false)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo Inventário</DialogTitle>
            <DialogDescription>Crie um novo levantamento/contagem.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Nome *" error={errors.nome?.message}>
              <Input placeholder="Ex: Inventário Anual 2025 — Setor TI" {...register("nome")}/>
            </Field>
            <Field label="Descrição">
              <Input placeholder="Objetivo do inventário..." {...register("descricao")}/>
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Data de Início">
                <Input type="date" value={dataInicio} onChange={e=>setValue("dataInicio", e.target.value)}/>
              </Field>
              <Field label="Data de Fim (opcional)">
                <Input type="date" value={dataFim || ""} onChange={e=>setValue("dataFim", e.target.value)}/>
              </Field>
              <Field label="Status">
                <Select value={status} onValueChange={v=>setValue("status", v as InventarioStatus, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABERTO">Aberto</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                    <SelectItem value="PAUSADO">Pausado</SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Setor (opcional)">
                <Select value={setorId||""} onValueChange={v=>setValue("setorId", v, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os setores</SelectItem>
                    {setores.map(s=><SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Colaborador / Responsável (opcional)">
                  <Select value={colabId||""} onValueChange={v=>setValue("colaboradorId", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não especificar</SelectItem>
                      {colaboradores.map(c=><SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" className="bg-solucao-blue hover:bg-solucao-blue/90" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                {submitting ? "Criando..." : "Criar Inventário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function statusLabel(s: InventarioStatus) {
  switch (s) {
    case "ABERTO": return "Aberto";
    case "EM_ANDAMENTO": return "Em andamento";
    case "PAUSADO": return "Pausado";
    case "CONCLUIDO": return "Concluído";
    case "CANCELADO": return "Cancelado";
  }
}
function badgeVariant(s: InventarioStatus): "default" | "outline" | "secondary" {
  return s === "ABERTO" ? "secondary" : s === "CONCLUIDO" ? "default" : "outline";
}
function badgeClass(s: InventarioStatus): string {
  switch (s) {
    case "ABERTO": return "bg-slate-200/60 text-slate-700 hover:bg-slate-200";
    case "EM_ANDAMENTO": return "bg-blue-100 text-blue-700 border-blue-200";
    case "PAUSADO": return "bg-amber-100 text-amber-700 border-amber-200";
    case "CONCLUIDO": return "bg-emerald-600";
    case "CANCELADO": return "bg-rose-100 text-rose-700 border-rose-200";
  }
}
