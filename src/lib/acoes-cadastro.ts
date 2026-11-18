"use server";

import { revalidatePath } from "next/cache";
import type { EstadoAcao } from "@/componentes/form-com-estado";
import { criarClienteServidor } from "./supabase/server";
import { exigirUsuario } from "./usuario";

// Ações da tela de Beneficiários. No banco, a tabela se chama "favorecidos".

const CAMINHO = "/beneficiarios";
const NOME_DUPLICADO = "23505";
const REGISTRO_EM_USO = "23503";
const ERRO_GENERICO = "Não foi possível salvar. Tente de novo.";

function lerNome(formData: FormData): string {
  return String(formData.get("nome") ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

/** Procura um beneficiário com o mesmo nome, sem diferenciar maiúsculas. */
async function nomeEmUso(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  nome: string,
  outroQue?: string,
): Promise<boolean> {
  const { data } = await supabase.from("favorecidos").select("id, nome");
  const procurado = nome.toLocaleLowerCase("pt-BR");
  return (data ?? []).some(
    (beneficiario) =>
      beneficiario.id !== outroQue &&
      beneficiario.nome.toLocaleLowerCase("pt-BR") === procurado,
  );
}

export async function criarBeneficiario(
  _: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  await exigirUsuario();
  const nome = lerNome(formData);
  if (!nome) return { erro: "Digite o nome." };

  const supabase = await criarClienteServidor();
  if (await nomeEmUso(supabase, nome)) {
    return { erro: "Já existe um beneficiário com esse nome." };
  }
  const { error } = await supabase.from("favorecidos").insert({ nome });
  if (error) {
    return {
      erro:
        error.code === NOME_DUPLICADO
          ? "Já existe um beneficiário com esse nome."
          : ERRO_GENERICO,
    };
  }

  revalidatePath(CAMINHO);
  return {};
}

export async function renomearBeneficiario(
  _: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  await exigirUsuario();
  const id = String(formData.get("id") ?? "");
  const nome = lerNome(formData);
  if (!id) return { erro: ERRO_GENERICO };
  if (!nome) return { erro: "O nome não pode ficar vazio." };

  const supabase = await criarClienteServidor();
  if (await nomeEmUso(supabase, nome, id)) {
    return { erro: "Já existe um beneficiário com esse nome." };
  }
  const { error } = await supabase
    .from("favorecidos")
    .update({ nome })
    .eq("id", id);
  if (error) {
    return {
      erro:
        error.code === NOME_DUPLICADO
          ? "Já existe um beneficiário com esse nome."
          : ERRO_GENERICO,
    };
  }

  // O nome aparece nas listas de boletos e nos relatórios.
  revalidatePath("/", "layout");
  return {};
}

export async function excluirBeneficiario(
  _: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  await exigirUsuario();
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: ERRO_GENERICO };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("favorecidos").delete().eq("id", id);
  if (error) {
    return {
      erro:
        error.code === REGISTRO_EM_USO
          ? "Este beneficiário tem boletos lançados e não pode ser excluído. Use Desativar."
          : ERRO_GENERICO,
    };
  }

  revalidatePath(CAMINHO);
  return {};
}

/** Beneficiário desativado some das sugestões ao lançar, mas mantém o histórico. */
export async function alternarBeneficiario(
  _: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  await exigirUsuario();
  const id = String(formData.get("id") ?? "");
  const ativo = formData.get("ativo") === "true";
  if (!id) return { erro: ERRO_GENERICO };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("favorecidos")
    .update({ ativo })
    .eq("id", id);
  if (error) return { erro: ERRO_GENERICO };

  revalidatePath(CAMINHO);
  return {};
}
