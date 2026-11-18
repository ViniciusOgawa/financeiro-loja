// Períodos da tela de Relatórios: semana (domingo a sábado, como no
// calendário), mês ou ano. Datas sempre como texto "AAAA-MM-DD".

import { formatarData, dataValida } from "./formato";
import { deslocarMes, diasNoMes, dataDoDia, nomeMes, somarDias } from "./meses";

export type TipoDePeriodo = "semana" | "mes" | "ano";

export const TIPOS_DE_PERIODO: { valor: TipoDePeriodo; rotulo: string }[] = [
  { valor: "semana", rotulo: "Semana" },
  { valor: "mes", rotulo: "Mês" },
  { valor: "ano", rotulo: "Ano" },
];

export type Periodo = {
  tipo: TipoDePeriodo;
  inicio: string;
  fim: string;
  titulo: string;
  /** Primeiro dia do período anterior e do seguinte, para as setas. */
  anterior: string;
  seguinte: string;
};

export function lerTipoDePeriodo(texto: string | undefined): TipoDePeriodo {
  return texto === "semana" || texto === "ano" ? texto : "mes";
}

/** O período do tipo pedido que contém a data (ou hoje, se ela for inválida). */
export function montarPeriodo(
  tipo: TipoDePeriodo,
  texto: string | undefined,
  hoje: string,
): Periodo {
  const data = texto && dataValida(texto) ? texto : hoje;
  const ano = Number(data.slice(0, 4));
  const mes = Number(data.slice(5, 7));

  if (tipo === "semana") {
    const [a, m, d] = data.split("-").map(Number);
    const diaDaSemana = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
    const inicio = somarDias(data, -diaDaSemana);
    const fim = somarDias(inicio, 6);
    return {
      tipo,
      inicio,
      fim,
      // O ano do início só aparece quando a semana atravessa a virada do ano.
      titulo: `${
        inicio.slice(0, 4) === fim.slice(0, 4)
          ? formatarData(inicio).slice(0, 5)
          : formatarData(inicio)
      } a ${formatarData(fim)}`,
      anterior: somarDias(inicio, -7),
      seguinte: somarDias(inicio, 7),
    };
  }

  if (tipo === "ano") {
    return {
      tipo,
      inicio: `${ano}-01-01`,
      fim: `${ano}-12-31`,
      titulo: String(ano),
      anterior: `${ano - 1}-01-01`,
      seguinte: `${ano + 1}-01-01`,
    };
  }

  const atual = { ano, mes };
  return {
    tipo,
    inicio: dataDoDia(atual, 1),
    fim: dataDoDia(atual, diasNoMes(atual)),
    titulo: nomeMes(atual),
    anterior: dataDoDia(deslocarMes(atual, -1), 1),
    seguinte: dataDoDia(deslocarMes(atual, 1), 1),
  };
}
