"use client";

import { Suspense, useState, useEffect } from "react";
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

const POWER_TOWER_IMAGE = "/images/postes-alta-tensao-cinza.jpg";

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="bg-white/70 backdrop-blur border-b border-slate-200/80">
        <div className="container mx-auto py-3 px-4 flex items-center justify-between">
          <Image
            src="https://sesolucao.com.br/wp-content/themes/solucao/img/logo__solucao.png"
            alt="Solução Equipamentos"
            width={180}
            height={54}
            priority
          />
          <span className="text-xs sm:text-sm font-semibold text-solucao-brand">
            Sistema de Inventário
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="relative hidden lg:block min-h-[520px]">
            <Image
              src={POWER_TOWER_IMAGE}
              alt="Postes de alta tensão"
              fill
              className="object-cover grayscale brightness-105 contrast-105"
              priority
              sizes="(max-width: 1024px) 0, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-solucao-blue/70 via-slate-900/55 to-solucao-brand/55" />
            <div className="absolute inset-0 p-10 flex flex-col justify-end gap-6 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] font-semibold text-white/80 mb-2">
                  Solução Equipamentos
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

          <div className="flex items-center justify-center px-4 sm:px-8 py-10 lg:py-12">
            <div className="w-full max-w-md">
              <Card className="shadow-none border-0 bg-transparent">
                <CardHeader className="text-center space-y-3 lg:hidden">
                  <CardTitle className="text-solucao-blue text-2xl">
                    Gestão de Patrimônio
                  </CardTitle>
                  <CardDescription>
                    Solução Equipamentos - Inventário
                  </CardDescription>
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
                      <Label htmlFor="home-email">E-mail</Label>
                      <Input
                        id="home-email"
                        type="email"
                        placeholder="voce@sesolucao.com.br"
                        autoComplete="email"
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="home-password">Senha</Label>
                      <Input
                        id="home-password"
                        type="password"
                        placeholder="Sua senha"
                        autoComplete="current-password"
                        {...register("password")}
                      />
                      {errors.password && (
                        <p className="text-xs text-destructive">
                          {errors.password.message}
                        </p>
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
      </main>

      <footer className="border-t bg-white/70 backdrop-blur py-4">
        <div className="container mx-auto text-center text-xs sm:text-sm text-muted-foreground px-4">
          © {new Date().getFullYear()} Solução Equipamentos. Todos os direitos
          reservados.
        </div>
      </footer>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="animate-pulse text-muted-foreground">
            Carregando...
          </div>
        </div>
      }
    >
      <HomeAuthGate />
    </Suspense>
  );
}

function HomeAuthGate() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) {
          if (active) setChecking(false);
          return;
        }
        const sessRes = await fetch("/api/session", {
          credentials: "include",
          cache: "no-store",
        }).catch(() => null);
        if (sessRes && sessRes.ok) {
          const json = await sessRes.json().catch(() => null);
          if (json && json.user) {
            router.replace("/dashboard");
            return;
          }
        }
      } catch {
        /* ignora e mostra login */
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return <LoginForm />;
}
