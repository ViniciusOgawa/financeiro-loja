// Valores em reais e datas no formato brasileiro.
// As datas circulam sempre como texto "AAAA-MM-DD", sem horário, para que o
// fuso do servidor nunca desloque um vencimento em um dia.

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarMoeda(valor: number): string {
  return moeda.format(valor);
}

/**
 * Lê um valor digitado: "1.234,56", "1234,5", "1234.56", "R$ 80".
 * Devolve null se não for um valor positivo com até duas casas.
 */
export function lerValor(texto: string): number | null {
  const limpo = texto.replace(/R\$/i, "").replace(/\s/g, "");
  if (!limpo) return null;

  let normalizado = limpo;
  if (limpo.includes(",")) {
    // Vírgula é o separador decimal; pontos são separadores de milhar.
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    // "1.500" sem vírgula é mil e quinhentos, não um e meio.
    normalizado = limpo.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;
  const valor = Math.round(Number(normalizado) * 100) / 100;
  return valor > 0 ? valor : null;
}

/** Confere se o texto é uma data real no formato "AAAA-MM-DD". */
export function dataValida(texto: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return false;
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

/** "2026-11-15" vira "15/11/2026". */
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Data de hoje na loja (horário de Brasília), como "AAAA-MM-DD". */
export function hoje(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}
