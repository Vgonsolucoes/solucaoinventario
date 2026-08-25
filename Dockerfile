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

# Copia arquivos públicos e gerados pelo Next standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia schema e migrations (exigido por `prisma migrate deploy` no entrypoint)
COPY --chown=nextjs:nodejs prisma ./prisma

# Script de entrypoint (roda migrations antes de subir a app)
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Diretório para uploads (volume persistente do EasyPanel em UPLOAD_DIR)
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads
ENV UPLOAD_DIR=/app/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
