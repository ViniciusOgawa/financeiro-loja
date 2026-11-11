import type { NextConfig } from "next";

// Todas as telas dependem do usuário logado e de dados que mudam a cada
// pagamento, então o sistema renderiza tudo a cada acesso, sem cache.
const nextConfig: NextConfig = {};

export default nextConfig;
