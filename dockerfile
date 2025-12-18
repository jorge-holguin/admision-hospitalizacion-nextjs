# =============================================
# Dockerfile para Sistema de Gestión Hospitalaria
# Soporte para SQL Server 2008 R2 con TLS 1.0
# =============================================

# ---- Etapa 1: Dependencias ----
FROM node:20-alpine AS deps

# Instalar dependencias necesarias para Prisma y OpenSSL
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar dependencias con legacy-peer-deps para evitar conflictos
RUN npm ci --legacy-peer-deps

# Generar cliente Prisma
RUN npx prisma generate

# ---- Etapa 2: Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para el build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# DATABASE_URL dummy para el build (Prisma lo necesita aunque no se conecte)
# La URL real se proporciona en runtime via .env o docker-compose
ENV DATABASE_URL="sqlserver://localhost:1433;database=dummy;user=dummy;password=dummy;encrypt=false;trustServerCertificate=true"

# IMPORTANTE: Variables NEXT_PUBLIC_* deben estar en build time para Next.js
# Estas se incrustan en el código del cliente durante el build
ARG NEXT_PUBLIC_AUTH_API_URL
ARG NEXT_PUBLIC_API_BACKEND_URL
ARG NEXT_PUBLIC_API_CIEX_URL
ARG NEXT_PUBLIC_API_CITAS_MASTER_URL
ARG NEXT_PUBLIC_API_RESERVAS_URL
ARG NEXT_PUBLIC_API_REFCON_URL
ARG NEXT_PUBLIC_API_RENIEC_URL
ARG NEXT_PUBLIC_API_SIS_URL

ENV NEXT_PUBLIC_AUTH_API_URL=$NEXT_PUBLIC_AUTH_API_URL
ENV NEXT_PUBLIC_API_BACKEND_URL=$NEXT_PUBLIC_API_BACKEND_URL
ENV NEXT_PUBLIC_API_CIEX_URL=$NEXT_PUBLIC_API_CIEX_URL
ENV NEXT_PUBLIC_API_CITAS_MASTER_URL=$NEXT_PUBLIC_API_CITAS_MASTER_URL
ENV NEXT_PUBLIC_API_RESERVAS_URL=$NEXT_PUBLIC_API_RESERVAS_URL
ENV NEXT_PUBLIC_API_REFCON_URL=$NEXT_PUBLIC_API_REFCON_URL
ENV NEXT_PUBLIC_API_RENIEC_URL=$NEXT_PUBLIC_API_RENIEC_URL
ENV NEXT_PUBLIC_API_SIS_URL=$NEXT_PUBLIC_API_SIS_URL

# Build de la aplicación
RUN npm run build

# ---- Etapa 3: Runner (Producción) ----
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar OpenSSL para SQL Server 2008 R2
RUN apk add --no-cache openssl

# Crear configuración de OpenSSL 3.x con provider legacy habilitado
# Esto permite algoritmos de firma antiguos que SQL Server 2008 R2 necesita
RUN printf '%s\n' \
    '# OpenSSL 3.x configuration for legacy SQL Server 2008 R2 support' \
    'openssl_conf = openssl_init' \
    '' \
    '[openssl_init]' \
    'providers = provider_sect' \
    'ssl_conf = ssl_sect' \
    '' \
    '[provider_sect]' \
    'default = default_sect' \
    'legacy = legacy_sect' \
    '' \
    '[default_sect]' \
    'activate = 1' \
    '' \
    '[legacy_sect]' \
    'activate = 1' \
    '' \
    '[ssl_sect]' \
    'system_default = system_default_sect' \
    '' \
    '[system_default_sect]' \
    'MinProtocol = TLSv1' \
    'CipherString = DEFAULT:@SECLEVEL=0' \
    'Options = UnsafeLegacyRenegotiation' \
    > /etc/ssl/openssl.cnf

# Variables de entorno para habilitar TLS 1.0 y provider legacy en Node.js
ENV NODE_OPTIONS="--tls-min-v1.0 --openssl-legacy-provider"
ENV OPENSSL_CONF=/etc/ssl/openssl.cnf
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
# Forzar OpenSSL a usar módulos legacy
ENV OPENSSL_MODULES=/usr/lib/ossl-modules

# Variables de entorno de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios del builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Establecer permisos
RUN chown -R nextjs:nodejs /app

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]