import type { Metadata } from "next";
import Link from "next/link";
import { formatarMoeda, hoje } from "@/lib/formato";
import {
  lerTipoDePeriodo,
  montarPeriodo,
  TIPOS_DE_PERIODO,
  type TipoDePeriodo,
} from "@/lib/periodos";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";

export const metadata: Metadata = { title: "Relatórios" };

type Boleto = {
  valor: number;
  vencimento: string;
  status: "aberta" | "paga";
  descricao: string;
  favorecido: { id: string; nome: string } | null;
};

type Situacao = "pago" | "aVencer" | "atrasado";

/** Ordem das partes na barra e na legenda. */
const SITUACOES: { chave: Situacao; rotulo: string }[] = [
  { chave: "pago", rotulo: "Pago" },
  { chave: "aVencer", rotulo: "A vencer" },
  { chave: "atrasado", rotulo: "Atrasado" },
];

type Linha = {
  chave: string;
  nome: string;
  boletos: number;
  total: number;
} & Record<Situacao, number>;

const primeiro = (valor: string | string[] | undefined) =>
  Array.isArray(valor) ? valor[0] : valor;

const plural = (n: number) => (n === 1 ? "1 boleto" : `${n} boletos`);

const endereco = (tipo: TipoDePeriodo, data: string) =>
  `/relatorios?periodo=${tipo}&data=${data}`;

