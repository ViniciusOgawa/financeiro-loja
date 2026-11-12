"use client";

import { useActionState } from "react";
import { entrar, type EstadoEntrada } from "./actions";

const estadoInicial: EstadoEntrada = {};

export function FormularioEntrada({ desligado }: { desligado: boolean }) {
  const [estado, acao, enviando] = useActionState(entrar, estadoInicial);

  return (
    <>
      {estado.erro && (
        <p className="aviso aviso-erro" role="alert">
          {estado.erro}
        </p>
      )}

      <form action={acao} className="caixa entrar-caixa" aria-busy={enviando}>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            className="entrada"
            autoComplete="username"
            defaultValue={estado.email}
            autoFocus
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            className="entrada"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          className="botao botao-principal botao-largo"
          disabled={enviando || desligado}
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </>
  );
}
