"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EstadoAcao } from "@/componentes/form-com-estado";
import { resolverBeneficiario } from "@/lib/beneficiarios";
import { dataValida, hoje, lerValor } from "@/lib/formato";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";

export type CamposConta = {
  beneficiario: string;
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
    beneficiario: texto(formData, "beneficiario").replace(/\s+/g, " "),
    valor: texto(formData, "valor"),
    vencimento: texto(formData, "vencimento"),
    observacao: texto(formData, "observacao"),
  };

  if (!campos.beneficiario) {
    return { erro: "Digite o beneficiário do boleto.", campos };
  }

  const valor = lerValor(campos.valor);
  if (valor === null || valor >= 10_000_000_000) {
    return { erro: "Digite um valor válido, como 1.250,00.", campos };
  }
  if (!dataValida(campos.vencimento)) {
    return { erro: "Escolha a data de vencimento.", campos };
  }

  const supabase = await criarClienteServidor();
  const beneficiario = await resolverBeneficiario(supabase, campos.beneficiario);
  if ("erro" in beneficiario) return { erro: beneficiario.erro, campos };

  // A descrição deixou de ser digitada; guarda o nome do beneficiário, como
  // nos boletos lançados antes da mudança.
  const { error } = await supabase.from("contas").insert({
    descricao: beneficiario.nome,
    favorecido_id: beneficiario.id,
    valor,
    vencimento: campos.vencimento,
    observacao: campos.observacao || null,
  });
  if (error) {
    return { erro: "Não foi possível salvar o boleto. Tente de novo.", campos };
  }

  revalidatePath("/", "layout");
  // Volta para o mês do vencimento, para o boleto aparecer na tela. Ao lançar
  // outro, o número no endereço muda a cada vez, o que faz o formulário
  // recomeçar vazio.
  redirect(
    formData.get("depois") === "outra"
      ? `/contas/nova?salva=${Date.now()}`
      : `/mes?mes=${campos.vencimento.slice(0, 7)}`,
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

export type CamposEdicao = {
  beneficiario: string;
  valor: string;
  vencimento: string;
  observacao: string;
  pago_em: string;
  valor_pago: string;
};

export type EstadoEdicao = {
  erro?: string;
  campos?: CamposEdicao;
};

/**
 * Corrige um boleto já lançado. Numa compra parcelada, muda só esta parcela.
 * Num boleto pago, também permite corrigir a data e o valor do pagamento.
 */
export async function editarConta(
  _anterior: EstadoEdicao,
  formData: FormData,
): Promise<EstadoEdicao> {
  await exigirUsuario();
  const id = texto(formData, "id");
  const paga = formData.get("paga") === "true";
  const campos: CamposEdicao = {
    beneficiario: texto(formData, "beneficiario").replace(/\s+/g, " "),
    valor: texto(formData, "valor"),
    vencimento: texto(formData, "vencimento"),
    observacao: texto(formData, "observacao"),
    pago_em: texto(formData, "pago_em"),
    valor_pago: texto(formData, "valor_pago"),
  };

  if (!id) return { erro: "Não foi possível salvar. Tente de novo.", campos };
  if (!campos.beneficiario) {
    return { erro: "Digite o beneficiário do boleto.", campos };
  }
  const valor = lerValor(campos.valor);
  if (valor === null || valor >= 10_000_000_000) {
    return { erro: "Digite um valor válido, como 1.250,00.", campos };
  }
  if (!dataValida(campos.vencimento)) {
    return { erro: "Escolha a data de vencimento.", campos };
  }

  let pagamento = {};
  if (paga) {
    const valorPago = lerValor(campos.valor_pago);
    if (!dataValida(campos.pago_em)) {
      return { erro: "Escolha a data do pagamento.", campos };
    }
    if (campos.pago_em > hoje()) {
      return { erro: "A data do pagamento não pode ser no futuro.", campos };
    }
    if (valorPago === null || valorPago >= 10_000_000_000) {
      return { erro: "Digite um valor pago válido, como 1.250,00.", campos };
    }
    pagamento = { pago_em: campos.pago_em, valor_pago: valorPago };
  }

  const supabase = await criarClienteServidor();
  const beneficiario = await resolverBeneficiario(supabase, campos.beneficiario);
  if ("erro" in beneficiario) return { erro: beneficiario.erro, campos };

  const { data, error } = await supabase
    .from("contas")
    .update({
      descricao: beneficiario.nome,
      favorecido_id: beneficiario.id,
      valor,
      vencimento: campos.vencimento,
      observacao: campos.observacao || null,
      ...pagamento,
    })
    .eq("id", id)
    .eq("status", paga ? "paga" : "aberta")
    .select("id");
  if (error) {
    return { erro: "Não foi possível salvar. Tente de novo.", campos };
  }
  if (!data?.length) {
    // Alguém pagou, desfez ou cancelou o boleto enquanto a tela estava aberta.
    return {
      erro: "Este boleto mudou de situação. Volte e abra a edição de novo.",
      campos,
    };
  }

  revalidatePath("/", "layout");
  redirect(`/mes?mes=${campos.vencimento.slice(0, 7)}`);
}
