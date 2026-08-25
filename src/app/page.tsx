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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-solucao-blue/5 via-white to-solucao-orange/5">
      <header className="bg-white/60 backdrop-blur border-b border-solucao-blue/10">
        <div className="container mx-auto py-3 px-4 flex items-center justify-between">
          <Image
            src="https://sesolucao.com.br/wp-content/themes/solucao/img/logo__solucao.png"
            alt="Solução Equipamentos"
            width={180}
            height={54}
            priority
          />
          <span className="text-xs sm:text-sm font-medium text-solucao-blue">
            Sistema de Inventário
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
          <div className="md:col-span-3 hidden md:block space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-solucao-blue mb-3">
                Gestão de Patrimônio
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Controle completo de ativos, inventários e colaboradores com
                leitura de QR Code via câmera.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <p className="font-semibold text-solucao-blue text-sm">Patrimônios</p>
                <p className="text-xs text-muted-foreground">
                  Cadastre e gerencie todos os ativos
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <p className="font-semibold text-solucao-orange text-sm">Inventários</p>
                <p className="text-xs text-muted-foreground">
                  Realize inventários periódicos
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <p className="font-semibold text-solucao-blue text-sm">Colaboradores</p>
                <p className="text-xs text-muted-foreground">
                  Responsáveis e usuários
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <p className="font-semibold text-solucao-orange text-sm">QR Code</p>
                <p className="text-xs text-muted-foreground">
                  Etiquetas e leitura via câmera
                </p>
              </div>
            </div>
          </div>

          <Card className="md:col-span-2 w-full shadow-xl border-0">
            <CardHeader className="text-center space-y-3 md:hidden">
              <CardTitle className="text-solucao-blue text-2xl">
                Gestão de Patrimônio
              </CardTitle>
              <CardDescription>
                Solução Equipamentos - Inventário
              </CardDescription>
            </CardHeader>
            <CardHeader className="text-center space-y-2 hidden md:block">
              <CardTitle className="text-solucao-blue text-xl">
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
                    <p className="text-xs text-destructive">{errors.email.message}</p>
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
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-solucao-blue hover:bg-solucao-blue/90"
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
      </main>

      <footer className="border-t bg-white/60 backdrop-blur py-4">
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    }>
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
    return () => { active = false; };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-solucao-blue/5 via-white to-solucao-orange/5">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return <LoginForm />;
}
