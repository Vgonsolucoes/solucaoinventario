"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Tags,
  Users,
  Package2,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Barcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  userEmail: string;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Setores", href: "/dashboard/setores", icon: Building2 },
  { label: "Categorias", href: "/dashboard/categorias", icon: Tags },
  { label: "Colaboradores", href: "/dashboard/colaboradores", icon: Users },
  { label: "Patrimônios", href: "/dashboard/patrimonios", icon: Package2 },
  { label: "Inventários", href: "/dashboard/inventarios", icon: ClipboardList },
  { label: "Leitura QR", href: "/dashboard/qrcode", icon: Barcode },
];

export function DashboardShell({
  children,
  userName,
  userRole,
  userEmail,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // ignore
    }
    toast.success("Sessão encerrada.");
    router.replace("/login");
    router.refresh();
  }

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "S";

  const NavList = ({ mobile }: { mobile?: boolean }) => (
    <nav className={cn("flex flex-col gap-1", mobile && "px-2")}>
      {navItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => mobile && setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-solucao-blue text-white shadow-sm"
                : "text-muted-foreground hover:bg-solucao-blue/10 hover:text-solucao-blue",
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-solucao-light">
      <Toaster position="top-right" richColors closeButton />

      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm md:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <NavList mobile />
            </div>
          </SheetContent>
        </Sheet>

        <div className="font-semibold text-solucao-blue flex-1">
          Solução Inventário
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-xs leading-tight">
            <span className="font-medium">{userName}</span>
            <span className="text-muted-foreground">{userRoleLabel(userRole)}</span>
          </div>
          <Avatar className="h-9 w-9 bg-solucao-orange text-white">
            <AvatarFallback className="bg-solucao-orange font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Sair"
            title="Sair"
          >
            <X className="h-5 w-5 text-muted-foreground" />
            <LogOut className="sr-only h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-white min-h-[calc(100vh-4rem)]">
          <div className="p-4">
            <NavList />
          </div>
          <div className="mt-auto p-4 border-t space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 bg-solucao-orange text-white">
                <AvatarFallback className="bg-solucao-orange font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs leading-tight overflow-hidden">
                <div className="font-medium truncate">{userName}</div>
                <div className="text-muted-foreground truncate">{userEmail}</div>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1800px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function userRoleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "USER":
      return "Usuário";
    case "AUDITOR":
      return "Auditor";
    default:
      return role;
  }
}
