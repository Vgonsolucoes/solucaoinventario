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
else
  echo "⚠️  DATABASE_URL não definida - pulando migrations."
fi

# 2) Sobe o servidor Next.js
echo "🚀 Iniciando servidor Next.js na porta ${PORT:-3000}..."
exec node server.js
