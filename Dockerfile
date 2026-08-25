# syntax=docker/dockerfile:1.6

# ===============================
# Stage 1: Dependências (deps)
# Instala apenas as dependências de produção e dev
# ===============================
FROM node:20-alpine AS deps
WORKDIR /app

# Alpine: instala OpenSSL (libssl) exigido pelo Prisma Engine
RUN apk add --no-cache openssl

# Copia o schema do Prisma (necessário antes do postinstall / prisma generate)
COPY prisma/schema.prisma prisma/

# Copia manifestos e instala dependências (cache layer)
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else npm install --omit=dev; fi

# ===============================
# Stage 2: Builder
# Gera build de produção + Prisma Client
# ===============================
FROM node:20-alpine AS builder
WORKDIR /app

# Alpine: instala OpenSSL (libssl) exigido pelo Prisma Engine
RUN apk add --no-cache openssl

# Copia dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Garante pastas que o Next precisa (e que COPY não falha se estiverem vazias/ausentes)
RUN mkdir -p /app/public /app/.next

# Garante Prisma Client (re-gerado com os bins de Alpine, evita incompatibilidade)
RUN npx prisma generate

# Build Next.js (output: standalone configurado em next.config.mjs)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ===============================
# Stage 3: Runtime (imagem final)
# Contém apenas o necessário para rodar
# ===============================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Alpine: OpenSSL (Prisma runtime) + wget/curl para health check
RUN apk add --no-cache openssl wget curl

# Usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Garante pastas existam (evita "not found" no COPY mesmo que fontes estejam vazias)
RUN mkdir -p /app/public /app/.next/standalone /app/.next/static

# Copia arquivos públicos e gerados pelo Next standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Garante que node_modules de PRODUCAO exista no runner (contem @prisma/client + engine binaries,
# necessario para `prisma migrate deploy` e para o Prisma Client em runtime)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copia schema e migrations (exigido por `prisma migrate deploy` no entrypoint)
COPY --chown=nextjs:nodejs prisma ./prisma

# Copia src + tsconfig (exigidos pelo seed prisma/seed.ts que usa alias @/lib/prisma via tsx)
COPY --chown=nextjs:nodejs src ./src
COPY --chown=nextjs:nodejs tsconfig.json ./tsconfig.json
COPY --chown=nextjs:nodejs package.json ./package.json

# Script de entrypoint (roda migrations antes de subir a app)
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Diretório para uploads (volume persistente do EasyPanel em UPLOAD_DIR)
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads
ENV UPLOAD_DIR=/app/uploads

USER nextjs

# Aviso: PORT e HOSTNAME sao frequentemente sobrescritos pelo runtime (EasyPanel: PORT=80).
# Entao nao dependa de EXPOSE/HARDCODE 3000 fora do healthcheck com variable.
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/api/health" || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
