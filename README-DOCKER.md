# 🐳 Guía de Build y Deploy con Docker (TLS 1.0)

Este proyecto está configurado para conectarse a SQL Server 2008 que requiere TLS 1.0. El Dockerfile incluye la configuración necesaria de OpenSSL legacy para soportar esta conexión.

## 📋 Requisitos Previos

- Docker instalado
- Docker Compose (opcional)
- Archivo `.env` configurado con las credenciales de base de datos

## 🔧 Configuración Inicial

### 1. Crear el archivo `.env`

Copia `.env.example` a `.env` y configura tus variables:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales reales:

```env
DATABASE_URL="sqlserver://172.16.0.10:1433;database=SIGSALUD;user=TU_USUARIO;password=TU_PASSWORD;encrypt=true;trustServerCertificate=true;poolTimeout=10"
NEXT_PUBLIC_API_CITAS_MASTER_URL="http://192.168.0.252:9011"
```

### 2. Verificar que existen los archivos necesarios

Asegúrate de que existen:
- ✅ `openssl-legacy.cnf` - Configuración de OpenSSL para TLS 1.0
- ✅ `Dockerfile` - Configuración multi-stage con Node 22
- ✅ `.dockerignore` - Excluye archivos innecesarios del build
- ✅ `prisma/schema.prisma` - Schema de Prisma con provider sqlserver

## 🚀 Opción 1: Build y Run con Docker (Recomendado)

### Build de la imagen

```bash
docker build -t admision-app .
```

Este comando:
- Usa Node 22 con Debian Bookworm
- Configura OpenSSL legacy para TLS 1.0
- Instala dependencias
- Genera Prisma Client
- Compila Next.js en modo producción
- Crea una imagen optimizada final

### Ejecutar el contenedor

```bash
docker run --env-file .env -p 3000:3000 admision-app
```

O con variables de entorno específicas:

```bash
docker run \
  -e DATABASE_URL="sqlserver://172.16.0.10:1433;database=SIGSALUD;user=USUARIO;password=PASSWORD;encrypt=true;trustServerCertificate=true" \
  -p 3000:3000 \
  admision-app
```

La aplicación estará disponible en: **http://localhost:3000**

## 🚀 Opción 2: Docker Compose

### Producción

```bash
# Build y run
docker-compose up --build

# O en modo detached
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### Desarrollo (opcional)

Si quieres usar Docker para desarrollo, descomenta la sección `app-dev` en `docker-compose.yml` y ejecuta:

```bash
docker-compose up app-dev
```

## 🔍 Verificación

### 1. Verificar que el contenedor está corriendo

```bash
docker ps
```

Deberías ver algo como:
```
CONTAINER ID   IMAGE          COMMAND                  PORTS                    NAMES
abc123def456   admision-app   "docker-entrypoint.s…"   0.0.0.0:3000->3000/tcp   admision-app
```

### 2. Verificar logs

```bash
docker logs -f admision-app
```

Deberías ver:
```
> admision@0.1.0 start
> next start -p 3000

   ▲ Next.js 15.2.4
   - Local:        http://localhost:3000
   - Network:      http://0.0.0.0:3000

 ✓ Ready in 1.5s
```

### 3. Test de conexión a base de datos

Accede a: http://localhost:3000

Si hay problemas de conexión, revisa:
- El `DATABASE_URL` en tu `.env`
- Que el servidor SQL Server sea accesible desde el contenedor
- Los logs del contenedor

## 🛠️ Troubleshooting

### Problema: "Error connecting to database"

**Solución:**
1. Verifica que SQL Server es accesible:
```bash
# Desde el host
telnet 172.16.0.10 1433
```

2. Si usas `localhost` en DATABASE_URL, cámbialo a la IP real de tu máquina o usa `host.docker.internal`:
```env
DATABASE_URL="sqlserver://host.docker.internal:1433;..."
```

### Problema: "TLS handshake failed"

**Solución:**
1. Verifica que el archivo `openssl-legacy.cnf` existe
2. Asegúrate de que `encrypt=true` y `trustServerCertificate=true` están en DATABASE_URL
3. Reconstruye la imagen: `docker build --no-cache -t admision-app .`

### Problema: "Prisma Client is not generated"

**Solución:**
```bash
# Reconstruir sin cache
docker build --no-cache -t admision-app .
```

### Problema: Build falla con "SWC binary not found"

**Solución:**
Agrega esta dependencia en `package.json` > `devDependencies`:
```json
"@next/swc-linux-x64-gnu": "15.2.4"
```

Y reconstruye:
```bash
docker build --no-cache -t admision-app .
```

## 📦 Comandos Útiles

### Limpiar todo (cuidado!)

```bash
# Detener y eliminar contenedores
docker-compose down

# Eliminar la imagen
docker rmi admision-app

# Limpiar todo (incluyendo volúmenes)
docker system prune -a --volumes
```

### Ejecutar comandos dentro del contenedor

```bash
# Bash
docker exec -it admision-app bash

# Ver variables de entorno
docker exec -it admision-app env | grep DATABASE

# Ejecutar Prisma Studio (requiere puerto 5555 expuesto)
docker exec -it admision-app npx prisma studio
```

### Rebuild rápido después de cambios

```bash
# Con Docker
docker build -t admision-app . && docker run --env-file .env -p 3000:3000 admision-app

# Con Docker Compose
docker-compose up --build
```

## 🔐 Seguridad

⚠️ **IMPORTANTE:**
- Nunca subas el archivo `.env` a Git (ya está en `.gitignore`)
- Usa variables de entorno específicas para cada ambiente (dev, staging, prod)
- Cambia las credenciales por defecto de SQL Server
- Considera usar Docker secrets en producción

## 📝 Notas Adicionales

### ¿Por qué TLS 1.0?

SQL Server 2008 solo soporta hasta TLS 1.0. Versiones modernas de Node.js (22+) con OpenSSL 3 bloquean TLS 1.0 por defecto por razones de seguridad. Este Dockerfile configura OpenSSL en modo legacy para permitir la conexión.

### Arquitectura del Dockerfile

El Dockerfile usa **multi-stage build**:
1. **Builder stage**: Compila la aplicación con todas las dependencias
2. **Runner stage**: Imagen final optimizada solo con lo necesario para producción

Esto reduce el tamaño de la imagen final significativamente.

### Variables de Entorno Importantes

```env
# OpenSSL (ya configuradas en Dockerfile)
OPENSSL_CONF=/etc/ssl/openssl-legacy.cnf
NODE_OPTIONS=--tls-min-v1.0 --openssl-legacy-provider

# Next.js
NODE_ENV=production
PORT=3000

# Base de datos
DATABASE_URL=...
```

## 🎯 Checklist Pre-Deploy

- [ ] Archivo `.env` configurado con credenciales correctas
- [ ] `DATABASE_URL` con `encrypt=true` y `trustServerCertificate=true`
- [ ] Archivo `openssl-legacy.cnf` existe en la raíz
- [ ] SQL Server es accesible desde el contenedor
- [ ] Puerto 3000 está libre (o cambiar en docker-compose.yml)
- [ ] Build exitoso sin errores
- [ ] Logs del contenedor muestran "Ready in X.Xs"

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs: `docker logs -f admision-app`
2. Verifica la configuración de red del contenedor
3. Asegúrate de que SQL Server acepta conexiones remotas
4. Consulta la documentación de Prisma para SQL Server

---

**Última actualización:** Noviembre 2025
**Versiones:** Node 22.16.0, Next.js 15.2.4, Prisma 6.11.1
