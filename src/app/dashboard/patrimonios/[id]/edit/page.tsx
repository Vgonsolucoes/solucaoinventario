"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Package2, Save, QrCode, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PatrimonioEstado } from "@prisma/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import { QrScannerModal } from "@/components/QrScannerModal";

const schema = z.object({
  tombamento: z.string().min(1, "Tombamento obrigatório"),
  descricao: z.string().min(3, "Descrição obrigatória"),
  numeroSerie: z.string().optional(),
  modelo: z.string().optional(),
  marca: z.string().optional(),
  valorCompra: z.union([z.string().transform((v) => (v === "" ? null : Number(v))), z.null()]).optional(),
  dataCompra: z.string().optional(),
  estado: z.nativeEnum(PatrimonioEstado),
  observacao: z.string().optional(),
  categoriaId: z.string().uuid("Selecione a categoria"),
  setorId: z.string().uuid("Selecione o setor"),
  colaboradorId: z.string().uuid().or(z.literal("")).optional(),
}).transform((d) => ({ ...d, colaboradorId: d.colaboradorId || null }));

type Form = z.infer<typeof schema>;
type Opt = { id: string; nome: string };
type Patrimonio = {
  id: string; tombamento: string; descricao: string; numeroSerie: string | null;
  modelo: string | null; marca: string | null; valorCompra: number | null;
  dataCompra: string | Date | null; estado: PatrimonioEstado;
  observacao: string | null; categoriaId: string; setorId: string;
  colaboradorId: string | null; categoria: Opt; setor: Opt; colaborador: Opt | null;
};

