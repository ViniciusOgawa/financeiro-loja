import type { Metadata } from "next";
import { FormComEstado } from "@/componentes/form-com-estado";
import {
  criarCategoria,
  excluirCategoria,
  renomearCategoria,
} from "@/lib/acoes-cadastro";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";

export const metadata: Metadata = { title: "Categorias" };

type Categoria = { id: string; nome: string };

export default async function PaginaCategorias() {
  await exigirUsuario();
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome")
    .order("nome");
  const categorias = (data ?? []) as Categoria[];

  return (
    <div className="pagina-estreita">
      <div className="pagina-titulo">
        <h1>Categorias</h1>
      </div>

      <p className="suave espaco-abaixo">
        Tipos de gasto, usados para agrupar as contas.
      </p>

      <section className="caixa espaco-abaixo">
        <div className="caixa-cabecalho">Nova categoria</div>
        <div className="caixa-corpo">
          <FormComEstado acao={criarCategoria} className="form-linha">
            <input
              name="nome"
              className="entrada"
              aria-label="Nome da categoria"
              placeholder="Nome"
              maxLength={80}
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
          Não foi possível carregar as categorias.
        </p>
      )}

      {!error && categorias.length === 0 && (
        <section className="caixa vazio">
          <h2>Nenhuma categoria ainda</h2>
          <p>Adicione a primeira acima.</p>
        </section>
      )}

      {categorias.length > 0 && (
        <section className="caixa tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th className="direita">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td className="larga">
                    <FormComEstado
                      acao={renomearCategoria}
                      className="form-linha"
                    >
                      <input type="hidden" name="id" value={categoria.id} />
                      <input
                        name="nome"
                        className="entrada"
                        aria-label={`Nome de ${categoria.nome}`}
                        defaultValue={categoria.nome}
                        maxLength={80}
                        required
                      />
                      <button type="submit" className="botao botao-pequeno">
                        Salvar nome
                      </button>
                    </FormComEstado>
                  </td>
                  <td>
                    <div className="acoes-linha">
                      <FormComEstado acao={excluirCategoria}>
                        <input type="hidden" name="id" value={categoria.id} />
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
