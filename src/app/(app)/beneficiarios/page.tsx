import type { Metadata } from "next";
import { FormComEstado } from "@/componentes/form-com-estado";
import {
  alternarBeneficiario,
  criarBeneficiario,
  excluirBeneficiario,
  renomearBeneficiario,
} from "@/lib/acoes-cadastro";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";

export const metadata: Metadata = { title: "Beneficiários" };

type Beneficiario = {
  id: string;
  nome: string;
  ativo: boolean;
  contas: { count: number }[];
};

export default async function PaginaBeneficiarios() {
  await exigirUsuario();
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("favorecidos")
    .select("id, nome, ativo, contas(count)")
    .order("nome");
  const beneficiarios = (data ?? []) as unknown as Beneficiario[];

  return (
    <div className="pagina-estreita">
      <div className="pagina-titulo">
        <h1>Beneficiários</h1>
      </div>

      <p className="suave espaco-abaixo">
        Quem emite os boletos: fornecedores, imobiliária, prestadores de
        serviço. Um beneficiário novo também é cadastrado sozinho quando você
        digita o nome ao lançar um boleto.
      </p>

      <section className="caixa espaco-abaixo">
        <div className="caixa-cabecalho">Novo beneficiário</div>
        <div className="caixa-corpo">
          <FormComEstado acao={criarBeneficiario} className="form-linha">
            <input
              name="nome"
              className="entrada"
              aria-label="Nome do beneficiário"
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
          Não foi possível carregar os beneficiários.
        </p>
      )}

      {!error && beneficiarios.length === 0 && (
        <section className="caixa vazio">
          <h2>Nenhum beneficiário ainda</h2>
          <p>Adicione o primeiro acima.</p>
        </section>
      )}

      {beneficiarios.length > 0 && (
        <section className="caixa tabela-rolagem">
          <table className="tabela tabela-cartoes">
            <thead>
              <tr>
                <th>Nome</th>
                <th className="direita">Ações</th>
              </tr>
            </thead>
            <tbody>
              {beneficiarios.map((beneficiario) => {
                const boletos = beneficiario.contas[0]?.count ?? 0;
                return (
                  <tr key={beneficiario.id}>
                    <td className="larga c-inteira">
                      <FormComEstado
                        acao={renomearBeneficiario}
                        className="form-linha"
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={beneficiario.id}
                        />
                        <input
                          name="nome"
                          className="entrada"
                          aria-label={`Nome de ${beneficiario.nome}`}
                          defaultValue={beneficiario.nome}
                          maxLength={120}
                          required
                        />
                        <button type="submit" className="botao botao-pequeno">
                          Salvar nome
                        </button>
                        <span className="suave sem-quebra contagem">
                          {boletos === 1 ? "1 boleto" : `${boletos} boletos`}
                        </span>
                        {!beneficiario.ativo && (
                          <span className="etiqueta etiqueta-neutra">
                            Desativado
                          </span>
                        )}
                      </FormComEstado>
                    </td>
                    <td className="c-acoes">
                      <div className="acoes-linha">
                        <FormComEstado acao={alternarBeneficiario}>
                          <input
                            type="hidden"
                            name="id"
                            value={beneficiario.id}
                          />
                          <input
                            type="hidden"
                            name="ativo"
                            value={String(!beneficiario.ativo)}
                          />
                          <button type="submit" className="botao botao-pequeno">
                            {beneficiario.ativo ? "Desativar" : "Reativar"}
                          </button>
                        </FormComEstado>
                        {boletos === 0 && (
                          <FormComEstado acao={excluirBeneficiario}>
                            <input
                              type="hidden"
                              name="id"
                              value={beneficiario.id}
                            />
                            <button
                              type="submit"
                              className="botao botao-pequeno botao-perigo"
                            >
                              Excluir
                            </button>
                          </FormComEstado>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
