import Link from "next/link";
import {
  COLUNAS_DA_CONTA,
  pluralDeContas,
  somarContas,
  TabelaDeContas,
  type Conta,
} from "@/componentes/tabela-de-contas";
import { formatarData, formatarMoeda, hoje } from "@/lib/formato";
import { lerMes, somarDias } from "@/lib/meses";
import { gerarContasFixas } from "@/lib/recorrencias";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";

/** Quantos dias à frente entram em "Próximos dias". */
const DIAS_A_FRENTE = 7;

export default async function PaginaInicial() {
  const usuario = await exigirUsuario();
  const dataDeHoje = hoje();
  const limite = somarDias(dataDeHoje, DIAS_A_FRENTE);

  const supabase = await criarClienteServidor();
  // Os próximos dias podem cair no mês seguinte, então as contas fixas são
  // geradas até o mês da data limite.
  await gerarContasFixas(supabase, lerMes(limite.slice(0, 7), dataDeHoje), dataDeHoje);

  const { data, error } = await supabase
    .from("contas")
    .select(COLUNAS_DA_CONTA)
    .eq("status", "aberta")
    .lte("vencimento", limite)
    .order("vencimento")
    .order("criado_em");

  const contas = (data ?? []) as unknown as Conta[];
  const atrasadas = contas.filter((conta) => conta.vencimento < dataDeHoje);
  const deHoje = contas.filter((conta) => conta.vencimento === dataDeHoje);
  const proximas = contas.filter((conta) => conta.vencimento > dataDeHoje);

  return (
    <>
      <div className="pagina-titulo">
        <div>
          <h1>Olá, {usuario.nome}</h1>
          <p className="suave">Hoje é {formatarData(dataDeHoje)}.</p>
        </div>
        <div className="form-linha">
          <Link href="/mes" className="botao">
            Ver o mês
          </Link>
          <Link href="/contas/nova" className="botao botao-principal">
            Lançar conta
          </Link>
        </div>
      </div>

      {error && (
        <p className="aviso aviso-erro espaco-abaixo" role="alert">
          Não foi possível carregar as contas.
        </p>
      )}

      <dl className="resumo">
        <div className="caixa resumo-item">
          <dt>Atrasadas</dt>
          <dd className={`numero ${atrasadas.length ? "perigo" : ""}`}>
            {formatarMoeda(somarContas(atrasadas))}
          </dd>
          <dd className="resumo-detalhe">{pluralDeContas(atrasadas.length)}</dd>
        </div>
        <div className="caixa resumo-item">
          <dt>Vencem hoje</dt>
          <dd className="numero">{formatarMoeda(somarContas(deHoje))}</dd>
          <dd className="resumo-detalhe">{pluralDeContas(deHoje.length)}</dd>
        </div>
        <div className="caixa resumo-item">
          <dt>Próximos {DIAS_A_FRENTE} dias</dt>
          <dd className="numero">{formatarMoeda(somarContas(proximas))}</dd>
          <dd className="resumo-detalhe">{pluralDeContas(proximas.length)}</dd>
        </div>
      </dl>

      {!error && contas.length === 0 && (
        <section className="caixa vazio">
          <h2>Tudo em dia</h2>
          <p>
            Não há contas atrasadas nem vencendo até{" "}
            {formatarData(limite)}.
          </p>
        </section>
      )}

      {atrasadas.length > 0 && (
        <section className="caixa caixa-perigo espaco-abaixo">
          <div className="caixa-cabecalho">Atrasadas</div>
          <TabelaDeContas contas={atrasadas} dataDeHoje={dataDeHoje} comAno />
        </section>
      )}

      {deHoje.length > 0 && (
        <section className="caixa caixa-atencao espaco-abaixo">
          <div className="caixa-cabecalho">Vencem hoje</div>
          <TabelaDeContas contas={deHoje} dataDeHoje={dataDeHoje} />
        </section>
      )}

      {proximas.length > 0 && (
        <section className="caixa espaco-abaixo">
          <div className="caixa-cabecalho">
            Próximos {DIAS_A_FRENTE} dias, até {formatarData(limite)}
          </div>
          <TabelaDeContas contas={proximas} dataDeHoje={dataDeHoje} />
        </section>
      )}
    </>
  );
}
