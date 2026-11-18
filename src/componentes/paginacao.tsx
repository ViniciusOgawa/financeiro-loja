import Link from "next/link";

/** Quantos boletos aparecem em cada página da lista. */
export const BOLETOS_POR_PAGINA = 15;

/** Lê o número da página do endereço, limitado às páginas que existem. */
export function lerPagina(texto: string | undefined, total: number): number {
  const paginas = Math.max(1, Math.ceil(total / BOLETOS_POR_PAGINA));
  const pedida = Math.trunc(Number(texto));
  return Number.isFinite(pedida) ? Math.min(Math.max(pedida, 1), paginas) : 1;
}

/** Os itens da página pedida. */
export function itensDaPagina<T>(itens: T[], pagina: number): T[] {
  const inicio = (pagina - 1) * BOLETOS_POR_PAGINA;
  return itens.slice(inicio, inicio + BOLETOS_POR_PAGINA);
}

/**
 * Números a mostrar: a primeira, a última e as vizinhas da atual. Os buracos
 * viram reticências: 1 … 4 5 6 … 12.
 */
function numerosVisiveis(atual: number, paginas: number): (number | null)[] {
  const numeros: (number | null)[] = [];
  for (let n = 1; n <= paginas; n++) {
    if (n === 1 || n === paginas || Math.abs(n - atual) <= 1) {
      numeros.push(n);
    } else if (numeros[numeros.length - 1] !== null) {
      numeros.push(null);
    }
  }
  return numeros;
}

export function Paginacao({
  pagina,
  total,
  endereco,
}: {
  pagina: number;
  total: number;
  /** Monta o endereço de uma página, mantendo o resto do filtro. */
  endereco: (pagina: number) => string;
}) {
  const paginas = Math.ceil(total / BOLETOS_POR_PAGINA);
  if (paginas <= 1) return null;

  const primeiro = (pagina - 1) * BOLETOS_POR_PAGINA + 1;
  const ultimo = Math.min(pagina * BOLETOS_POR_PAGINA, total);

  return (
    <nav className="paginacao" aria-label="Páginas da lista">
      <span className="suave">
        {primeiro}–{ultimo} de {total}
      </span>

      <div className="paginacao-botoes">
        {pagina > 1 ? (
          <Link
            href={endereco(pagina - 1)}
            className="botao botao-pequeno"
            scroll={false}
          >
            ← Anterior
          </Link>
        ) : (
          <span className="botao botao-pequeno" aria-disabled="true">
            ← Anterior
          </span>
        )}

        {numerosVisiveis(pagina, paginas).map((numero, indice) =>
          numero === null ? (
            <span key={`buraco-${indice}`} className="paginacao-buraco">
              …
            </span>
          ) : (
            <Link
              key={numero}
              href={endereco(numero)}
              className="botao botao-pequeno paginacao-numero"
              aria-current={numero === pagina ? "page" : undefined}
              aria-label={`Página ${numero}`}
              scroll={false}
            >
              {numero}
            </Link>
          ),
        )}

        {pagina < paginas ? (
          <Link
            href={endereco(pagina + 1)}
            className="botao botao-pequeno"
            scroll={false}
          >
            Próxima →
          </Link>
        ) : (
          <span className="botao botao-pequeno" aria-disabled="true">
            Próxima →
          </span>
        )}
      </div>
    </nav>
  );
}
