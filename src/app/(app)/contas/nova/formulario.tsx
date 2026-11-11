"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  dataValida,
  formatarMoeda,
  formatarValorDeCampo,
  lerValor,
} from "@/lib/formato";
import {
  datasDasParcelas,
  dividirEmParcelas,
  INTERVALOS,
  MAXIMO_DE_PARCELAS,
  type Intervalo,
} from "@/lib/parcelas";
import { criarConta, type EstadoConta } from "../actions";

type Props = {
  categorias: { id: string; nome: string }[];
  favorecidos: string[];
  vencimentoInicial: string;
};

/** Alterações feitas à mão em uma parcela da prévia. */
type Ajuste = { valor?: string; vencimento?: string };

const estadoInicial: EstadoConta = {};

export function FormularioConta({
  categorias,
  favorecidos,
  vencimentoInicial,
}: Props) {
  const [estado, acao, enviando] = useActionState(criarConta, estadoInicial);
  const campos = estado.campos;

  // Os campos que definem as parcelas são controlados, para a prévia
  // acompanhar o que é digitado. Os demais ficam por conta do navegador.
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState(vencimentoInicial);
  const [textoParcelas, setTextoParcelas] = useState("1");
  const [intervalo, setIntervalo] = useState<Intervalo>("mensal");
  const [valorEhTotal, setValorEhTotal] = useState(false);
  const [ajustes, setAjustes] = useState<Record<number, Ajuste>>({});

  // Mudar qualquer dado de base refaz as parcelas e descarta os ajustes.
  const aoMudarBase =
    <T,>(definir: (novo: T) => void) =>
    (novo: T) => {
      definir(novo);
      setAjustes({});
    };

  const quantidade = Math.min(
    Math.max(Math.trunc(Number(textoParcelas)) || 1, 1),
    MAXIMO_DE_PARCELAS,
  );
  const parcelado = quantidade > 1;

  const valorLido = lerValor(valor);
  const parcelas =
    parcelado && valorLido !== null && dataValida(vencimento)
      ? gerarParcelas()
      : [];

  function gerarParcelas() {
    const valores = valorEhTotal
      ? dividirEmParcelas(valorLido!, quantidade)
      : Array<number>(quantidade).fill(valorLido!);
    const datas = datasDasParcelas(vencimento, quantidade, intervalo);
    return datas.map((data, indice) => ({
      valor: ajustes[indice]?.valor ?? formatarValorDeCampo(valores[indice]),
      vencimento: ajustes[indice]?.vencimento ?? data,
    }));
  }

  const ajustar = (indice: number, ajuste: Ajuste) =>
    setAjustes((atuais) => ({
      ...atuais,
      [indice]: { ...atuais[indice], ...ajuste },
    }));

  const total = parcelas.reduce(
    (soma, parcela) => soma + (lerValor(parcela.valor) ?? 0),
    0,
  );

  return (
    <form action={acao} className="caixa caixa-corpo">
      {estado.erro && (
        <p className="aviso aviso-erro espaco-abaixo" role="alert">
          {estado.erro}
        </p>
      )}

      <div className="form-grade">
        <div className="campo inteira">
          <label htmlFor="descricao">Descrição</label>
          <input
            id="descricao"
            name="descricao"
            className="entrada"
            placeholder="Ex.: Boleto coleção de verão"
            defaultValue={campos?.descricao}
            maxLength={160}
            autoFocus
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="valor">Valor (R$)</label>
          <input
            id="valor"
            name="valor"
            className="entrada numero"
            inputMode="decimal"
            placeholder="0,00"
            value={valor}
            onChange={(evento) => aoMudarBase(setValor)(evento.target.value)}
            autoComplete="off"
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="vencimento">
            {parcelado ? "Vencimento da 1ª parcela" : "Vencimento"}
          </label>
          <input
            id="vencimento"
            name="vencimento"
            type="date"
            className="entrada"
            value={vencimento}
            onChange={(evento) =>
              aoMudarBase(setVencimento)(evento.target.value)
            }
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="parcelas">Parcelas</label>
          <input
            id="parcelas"
            name="parcelas"
            type="number"
            className="entrada numero"
            min={1}
            max={MAXIMO_DE_PARCELAS}
            step={1}
            value={textoParcelas}
            onChange={(evento) =>
              aoMudarBase(setTextoParcelas)(evento.target.value)
            }
            required
          />
          <span className="dica">
            Deixe 1 para uma conta só. Acima disso, o sistema cria uma conta
            para cada parcela.
          </span>
        </div>

        {parcelado && (
          <div className="campo">
            <label htmlFor="intervalo">Intervalo entre as parcelas</label>
            <select
              id="intervalo"
              className="entrada"
              value={intervalo}
              onChange={(evento) =>
                aoMudarBase(setIntervalo)(evento.target.value as Intervalo)
              }
            >
              {INTERVALOS.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </select>
          </div>
        )}

        {parcelado && (
          <fieldset className="campo inteira opcoes">
            <legend>O valor informado é</legend>
            <label>
              <input
                type="radio"
                checked={!valorEhTotal}
                onChange={() => aoMudarBase(setValorEhTotal)(false)}
              />
              de cada parcela
            </label>
            <label>
              <input
                type="radio"
                checked={valorEhTotal}
                onChange={() => aoMudarBase(setValorEhTotal)(true)}
              />
              o total da compra
            </label>
          </fieldset>
        )}

        {parcelado && (
          <div className="inteira">
            {parcelas.length === 0 ? (
              <p className="aviso">
                Preencha o valor e o vencimento da 1ª parcela para ver as
                parcelas.
              </p>
            ) : (
              <div className="caixa tabela-rolagem">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Parcela</th>
                      <th>Vencimento</th>
                      <th>Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelas.map((parcela, indice) => (
                      <tr key={indice}>
                        <td className="numero">
                          {indice + 1}/{quantidade}
                        </td>
                        <td>
                          <input
                            name="parcela_vencimento"
                            type="date"
                            className="entrada"
                            aria-label={`Vencimento da parcela ${indice + 1}`}
                            value={parcela.vencimento}
                            onChange={(evento) =>
                              ajustar(indice, {
                                vencimento: evento.target.value,
                              })
                            }
                            required
                          />
                        </td>
                        <td>
                          <input
                            name="parcela_valor"
                            className="entrada numero"
                            inputMode="decimal"
                            aria-label={`Valor da parcela ${indice + 1}`}
                            value={parcela.valor}
                            onChange={(evento) =>
                              ajustar(indice, { valor: evento.target.value })
                            }
                            autoComplete="off"
                            required
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>Total da compra</td>
                      <td className="numero">{formatarMoeda(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <span className="dica">
              Confira com os boletos: a data e o valor de cada parcela podem
              ser corrigidos aqui antes de salvar.
            </span>
          </div>
        )}

        <div className="campo">
          <label htmlFor="favorecido">Favorecido</label>
          <input
            id="favorecido"
            name="favorecido"
            className="entrada"
            list="lista-favorecidos"
            defaultValue={campos?.favorecido}
            maxLength={120}
            autoComplete="off"
          />
          <datalist id="lista-favorecidos">
            {favorecidos.map((nome) => (
              <option key={nome} value={nome} />
            ))}
          </datalist>
          <span className="dica">
            Para quem é o pagamento. Se o nome for novo, ele é cadastrado
            sozinho.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="categoria_id">Categoria</label>
          {/* A chave recria o campo após um erro; sem ela, a categoria
              escolhida voltaria para "Sem categoria". */}
          <select
            key={campos?.categoria_id ?? ""}
            id="categoria_id"
            name="categoria_id"
            className="entrada"
            defaultValue={campos?.categoria_id ?? ""}
          >
            <option value="">Sem categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="campo inteira">
          <label htmlFor="observacao">Observação (opcional)</label>
          <textarea
            id="observacao"
            name="observacao"
            className="entrada"
            defaultValue={campos?.observacao}
            maxLength={500}
          />
        </div>
      </div>

      <div className="form-acoes">
        <button
          type="submit"
          className="botao botao-principal"
          disabled={enviando}
        >
          {enviando ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="submit"
          name="depois"
          value="outra"
          className="botao"
          disabled={enviando}
        >
          Salvar e lançar outra
        </button>
        <Link href="/" className="botao">
          Voltar
        </Link>
      </div>
    </form>
  );
}
