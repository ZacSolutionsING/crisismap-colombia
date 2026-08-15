/** @type {import('next').NextConfig} */
const nextConfig = {
  // Solo una vez, y en true para mejor desarrollo
  reactStrictMode: true,

  // Quitar header de powered-by por seguridad
  poweredByHeader: false,

  // Configuración experimental
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.vercel.app",
        "*.crisismap-colombia.vercel.app",
      ],
    },
  },

  // Configuración de imágenes (para Supabase)
  images: {
    // SOLO USAMOS remotePatterns (más flexible y moderno)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // Esto cubre cualquier subdominio de supabase.co
      },
    ],
  },

  // Configuración para PWA
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/icons/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Compilador optimizado
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  swcMinify: true,
  trailingSlash: false,
};

module.exports = nextConfig;
