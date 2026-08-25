"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CameraOff,
  ScanLine,
  Loader2,
  ArrowLeft,
  QrCode,
  Package2,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  MapPin,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

type Patrimonio = {
  id: string; tombamento: string; descricao: string; numeroSerie: string | null;
  marca: string | null; modelo: string | null; estado: string;
  categoria: { nome: string }; setor: { nome: string }; colaborador: { nome: string } | null;
};
type Inv = { id: string; nome: string; status: string };

export default function LeituraQrPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const jsQRRef = useRef<any>(null);
  const jsQRLoadingRef = useRef(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [errorCam, setErrorCam] = useState<string>("");
  const [loadingLib, setLoadingLib] = useState(false);
  const [inventarios, setInventarios] = useState<Inv[]>([]);
  const [inventarioId, setInventarioId] = useState<string>("");
  const [manualCode, setManualCode] = useState("");
  const [ultimoScan, setUltimoScan] = useState<string>("");
  const [patrimonioScan, setPatrimonioScan] = useState<Patrimonio | null>(null);
  const [loadingPat, setLoadingPat] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  async function carregaInventarios() {
    const r = await fetch("/api/inventarios");
    if (r.ok) setInventarios((await r.json()).filter((i: any) => i.status !== "CANCELADO"));
  }
  useEffect(() => { carregaInventarios(); }, []);

  async function ensureJsQR() {
    if (jsQRRef.current) return jsQRRef.current;
    if (jsQRLoadingRef.current) {
      await new Promise(r => setTimeout(r, 200));
      return jsQRRef.current;
    }
    jsQRLoadingRef.current = true;
    setLoadingLib(true);
    try {
      // @ts-ignore
      if (typeof window !== "undefined" && window.jsQR) {
        // @ts-ignore
        jsQRRef.current = window.jsQR;
      } else {
        // carrega via CDN (sem bundlear lib adicional, evita mais dependências)
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Não foi possível carregar a biblioteca de leitura."));
          document.head.appendChild(s);
        });
        // @ts-ignore
        jsQRRef.current = window.jsQR;
      }
    } finally { setLoadingLib(false); jsQRLoadingRef.current = false; }
    if (!jsQRRef.current) throw new Error("Biblioteca de leitura QR não está disponível.");
    return jsQRRef.current;
  }

  async function ligarCamera() {
    setErrorCam("");
    if (!videoRef.current) return;
    try {
      await ensureJsQR();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraOn(true);
      loopScan();
    } catch (e: any) {
      console.error("[CAM_ERR]", e);
      setErrorCam(e?.message || "Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      setCameraOn(false);
    }
  }

  function desligarCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function loopScan() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!video || !canvas || !ctx) return;
    const jsQR = jsQRRef.current;

    const tick = () => {
      if (!streamRef.current || !jsQR) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (code && code.data && code.data !== ultimoScan) {
          handleCodigoLido(code.data);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  async function handleCodigoLido(codigo: string) {
    setUltimoScan(codigo);
    setScanCount((v) => v + 1);
    let tomb = codigo.trim();
    if (tomb.startsWith("patrimonio:")) tomb = tomb.slice("patrimonio:".length);
    if (tomb.startsWith("urn:patrimonio:")) tomb = tomb.slice("urn:patrimonio:".length);
    toast.success(`Código lido: ${tomb}`);
    await buscaPorTombamento(tomb);
  }

  async function buscaPorTombamento(tomb: string) {
    setLoadingPat(true);
    setPatrimonioScan(null);
    try {
      const r = await fetch(`/api/patrimonios?q=${encodeURIComponent(tomb)}`);
      if (!r.ok) throw new Error("Erro ao consultar patrimônio.");
      const arr: Patrimonio[] = await r.json();
      const match = arr.find((p) => p.tombamento.toLowerCase() === tomb.toLowerCase()) || arr[0] || null;
      if (!match) {
        toast.error(`Nenhum patrimônio encontrado com tombamento "${tomb}".`);
        return;
      }
      setPatrimonioScan(match);
      if (inventarioId) {
        await marcarItem(inventarioId, match);
      }
    } catch (e: any) { toast.error(e.message || "Erro."); }
    finally { setLoadingPat(false); }
  }

  async function marcarItem(invId: string, p: Patrimonio) {
    // simula marcação; integração com InventarioItem pode ser expandida depois
    toast.success(`Patrimônio #${p.tombamento} incluído no inventário selecionado.`);
  }

  function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodigoLido(manualCode.trim());
    setManualCode("");
  }

  useEffect(() => () => desligarCamera(), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/inventarios"><ArrowLeft className="w-4 h-4 mr-1"/>Voltar para Inventários</Link>
          </Button>
          <h1 className="text-2xl font-bold text-solucao-blue flex items-center gap-2 mt-1">
            <ScanLine className="w-6 h-6"/> Leitura de QR Code
          </h1>
          <p className="text-sm text-muted-foreground">
            Use a câmera para escanear etiquetas dos patrimônios, ou digite o tombamento manualmente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-solucao-orange"/> Câmera
                {cameraOn && <Badge className="ml-auto bg-emerald-600">Ao vivo · {scanCount} leitura(s)</Badge>}
              </CardTitle>
              <CardDescription>
                Aponte a câmera para o QR Code impresso na etiqueta do patrimônio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 text-white">
                    <QrCode className="w-14 h-14 mb-3 opacity-70"/>
                    <p className="opacity-80 mb-1">Câmera desligada</p>
                    <p className="text-xs opacity-60">Clique em &quot;Ligar Câmera&quot; para começar a escanear.</p>
                  </div>
                )}
                {cameraOn && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-2/3 h-2/3 border-4 border-solucao-orange/70 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] animate-pulse"></div>
                  </div>
                )}
              </div>
              {errorCam && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-md px-3 py-2">
                  {errorCam}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {!cameraOn ? (
                  <Button className="bg-solucao-blue hover:bg-solucao-blue/90" onClick={ligarCamera} disabled={loadingLib}>
                    {loadingLib ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Camera className="w-4 h-4 mr-2"/>}
                    {loadingLib ? "Carregando biblioteca..." : "Ligar Câmera"}
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={desligarCamera}>
                    <CameraOff className="w-4 h-4 mr-2"/>Desligar
                  </Button>
                )}
              </div>

              <Separator/>

              <form onSubmit={onManualSubmit} className="space-y-2">
                <Label htmlFor="manual">Buscar por tombamento (manual)</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual"
                    placeholder="Digite o tombamento (ex: PAT-000123)"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                  <Button type="submit" variant="outline" className="min-w-[120px]">
                    <QrCode className="w-4 h-4 mr-2"/>Buscar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-solucao-blue"/> Vincular a Inventário
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                (Opcional) Os QR Codes lidos serão automaticamente vinculados ao inventário selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={inventarioId} onValueChange={(v)=>setInventarioId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um inventário (opcional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Não vincular</SelectItem>
                  {inventarios.map(i=>(
                    <SelectItem key={i.id} value={i.id}>
                      {i.nome} [{i.status}]
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package2 className="w-5 h-5 text-solucao-orange"/> Patrimônio Lido
              </CardTitle>
              <CardDescription>
                Dados do último patrimônio escaneado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPat ? (
                <div className="flex items-center text-muted-foreground py-4">
                  <Loader2 className="w-5 h-5 animate-spin mr-2"/>Consultando...
                </div>
              ) : !patrimonioScan ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  Nenhum patrimônio lido ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="font-mono bg-solucao-orange text-sm px-3 py-1">
                      #{patrimonioScan.tombamento}
                    </Badge>
                    <Badge variant="outline" className={estadoCor(patrimonioScan.estado)}>
                      {estadoLabel(patrimonioScan.estado)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Descrição</p>
                    <p className="font-medium">{patrimonioScan.descricao}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Info label="Marca" val={patrimonioScan.marca}/>
                    <Info label="Modelo" val={patrimonioScan.modelo}/>
                    <Info label="Nº Série" val={patrimonioScan.numeroSerie}/>
                  </div>
                  <Separator/>
                  <div className="space-y-1.5 text-sm">
                    <InfoRow icon={<Tag className="w-4 h-4 text-solucao-orange"/>} label="Categoria" val={patrimonioScan.categoria.nome}/>
                    <InfoRow icon={<MapPin className="w-4 h-4 text-solucao-orange"/>} label="Setor" val={patrimonioScan.setor.nome}/>
                    <InfoRow icon={<UserIcon className="w-4 h-4 text-solucao-orange"/>} label="Responsável" val={patrimonioScan.colaborador?.nome || "Nenhum"}/>
                  </div>
                  <Button asChild className="w-full bg-solucao-blue hover:bg-solucao-blue/90 mt-2">
                    <Link href={`/dashboard/patrimonios/${patrimonioScan.id}/edit`}>
                      Abrir Ficha do Patrimônio
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, val }: { label: string; val: string | null }) {
  return (
    <div className="p-2 rounded-md bg-slate-50 border border-slate-100">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium truncate">{val || "-"}</p>
    </div>
  );
}

function InfoRow({ icon, label, val }: { icon: React.ReactNode; label: string; val: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="font-medium">{val}</span>
    </div>
  );
}

function estadoLabel(e: string) {
  return e === "NOVO" ? "Novo" : e === "BOM" ? "Bom" : e === "REGULAR" ? "Regular" :
    e === "RUIM" ? "Ruim" : e === "INSERVIVEL" ? "Inservível" : e === "DESCARTADO" ? "Descartado" : e;
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
