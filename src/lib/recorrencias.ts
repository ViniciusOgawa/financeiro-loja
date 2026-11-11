import "server-only";
import {
  chaveMes,
  dataDoDia,
  deslocarMes,
  diasNoMes,
  lerMes,
  type Mes,
} from "./meses";
import type { criarClienteServidor } from "./supabase/server";

type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>;

/** Até quantos meses para trás e para a frente as contas fixas são geradas. */
const MESES_PARA_TRAS = 12;
const MESES_PARA_FRENTE = 12;

/**
 * Cria as contas do mês para cada conta fixa ativa, se ainda não existirem.
 * Roda ao abrir a tela do mês, sem depender de tarefa agendada.
 *
 * Além do mês que está sendo visto, cobre os meses passados recentes: se
 * ninguém abrir o sistema em um mês, as contas dele não podem ficar sem ser
 * geradas, porque sumiriam da lista de atrasadas.
 *
 * Uma conta gerada e depois cancelada não é recriada: a conferência
 * considera contas em qualquer situação.
 */
export async function gerarContasFixas(
  supabase: Cliente,
  mesVisto: Mes,
  dataDeHoje: string,
): Promise<void> {
  const atual = lerMes(undefined, dataDeHoje);

  const meses: Mes[] = [];
  for (let recuo = MESES_PARA_TRAS; recuo >= 0; recuo--) {
    meses.push(deslocarMes(atual, -recuo));
  }
  const visto = chaveMes(mesVisto);
  if (
    visto > chaveMes(atual) &&
    visto <= chaveMes(deslocarMes(atual, MESES_PARA_FRENTE))
  ) {
    meses.push(mesVisto);
  }

  const { data: fixas, error: erroFixas } = await supabase
    .from("recorrencias")
    .select(
      "id, descricao, favorecido_id, categoria_id, valor, dia_vencimento, inicio, fim",
    )
    .eq("ativa", true);
  if (erroFixas || fixas.length === 0) return;

  const competencias = meses.map((mes) => dataDoDia(mes, 1));
  const { data: existentes, error: erroExistentes } = await supabase
    .from("contas")
    .select("recorrencia_id, competencia")
    .in(
      "recorrencia_id",
      fixas.map((fixa) => fixa.id),
    )
    .in("competencia", competencias);
  if (erroExistentes) return;

  const jaGeradas = new Set(
    existentes.map((conta) => `${conta.recorrencia_id}|${conta.competencia}`),
  );

  const novas = [];
  for (const fixa of fixas) {
    for (const mes of meses) {
      const competencia = dataDoDia(mes, 1);
      if (competencia < fixa.inicio) continue;
      if (fixa.fim && competencia > fixa.fim) continue;
      if (jaGeradas.has(`${fixa.id}|${competencia}`)) continue;

      novas.push({
        descricao: fixa.descricao,
        favorecido_id: fixa.favorecido_id,
        categoria_id: fixa.categoria_id,
        valor: fixa.valor,
        // Em meses mais curtos, o vencimento cai no último dia.
        vencimento: dataDoDia(mes, Math.min(fixa.dia_vencimento, diasNoMes(mes))),
        recorrencia_id: fixa.id,
        competencia,
      });
    }
  }

  if (novas.length === 0) return;
  // Se duas pessoas abrirem a tela ao mesmo tempo, o banco recusa a
  // duplicata e o erro pode ser ignorado: a próxima abertura completa o
  // que faltar.
  await supabase.from("contas").insert(novas);
}
