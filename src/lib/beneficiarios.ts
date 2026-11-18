import "server-only";
import type { criarClienteServidor } from "./supabase/server";

type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>;

/**
 * O beneficiário é digitado livremente ao lançar um boleto. Devolve o
 * cadastro com o mesmo nome (sem diferenciar maiúsculas) ou cria um novo.
 * No banco, a tabela se chama "favorecidos".
 */
export async function resolverBeneficiario(
  supabase: Cliente,
  nome: string,
): Promise<{ id: string; nome: string } | { erro: string }> {
  const { data: existentes, error: erroBusca } = await supabase
    .from("favorecidos")
    .select("id, nome, ativo");
  if (erroBusca) return { erro: "Não foi possível salvar. Tente de novo." };

  const procurado = nome.toLocaleLowerCase("pt-BR");
  const encontrado = existentes.find(
    (beneficiario) => beneficiario.nome.toLocaleLowerCase("pt-BR") === procurado,
  );
  if (encontrado) {
    // Lançar um boleto para um beneficiário desativado o traz de volta.
    if (!encontrado.ativo) {
      await supabase
        .from("favorecidos")
        .update({ ativo: true })
        .eq("id", encontrado.id);
    }
    return { id: encontrado.id, nome: encontrado.nome };
  }

  const { data: novo, error: erroNovo } = await supabase
    .from("favorecidos")
    .insert({ nome })
    .select("id, nome")
    .single();
  if (erroNovo) return { erro: "Não foi possível cadastrar o beneficiário." };
  return novo;
}
