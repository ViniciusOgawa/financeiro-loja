"use client";

import { useActionState, useRef, type ReactNode } from "react";
import {
  cancelarConta,
  desfazerPagamento,
  pagarConta,
} from "@/app/(app)/contas/actions";
import {
  formatarData,
  formatarMoeda,
  formatarValorDeCampo,
} from "@/lib/formato";
import type { EstadoAcao } from "./form-com-estado";

type Props = {
  conta: {
    id: string;
    descricao: string;
    valor: number;
    vencimento: string;
    paga: boolean;
  };
  hoje: string;
};

/**
 * Botões de uma conta na lista. Toda ação abre uma janela de confirmação,
 * para que um clique errado não mude nada.
 */
export function AcoesConta({ conta, hoje }: Props) {
  const resumo = (
    <p className="janela-resumo">
      <strong>{conta.descricao}</strong>
      <span className="suave numero">
        {formatarMoeda(conta.valor)} · vence em{" "}
        {formatarData(conta.vencimento)}
      </span>
    </p>
  );

  if (conta.paga) {
    return (
      <div className="acoes-linha">
        <Janela
          key="desfazer"
          rotulo="Desfazer"
          titulo="Desfazer pagamento"
          acao={desfazerPagamento}
          confirmar="Voltar para em aberto"
        >
          <input type="hidden" name="id" value={conta.id} />
          {resumo}
          <p>A conta volta a aparecer como em aberto.</p>
        </Janela>
      </div>
    );
  }

  return (
    <div className="acoes-linha">
      <Janela
        key="pagar"
        rotulo="Pagar"
        titulo="Marcar como paga"
        acao={pagarConta}
        confirmar="Confirmar pagamento"
        principal
      >
        <input type="hidden" name="id" value={conta.id} />
        {resumo}
        <div className="form-grade">
          <div className="campo">
            <label htmlFor={`pago-em-${conta.id}`}>Data do pagamento</label>
            <input
              id={`pago-em-${conta.id}`}
              name="pago_em"
              type="date"
              className="entrada"
              defaultValue={hoje}
              max={hoje}
              required
            />
          </div>
          <div className="campo">
            <label htmlFor={`valor-pago-${conta.id}`}>Valor pago (R$)</label>
            <input
              id={`valor-pago-${conta.id}`}
              name="valor_pago"
              className="entrada numero"
              inputMode="decimal"
              defaultValue={formatarValorDeCampo(conta.valor)}
              autoComplete="off"
              required
            />
          </div>
        </div>
        <p className="suave dica-janela">
          Altere o valor se houve juros ou desconto.
        </p>
      </Janela>

      <Janela
        key="cancelar"
        rotulo="Cancelar"
        titulo="Cancelar conta"
        acao={cancelarConta}
        confirmar="Cancelar esta conta"
        perigo
      >
        <input type="hidden" name="id" value={conta.id} />
        {resumo}
        <p>
          A conta sai da lista e dos totais. Use para lançamentos feitos por
          engano ou boletos que não serão pagos.
        </p>
      </Janela>
    </div>
  );
}

type JanelaProps = {
  rotulo: string;
  titulo: string;
  confirmar: string;
  acao: (anterior: EstadoAcao, formData: FormData) => Promise<EstadoAcao>;
  principal?: boolean;
  perigo?: boolean;
  children: ReactNode;
};

/** Botão que abre uma janela com um formulário de confirmação. */
function Janela({
  rotulo,
  titulo,
  confirmar,
  acao,
  principal,
  perigo,
  children,
}: JanelaProps) {
  const janela = useRef<HTMLDialogElement>(null);
  const [estado, enviar, enviando] = useActionState(acao, {});

  // Quando a ação dá certo, a lista é recarregada e a linha muda de estado
  // ou some: a janela é desmontada e fecha. Cada janela tem uma chave própria
  // para o React não reaproveitar a janela aberta de "Pagar" como "Desfazer".
  return (
    <>
      <button
        type="button"
        className={`botao botao-pequeno ${principal ? "botao-principal" : ""} ${perigo ? "botao-perigo" : ""}`}
        onClick={() => janela.current?.showModal()}
      >
        {rotulo}
      </button>

      <dialog ref={janela} className="janela" aria-label={titulo}>
        <form action={enviar}>
          <div className="caixa-cabecalho">{titulo}</div>
          <div className="caixa-corpo janela-corpo">
            {children}
            {estado.erro && (
              <p className="aviso aviso-erro" role="alert">
                {estado.erro}
              </p>
            )}
          </div>
          <div className="janela-acoes">
            <button
              type="button"
              className="botao"
              onClick={() => janela.current?.close()}
            >
              Voltar
            </button>
            <button
              type="submit"
              className={`botao ${perigo ? "botao-perigo-cheio" : "botao-principal"}`}
              disabled={enviando}
            >
              {enviando ? "Salvando…" : confirmar}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
