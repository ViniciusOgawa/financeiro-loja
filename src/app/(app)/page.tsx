import Link from "next/link";
import { AcoesConta } from "@/componentes/acoes-conta";
import {
  formatarData,
  formatarDiaMes,
  formatarMoeda,
  formatarMoedaCurta,
  hoje,
} from "@/lib/formato";
import {
  chaveMes,
  dataDoDia,
  deslocarMes,
  diasNoMes,
  lerMes,
  nomeMes,
  semanasDoMes,
} from "@/lib/meses";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";

type Conta = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: "aberta" | "paga";
  pago_em: string | null;
  valor_pago: number | null;
  favorecido: { nome: string } | null;
  categoria: { nome: string } | null;
};

const COLUNAS =
  "id, descricao, valor, vencimento, status, pago_em, valor_pago, favorecido:favorecidos(nome), categoria:categorias(nome)";

const DIAS_DA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const primeiro = (valor: string | string[] | undefined) =>
  Array.isArray(valor) ? valor[0] : valor;

const somar = (contas: Conta[]) =>
  contas.reduce((total, conta) => total + Number(conta.valor), 0);

export default async function PaginaDoMes({ searchParams }: PageProps<"/">) {
  await exigirUsuario();
  const parametros = await searchParams;

  const dataDeHoje = hoje();
  const mesAtual = lerMes(undefined, dataDeHoje);
  const mes = lerMes(primeiro(parametros.mes), dataDeHoje);
  const chave = chaveMes(mes);
  const vendoMesAtual = chave === chaveMes(mesAtual);

  const diaPedido = Number(primeiro(parametros.dia));
  const diaSelecionado =
    Number.isInteger(diaPedido) && diaPedido >= 1 && diaPedido <= diasNoMes(mes)
      ? diaPedido
      : null;

  const supabase = await criarClienteServidor();
  const [doMes, antigas] = await Promise.all([
    supabase
      .from("contas")
      .select(COLUNAS)
      .neq("status", "cancelada")
      .gte("vencimento", dataDoDia(mes, 1))
      .lte("vencimento", dataDoDia(mes, diasNoMes(mes)))
      .order("vencimento")
      .order("criado_em"),
    // Contas em aberto de meses passados: não podem sumir quando o mês vira.
    supabase
      .from("contas")
      .select(COLUNAS)
      .eq("status", "aberta")
      .lt("vencimento", dataDoDia(mesAtual, 1))
      .order("vencimento")
      .order("criado_em"),
  ]);

  const erro = doMes.error ?? antigas.error;
  const contas = (doMes.data ?? []) as unknown as Conta[];
  const atrasadasAntigas = (antigas.data ?? []) as unknown as Conta[];

  const abertas = contas.filter((conta) => conta.status === "aberta");
  const pagas = contas.filter((conta) => conta.status === "paga");

  const porDia = new Map<number, Conta[]>();
  for (const conta of contas) {
    const dia = Number(conta.vencimento.slice(8, 10));
    porDia.set(dia, [...(porDia.get(dia) ?? []), conta]);
  }

  const listadas = diaSelecionado
    ? (porDia.get(diaSelecionado) ?? [])
    : contas;
  const enderecoDoMes = `/?mes=${chave}`;
  const lancar = diaSelecionado
    ? `/contas/nova?vencimento=${dataDoDia(mes, diaSelecionado)}`
    : "/contas/nova";

  return (
    <>
      <div className="pagina-titulo">
        <div className="mes-navegacao">
          <Link
            href={`/?mes=${chaveMes(deslocarMes(mes, -1))}`}
            className="botao"
            aria-label="Mês anterior"
          >
            ←
          </Link>
          <h1>{nomeMes(mes)}</h1>
          <Link
            href={`/?mes=${chaveMes(deslocarMes(mes, 1))}`}
            className="botao"
            aria-label="Próximo mês"
          >
            →
          </Link>
          {!vendoMesAtual && (
            <Link href="/" className="botao">
              Voltar para hoje
            </Link>
          )}
        </div>
        <Link href={lancar} className="botao botao-principal">
          Lançar conta
        </Link>
      </div>

      {erro && (
        <p className="aviso aviso-erro espaco-abaixo" role="alert">
          Não foi possível carregar as contas.
        </p>
      )}

      <dl className="resumo">
        <div className="caixa resumo-item">
          <dt>Total do mês</dt>
          <dd className="numero">{formatarMoeda(somar(contas))}</dd>
          <dd className="resumo-detalhe">{plural(contas.length)}</dd>
        </div>
        <div className="caixa resumo-item">
          <dt>Já pago</dt>
          <dd className="numero sucesso">{formatarMoeda(somar(pagas))}</dd>
          <dd className="resumo-detalhe">{plural(pagas.length)}</dd>
        </div>
        <div className="caixa resumo-item">
          <dt>Falta pagar</dt>
          <dd className="numero">{formatarMoeda(somar(abertas))}</dd>
          <dd className="resumo-detalhe">{plural(abertas.length)}</dd>
        </div>
      </dl>

      {vendoMesAtual && atrasadasAntigas.length > 0 && (
        <section className="caixa caixa-perigo espaco-abaixo">
          <div className="caixa-cabecalho">
            Atrasadas de meses anteriores: {plural(atrasadasAntigas.length)},{" "}
            <span className="numero">
              {formatarMoeda(somar(atrasadasAntigas))}
            </span>
          </div>
          <TabelaDeContas
            contas={atrasadasAntigas}
            dataDeHoje={dataDeHoje}
            comAno
          />
        </section>
      )}

      <div className="mes-grade">
        <section className="caixa calendario" aria-label="Calendário do mês">
          <div className="calendario-semana calendario-cabecalho">
            {DIAS_DA_SEMANA.map((nome) => (
              <span key={nome}>{nome}</span>
            ))}
          </div>
          {semanasDoMes(mes).map((semana, indice) => (
            <div key={indice} className="calendario-semana">
              {semana.map((dia, posicao) =>
                dia === null ? (
                  <span key={posicao} className="dia dia-vazio" />
                ) : (
                  <DiaDoCalendario
                    key={posicao}
                    dia={dia}
                    data={dataDoDia(mes, dia)}
                    dataDeHoje={dataDeHoje}
                    contas={porDia.get(dia) ?? []}
                    selecionado={dia === diaSelecionado}
                    href={
                      dia === diaSelecionado
                        ? enderecoDoMes
                        : `${enderecoDoMes}&dia=${dia}`
                    }
                  />
                ),
              )}
            </div>
          ))}
        </section>

        <section className="caixa">
          <div className="caixa-cabecalho lista-cabecalho">
            {diaSelecionado ? (
              <>
                <span>
                  Contas do dia{" "}
                  {formatarData(dataDoDia(mes, diaSelecionado))}
                </span>
                <Link href={enderecoDoMes}>Ver o mês inteiro</Link>
              </>
            ) : (
              <span>Contas do mês</span>
            )}
          </div>

          {listadas.length === 0 ? (
            <div className="vazio">
              <h2>
                {diaSelecionado
                  ? "Nenhuma conta neste dia"
                  : "Nenhuma conta neste mês"}
              </h2>
              <p>
                Use o botão Lançar conta para registrar um boleto ou despesa.
              </p>
            </div>
          ) : (
            <TabelaDeContas contas={listadas} dataDeHoje={dataDeHoje} />
          )}
        </section>
      </div>
    </>
  );
}

