"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EstadoAcao } from "@/componentes/form-com-estado";
import { resolverFavorecido } from "@/lib/favorecidos";
import { hoje, lerValor } from "@/lib/formato";
import { chaveMes, lerMes } from "@/lib/meses";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";

export type CamposFixa = {
  descricao: string;
  favorecido: string;
  categoria_id: string;
  valor: string;
  dia_vencimento: string;
  // Meses no formato "AAAA-MM", como o campo de mês do navegador entrega.
  inicio: string;
  fim: string;
};

export type EstadoFixa = {
  erro?: string;
  campos?: CamposFixa;
};

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

function texto(formData: FormData, nome: string): string {
  return String(formData.get(nome) ?? "").trim();
}

/** Cria uma conta fixa ou, se vier um id, altera a existente. */
export async function salvarContaFixa(
  _anterior: EstadoFixa,
  formData: FormData,
): Promise<EstadoFixa> {
  await exigirUsuario();
  const id = texto(formData, "id");

  const campos: CamposFixa = {
    descricao: texto(formData, "descricao").replace(/\s+/g, " "),
    favorecido: texto(formData, "favorecido").replace(/\s+/g, " "),
    categoria_id: texto(formData, "categoria_id"),
    valor: texto(formData, "valor"),
    dia_vencimento: texto(formData, "dia_vencimento"),
    inicio: texto(formData, "inicio"),
    fim: texto(formData, "fim"),
  };

  if (!campos.descricao) {
    return { erro: "Digite a descrição.", campos };
  }
  const valor = lerValor(campos.valor);
  if (valor === null || valor >= 10_000_000_000) {
    return { erro: "Digite um valor válido, como 1.250,00.", campos };
  }
  const dia = Number(campos.dia_vencimento);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
    return { erro: "O dia do vencimento deve ficar entre 1 e 31.", campos };
  }
  if (!MES.test(campos.inicio)) {
    return { erro: "Escolha o mês em que a conta começa.", campos };
  }
  if (campos.fim && !MES.test(campos.fim)) {
    return { erro: "O mês final não é válido.", campos };
  }
  if (campos.fim && campos.fim < campos.inicio) {
    return { erro: "O mês final não pode ser antes do mês inicial.", campos };
  }

  const supabase = await criarClienteServidor();
  const favorecido = await resolverFavorecido(supabase, campos.favorecido);
  if ("erro" in favorecido) return { erro: favorecido.erro, campos };

  const dados = {
    descricao: campos.descricao,
    favorecido_id: favorecido.id,
    categoria_id: campos.categoria_id || null,
    valor,
    dia_vencimento: dia,
    inicio: `${campos.inicio}-01`,
    fim: campos.fim ? `${campos.fim}-01` : null,
  };

  const { error } = id
    ? await supabase.from("recorrencias").update(dados).eq("id", id)
    : await supabase.from("recorrencias").insert(dados);
  if (error) {
    return { erro: "Não foi possível salvar. Tente de novo.", campos };
  }

  revalidatePath("/", "layout");
  revalidatePath("/recorrencias");
  revalidatePath("/favorecidos");
  redirect("/recorrencias");
}

/** Pausa ou reativa a geração mensal de uma conta fixa. */
export async function alternarContaFixa(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  await exigirUsuario();
  const id = texto(formData, "id");
  const ativar = formData.get("ativa") === "true";
  if (!id) return { erro: "Não foi possível salvar." };

  const supabase = await criarClienteServidor();

  const alteracao: { ativa: boolean; inicio?: string } = { ativa: ativar };
  if (ativar) {
    // Ao reativar, a conta recomeça no mês atual. Sem isso, o sistema
    // criaria de uma vez as contas de todos os meses em que ficou pausada.
    const mesAtual = `${chaveMes(lerMes(undefined, hoje()))}-01`;
    const { data: fixa, error: erroBusca } = await supabase
      .from("recorrencias")
      .select("inicio, fim")
      .eq("id", id)
      .single();
    if (erroBusca) return { erro: "Não foi possível salvar." };
    if (fixa.fim && fixa.fim < mesAtual) {
      return {
        erro: "Esta conta já passou do mês final. Edite o mês final antes de reativar.",
      };
    }
    if (fixa.inicio < mesAtual) alteracao.inicio = mesAtual;
  }

  const { error } = await supabase
    .from("recorrencias")
    .update(alteracao)
    .eq("id", id);
  if (error) return { erro: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  revalidatePath("/recorrencias");
  return {};
}
