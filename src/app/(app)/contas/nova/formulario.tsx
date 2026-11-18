"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CampoBeneficiario } from "@/componentes/campo-beneficiario";
import { mascararValor } from "@/lib/formato";
import { criarConta, type EstadoConta } from "../actions";

type Props = {
  beneficiarios: string[];
  vencimentoInicial: string;
};

const estadoInicial: EstadoConta = {};

export function FormularioConta({ beneficiarios, vencimentoInicial }: Props) {
  const [estado, acao, enviando] = useActionState(criarConta, estadoInicial);
  const campos = estado.campos;

  // Valor e vencimento são controlados: a máscara reescreve o valor a cada
  // tecla, e os dois continuam preenchidos se o servidor devolver um erro.
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState(vencimentoInicial);

  return (
    <form action={acao} className="caixa caixa-corpo" aria-busy={enviando}>
      {estado.erro && (
        <p className="aviso aviso-erro espaco-abaixo" role="alert">
          {estado.erro}
        </p>
      )}

      <div className="form-grade">
        <div className="campo inteira">
          <label htmlFor="beneficiario">Beneficiário</label>
          <CampoBeneficiario
            id="beneficiario"
            name="beneficiario"
            opcoes={beneficiarios}
            placeholder="Quem emitiu o boleto"
            defaultValue={campos?.beneficiario}
            autoFocus
          />
          <span className="dica">
            Comece a digitar para escolher um já cadastrado. Se o nome for
            novo, ele é cadastrado sozinho.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="valor">Valor (R$)</label>
          <input
            id="valor"
            name="valor"
            className="entrada numero"
            inputMode="numeric"
            placeholder="0,00"
            value={valor}
            onChange={(evento) => setValor(mascararValor(evento.target.value))}
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
            value={vencimento}
            onChange={(evento) => setVencimento(evento.target.value)}
            required
          />
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
          Salvar e lançar outro
        </button>
        <Link href="/" className="botao">
          Voltar
        </Link>
      </div>
    </form>
  );
}
