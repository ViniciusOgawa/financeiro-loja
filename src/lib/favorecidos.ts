import "server-only";
import type { criarClienteServidor } from "./supabase/server";

type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>;

/**
 * O favorecido é digitado livremente nos formulários. Devolve o id do
 * cadastro com o mesmo nome (sem diferenciar maiúsculas) ou cria um novo.
 * Nome vazio significa "sem favorecido" e devolve null.
 */
export async function resolverFavorecido(
  supabase: Cliente,
  nome: string,
): Promise<{ id: string | null } | { erro: string }> {
  if (!nome) return { id: null };

  const { data: existentes, error: erroBusca } = await supabase
    .from("favorecidos")
    .select("id, nome");
  if (erroBusca) return { erro: "Não foi possível salvar. Tente de novo." };

  const procurado = nome.toLocaleLowerCase("pt-BR");
  const encontrado = existentes.find(
    (favorecido) => favorecido.nome.toLocaleLowerCase("pt-BR") === procurado,
  );
  if (encontrado) return { id: encontrado.id };

  const { data: novo, error: erroNovo } = await supabase
    .from("favorecidos")
    .insert({ nome })
    .select("id")
    .single();
  if (erroNovo) return { erro: "Não foi possível criar o favorecido." };
  return { id: novo.id };
}
