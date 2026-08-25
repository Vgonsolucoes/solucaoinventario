#!/bin/sh
set -e

echo "🔧 Inicializando aplicação Solução Inventário..."

# 1) Migrações seguras de produção (nunca executa reset)
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Executando prisma migrate deploy..."
  node node_modules/prisma/build/index.js migrate deploy || {
    echo "⚠️  Migrate falhou. Tentando somente prisma generate..."
    node node_modules/prisma/build/index.js generate
  }
else
  echo "⚠️  DATABASE_URL não definida - pulando migrations."
fi

# 2) Sobe o servidor Next.js
echo "🚀 Iniciando servidor Next.js na porta ${PORT:-3000}..."
exec node server.js
