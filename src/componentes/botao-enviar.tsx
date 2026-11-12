"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Botão de envio para formulários simples, sem estado próprio: mostra a
 * animação de carregamento enquanto a ação do formulário não termina.
 */
export function BotaoEnviar({
  className = "botao",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      aria-busy={pending}
      disabled={pending}
    >
      {children}
    </button>
  );
}