export default function EditarPatrimonioPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [setores, setSetores] = useState<Opt[]>([]);
  const [categorias, setCategorias] = useState<Opt[]>([]);
  const [colaboradores, setColaboradores] = useState<Opt[]>([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrScanOpen, setQrScanOpen] = useState(false);
  const [qrPng, setQrPng] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [pat, setPat] = useState<Patrimonio | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      tombamento: "", descricao: "", numeroSerie: "", modelo: "", marca: "",
      valorCompra: undefined, dataCompra: "", estado: PatrimonioEstado.BOM,
      observacao: "", categoriaId: "", setorId: "", colaboradorId: "",
    },
  });
  const [catVal, setorVal, colabVal, estadoVal, dataCompra, valor] = [
    watch("categoriaId"), watch("setorId"), watch("colaboradorId"), watch("estado"),
    watch("dataCompra"), watch("valorCompra"),
  ];

  useEffect(() => {
    async function loadCombo() {
      const [s, c, k, p] = await Promise.all([
        fetch("/api/setores").then((r) => r.ok ? r.json() : []),
        fetch("/api/categorias").then((r) => r.ok ? r.json() : []),
        fetch("/api/colaboradores").then((r) => r.ok ? r.json() : []),
        fetch(`/api/patrimonios/${params.id}`).then((r) => r.ok ? r.json() : null),
      ]);
      setSetores(s.filter((x: any) => x.ativo));
      setCategorias(c.filter((x: any) => x.ativo));
      setColaboradores(k.filter((x: any) => x.ativo));
      setPat(p);
      if (p) {
        reset({
          tombamento: p.tombamento, descricao: p.descricao,
          numeroSerie: p.numeroSerie || "", modelo: p.modelo || "", marca: p.marca || "",
          valorCompra: p.valorCompra ?? null,
          dataCompra: p.dataCompra ? new Date(p.dataCompra).toISOString().slice(0, 10) : "",
          estado: p.estado, observacao: p.observacao || "",
          categoriaId: p.categoriaId, setorId: p.setorId,
          colaboradorId: p.colaboradorId || "",
        });
      }
      setLoading(false);
    }
    loadCombo();
  }, [params.id, reset]);

  async function onSubmit(data: Form) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/patrimonios/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, colaboradorId: data.colaboradorId || null }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao salvar.");
      toast.success("Patrimônio atualizado com sucesso!");
      router.replace("/dashboard/patrimonios");
    } catch (e: any) { toast.error(e.message || "Erro."); }
    finally { setSubmitting(false); }
  }

  async function gerarQr() {
    setQrLoading(true); setQrPng(""); setQrOpen(true);
    const r = await fetch(`/api/patrimonios/${params.id}/qrcode`);
    if (r.ok) { const j = await r.json(); setQrPng(j.qrcode); }
    else toast.error("Erro ao gerar QR Code.");
    setQrLoading(false);
  }

  function imprimir() {
    if (!pat || !qrPng) return;
    const w = window.open("", "_blank");
    if (!w) return toast.error("Não foi possível abrir impressão.");
    w.document.write(`
      <html><head><title>QR - ${pat.tombamento}</title>
      <style>
        body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
        .card{border:2px solid #e5e7eb;border-radius:1rem;padding:24px;text-align:center;max-width:440px;}
        h2{margin:0 0 8px;color:#003366;}p{margin:4px 0;color:#6b7280;}
        img{margin:16px auto;display:block;}
      </style></head><body>
      <div class="card">
        <h2>${pat.tombamento}</h2>
        <p>${pat.descricao}</p>
        <p>${pat.setor?.nome || ""}${pat.colaborador ? " · " + pat.colaborador.nome : ""}</p>
        <img src="${qrPng}" alt="QR" width="360" height="360"/>
      </div>
      <script>setTimeout(()=>window.print(),350);</script></body></html>`);
    w.document.close();
  }

  function onQrScanResult(codigo: string) {
    setValue("tombamento", codigo, { shouldValidate: true, shouldDirty: true });
    setQrScanOpen(false);
    toast.success(`Tombamento lido: ${codigo}`);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando patrimônio...
    </div>
  );
  if (!pat) return (
    <div className="space-y-4">
      <Button asChild variant="ghost"><Link href="/dashboard/patrimonios"><ArrowLeft className="w-4 h-4 mr-1"/>Voltar</Link></Button>
      <Card><CardContent className="py-10 text-center text-muted-foreground">Patrimônio não encontrado.</CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/patrimonios"><ArrowLeft className="w-4 h-4 mr-1"/>Voltar</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={gerarQr}><QrCode className="w-4 h-4 mr-2"/>Ver QR Code</Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-solucao-blue flex items-center gap-2">
            <Package2 className="w-6 h-6" /> Editar Patrimônio
            <span className="ml-auto text-lg font-mono bg-solucao-orange/10 text-solucao-orange px-3 py-1 rounded-full">
              #{pat.tombamento}
            </span>
          </CardTitle>
          <CardDescription>Atualize os dados do bem/ativo.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tombamento *" error={errors.tombamento?.message}>
              <div className="flex gap-2">
                <Input {...register("tombamento")} className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQrScanOpen(true)}
                  className="shrink-0 border-solucao-brand text-solucao-brand hover:bg-solucao-brand/10 hover:text-solucao-brand"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Ler QR Code
                </Button>
              </div>
            </Field>
            <Field label="Estado de Conservação" error={errors.estado?.message as string}>
              <Select value={estadoVal} onValueChange={(v) => setValue("estado", v as PatrimonioEstado, { shouldValidate: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOVO">Novo</SelectItem>
                  <SelectItem value="BOM">Bom</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="RUIM">Ruim</SelectItem>
                  <SelectItem value="INSERVIVEL">Inservível</SelectItem>
                  <SelectItem value="DESCARTADO">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Descrição *" error={errors.descricao?.message}>
                <Input {...register("descricao")} />
              </Field>
            </div>
            <Field label="Marca"><Input {...register("marca")} /></Field>
            <Field label="Modelo"><Input {...register("modelo")} /></Field>
            <Field label="Número de Série"><Input {...register("numeroSerie")} /></Field>
            <Field label="Data da Compra">
              <Input type="date" value={dataCompra} onChange={(e)=>setValue("dataCompra", e.target.value)} />
            </Field>
            <Field label="Valor da Compra (R$)">
              <Input type="number" step="0.01" value={valor as any}
                onChange={(e)=>setValue("valorCompra", e.target.value === "" ? null as any : Number(e.target.value))} />
            </Field>
            <Field label="Categoria *" error={errors.categoriaId?.message}>
              <Select value={catVal||""} onValueChange={(v) => setValue("categoriaId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Setor *" error={errors.setorId?.message}>
              <Select value={setorVal||""} onValueChange={(v) => setValue("setorId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Responsável (opcional)">
              <Select value={colabVal||""} onValueChange={(v) => setValue("colaboradorId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {colaboradores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Observações">
                <Textarea rows={3} {...register("observacao")} />
              </Field>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 justify-end">
            <Button type="button" variant="outline" asChild><Link href="/dashboard/patrimonios">Cancelar</Link></Button>
            <Button type="submit" className="bg-solucao-blue hover:bg-solucao-blue/90" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
              <Save className="w-4 h-4 mr-2"/>
              {submitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={qrOpen} onOpenChange={(o)=>!o&&setQrOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code — #{pat.tombamento}</DialogTitle>
            <DialogDescription>{pat.descricao}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            {qrLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2 text-muted-foreground"/> :
              qrPng ? <img src={qrPng} width={360} height={360} alt="QR" className="border rounded-lg"/> :
              <p className="text-muted-foreground text-sm">Erro ao gerar QR.</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
            <Button className="bg-solucao-blue hover:bg-solucao-blue/90" disabled={!qrPng} onClick={imprimir}>
              <Printer className="w-4 h-4 mr-2"/>Imprimir Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QrScannerModal
        open={qrScanOpen}
        onOpenChange={setQrScanOpen}
        onResult={onQrScanResult}
      />
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
