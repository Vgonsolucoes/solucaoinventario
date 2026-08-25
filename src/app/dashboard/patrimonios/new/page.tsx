"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Loader2, Package2, QrCode, Save } from "lucide-react";
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
import { QrScannerModal } from "@/components/QrScannerModal";

const schema = z.object({
  tombamento: z.string().min(1, "Tombamento obrigatório"),
  descricao: z.string().min(3, "Descrição obrigatória"),
  numeroSerie: z.string().optional(),
  modelo: z.string().optional(),
  marca: z.string().optional(),
  valorCompra: z.union([z.string().transform((v) => (v === "" ? null : Number(v))), z.null()]).optional(),
  dataCompra: z.string().optional(),
  estado: z.nativeEnum(PatrimonioEstado).default(PatrimonioEstado.BOM),
  observacao: z.string().optional(),
  categoriaId: z.string().uuid("Selecione a categoria"),
  setorId: z.string().uuid("Selecione o setor"),
  colaboradorId: z.string().uuid().or(z.literal("")).optional(),
}).transform((d) => ({
  ...d,
  colaboradorId: d.colaboradorId || null,
}));

type Form = z.infer<typeof schema>;
type Opt = { id: string; nome: string };

export default function NovoPatrimonioPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [setores, setSetores] = useState<Opt[]>([]);
  const [categorias, setCategorias] = useState<Opt[]>([]);
  const [colaboradores, setColaboradores] = useState<Opt[]>([]);
  const [qrOpen, setQrOpen] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      tombamento: "", descricao: "", numeroSerie: "", modelo: "", marca: "",
      valorCompra: undefined, dataCompra: "", estado: PatrimonioEstado.BOM,
      observacao: "", categoriaId: "", setorId: "", colaboradorId: "",
    },
  });
  const catVal = watch("categoriaId");
  const setorVal = watch("setorId");
  const colabVal = watch("colaboradorId");
  const estadoVal = watch("estado");

  useEffect(() => {
    (async () => {
      const [s, c, k] = await Promise.all([
        fetch("/api/setores").then((r) => r.ok ? r.json() : []),
        fetch("/api/categorias").then((r) => r.ok ? r.json() : []),
        fetch("/api/colaboradores").then((r) => r.ok ? r.json() : []),
      ]);
      setSetores(s.filter((x: any) => x.ativo));
      setCategorias(c.filter((x: any) => x.ativo));
      setColaboradores(k.filter((x: any) => x.ativo));
    })();
  }, []);

  async function onSubmit(data: Form) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/patrimonios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, colaboradorId: data.colaboradorId || null }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erro ao salvar.");
      toast.success("Patrimônio cadastrado com sucesso!");
      router.replace("/dashboard/patrimonios");
    } catch (e: any) {
      toast.error(e.message || "Erro ao cadastrar.");
    } finally { setSubmitting(false); }
  }

  function onQrResult(codigo: string) {
    setValue("tombamento", codigo, { shouldValidate: true, shouldDirty: true });
    setQrOpen(false);
    toast.success(`Tombamento lido: ${codigo}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/patrimonios"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-solucao-blue flex items-center gap-2">
            <Package2 className="w-6 h-6" /> Novo Patrimônio
          </CardTitle>
          <CardDescription>Preencha os dados abaixo para cadastrar um novo bem/ativo.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tombamento *" error={errors.tombamento?.message}>
              <div className="flex gap-2">
                <Input placeholder="Ex: PAT-000123" {...register("tombamento")} className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQrOpen(true)}
                  className="shrink-0 border-solucao-brand text-solucao-brand hover:bg-solucao-brand/10 hover:text-solucao-brand"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Ler QR Code
                </Button>
              </div>
            </Field>
            <Field label="Estado de Conservação" error={errors.estado?.message as string}>
              <Select value={estadoVal} onValueChange={(v) => setValue("estado", v as PatrimonioEstado, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
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
                <Input placeholder="Ex: Notebook Dell Latitude 5420 - 16GB - SSD 512GB" {...register("descricao")} />
              </Field>
            </div>

            <Field label="Marca">
              <Input placeholder="Ex: Dell" {...register("marca")} />
            </Field>
            <Field label="Modelo">
              <Input placeholder="Ex: Latitude 5420" {...register("modelo")} />
            </Field>

            <Field label="Número de Série">
              <Input placeholder="Ex: 8XBX2Y3" {...register("numeroSerie")} />
            </Field>
            <Field label="Data da Compra">
              <Input type="date" {...register("dataCompra")} />
            </Field>

            <Field label="Valor da Compra (R$)">
              <Input type="number" step="0.01" placeholder="Ex: 3500.00" {...register("valorCompra")} />
            </Field>
            <Field label="Categoria *" error={errors.categoriaId?.message}>
              <Select value={catVal || ""} onValueChange={(v) => setValue("categoriaId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione a categoria..." /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Setor *" error={errors.setorId?.message}>
              <Select value={setorVal || ""} onValueChange={(v) => setValue("setorId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione o setor..." /></SelectTrigger>
                <SelectContent>
                  {setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Responsável (opcional)">
              <Select value={colabVal || ""} onValueChange={(v) => setValue("colaboradorId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione o colaborador..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum (sem responsável)</SelectItem>
                  {colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Observações">
                <Textarea rows={3} placeholder="Informações adicionais, histórico, garantia..." {...register("observacao")} />
              </Field>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 justify-end">
            <Button type="button" variant="outline" asChild><Link href="/dashboard/patrimonios">Cancelar</Link></Button>
            <Button type="submit" className="bg-solucao-blue hover:bg-solucao-blue/90" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {submitting ? "Salvando..." : "Cadastrar Patrimônio"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <QrScannerModal
        open={qrOpen}
        onOpenChange={setQrOpen}
        onResult={onQrResult}
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
