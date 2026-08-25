import Image from "next/image";
import { Barcode, Package2, Users, ClipboardList } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-solucao-blue/10 shadow-sm">
        <div className="container mx-auto py-4 flex items-center justify-between">
          <Image
            src="https://sesolucao.com.br/wp-content/themes/solucao/img/logo__solucao.png"
            alt="Solução Equipamentos"
            width={200}
            height={60}
            priority
          />
          <span className="text-sm font-medium text-solucao-blue">
            Sistema de Inventário
          </span>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-solucao-blue mb-4">
            Gestão de Patrimônio
          </h1>
          <p className="text-lg text-muted-foreground">
            Controle completo de ativos, inventários e colaboradores com
            leitura de QR Code via câmera.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-solucao-blue/10 text-solucao-blue flex items-center justify-center">
              <Package2 className="w-6 h-6" />
            </div>
            <h2 className="font-semibold text-lg mb-1">Patrimônios</h2>
            <p className="text-sm text-muted-foreground">
              Cadastre e gerencie todos os ativos
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-solucao-orange/10 text-solucao-orange flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h2 className="font-semibold text-lg mb-1">Inventários</h2>
            <p className="text-sm text-muted-foreground">
              Realize inventários periódicos
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-solucao-blue/10 text-solucao-blue flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="font-semibold text-lg mb-1">Colaboradores</h2>
            <p className="text-sm text-muted-foreground">
              Responsáveis e usuários do sistema
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-solucao-orange/10 text-solucao-orange flex items-center justify-center">
              <Barcode className="w-6 h-6" />
            </div>
            <h2 className="font-semibold text-lg mb-1">QR Code</h2>
            <p className="text-sm text-muted-foreground">
              Etiquetas e leitura via câmera
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Solução Equipamentos. Todos os direitos
          reservados.
        </div>
      </footer>
    </div>
  );
}
