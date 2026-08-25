"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Package2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  QrCode,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

type Patrimonio = {
  id: string; tombamento: string; descricao: string; numeroSerie: string | null;
  marca: string | null; modelo: string | null; estado: string;
  categoria: { nome: string }; setor: { nome: string }; colaborador: { nome: string } | null;
};

export default function PatrimoniosPage() {
  const [items, setItems] = useState<Patrimonio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [qrDialogPat, setQrDialogPat] = useState<Patrimonio | null>(null);
  const [qrPng, setQrPng] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);

  async function load(q?: string) {
    setLoading(true);
    const url = "/api/patrimonios" + (q ? `?q=${encodeURIComponent(q)}` : "");
    const r = await fetch(url);
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(debouncedSearch); }, [debouncedSearch]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function remove(item: Patrimonio) {
    if (!confirm(`Deseja descartar/inativar o patrimônio #${item.tombamento}?`)) return;
    const r = await fetch(`/api/patrimonios/${item.id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Patrimônio inativado."); load(debouncedSearch); }
    else toast.error("Erro ao inativar.");
  }

  async function openQr(p: Patrimonio) {
    setQrDialogPat(p);
    setQrPng("");
    setQrLoading(true);
    const r = await fetch(`/api/patrimonios/${p.id}/qrcode`);
    if (r.ok) {
      const j = await r.json();
      setQrPng(j.qrcode);
    } else toast.error("Erro ao gerar QR Code.");
    setQrLoading(false);
  }

  async function imprimir() {
    if (!qrDialogPat) return;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Não foi possível abrir a janela de impressão."); return; }
    w.document.write(`
      <html><head><title>QR Code - ${qrDialogPat.tombamento}</title>
      <style>
        body { font-family: Arial, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
        .card { border: 2px solid #e5e7eb; border-radius: 1rem; padding: 24px; text-align:center; max-width: 420px; }
        h2 { margin: 0 0 8px 0; color: #003366; }
        p { margin: 4px 0; color: #6b7280; }
        img { margin: 16px auto; display: block; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="card">
        <h2>${qrDialogPat.tombamento}</h2>
        <p>${qrDialogPat.descricao}</p>
        <p>${qrDialogPat.setor.nome}${qrDialogPat.colaborador ? " · " + qrDialogPat.colaborador.nome : ""}</p>
        <img src="${qrPng}" alt="QR Code ${qrDialogPat.tombamento}" width="360" height="360"/>
      </div>
      <script>window.onload = function(){ setTimeout(()=>window.print(), 400); }</script>
      </body></html>`);
    w.document.close();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-solucao-blue flex items-center gap-2">
            <Package2 className="w-6 h-6" /> Patrimônios
          </h1>
          <p className="text-sm text-muted-foreground">
            Bens, ativos e equipamentos cadastrados.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por tombamento, descrição, marca, modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <Button asChild className="bg-solucao-blue hover:bg-solucao-blue/90">
            <Link href="/dashboard/patrimonios/new">
              <Plus className="w-4 h-4 mr-2" /> Novo Patrimônio
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {items.length} patrimônio(s) encontrado(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhum patrimônio encontrado. Clique em &quot;Novo Patrimônio&quot;.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tombamento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Resp.</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-bold text-solucao-orange text-sm">{p.tombamento}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate" title={p.descricao}>{p.descricao}</TableCell>
                      <TableCell className="text-sm">{p.categoria.nome}</TableCell>
                      <TableCell className="text-sm">{p.setor.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.colaborador?.nome || "-"}</TableCell>
                      <TableCell><Badge variant="outline" className={estadoCor(p.estado)}>{estado(p.estado)}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="Visualizar/Editar">
                            <Link href={`/dashboard/patrimonios/${p.id}`}><Eye className="w-4 h-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" title="QR Code / Imprimir" onClick={() => openQr(p)}>
                            <QrCode className="w-4 h-4 text-solucao-blue" />
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Editar">
                            <Link href={`/dashboard/patrimonios/${p.id}/edit`}><Pencil className="w-4 h-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" title="Inativar/Descartar" onClick={() => remove(p)}>
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

      <Dialog open={!!qrDialogPat} onOpenChange={(o) => !o && setQrDialogPat(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code do Patrimônio</DialogTitle>
            <DialogDescription>
              {qrDialogPat ? (
                <>
                  <span className="font-semibold text-solucao-orange">#{qrDialogPat.tombamento}</span> — {qrDialogPat.descricao}
                </>
              ) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            {qrLoading ? (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Gerando QR Code...
              </div>
            ) : qrPng ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrPng} alt="QR Code" className="border rounded-lg" width={360} height={360} />
            ) : (
              <p className="text-muted-foreground text-sm">Erro ao gerar QR Code.</p>
            )}
          </div>
          <DialogFooter className="flex-row sm:justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
            <Button className="bg-solucao-blue hover:bg-solucao-blue/90" disabled={!qrPng} onClick={imprimir}>
              Imprimir Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function estado(e: string) {
  switch (e) {
    case "NOVO": return "Novo";
    case "BOM": return "Bom";
    case "REGULAR": return "Regular";
    case "RUIM": return "Ruim";
    case "INSERVIVEL": return "Inservível";
    case "DESCARTADO": return "Descartado";
    default: return e;
  }
}
function estadoCor(e: string): string {
  switch (e) {
    case "NOVO": return "bg-violet-500/10 text-violet-700 border-violet-200";
    case "BOM": return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    case "REGULAR": return "bg-blue-500/10 text-blue-700 border-blue-200";
    case "RUIM": return "bg-amber-500/10 text-amber-700 border-amber-200";
    case "INSERVIVEL": return "bg-rose-500/10 text-rose-700 border-rose-200";
    case "DESCARTADO": return "bg-slate-500/10 text-slate-700 border-slate-200";
    default: return "";
  }
}
