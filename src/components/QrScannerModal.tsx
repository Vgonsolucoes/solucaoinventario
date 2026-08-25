"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, QrCode, ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface QrScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (codigoTombamento: string) => void;
  title?: string;
  description?: string;
}

export function QrScannerModal({
  open,
  onOpenChange,
  onResult,
  title = "Ler QR Code do Tombamento",
  description = "Aponte a câmera para o QR Code impresso na etiqueta do patrimônio. O código será lido automaticamente.",
}: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const jsQRRef = useRef<any>(null);
  const jsQRLoadingRef = useRef(false);
  const ultimoLidoRef = useRef<string>("");

  const [cameraOn, setCameraOn] = useState(false);
  const [errorCam, setErrorCam] = useState<string>("");
  const [loadingLib, setLoadingLib] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  async function ensureJsQR() {
    if (jsQRRef.current) return jsQRRef.current;
    if (jsQRLoadingRef.current) {
      await new Promise((r) => setTimeout(r, 200));
      return jsQRRef.current;
    }
    jsQRLoadingRef.current = true;
    setLoadingLib(true);
    try {
      if (typeof window !== "undefined") {
        // @ts-ignore
        if (window.jsQR) {
          // @ts-ignore
          jsQRRef.current = window.jsQR;
        } else {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () =>
              reject(
                new Error(
                  "Não foi possível carregar a biblioteca de leitura QR. Verifique sua conexão com a internet."
                )
              );
            document.head.appendChild(s);
          });
          // @ts-ignore
          jsQRRef.current = window.jsQR;
        }
      }
    } finally {
      setLoadingLib(false);
      jsQRLoadingRef.current = false;
    }
    if (!jsQRRef.current) throw new Error("Biblioteca de leitura QR indisponível.");
    return jsQRRef.current;
  }

  async function ligarCamera() {
    setErrorCam("");
    if (!videoRef.current) return;
    try {
      await ensureJsQR();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraOn(true);
      loopScan();
    } catch (e: any) {
      console.error("[CAM_ERR]", e);
      setErrorCam(
        e?.message ||
          "Não foi possível acessar a câmera. Verifique as permissões do navegador e tente novamente."
      );
      setCameraOn(false);
    }
  }

  function desligarCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  function loopScan() {
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
        const code = jsQR(img.data, img.width, img.height, {
          inversionAttempts: "dontInvert",
        });
        if (code && code.data && code.data !== ultimoLidoRef.current) {
          ultimoLidoRef.current = code.data;
          handleCodigoLido(code.data);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function handleCodigoLido(codigo: string) {
    setScanCount((v) => v + 1);
    let tomb = codigo.trim();
    if (tomb.startsWith("patrimonio:")) tomb = tomb.slice("patrimonio:".length);
    if (tomb.startsWith("urn:patrimonio:")) tomb = tomb.slice("urn:patrimonio:".length);
    if (tomb.startsWith("http")) {
      try {
        const u = new URL(tomb);
        const pTomb = u.searchParams.get("tombamento") || u.searchParams.get("tomb");
        if (pTomb) tomb = pTomb;
      } catch {}
    }
    onResult(tomb);
  }

  useEffect(() => {
    if (open) {
      ultimoLidoRef.current = "";
      setScanCount(0);
      setErrorCam("");
      setTimeout(() => ligarCamera(), 100);
    } else {
      desligarCamera();
    }
    return () => desligarCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-solucao-brand" /> {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            {!cameraOn && !loadingLib && !errorCam && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 text-white">
                <QrCode className="w-14 h-14 mb-3 opacity-70" />
                <p className="opacity-80 mb-1">Câmera desligada</p>
                <p className="text-xs opacity-60">
                  Clique em &quot;Ligar Câmera&quot; para começar a escanear.
                </p>
              </div>
            )}
            {cameraOn && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-2/3 h-2/3 border-4 border-solucao-brand/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] animate-pulse"></div>
              </div>
            )}
            {cameraOn && (
              <Badge className="absolute top-2 right-2 bg-emerald-600">
                Ao vivo · {scanCount} leitura(s)
              </Badge>
            )}
            {!cameraOn && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 text-white hover:text-white hover:bg-white/10"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {errorCam && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-md px-3 py-2">
              {errorCam}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {!cameraOn ? (
              <Button
                className="bg-solucao-brand hover:bg-solucao-brand/90 text-white"
                onClick={ligarCamera}
                disabled={loadingLib}
              >
                {loadingLib ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                {loadingLib ? "Carregando biblioteca..." : "Ligar Câmera"}
              </Button>
            ) : (
              <Button variant="destructive" onClick={desligarCamera}>
                <CameraOff className="w-4 h-4 mr-2" />
                Desligar
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Dica: QR codes com conteúdo <code className="bg-slate-100 px-1 rounded">patrimonio:TOMB-0001</code>{" "}
            ou apenas o texto do tombamento serão automaticamente reconhecidos e inseridos no campo.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
