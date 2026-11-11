"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EstadoAcao } from "@/componentes/form-com-estado";
import { dataValida, hoje, lerValor } from "@/lib/formato";
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
  const valor = lerValor(campos.valor);
  if (valor === null) {
    return { erro: "Digite um valor válido, como 1.250,00.", campos };
  }
  if (valor >= 10_000_000_000) {
    return { erro: "O valor é alto demais.", campos };
  }
  if (!dataValida(campos.vencimento)) {
    return { erro: "Escolha a data de vencimento.", campos };
  }

  const supabase = await criarClienteServidor();

  // O favorecido é digitado livremente: usa o cadastro existente com o mesmo
  // nome (sem diferenciar maiúsculas) ou cria um novo na hora.
  let favorecidoId: string | null = null;
  if (campos.favorecido) {
    const { data: existentes, error: erroBusca } = await supabase
      .from("favorecidos")
      .select("id, nome");
    if (erroBusca) {
      return { erro: "Não foi possível salvar. Tente de novo.", campos };
    }

    const procurado = campos.favorecido.toLocaleLowerCase("pt-BR");
    const encontrado = existentes.find(
      (f) => f.nome.toLocaleLowerCase("pt-BR") === procurado,
    );

    if (encontrado) {
      favorecidoId = encontrado.id;
    } else {
      const { data: novo, error: erroNovo } = await supabase
        .from("favorecidos")
        .insert({ nome: campos.favorecido })
        .select("id")
        .single();
      if (erroNovo) {
        return { erro: "Não foi possível criar o favorecido.", campos };
      }
      favorecidoId = novo.id;
    }
  }

  const { error } = await supabase.from("contas").insert({
    descricao: campos.descricao,
    favorecido_id: favorecidoId,
    categoria_id: campos.categoria_id || null,
    valor,
    vencimento: campos.vencimento,
    observacao: campos.observacao || null,
  });
  if (error) {
    return { erro: "Não foi possível salvar a conta. Tente de novo.", campos };
  }

  revalidatePath("/");
  revalidatePath("/favorecidos");
  // Volta para o mês em que a conta vence, para ela aparecer na tela.
  redirect(
    formData.get("depois") === "outra"
      ? "/contas/nova?salva=1"
      : `/?mes=${campos.vencimento.slice(0, 7)}`,
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

  revalidatePath("/");
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

  revalidatePath("/");
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

  revalidatePath("/");
  return {};
}
