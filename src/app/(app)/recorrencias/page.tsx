import type { Metadata } from "next";
import Link from "next/link";
import { FormComEstado } from "@/componentes/form-com-estado";
import { formatarMoeda } from "@/lib/formato";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";
import { alternarContaFixa } from "./actions";

export const metadata: Metadata = { title: "Contas fixas" };

type Fixa = {
  id: string;
  descricao: string;
  valor: number;
  dia_vencimento: number;
  inicio: string;
  fim: string | null;
  ativa: boolean;
  favorecido: { nome: string } | null;
  categoria: { nome: string } | null;
};

/** "2026-11-01" vira "11/2026". */
const mesAno = (data: string) => `${data.slice(5, 7)}/${data.slice(0, 4)}`;

export default async function PaginaContasFixas() {
  await exigirUsuario();
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("recorrencias")
    .select(
      "id, descricao, valor, dia_vencimento, inicio, fim, ativa, favorecido:favorecidos(nome), categoria:categorias(nome)",
    )
    .order("ativa", { ascending: false })
    .order("dia_vencimento")
    .order("descricao");

  const fixas = (data ?? []) as unknown as Fixa[];
  const ativas = fixas.filter((fixa) => fixa.ativa);
  const totalMensal = ativas.reduce(
    (total, fixa) => total + Number(fixa.valor),
    0,
  );

  return (
    <>
      <div className="pagina-titulo">
        <h1>Contas fixas</h1>
        <Link href="/recorrencias/nova" className="botao botao-principal">
          Nova conta fixa
        </Link>
      </div>

      <p className="suave espaco-abaixo">
        Despesas que se repetem todo mês, como salários, aluguel e internet. O
        sistema cria a conta de cada mês sozinho, e ela aparece no calendário
        para ser paga como qualquer outra.
      </p>

      {error && (
        <p className="aviso aviso-erro" role="alert">
          Não foi possível carregar as contas fixas.
        </p>
      )}

      {!error && fixas.length === 0 && (
        <section className="caixa vazio">
          <h2>Nenhuma conta fixa ainda</h2>
          <p>
            Cadastre as despesas que se repetem todo mês para não precisar
            lançá-las de novo.
          </p>
        </section>
      )}

      {fixas.length > 0 && (
        <>
          <dl className="resumo">
            <div className="caixa resumo-item">
              <dt>Total por mês</dt>
              <dd className="numero">{formatarMoeda(totalMensal)}</dd>
              <dd className="resumo-detalhe">
                {ativas.length === 1
                  ? "1 conta fixa ativa"
                  : `${ativas.length} contas fixas ativas`}
              </dd>
            </div>
          </dl>

          <section className="caixa tabela-rolagem">
            <table className="tabela tabela-cartoes">
              <thead>
                <tr>
                  <th>Vence</th>
                  <th>Conta</th>
                  <th className="direita">Valor</th>
                  <th>Período</th>
                  <th>Situação</th>
                  <th className="direita">Ações</th>
                </tr>
              </thead>
              <tbody>
                {fixas.map((fixa) => {
                  const detalhes = [fixa.favorecido?.nome, fixa.categoria?.nome]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <tr key={fixa.id}>
                      <td className="numero sem-quebra c-vence">
                        Dia {fixa.dia_vencimento}
                      </td>
                      <td className="larga c-conta">
                        {fixa.descricao}
                        {detalhes && (
                          <span className="linha-detalhe">{detalhes}</span>
                        )}
                      </td>
                      <td className="direita numero c-valor">
                        {formatarMoeda(Number(fixa.valor))}
                      </td>
                      <td className="numero sem-quebra c-periodo">
                        {fixa.fim
                          ? `${mesAno(fixa.inicio)} a ${mesAno(fixa.fim)}`
                          : `Desde ${mesAno(fixa.inicio)}`}
                      </td>
                      <td className="c-situacao">
                        {fixa.ativa ? (
                          <span className="etiqueta etiqueta-verde">Ativa</span>
                        ) : (
                          <span className="etiqueta etiqueta-neutra">
                            Pausada
                          </span>
                        )}
                      </td>
                      <td className="c-acoes">
                        <div className="acoes-linha">
                          <Link
                            href={`/recorrencias/${fixa.id}`}
                            className="botao botao-pequeno"
                          >
                            Editar
                          </Link>
                          <FormComEstado acao={alternarContaFixa}>
                            <input type="hidden" name="id" value={fixa.id} />
                            <input
                              type="hidden"
                              name="ativa"
                              value={String(!fixa.ativa)}
                            />
                            <button
                              type="submit"
                              className="botao botao-pequeno"
                            >
                              {fixa.ativa ? "Pausar" : "Reativar"}
                            </button>
                          </FormComEstado>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  );
}
