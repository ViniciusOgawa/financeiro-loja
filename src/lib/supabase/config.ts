// Endereço e chave pública do projeto no Supabase. A chave pública pode ir
// para o navegador: quem protege os dados são as regras de acesso do banco.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseChave =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabaseConfigurado = Boolean(supabaseUrl && supabaseChave);
