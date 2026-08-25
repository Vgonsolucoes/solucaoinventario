import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell
      userName={session.name}
      userRole={session.role}
      userEmail={session.email}
    >
      {children}
    </DashboardShell>
  );
}
