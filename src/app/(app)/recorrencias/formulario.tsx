"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  salvarContaFixa,
  type CamposFixa,
  type EstadoFixa,
} from "./actions";

type Props = {
  // Presente ao editar uma conta fixa existente.
  id?: string;
  inicial: CamposFixa;
  categorias: { id: string; nome: string }[];
  favorecidos: string[];
};

const estadoInicial: EstadoFixa = {};

export function FormularioContaFixa({
  id,
  inicial,
  categorias,
  favorecidos,
}: Props) {
  const [estado, acao, enviando] = useActionState(
    salvarContaFixa,
    estadoInicial,
  );
  // Depois de um erro, mostra o que a pessoa tinha digitado.
  const campos = estado.campos ?? inicial;

  return (
    <form action={acao} className="caixa caixa-corpo">
      {id && <input type="hidden" name="id" value={id} />}

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
            placeholder="Ex.: Aluguel da loja"
            defaultValue={campos.descricao}
            maxLength={160}
            autoFocus
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="valor">Valor por mês (R$)</label>
          <input
            id="valor"
            name="valor"
            className="entrada numero"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={campos.valor}
            autoComplete="off"
            required
          />
          <span className="dica">
            Se o valor muda todo mês, como a conta de luz, coloque uma
            estimativa. O valor certo é informado na hora de pagar.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="dia_vencimento">Dia do vencimento</label>
          <input
            id="dia_vencimento"
            name="dia_vencimento"
            type="number"
            className="entrada numero"
            min={1}
            max={31}
            step={1}
            defaultValue={campos.dia_vencimento}
            required
          />
          <span className="dica">
            Em meses mais curtos, vale o último dia do mês.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="inicio">Começa em</label>
          <input
            id="inicio"
            name="inicio"
            type="month"
            className="entrada"
            defaultValue={campos.inicio}
            required
          />
          <span className="dica">Primeiro mês em que a conta é criada.</span>
        </div>

        <div className="campo">
          <label htmlFor="fim">Termina em (opcional)</label>
          <input
            id="fim"
            name="fim"
            type="month"
            className="entrada"
            defaultValue={campos.fim}
          />
          <span className="dica">Deixe vazio se não tem data para acabar.</span>
        </div>

        <div className="campo">
          <label htmlFor="favorecido">Favorecido</label>
          <input
            id="favorecido"
            name="favorecido"
            className="entrada"
            list="lista-favorecidos"
            defaultValue={campos.favorecido}
            maxLength={120}
            autoComplete="off"
          />
          <datalist id="lista-favorecidos">
            {favorecidos.map((nome) => (
              <option key={nome} value={nome} />
            ))}
          </datalist>
          <span className="dica">
            Se o nome for novo, ele é cadastrado sozinho.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="categoria_id">Categoria</label>
          {/* A chave recria o campo após um erro, mantendo a escolha. */}
          <select
            key={campos.categoria_id}
            id="categoria_id"
            name="categoria_id"
            className="entrada"
            defaultValue={campos.categoria_id}
          >
            <option value="">Sem categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {id && (
        <p className="aviso espaco-acima">
          As alterações valem para as contas dos próximos meses. As contas que
          já foram criadas continuam como estão.
        </p>
      )}

      <div className="form-acoes">
        <button
          type="submit"
          className="botao botao-principal"
          disabled={enviando}
        >
          {enviando ? "Salvando…" : "Salvar"}
        </button>
        <Link href="/recorrencias" className="botao">
          Voltar
        </Link>
      </div>
    </form>
  );
}
