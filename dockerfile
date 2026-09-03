# =============================================
# Dockerfile para Sistema de Admision Web (Vite + React SPA)
# Servido con Nginx sobre dist/ de produccion
# =============================================

# ---- Etapa 1: Dependencias ----
FROM node:20-alpine AS deps

WORKDIR /app

# Copiar archivos de dependencias y variables de entorno
COPY package.json package-lock.json* ./
COPY .env .env.production* ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# ---- Etapa 2: Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para build de Vite
ENV NODE_ENV=production

# Build de la aplicacion (Vite lee .env y .env.production si existe)
RUN npm run build

# ---- Etapa 3: Runner (Produccion con Nginx) ----
FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

# Copiar el build estatico de Vite
COPY --from=builder /app/dist ./

# Configuracion de Nginx para SPA (rutas fallback a index.html)
RUN printf '%s\n' \
    'server {' \
    '    listen 80;' \
    '    server_name localhost;' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '    location / {' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf|map)$ {' \
    '        expires 1y;' \
    '        add_header Cache-Control "public, immutable";' \
    '    }' \
    '    gzip on;' \
    '    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;' \
    '}' \
    > /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
