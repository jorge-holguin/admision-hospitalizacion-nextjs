/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"]
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Asegurar que los archivos estáticos en public sean accesibles
  async rewrites() {
    return [
      {
        source: '/swagger.html',
        destination: '/swagger.html',
      },
      {
        source: '/swagger-:path*',
        destination: '/swagger-:path*',
      },
      {
        source: '/swagger-loader.js',
        destination: '/swagger-loader.js',
      },
    ];
  },
}

const originalLog = console.log;
console.log = (...args) => {
  const timestamp = new Date().toLocaleTimeString("es-PE", {
    hour12: false,
    timeZone: "America/Lima"
  });
  originalLog(`[${timestamp}]`, ...args);
};


export default nextConfig
