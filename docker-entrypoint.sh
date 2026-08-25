#!/bin/sh
set -e

echo "🔧 Inicializando aplicação Solução Inventário..."

PRISMA_BIN="./node_modules/.bin/prisma"
if [ ! -x "$PRISMA_BIN" ]; then
  PRISMA_BIN="./node_modules/prisma/build/index.js"
fi

# 1) Migrações seguras de produção (nunca executa reset)
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Executando prisma migrate deploy..."
  if [ -x "$PRISMA_BIN" ]; then
    node "$PRISMA_BIN" migrate deploy || {
      echo "⚠️  Migrate falhou. Tentando somente prisma generate..."
      node "$PRISMA_BIN" generate || true
    }
  else
    echo "⚠️  prisma cli nao encontrado em node_modules - pulando migrate deploy."
  fi

  # 2) Seed inicial (idempotente) - cria admin + setores + categorias
  TSX_BIN="./node_modules/.bin/tsx"
  if [ -x "$TSX_BIN" ] && [ -f prisma/seed.ts ]; then
    echo "🌱 Executando prisma seed (idempotente)..."
    SEED_ADMIN_EMAIL="${SEED_ADMIN_EMAIL:-admin@sesolucao.com.br}" \
    SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-Solucao@123}" \
    node -r "$TSX_BIN/cli.mjs" prisma/seed.ts || {
      echo "⚠️  Seed falhou - tentando via prisma db seed..."
      node "$PRISMA_BIN" db seed || true
    }
  else
    echo "⚠️  tsx ou prisma/seed.ts nao encontrados - pulando seed."
  fi
else
  echo "⚠️  DATABASE_URL não definida - pulando migrations e seed."
fi

# 3) Sobe o servidor Next.js
echo "🚀 Iniciando servidor Next.js na porta ${PORT:-3000}..."
exec node server.js
