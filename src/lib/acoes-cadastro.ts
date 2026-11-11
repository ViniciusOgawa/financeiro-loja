"use server";

import { revalidatePath } from "next/cache";
import type { EstadoAcao } from "@/componentes/form-com-estado";
import { criarClienteServidor } from "./supabase/server";
import { exigirUsuario } from "./usuario";

// Ações das telas de Favorecidos e Categorias. As duas tabelas têm a mesma
// forma básica (id e nome único), então compartilham a mesma lógica.

type Cadastro = {
  tabela: "favorecidos" | "categorias";
  caminho: string;
  // Usados nas mensagens: "Já existe um favorecido com esse nome."
  um: string;
  esteEmUso: string;
};

const FAVORECIDOS: Cadastro = {
  tabela: "favorecidos",
  caminho: "/favorecidos",
  um: "um favorecido",
  esteEmUso:
    "Este favorecido tem contas lançadas e não pode ser excluído. Use Desativar.",
};

const CATEGORIAS: Cadastro = {
  tabela: "categorias",
  caminho: "/categorias",
  um: "uma categoria",
  esteEmUso: "Esta categoria tem contas lançadas e não pode ser excluída.",
};

const NOME_DUPLICADO = "23505";
const REGISTRO_EM_USO = "23503";
const ERRO_GENERICO = "Não foi possível salvar. Tente de novo.";

function lerNome(formData: FormData): string {
  return String(formData.get("nome") ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

async function criar(cadastro: Cadastro, formData: FormData): Promise<EstadoAcao> {
  await exigirUsuario();
  const nome = lerNome(formData);
  if (!nome) return { erro: "Digite o nome." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from(cadastro.tabela).insert({ nome });
  if (error) {
    return {
      erro:
        error.code === NOME_DUPLICADO
          ? `Já existe ${cadastro.um} com esse nome.`
          : ERRO_GENERICO,
    };
  }

  revalidatePath(cadastro.caminho);
  return {};
}

async function renomear(cadastro: Cadastro, formData: FormData): Promise<EstadoAcao> {
  await exigirUsuario();
  const id = String(formData.get("id") ?? "");
  const nome = lerNome(formData);
  if (!id) return { erro: ERRO_GENERICO };
  if (!nome) return { erro: "O nome não pode ficar vazio." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from(cadastro.tabela)
    .update({ nome })
    .eq("id", id);
  if (error) {
    return {
      erro:
        error.code === NOME_DUPLICADO
          ? `Já existe ${cadastro.um} com esse nome.`
          : ERRO_GENERICO,
    };
  }

  revalidatePath(cadastro.caminho);
  return {};
}

async function excluir(cadastro: Cadastro, formData: FormData): Promise<EstadoAcao> {
  await exigirUsuario();
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: ERRO_GENERICO };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from(cadastro.tabela).delete().eq("id", id);
  if (error) {
    return {
      erro: error.code === REGISTRO_EM_USO ? cadastro.esteEmUso : ERRO_GENERICO,
    };
  }

  revalidatePath(cadastro.caminho);
  return {};
}

export async function criarFavorecido(_: EstadoAcao, formData: FormData) {
  return criar(FAVORECIDOS, formData);
}

export async function renomearFavorecido(_: EstadoAcao, formData: FormData) {
  return renomear(FAVORECIDOS, formData);
}

export async function excluirFavorecido(_: EstadoAcao, formData: FormData) {
  return excluir(FAVORECIDOS, formData);
}

/** Favorecido desativado some das sugestões ao lançar, mas mantém o histórico. */
export async function alternarFavorecido(
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

  revalidatePath("/favorecidos");
  return {};
}

export async function criarCategoria(_: EstadoAcao, formData: FormData) {
  return criar(CATEGORIAS, formData);
}

export async function renomearCategoria(_: EstadoAcao, formData: FormData) {
  return renomear(CATEGORIAS, formData);
}

export async function excluirCategoria(_: EstadoAcao, formData: FormData) {
  return excluir(CATEGORIAS, formData);
}
