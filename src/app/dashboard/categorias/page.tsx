"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tags, Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  nome: z.string().min(2, "Nome obrigatório"),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
});

type Form = z.infer<typeof schema>;
type Item = { id: string; nome: string; descricao: string | null; ativo: boolean; _count: { patrimonios: number } };

export default function CategoriasPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", descricao: "", ativo: true },
  });

  async function load() {
    setLoading(true);
    const r = await fetch("/api/categorias");
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    reset({ nome: "", descricao: "", ativo: true });
    setOpen(true);
  }
  function openEdit(i: Item) {
    setEditing(i);
    reset({ nome: i.nome, descricao: i.descricao || "", ativo: i.ativo });
    setOpen(true);
  }

  async function onSubmit(data: Form) {
    setSubmitting(true);
    try {
      const url = editing ? `/api/categorias/${editing.id}` : "/api/categorias";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao salvar.");
      toast.success(editing ? "Categoria atualizada!" : "Categoria criada!");
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro.");
    } finally { setSubmitting(false); }
  }

  async function remove(item: Item) {
    if (!confirm(`Deseja inativar a categoria "${item.nome}"?`)) return;
    const r = await fetch(`/api/categorias/${item.id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Categoria inativada."); load(); }
    else toast.error("Erro ao inativar.");
  }

  const filtered = items.filter((i) =>
    (i.nome + " " + (i.descricao || "")).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-solucao-blue flex items-center gap-2">
            <Tags className="w-6 h-6" />
            Categorias
          </h1>
          <p className="text-sm text-muted-foreground">Tipos de patrimônios cadastrados.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar categoria..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full md:w-64" />
          </div>
          <Button className="bg-solucao-blue hover:bg-solucao-blue/90" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> Nova Categoria
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Total de {filtered.length} categoria(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhuma categoria encontrada.</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Patrimônios</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{i.descricao || "-"}</TableCell>
                      <TableCell>{i._count.patrimonios}</TableCell>
                      <TableCell>
                        <Badge variant={i.ativo ? "default" : "outline"} className={i.ativo ? "bg-emerald-600" : ""}>
                          {i.ativo ? "Ativa" : "Inativa"}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            <DialogDescription>Classifique os tipos de bens da empresa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-nome">Nome *</Label>
              <Input id="cat-nome" placeholder="Ex: Notebooks" {...register("nome")} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Descrição</Label>
              <Textarea id="cat-desc" rows={3} placeholder="Opcional..." {...register("descricao")} />
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
