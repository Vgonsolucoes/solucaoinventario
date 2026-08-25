import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Iniciando seed do banco...");

  const email = process.env.SEED_ADMIN_EMAIL || "admin@sesolucao.com.br";
  const senha = process.env.SEED_ADMIN_PASSWORD || "Solucao@123";
  const nome = process.env.SEED_ADMIN_NAME || "Administrador";

  const existe = await prisma.user.findUnique({ where: { email } });
  if (existe) {
    console.log("✅ Usuário admin já existe. Nenhuma alteração feita.");
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(senha, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: nome,
      passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  console.log("✅ Admin criado:");
  console.log(`   E-mail  : ${email}`);
  console.log(`   Senha   : ${senha}`);
  console.log("   Guarde estas credenciais em local seguro!");

  const setoresIniciais = [
    { nome: "Administrativo", descricao: "Departamento administrativo" },
    { nome: "Financeiro", descricao: "Departamento financeiro" },
    { nome: "Comercial", descricao: "Vendas e relacionamento" },
    { nome: "Tecnologia da Informação", descricao: "TI / Suporte / Infraestrutura" },
    { nome: "Operações", descricao: "Operações e logística" },
    { nome: "RH", descricao: "Recursos Humanos" },
  ];
  for (const s of setoresIniciais) {
    await prisma.setor.upsert({
      where: { id: crypto.randomUUID() },
      update: {},
      create: s,
    });
  }
  console.log("✅ Setores iniciais criados.");

  const categorias = [
    { nome: "Computadores", descricao: "Desktops, all-in-one" },
    { nome: "Notebooks", descricao: "Laptops e ultrabooks" },
    { nome: "Monitores", descricao: "Telens e monitores" },
    { nome: "Impressoras", descricao: "Impressoras, scanners e multifuncionais" },
    { nome: "Servidores", descricao: "Servidores físicos e storages" },
    { nome: "Rede", descricao: "Switches, roteadores, access points" },
    { nome: "Telefonia", descricao: "PABX, telefones IP, headsets" },
    { nome: "Mobiliário", descricao: "Mesas, cadeiras, armários" },
    { nome: "Veículos", descricao: "Automóveis e utilitários" },
    { nome: "Outros", descricao: "Demais itens" },
  ];
  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { id: crypto.randomUUID() },
      update: {},
      create: c,
    });
  }
  console.log("✅ Categorias iniciais criadas.");

  await prisma.$disconnect();
  console.log("🌱 Seed concluído!");
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
