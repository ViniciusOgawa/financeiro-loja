"use client";

import Link from "next/link";
import { useActionState } from "react";
import { criarConta, type EstadoConta } from "../actions";

type Props = {
  categorias: { id: string; nome: string }[];
  favorecidos: string[];
  vencimentoInicial: string;
};

const estadoInicial: EstadoConta = {};

export function FormularioConta({
  categorias,
  favorecidos,
  vencimentoInicial,
}: Props) {
  const [estado, acao, enviando] = useActionState(criarConta, estadoInicial);
  const campos = estado.campos;

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
            defaultValue={campos?.valor}
            autoComplete="off"
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="vencimento">Vencimento</label>
          <input
            id="vencimento"
            name="vencimento"
            type="date"
            className="entrada"
            defaultValue={campos?.vencimento ?? vencimentoInicial}
            required
          />
        </div>

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
