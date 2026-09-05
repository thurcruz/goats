import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Rotas renomeadas na V1 (Performance/Saúde/Conhecimento/Financeiro ->
  // Hoje/Corpo/Mente/Finanças). Os redirects preservam links e favoritos
  // antigos; podem ser removidos quando não houver mais tráfego neles.
  async redirects() {
    return [
      { source: '/dashboard', destination: '/hoje', permanent: true },
      { source: '/saude', destination: '/corpo', permanent: true },
      { source: '/saude/:path*', destination: '/corpo/:path*', permanent: true },
      { source: '/conhecimento', destination: '/mente', permanent: true },
      { source: '/financeiro', destination: '/financas', permanent: true },
      { source: '/goat-ai', destination: '/pri', permanent: true },
      { source: '/apri', destination: '/pri', permanent: true },
    ];
  },
};

export default nextConfig;
