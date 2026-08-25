"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  X,
} from "lucide-react";
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
  DialogTrigger,
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
  nome: z.string().min(2, "Nome obrigatório (mínimo 2 caracteres)"),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
});

type Form = z.infer<typeof schema>;
type Item = { id: string; nome: string; descricao: string | null; ativo: boolean; _count: { colaboradores: number; patrimonios: number } };

export default function SetoresPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", descricao: "", ativo: true },
  });

  async function load() {
    setLoading(true);
    const r = await fetch("/api/setores");
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    reset({ nome: "", descricao: "", ativo: true });
    setDialogOpen(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    reset({ nome: item.nome, descricao: item.descricao || "", ativo: item.ativo });
    setDialogOpen(true);
  }

  async function onSubmit(data: Form) {
    setSubmitting(true);
    try {
      const url = editing ? `/api/setores/${editing.id}` : "/api/setores";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Erro ao salvar.");
      }
      toast.success(editing ? "Setor atualizado!" : "Setor criado!");
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(item: Item) {
    if (!confirm(`Deseja inativar o setor "${item.nome}"?`)) return;
    const res = await fetch(`/api/setores/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Setor inativado.");
      load();
    } else toast.error("Erro ao inativar.");
  }

  const filtered = items.filter((i) =>
    (i.nome + " " + (i.descricao || ""))
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-solucao-blue flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Setores
          </h1>
          <p className="text-sm text-muted-foreground">
            Departamentos e unidades da Solução Equipamentos.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar setor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full md:w-64"
            />
          </div>
          <Button className="bg-solucao-blue hover:bg-solucao-blue/90" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Setor
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Total de {filtered.length} setor(es)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhum setor encontrado.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Colab.</TableHead>
                    <TableHead>Patrim.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.nome}</TableCell>
                      <TableCell className="text-muted-foreground max-w-sm truncate">
                        {i.descricao || "-"}
                      </TableCell>
                      <TableCell>{i._count.colaboradores}</TableCell>
                      <TableCell>{i._count.patrimonios}</TableCell>
                      <TableCell>
                        <Badge variant={i.ativo ? "default" : "outline"} className={i.ativo ? "bg-emerald-600" : ""}>
                          {i.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(i)} title="Editar">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(i)} title="Inativar">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Setor" : "Novo Setor"}</DialogTitle>
            <DialogDescription>
              Cadastre os setores/ departamentos da empresa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" placeholder="Ex: Tecnologia da Informação" {...register("nome")} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" placeholder="Opcional..." rows={3} {...register("descricao")} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" className="bg-solucao-blue hover:bg-solucao-blue/90" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
