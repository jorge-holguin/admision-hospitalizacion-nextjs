/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
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
