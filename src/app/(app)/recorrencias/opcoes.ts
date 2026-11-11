import "server-only";
import { criarClienteServidor } from "@/lib/supabase/server";

/** Categorias e favorecidos ativos, para os campos do formulário. */
export async function carregarOpcoes() {
  const supabase = await criarClienteServidor();
  const [categorias, favorecidos] = await Promise.all([
    supabase.from("categorias").select("id, nome").order("nome"),
    supabase
      .from("favorecidos")
      .select("nome")
      .eq("ativo", true)
      .order("nome"),
  ]);

  return {
    categorias: (categorias.data ?? []) as { id: string; nome: string }[],
    favorecidos: (favorecidos.data ?? []).map((f) => f.nome as string),
  };
}