function plural(quantidade: number): string {
  return quantidade === 1 ? "1 conta" : `${quantidade} contas`;
}

function DiaDoCalendario({
  dia,
  data,
  dataDeHoje,
  contas,
  selecionado,
  href,
}: {
  dia: number;
  data: string;
  dataDeHoje: string;
  contas: Conta[];
  selecionado: boolean;
  href: string;
}) {
  const abertas = contas.filter((conta) => conta.status === "aberta");
  const situacao =
    contas.length === 0
      ? ""
      : abertas.length === 0
        ? "dia-pago"
        : data < dataDeHoje
          ? "dia-atrasado"
          : "dia-aberto";

  const descricao =
    contas.length === 0
      ? "sem contas"
      : abertas.length === 0
        ? `${plural(contas.length)}, tudo pago`
        : `${plural(abertas.length)} em aberto, ${formatarMoeda(somar(abertas))}`;

  return (
    <Link
      href={href}
      className={`dia ${situacao} ${data === dataDeHoje ? "dia-hoje" : ""}`}
      aria-current={selecionado ? "date" : undefined}
      aria-label={`Dia ${dia}: ${descricao}`}
      scroll={false}
    >
      <span className="dia-numero">{dia}</span>
      {contas.length > 0 && (
        <span className="dia-info numero">
          {abertas.length === 0 ? (
            "Pago"
          ) : (
            <>
              {formatarMoedaCurta(somar(abertas))}
              <small>{plural(abertas.length)}</small>
            </>
          )}
        </span>
      )}
    </Link>
  );
}

function TabelaDeContas({
  contas,
  dataDeHoje,
  comAno = false,
}: {
  contas: Conta[];
  dataDeHoje: string;
  comAno?: boolean;
}) {
  return (
    <div className="tabela-rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Vence</th>
            <th>Conta</th>
            <th className="direita">Valor</th>
            <th>Situação</th>
            <th className="direita">Ações</th>
          </tr>
        </thead>
        <tbody>
          {contas.map((conta) => {
            const valor = Number(conta.valor);
            const valorPago = Number(conta.valor_pago ?? valor);
            const detalhes = [conta.favorecido?.nome, conta.categoria?.nome]
              .filter(Boolean)
              .join(" · ");

            return (
              <tr key={conta.id}>
                <td className="numero">
                  {comAno
                    ? formatarData(conta.vencimento)
                    : formatarDiaMes(conta.vencimento)}
                </td>
                <td className="larga">
                  {conta.descricao}
                  {detalhes && <span className="linha-detalhe">{detalhes}</span>}
                </td>
                <td className="direita numero">
                  {formatarMoeda(valor)}
                  {conta.status === "paga" && valorPago !== valor && (
                    <span className="linha-detalhe">
                      pago {formatarMoeda(valorPago)}
                    </span>
                  )}
                </td>
                <td>
                  <Situacao conta={conta} dataDeHoje={dataDeHoje} />
                </td>
                <td>
                  <AcoesConta
                    hoje={dataDeHoje}
                    conta={{
                      id: conta.id,
                      descricao: conta.descricao,
                      valor,
                      vencimento: conta.vencimento,
                      paga: conta.status === "paga",
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Situacao({ conta, dataDeHoje }: { conta: Conta; dataDeHoje: string }) {
  if (conta.status === "paga") {
    return (
      <span className="etiqueta etiqueta-verde">
        Paga{conta.pago_em ? ` em ${formatarDiaMes(conta.pago_em)}` : ""}
      </span>
    );
  }
  if (conta.vencimento < dataDeHoje) {
    return <span className="etiqueta etiqueta-vermelha">Atrasada</span>;
  }
  if (conta.vencimento === dataDeHoje) {
    return <span className="etiqueta etiqueta-amarela">Vence hoje</span>;
  }
  return <span className="etiqueta etiqueta-neutra">Em aberto</span>;
}
