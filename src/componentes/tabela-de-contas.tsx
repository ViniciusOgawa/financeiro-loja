import { AcoesConta } from "@/componentes/acoes-conta";
import { formatarData, formatarDiaMes, formatarMoeda } from "@/lib/formato";

// Lista de contas usada na tela inicial e na tela do mês.

export type Conta = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: "aberta" | "paga";
  parcela_numero: number | null;
  recorrencia_id: string | null;
  compra: { num_parcelas: number } | null;
  pago_em: string | null;
  valor_pago: number | null;
  favorecido: { nome: string } | null;
  categoria: { nome: string } | null;
};

/** Colunas a pedir ao banco para montar uma `Conta`. */
export const COLUNAS_DA_CONTA =
  "id, descricao, valor, vencimento, status, pago_em, valor_pago, parcela_numero, recorrencia_id, favorecido:favorecidos(nome), categoria:categorias(nome), compra:compras(num_parcelas)";

export const somarContas = (contas: Conta[]) =>
  contas.reduce((total, conta) => total + Number(conta.valor), 0);

export function pluralDeContas(quantidade: number): string {
  return quantidade === 1 ? "1 conta" : `${quantidade} contas`;
}

export function TabelaDeContas({
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
      <table className="tabela tabela-cartoes">
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
                <td className="numero c-vence" data-rotulo="Vence">
                  {comAno
                    ? formatarData(conta.vencimento)
                    : formatarDiaMes(conta.vencimento)}
                </td>
                <td className="larga c-conta">
                  {conta.descricao}
                  {conta.parcela_numero && conta.compra && (
                    <span className="etiqueta etiqueta-neutra etiqueta-parcela">
                      parcela {conta.parcela_numero}/{conta.compra.num_parcelas}
                    </span>
                  )}
                  {conta.recorrencia_id && (
                    <span className="etiqueta etiqueta-neutra etiqueta-parcela">
                      fixa
                    </span>
                  )}
                  {detalhes && <span className="linha-detalhe">{detalhes}</span>}
                </td>
                <td className="direita numero c-valor">
                  {formatarMoeda(valor)}
                  {conta.status === "paga" && valorPago !== valor && (
                    <span className="linha-detalhe">
                      pago {formatarMoeda(valorPago)}
                    </span>
                  )}
                </td>
                <td className="c-situacao">
                  <Situacao conta={conta} dataDeHoje={dataDeHoje} />
                </td>
                <td className="c-acoes">
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
