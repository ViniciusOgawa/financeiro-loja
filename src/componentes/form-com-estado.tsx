"use client";

import { useActionState, type ReactNode } from "react";

export type EstadoAcao = { erro?: string };

type Props = {
  acao: (anterior: EstadoAcao, formData: FormData) => Promise<EstadoAcao>;
  className?: string;
  children: ReactNode;
};

/** Formulário simples que mostra, logo abaixo, o erro devolvido pela ação. */
export function FormComEstado({ acao, className, children }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});

  return (
    <form action={enviar} className={className} aria-busy={enviando}>
      {children}
      {estado.erro && (
        <p className="form-erro" role="alert">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