export default async function PaginaRelatorios({
  searchParams,
}: PageProps<"/relatorios">) {
  await exigirUsuario();
  const parametros = await searchParams;
  const dataDeHoje = hoje();
  const tipo = lerTipoDePeriodo(primeiro(parametros.periodo));
  const periodo = montarPeriodo(tipo, primeiro(parametros.data), dataDeHoje);
  const contemHoje = periodo.inicio <= dataDeHoje && dataDeHoje <= periodo.fim;

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("contas")
    .select("valor, vencimento, status, descricao, favorecido:favorecidos(id, nome)")
    .neq("status", "cancelada")
    .gte("vencimento", periodo.inicio)
    .lte("vencimento", periodo.fim);
  const boletos = (data ?? []) as unknown as Boleto[];

  // Agrupa por beneficiário; boletos sem beneficiário ficam pela descrição.
  const porBeneficiario = new Map<string, Linha>();
  const totais: Record<Situacao, number> = { pago: 0, aVencer: 0, atrasado: 0 };
  const quantidades: Record<Situacao, number> = { pago: 0, aVencer: 0, atrasado: 0 };

  for (const boleto of boletos) {
    const situacao: Situacao =
      boleto.status === "paga"
        ? "pago"
        : boleto.vencimento < dataDeHoje
          ? "atrasado"
          : "aVencer";
    const valor = Number(boleto.valor);
    const nome = boleto.favorecido?.nome ?? boleto.descricao;
    const chave = boleto.favorecido?.id ?? `descricao:${nome.toLowerCase()}`;

    const linha = porBeneficiario.get(chave) ?? {
      chave,
      nome,
      boletos: 0,
      total: 0,
      pago: 0,
      aVencer: 0,
      atrasado: 0,
    };
    linha[situacao] += valor;
    linha.total += valor;
    linha.boletos += 1;
    porBeneficiario.set(chave, linha);

    totais[situacao] += valor;
    quantidades[situacao] += 1;
  }

  const linhas = [...porBeneficiario.values()].sort(
    (a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"),
  );
  const totalGeral = totais.pago + totais.aVencer + totais.atrasado;
  const maior = linhas[0]?.total ?? 0;

  return (
    <>
      <div className="pagina-titulo">
        <div className="mes-navegacao">
          <Link
            href={endereco(tipo, periodo.anterior)}
            className="botao"
            aria-label="Período anterior"
          >
            ←
          </Link>
          <h1>{periodo.titulo}</h1>
          <Link
            href={endereco(tipo, periodo.seguinte)}
            className="botao"
            aria-label="Próximo período"
          >
            →
          </Link>
          {!contemHoje && (
            <Link href={endereco(tipo, dataDeHoje)} className="botao">
              Voltar para hoje
            </Link>
          )}
        </div>

        <nav className="seletor" aria-label="Tipo de período">
          {TIPOS_DE_PERIODO.map((opcao) => (
            <Link
              key={opcao.valor}
              href={endereco(opcao.valor, periodo.inicio)}
              className="seletor-item"
              aria-current={opcao.valor === tipo ? "page" : undefined}
            >
              {opcao.rotulo}
            </Link>
          ))}
        </nav>
      </div>

      {error && (
        <p className="aviso aviso-erro espaco-abaixo" role="alert">
          Não foi possível carregar os boletos.
        </p>
      )}

      <dl className="resumo">
        <div className="caixa resumo-item">
          <dt>Total do período</dt>
          <dd className="numero">{formatarMoeda(totalGeral)}</dd>
          <dd className="resumo-detalhe">{plural(boletos.length)}</dd>
        </div>
        {SITUACOES.map(({ chave, rotulo }) => (
          <div key={chave} className="caixa resumo-item">
            <dt>
              <span className={`amostra amostra-${chave}`} aria-hidden />
              {rotulo}
            </dt>
            <dd
              className={`numero ${chave === "atrasado" && totais.atrasado > 0 ? "perigo" : ""}`}
            >
              {formatarMoeda(totais[chave])}
            </dd>
            <dd className="resumo-detalhe">{plural(quantidades[chave])}</dd>
          </div>
        ))}
      </dl>

      {!error && linhas.length === 0 ? (
        <section className="caixa vazio">
          <h2>Nenhum boleto neste período</h2>
          <p>Os boletos com vencimento entre essas datas aparecem aqui.</p>
        </section>
      ) : (
        <>
          <section className="caixa espaco-abaixo">
            <div className="caixa-cabecalho lista-cabecalho">
              <span>Por beneficiário</span>
              <ul className="legenda" aria-label="Legenda">
                {SITUACOES.map(({ chave, rotulo }) => (
                  <li key={chave}>
                    <span className={`amostra amostra-${chave}`} aria-hidden />
                    {rotulo}
                  </li>
                ))}
              </ul>
            </div>
            <ul className="grafico caixa-corpo">
              {linhas.map((linha) => {
                const partes = SITUACOES.filter(({ chave }) => linha[chave] > 0);
                const descricao = partes
                  .map(({ chave, rotulo }) => `${rotulo}: ${formatarMoeda(linha[chave])}`)
                  .join(", ");
                return (
                  <li key={linha.chave} className="grafico-linha">
                    <span className="grafico-nome" title={linha.nome}>
                      {linha.nome}
                    </span>
                    <span
                      className="grafico-trilho"
                      role="img"
                      aria-label={`${linha.nome}: ${descricao}`}
                    >
                      <span
                        className="grafico-barra"
                        style={{ width: `${(linha.total / maior) * 100}%` }}
                      >
                        {partes.map(({ chave, rotulo }) => (
                          <span
                            key={chave}
                            className={`grafico-parte amostra-${chave}`}
                            style={{ flexGrow: linha[chave] }}
                            title={`${rotulo}: ${formatarMoeda(linha[chave])}`}
                          />
                        ))}
                      </span>
                    </span>
                    <span className="grafico-valor numero">
                      {formatarMoeda(linha.total)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="caixa tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Beneficiário</th>
                  <th className="direita">Pago</th>
                  <th className="direita">A vencer</th>
                  <th className="direita">Atrasado</th>
                  <th className="direita">Total</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.chave}>
                    <td className="larga">
                      {linha.nome}
                      <span className="linha-detalhe">{plural(linha.boletos)}</span>
                    </td>
                    {SITUACOES.map(({ chave }) => (
                      <td key={chave} className="direita numero">
                        {linha[chave] ? formatarMoeda(linha[chave]) : "–"}
                      </td>
                    ))}
                    <td className="direita numero">
                      <strong>{formatarMoeda(linha.total)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  {SITUACOES.map(({ chave }) => (
                    <td key={chave} className="direita numero">
                      {formatarMoeda(totais[chave])}
                    </td>
                  ))}
                  <td className="direita numero">{formatarMoeda(totalGeral)}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        </>
      )}
    </>
  );
}
