import Link from "next/link";
import { FormComEstado } from "@/componentes/form-com-estado";
import { formatarData, formatarMoeda, hoje } from "@/lib/formato";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";
import { cancelarConta } from "./contas/actions";

type ContaAberta = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  favorecido: { nome: string } | null;
  categoria: { nome: string } | null;
};

export default async function PaginaInicial() {
  await exigirUsuario();
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("contas")
    .select(
      "id, descricao, valor, vencimento, favorecido:favorecidos(nome), categoria:categorias(nome)",
    )
    .eq("status", "aberta")
    .order("vencimento")
    .order("criado_em");

  const contas = (data ?? []) as unknown as ContaAberta[];
  const dataDeHoje = hoje();
  const atrasadas = contas.filter((conta) => conta.vencimento < dataDeHoje);
  const somar = (lista: ContaAberta[]) =>
    lista.reduce((total, conta) => total + Number(conta.valor), 0);

  return (
    <>
      <div className="pagina-titulo">
        <h1>Contas a pagar</h1>
        <Link href="/contas/nova" className="botao botao-principal">
          Lançar conta
        </Link>
      </div>

      {error && (
        <p className="aviso aviso-erro" role="alert">
          Não foi possível carregar as contas.
        </p>
      )}

      {!error && contas.length === 0 && (
        <section className="caixa vazio">
          <h2>Nenhuma conta em aberto</h2>
          <p>
            Lance os boletos e despesas que ainda precisam ser pagos. Eles
            aparecem aqui em ordem de vencimento.
          </p>
        </section>
      )}

      {contas.length > 0 && (
        <>
          <dl className="resumo">
            <div className="caixa resumo-item">
              <dt>Total em aberto</dt>
              <dd className="numero">{formatarMoeda(somar(contas))}</dd>
            </div>
            <div className="caixa resumo-item">
              <dt>Contas em aberto</dt>
              <dd className="numero">{contas.length}</dd>
            </div>
            <div className="caixa resumo-item">
              <dt>Atrasadas</dt>
              <dd className={`numero ${atrasadas.length ? "perigo" : ""}`}>
                {atrasadas.length
                  ? `${atrasadas.length} · ${formatarMoeda(somar(atrasadas))}`
                  : "Nenhuma"}
              </dd>
            </div>
          </dl>

          <section className="caixa tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Vencimento</th>
                  <th>Descrição</th>
                  <th>Favorecido</th>
                  <th>Categoria</th>
                  <th className="direita">Valor</th>
                  <th className="direita">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contas.map((conta) => (
                  <tr key={conta.id}>
                    <td className="numero">
                      {formatarData(conta.vencimento)}{" "}
                      {conta.vencimento < dataDeHoje && (
                        <span className="etiqueta etiqueta-vermelha">
                          Atrasada
                        </span>
                      )}
                      {conta.vencimento === dataDeHoje && (
                        <span className="etiqueta etiqueta-amarela">
                          Vence hoje
                        </span>
                      )}
                    </td>
                    <td>{conta.descricao}</td>
                    <td>{conta.favorecido?.nome ?? "—"}</td>
                    <td>{conta.categoria?.nome ?? "—"}</td>
                    <td className="direita numero">
                      {formatarMoeda(Number(conta.valor))}
                    </td>
                    <td>
                      <div className="acoes-linha">
                        <FormComEstado acao={cancelarConta}>
                          <input type="hidden" name="id" value={conta.id} />
                          <button
                            type="submit"
                            className="botao botao-pequeno botao-perigo"
                          >
                            Cancelar
                          </button>
                        </FormComEstado>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  );
}
