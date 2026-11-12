"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Depois deste tempo a barra some, mesmo que a tela não tenha trocado. */
const LIMITE_MS = 15_000;

/**
 * Barra no topo que aparece entre o clique em um link e a chegada da nova
 * tela. As telas buscam os dados no servidor a cada visita, então sem ela o
 * clique pareceria não ter funcionado.
 */
export function ProgressoDaNavegacao() {
  const caminho = usePathname();
  const busca = useSearchParams().toString();
  const enderecoAtual = busca ? `${caminho}?${busca}` : caminho;

  // Guarda o endereço em que a pessoa estava ao clicar. A barra fica ativa
  // enquanto esse ainda for o endereço atual, e some sozinha quando ele muda.
  const [saindoDe, setSaindoDe] = useState<string | null>(null);
  const ativo = saindoDe === enderecoAtual;
  // A tela trocou: esquece o endereço antigo, para a barra não reaparecer
  // sozinha quando a pessoa voltar a ele.
  if (saindoDe !== null && !ativo) setSaindoDe(null);

  useEffect(() => {
    let relogio: ReturnType<typeof setTimeout> | undefined;

    function aoClicar(evento: MouseEvent) {
      // Não dá para olhar defaultPrevented: o próprio Link do Next cancela o
      // clique para trocar de tela sem recarregar a página.
      if (
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey
      ) {
        return;
      }
      const link = (evento.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target && link.target !== "_self") return;
      if (link.origin !== window.location.origin) return;

      const destino = link.pathname + link.search;
      const origem = window.location.pathname + window.location.search;
      if (destino === origem) return;

      setSaindoDe(origem);
      clearTimeout(relogio);
      relogio = setTimeout(() => setSaindoDe(null), LIMITE_MS);
    }

    // Na fase de captura, para ver o clique antes de qualquer outro código.
    document.addEventListener("click", aoClicar, true);
    return () => {
      document.removeEventListener("click", aoClicar, true);
      clearTimeout(relogio);
    };
  }, []);

  return (
    <div
      className={`progresso ${ativo ? "progresso-ativo" : ""}`}
      role="status"
      aria-live="polite"
    >
      {ativo && <span className="so-leitor">Carregando…</span>}
    </div>
  );
}
