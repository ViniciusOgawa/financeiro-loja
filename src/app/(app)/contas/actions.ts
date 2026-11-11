"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EstadoAcao } from "@/componentes/form-com-estado";
import { resolverFavorecido } from "@/lib/favorecidos";
import { dataValida, hoje, lerValor } from "@/lib/formato";
import { MAXIMO_DE_PARCELAS } from "@/lib/parcelas";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";

export type CamposConta = {
  descricao: string;
  favorecido: string;
  categoria_id: string;
  valor: string;
  vencimento: string;
  observacao: string;
};

export type EstadoConta = {
  erro?: string;
  // Devolvidos quando há erro, para a pessoa não precisar digitar tudo de novo.
  campos?: CamposConta;
};

function texto(formData: FormData, nome: string): string {
  return String(formData.get(nome) ?? "").trim();
}

export async function criarConta(
  _anterior: EstadoConta,
  formData: FormData,
): Promise<EstadoConta> {
  await exigirUsuario();

  const campos: CamposConta = {
    descricao: texto(formData, "descricao").replace(/\s+/g, " "),
    favorecido: texto(formData, "favorecido").replace(/\s+/g, " "),
    categoria_id: texto(formData, "categoria_id"),
    valor: texto(formData, "valor"),
    vencimento: texto(formData, "vencimento"),
    observacao: texto(formData, "observacao"),
  };

  if (!campos.descricao) {
    return { erro: "Digite a descrição da conta.", campos };
  }

  // Uma conta simples tem uma única parcela, lida dos campos principais.
  // Uma compra parcelada manda a data e o valor de cada parcela, já
  // conferidos (e talvez ajustados) pela pessoa na prévia do formulário.
  const quantidade = Number(texto(formData, "parcelas") || "1");
  if (
    !Number.isInteger(quantidade) ||
    quantidade < 1 ||
    quantidade > MAXIMO_DE_PARCELAS
  ) {
    return {
      erro: `O número de parcelas deve ficar entre 1 e ${MAXIMO_DE_PARCELAS}.`,
      campos,
    };
  }

  const parcelas: { valor: number; vencimento: string }[] = [];
  if (quantidade === 1) {
    const valor = lerValor(campos.valor);
    if (valor === null) {
      return { erro: "Digite um valor válido, como 1.250,00.", campos };
    }
    if (!dataValida(campos.vencimento)) {
      return { erro: "Escolha a data de vencimento.", campos };
    }
    parcelas.push({ valor, vencimento: campos.vencimento });
  } else {
    const valores = formData.getAll("parcela_valor").map(String);
    const vencimentos = formData.getAll("parcela_vencimento").map(String);
    if (valores.length !== quantidade || vencimentos.length !== quantidade) {
      return {
        erro: "Preencha o valor e o primeiro vencimento para gerar as parcelas.",
        campos,
      };
    }
    for (let indice = 0; indice < quantidade; indice++) {
      const valor = lerValor(valores[indice]);
      if (valor === null) {
        return {
          erro: `O valor da parcela ${indice + 1} não é válido.`,
          campos,
        };
      }
      if (!dataValida(vencimentos[indice])) {
        return {
          erro: `Escolha o vencimento da parcela ${indice + 1}.`,
          campos,
        };
      }
      parcelas.push({ valor, vencimento: vencimentos[indice] });
    }
  }

  const total =
    Math.round(parcelas.reduce((soma, p) => soma + p.valor, 0) * 100) / 100;
  if (total >= 10_000_000_000) {
    return { erro: "O valor é alto demais.", campos };
  }

  const supabase = await criarClienteServidor();

  const favorecido = await resolverFavorecido(supabase, campos.favorecido);
  if ("erro" in favorecido) return { erro: favorecido.erro, campos };
  const favorecidoId = favorecido.id;

  const comum = {
    descricao: campos.descricao,
    favorecido_id: favorecidoId,
    categoria_id: campos.categoria_id || null,
  };

  // Compra parcelada: um registro da compra e uma conta para cada parcela.
  let compraId: string | null = null;
  if (parcelas.length > 1) {
    const { data: compra, error: erroCompra } = await supabase
      .from("compras")
      .insert({ ...comum, valor_total: total, num_parcelas: parcelas.length })
      .select("id")
      .single();
    if (erroCompra) {
      return { erro: "Não foi possível salvar a compra. Tente de novo.", campos };
    }
    compraId = compra.id;
  }

  // As parcelas entram todas de uma vez: ou todas são gravadas, ou nenhuma.
  const { error } = await supabase.from("contas").insert(
    parcelas.map((parcela, indice) => ({
      ...comum,
      valor: parcela.valor,
      vencimento: parcela.vencimento,
      observacao: campos.observacao || null,
      compra_id: compraId,
      parcela_numero: compraId ? indice + 1 : null,
    })),
  );
  if (error) {
    // Sem as parcelas, a compra ficaria solta no banco.
    if (compraId) await supabase.from("compras").delete().eq("id", compraId);
    return { erro: "Não foi possível salvar a conta. Tente de novo.", campos };
  }

  revalidatePath("/", "layout");
  revalidatePath("/favorecidos");
  // Volta para o mês do primeiro vencimento, para a conta aparecer na tela.
  // Ao lançar outra, o número no endereço muda a cada vez, o que faz o
  // formulário recomeçar vazio.
  redirect(
    formData.get("depois") === "outra"
      ? `/contas/nova?salva=${Date.now()}`
      : `/mes?mes=${parcelas[0].vencimento.slice(0, 7)}`,
  );
}

/** Marca como paga, com a data e o valor realmente pago (pode ter juros). */
export async function pagarConta(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const usuario = await exigirUsuario();
  const id = texto(formData, "id");
  const pagoEm = texto(formData, "pago_em");
  const valorPago = lerValor(texto(formData, "valor_pago"));

  if (!id) return { erro: "Não foi possível registrar o pagamento." };
  if (!dataValida(pagoEm)) return { erro: "Escolha a data do pagamento." };
  if (pagoEm > hoje()) {
    return { erro: "A data do pagamento não pode ser no futuro." };
  }
  if (valorPago === null || valorPago >= 10_000_000_000) {
    return { erro: "Digite um valor válido, como 1.250,00." };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("contas")
    .update({
      status: "paga",
      pago_em: pagoEm,
      valor_pago: valorPago,
      pago_por: usuario.id,
    })
    .eq("id", id)
    .eq("status", "aberta");
  if (error) return { erro: "Não foi possível registrar o pagamento." };

  revalidatePath("/", "layout");
  return {};
}

/** Volta uma conta paga para "em aberto", para corrigir um engano. */
export async function desfazerPagamento(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  await exigirUsuario();
  const id = texto(formData, "id");
  if (!id) return { erro: "Não foi possível desfazer o pagamento." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("contas")
    .update({ status: "aberta", pago_em: null, valor_pago: null, pago_por: null })
    .eq("id", id)
    .eq("status", "paga");
  if (error) return { erro: "Não foi possível desfazer o pagamento." };

  revalidatePath("/", "layout");
  return {};
}

/** Conta cancelada sai das listas e dos totais, mas continua no histórico. */
export async function cancelarConta(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  await exigirUsuario();
  const id = texto(formData, "id");
  if (!id) return { erro: "Não foi possível cancelar." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("contas")
    .update({ status: "cancelada" })
    .eq("id", id)
    .eq("status", "aberta");
  if (error) return { erro: "Não foi possível cancelar." };

  revalidatePath("/", "layout");
  return {};
}
