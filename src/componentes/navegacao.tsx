"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const itens = [
  { href: "/", rotulo: "Início" },
  { href: "/mes", rotulo: "Mês" },
  { href: "/recorrencias", rotulo: "Contas fixas" },
  { href: "/favorecidos", rotulo: "Favorecidos" },
  { href: "/categorias", rotulo: "Categorias" },
];

export function Navegacao() {
  const caminho = usePathname();
  const menu = useRef<HTMLElement>(null);

  // No celular o menu rola para os lados: a seção atual fica sempre à vista.
  useEffect(() => {
    menu.current
      ?.querySelector("[aria-current]")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [caminho]);

  return (
    <nav ref={menu} className="menu" aria-label="Seções">
      {itens.map(({ href, rotulo }) => {
        const atual =
          href === "/"
            ? caminho === "/" || caminho.startsWith("/contas")
            : caminho.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="menu-item"
            aria-current={atual ? "page" : undefined}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
