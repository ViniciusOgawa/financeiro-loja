// Contas de calendário para a tela do mês. Tudo é feito com ano, mês e dia
// como números, sem horário, para o fuso do servidor não interferir.

/** Um mês do calendário. `mes` vai de 1 (janeiro) a 12 (dezembro). */
export type Mes = { ano: number; mes: number };

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** Lê "AAAA-MM" do endereço; se vier vazio ou inválido, usa o mês de hoje. */
export function lerMes(texto: string | undefined, hoje: string): Mes {
  const partes = /^(\d{4})-(\d{2})$/.exec(texto ?? "");
  if (partes) {
    const ano = Number(partes[1]);
    const mes = Number(partes[2]);
    if (ano >= 2000 && ano <= 2100 && mes >= 1 && mes <= 12) {
      return { ano, mes };
    }
  }
  return { ano: Number(hoje.slice(0, 4)), mes: Number(hoje.slice(5, 7)) };
}

/** "2026-11", usado no endereço da página. */
export function chaveMes({ ano, mes }: Mes): string {
  return `${ano}-${doisDigitos(mes)}`;
}

export function deslocarMes({ ano, mes }: Mes, quantos: number): Mes {
  const indice = ano * 12 + (mes - 1) + quantos;
  return { ano: Math.floor(indice / 12), mes: (indice % 12) + 1 };
}

export function diasNoMes({ ano, mes }: Mes): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Data "AAAA-MM-DD" de um dia do mês. */
export function dataDoDia(mes: Mes, dia: number): string {
  return `${chaveMes(mes)}-${doisDigitos(dia)}`;
}

/** "Novembro de 2026". */
export function nomeMes({ ano, mes }: Mes): string {
  const nome = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(ano, mes - 1, 1)));
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

/**
 * Semanas do mês para desenhar o calendário, começando no domingo.
 * Posições fora do mês vêm como null.
 */
export function semanasDoMes(mes: Mes): (number | null)[][] {
  const primeiroDiaDaSemana = new Date(
    Date.UTC(mes.ano, mes.mes - 1, 1),
  ).getUTCDay();
  const celulas: (number | null)[] = Array(primeiroDiaDaSemana).fill(null);
  for (let dia = 1; dia <= diasNoMes(mes); dia++) celulas.push(dia);
  while (celulas.length % 7 !== 0) celulas.push(null);

  const semanas: (number | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) {
    semanas.push(celulas.slice(i, i + 7));
  }
  return semanas;
}
