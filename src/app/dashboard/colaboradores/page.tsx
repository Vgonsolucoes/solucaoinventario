"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Plus, Pencil, Trash2, Search, Loader2, Mail, Phone, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const schema = z.object({
  matricula: z.string().min(1, "Matrícula obrigatória"),
  nome: z.string().min(2, "Nome obrigatório"),
  cargo: z.string().optional(),
  email: z.union([z.literal(""), z.string().email("E-mail inválido")]).optional(),
  telefone: z.string().optional(),
  setorId: z.string().uuid("Selecione o setor"),
  ativo: z.boolean().default(true),
});

type Form = z.infer<typeof schema>;
type Setor = { id: string; nome: string };
type Item = {
  id: string; matricula: string; nome: string; cargo: string | null; email: string | null;
  telefone: string | null; ativo: boolean; setor: { nome: string }; _count: { patrimonios: number };
};

export default function ColaboradoresPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { matricula: "", nome: "", cargo: "", email: "", telefone: "", setorId: "", ativo: true },
  });
  const setorValor = watch("setorId");

  async function load() {
    setLoading(true);
    const [r1, r2] = await Promise.all([fetch("/api/colaboradores"), fetch("/api/setores")]);
    if (r1.ok) setItems(await r1.json());
    if (r2.ok) setSetores((await r2.json()).filter((s: any) => s.ativo));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    reset({ matricula: "", nome: "", cargo: "", email: "", telefone: "", setorId: "", ativo: true });
    setOpen(true);
  }
  function openEdit(i: Item) {
    setEditing(i);
    reset({
      matricula: i.matricula, nome: i.nome, cargo: i.cargo || "",
      email: i.email || "", telefone: i.telefone || "", ativo: i.ativo,
    });
    // o setor vem junto do Item via include, então precisamos buscar o id. Por enquanto setamos via string temporária
    const match = setores.find((s) => s.nome === i.setor.nome);
    if (match) setValue("setorId", match.id, { shouldValidate: true });
    setOpen(true);
  }

  async function onSubmit(data: Form) {
    setSubmitting(true);
    try {
      const url = editing ? `/api/colaboradores/${editing.id}` : "/api/colaboradores";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao salvar.");
      toast.success(editing ? "Colaborador atualizado!" : "Colaborador criado!");
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro.");
    } finally { setSubmitting(false); }
  }

  async function remove(item: Item) {
    if (!confirm(`Deseja inativar "${item.nome}"?`)) return;
    const r = await fetch(`/api/colaboradores/${item.id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Colaborador inativado."); load(); }
    else toast.error("Erro.");
  }

  const filtered = items.filter((i) =>
    (i.nome + " " + i.matricula + " " + (i.cargo || "") + " " + (i.email || "") + " " + i.setor.nome)
      .toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-solucao-blue flex items-center gap-2">
            <Users className="w-6 h-6" /> Colaboradores
          </h1>
          <p className="text-sm text-muted-foreground">Responsáveis e funcionários.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar colaborador..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full md:w-72" />
          </div>
          <Button className="bg-solucao-blue hover:bg-solucao-blue/90" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> Novo Colaborador
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Total de {filtered.length} colaborador(es)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhum colaborador encontrado.</div>
          ) : (
            <div className="rounded-md border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Patrim.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.matricula}</TableCell>
                      <TableCell className="font-medium">{i.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{i.cargo || "-"}</TableCell>
                      <TableCell>{i.setor.nome}</TableCell>
                      <TableCell>{i._count.patrimonios}</TableCell>
                      <TableCell>
                        <Badge variant={i.ativo ? "default" : "outline"} className={i.ativo ? "bg-emerald-600" : ""}>
                          {i.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(i)} title="Editar"><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(i)} title="Inativar"><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
            <DialogDescription>Dados do colaborador/responsável.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="mat">Matrícula *</Label>
                <Input id="mat" placeholder="Ex: 00123" {...register("matricula")} />
                {errors.matricula && <p className="text-xs text-destructive">{errors.matricula.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setor-sel">Setor *</Label>
                <Select value={setorValor || ""} onValueChange={(v) => setValue("setorId", v, { shouldValidate: true })}>
                  <SelectTrigger id="setor-sel">
                    <SelectValue placeholder="Selecione o setor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {setores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.setorId && <p className="text-xs text-destructive">{errors.setorId.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nome-colab">Nome Completo *</Label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="nome-colab" className="pl-9" placeholder="Nome completo" {...register("nome")} />
              </div>
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cargo">Cargo</Label>
                <Input id="cargo" placeholder="Ex: Analista de TI" {...register("cargo")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tel">Telefone</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="tel" className="pl-9" placeholder="(00) 00000-0000" {...register("telefone")} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email-colab">E-mail</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="email-colab" type="email" className="pl-9" placeholder="colaborador@sesolucao.com.br" {...register("email")} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" className="bg-solucao-blue hover:bg-solucao-blue/90" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
