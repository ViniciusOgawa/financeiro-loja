import type { Metadata } from "next";
import { FormComEstado } from "@/componentes/form-com-estado";
import {
  alternarFavorecido,
  criarFavorecido,
  excluirFavorecido,
  renomearFavorecido,
} from "@/lib/acoes-cadastro";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";

export const metadata: Metadata = { title: "Favorecidos" };

type Favorecido = { id: string; nome: string; ativo: boolean };

export default async function PaginaFavorecidos() {
  await exigirUsuario();
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("favorecidos")
    .select("id, nome, ativo")
    .order("nome");
  const favorecidos = (data ?? []) as Favorecido[];

  return (
    <div className="pagina-estreita">
      <div className="pagina-titulo">
        <h1>Favorecidos</h1>
      </div>

      <p className="suave espaco-abaixo">
        Para quem a loja paga: fornecedores, funcionários, imobiliária. Um
        favorecido novo também é criado sozinho quando você digita o nome ao
        lançar uma conta.
      </p>

      <section className="caixa espaco-abaixo">
        <div className="caixa-cabecalho">Novo favorecido</div>
        <div className="caixa-corpo">
          <FormComEstado acao={criarFavorecido} className="form-linha">
            <input
              name="nome"
              className="entrada"
              aria-label="Nome do favorecido"
              placeholder="Nome"
              maxLength={120}
              required
            />
            <button type="submit" className="botao botao-principal">
              Adicionar
            </button>
          </FormComEstado>
        </div>
      </section>

      {error && (
        <p className="aviso aviso-erro" role="alert">
          Não foi possível carregar os favorecidos.
        </p>
      )}

      {!error && favorecidos.length === 0 && (
        <section className="caixa vazio">
          <h2>Nenhum favorecido ainda</h2>
          <p>Adicione o primeiro acima.</p>
        </section>
      )}

      {favorecidos.length > 0 && (
        <section className="caixa tabela-rolagem">
          <table className="tabela tabela-cartoes">
            <thead>
              <tr>
                <th>Nome</th>
                <th className="direita">Ações</th>
              </tr>
            </thead>
            <tbody>
              {favorecidos.map((favorecido) => (
                <tr key={favorecido.id}>
                  <td className="larga c-inteira">
                    <FormComEstado
                      acao={renomearFavorecido}
                      className="form-linha"
                    >
                      <input type="hidden" name="id" value={favorecido.id} />
                      <input
                        name="nome"
                        className="entrada"
                        aria-label={`Nome de ${favorecido.nome}`}
                        defaultValue={favorecido.nome}
                        maxLength={120}
                        required
                      />
                      <button type="submit" className="botao botao-pequeno">
                        Salvar nome
                      </button>
                      {!favorecido.ativo && (
                        <span className="etiqueta etiqueta-neutra">
                          Desativado
                        </span>
                      )}
                    </FormComEstado>
                  </td>
                  <td className="c-acoes">
                    <div className="acoes-linha">
                      <FormComEstado acao={alternarFavorecido}>
                        <input type="hidden" name="id" value={favorecido.id} />
                        <input
                          type="hidden"
                          name="ativo"
                          value={String(!favorecido.ativo)}
                        />
                        <button type="submit" className="botao botao-pequeno">
                          {favorecido.ativo ? "Desativar" : "Reativar"}
                        </button>
                      </FormComEstado>
                      <FormComEstado acao={excluirFavorecido}>
                        <input type="hidden" name="id" value={favorecido.id} />
                        <button
                          type="submit"
                          className="botao botao-pequeno botao-perigo"
                        >
                          Excluir
                        </button>
                      </FormComEstado>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
