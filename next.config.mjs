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
    // Mejora el inicio en dev evitando escanear todos los submódulos de paquetes grandes
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      'pdf-lib',
      'html2canvas'
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
