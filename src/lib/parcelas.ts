import { somarDias, somarMeses } from "./meses";

export const MAXIMO_DE_PARCELAS = 48;

/** Como as datas das parcelas se distribuem a partir da primeira. */
export const INTERVALOS = [
  { valor: "mensal", rotulo: "Todo mês, no mesmo dia" },
  { valor: "30", rotulo: "A cada 30 dias" },
  { valor: "28", rotulo: "A cada 28 dias" },
  { valor: "15", rotulo: "A cada 15 dias" },
] as const;

export type Intervalo = (typeof INTERVALOS)[number]["valor"];

/** Vencimento de cada parcela, a partir da data da primeira. */
export function datasDasParcelas(
  primeira: string,
  quantidade: number,
  intervalo: Intervalo,
): string[] {
  return Array.from({ length: quantidade }, (_, indice) =>
    intervalo === "mensal"
      ? somarMeses(primeira, indice)
      : somarDias(primeira, indice * Number(intervalo)),
  );
}

/**
 * Divide um total em parcelas iguais. Os centavos que sobram da divisão vão
 * para a primeira parcela, para a soma fechar exatamente no total.
 */
export function dividirEmParcelas(total: number, quantidade: number): number[] {
  const centavos = Math.round(total * 100);
  const base = Math.floor(centavos / quantidade);
  const resto = centavos - base * quantidade;
  return Array.from(
    { length: quantidade },
    (_, indice) => (base + (indice === 0 ? resto : 0)) / 100,
  );
}
