"use client";

import Link from "next/link";
import { useActionState } from "react";
import { mascararValor } from "@/lib/formato";
import { editarConta, type CamposEdicao, type EstadoEdicao } from "../actions";

type Props = {
  id: string;
  paga: boolean;
  parcela: string | null;
  inicial: CamposEdicao;
  beneficiarios: string[];
  hoje: string;
  voltarPara: string;
};

const estadoInicial: EstadoEdicao = {};

/** Aplica a máscara de valor enquanto a pessoa digita. */
const mascarar = (evento: React.ChangeEvent<HTMLInputElement>) => {
  evento.target.value = mascararValor(evento.target.value);
};

export function FormularioEdicao({
  id,
  paga,
  parcela,
  inicial,
  beneficiarios,
  hoje,
  voltarPara,
}: Props) {
  const [estado, acao, enviando] = useActionState(editarConta, estadoInicial);
  // Depois de um erro, mostra o que a pessoa tinha digitado.
  const campos = estado.campos ?? inicial;

  return (
    <form
      key={estado.campos ? JSON.stringify(estado.campos) : "inicial"}
      action={acao}
      className="caixa caixa-corpo"
      aria-busy={enviando}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="paga" value={String(paga)} />

      {estado.erro && (
        <p className="aviso aviso-erro espaco-abaixo" role="alert">
          {estado.erro}
        </p>
      )}

      {parcela && (
        <p className="aviso espaco-abaixo">
          Este boleto é a {parcela} de uma compra parcelada. A alteração vale só
          para esta parcela.
        </p>
      )}

      <div className="form-grade">
        <div className="campo inteira">
          <label htmlFor="beneficiario">Beneficiário</label>
          <input
            id="beneficiario"
            name="beneficiario"
            className="entrada"
            list="lista-beneficiarios"
            defaultValue={campos.beneficiario}
            maxLength={120}
            autoComplete="off"
            required
          />
          <datalist id="lista-beneficiarios">
            {beneficiarios.map((nome) => (
              <option key={nome} value={nome} />
            ))}
          </datalist>
        </div>

        <div className="campo">
          <label htmlFor="valor">Valor (R$)</label>
          <input
            id="valor"
            name="valor"
            className="entrada numero"
            inputMode="numeric"
            defaultValue={campos.valor}
            onChange={mascarar}
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
            defaultValue={campos.vencimento}
            required
          />
        </div>

        {paga && (
          <>
            <div className="campo">
              <label htmlFor="pago_em">Data do pagamento</label>
              <input
                id="pago_em"
                name="pago_em"
                type="date"
                className="entrada"
                defaultValue={campos.pago_em}
                max={hoje}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="valor_pago">Valor pago (R$)</label>
              <input
                id="valor_pago"
                name="valor_pago"
                className="entrada numero"
                inputMode="numeric"
                defaultValue={campos.valor_pago}
                onChange={mascarar}
                autoComplete="off"
                required
              />
            </div>
          </>
        )}

        <div className="campo inteira">
          <label htmlFor="observacao">Observação (opcional)</label>
          <textarea
            id="observacao"
            name="observacao"
            className="entrada"
            defaultValue={campos.observacao}
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
          {enviando ? "Salvando…" : "Salvar alterações"}
        </button>
        <Link href={voltarPara} className="botao">
          Voltar
        </Link>
      </div>
    </form>
  );
}
