"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().min(1, "Digite a senha"),
});

type LoginForm = z.infer<typeof loginSchema>;

const POWER_TOWER_IMAGE =
  "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=industrial%20high%20voltage%20electricity%20transmission%20towers%20landscape%20monochrome%20gray%20tones%20moody%20sky%20realistic%20photography%20horizontal%20banner&image_size=landscape_16_9";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Falha no login.");
        return;
      }
      toast.success(`Bem-vindo(a), ${json.user.name}!`);
      router.replace(next);
      router.refresh();
    } catch {
      toast.error("Erro de conexão ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Toaster position="top-right" richColors closeButton />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="relative hidden lg:block min-h-[560px]">
            <Image
              src={POWER_TOWER_IMAGE}
              alt="Postes de alta tensão"
              fill
              className="object-cover grayscale brightness-105 contrast-105"
              priority
              sizes="(max-width: 1024px) 0, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-solucao-blue/70 via-slate-900/55 to-solucao-brand/55" />
            <div className="absolute inset-0 p-10 flex flex-col justify-between">
              <div className="mx-auto">
                <Image
                  src="https://sesolucao.com.br/wp-content/themes/solucao/img/logo__solucao.png"
                  alt="Solução Equipamentos"
                  width={200}
                  height={60}
                  priority
                />
              </div>
              <div className="space-y-6 text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] font-semibold text-white/80 mb-2">
                    Sistema de Inventário
                  </p>
                  <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                    Gestão de Patrimônio
                  </h1>
                  <p className="mt-4 text-lg text-white/90 max-w-md leading-relaxed">
                    Controle completo de ativos, inventários e colaboradores com
                    leitura de QR Code via câmera.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
                    <p className="text-sm font-semibold">Patrimônios</p>
                    <p className="text-xs text-white/80">
                      Cadastre e gerencie todos os ativos
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
                    <p className="text-sm font-semibold">Inventários</p>
                    <p className="text-xs text-white/80">
                      Realize inventários periódicos
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
                    <p className="text-sm font-semibold">Colaboradores</p>
                    <p className="text-xs text-white/80">
                      Responsáveis e usuários
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
                    <p className="text-sm font-semibold">QR Code</p>
                    <p className="text-xs text-white/80">
                      Etiquetas e leitura via câmera
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center px-4 sm:px-8 py-10 lg:py-12">
            <Card className="w-full max-w-md shadow-none border-0 bg-transparent">
              <CardHeader className="text-center space-y-4 lg:hidden">
                <div className="mx-auto">
                  <Image
                    src="https://sesolucao.com.br/wp-content/themes/solucao/img/logo__solucao.png"
                    alt="Solução Equipamentos"
                    width={180}
                    height={54}
                    priority
                  />
                </div>
                <div>
                  <CardTitle className="text-solucao-blue text-2xl">
                    Acesso ao Sistema
                  </CardTitle>
                  <CardDescription>
                    Sistema de Inventário - Solução Equipamentos
                  </CardDescription>
                </div>
              </CardHeader>
              <CardHeader className="text-center space-y-2 hidden lg:block">
                <CardTitle className="text-solucao-blue text-2xl">
                  Acesso ao Sistema
                </CardTitle>
                <CardDescription>
                  Entre com suas credenciais
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@sesolucao.com.br"
                      autoComplete="email"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Sua senha"
                      autoComplete="current-password"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full bg-solucao-brand hover:bg-solucao-brand/90 text-white shadow-lg shadow-solucao-brand/20"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4 mr-2" />
                    )}
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
