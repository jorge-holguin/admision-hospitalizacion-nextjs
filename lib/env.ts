// Next.js carga automáticamente las variables de entorno desde .env, .env.local, etc.
// No es necesario usar dotenv explícitamente en Next.js

// Exporta las variables de entorno para usar en toda la aplicación
export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_AUTH_API_URL: process.env.NEXT_PUBLIC_AUTH_API_URL,
};

// Valida que las variables requeridas estén definidas
if (typeof process !== 'undefined' && !process.env.DATABASE_URL) {
  console.error('La variable de entorno DATABASE_URL no está definida');
}
