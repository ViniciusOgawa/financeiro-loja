"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const itens = [
  { href: "/", rotulo: "Contas" },
  { href: "/recorrencias", rotulo: "Contas fixas" },
  { href: "/favorecidos", rotulo: "Favorecidos" },
  { href: "/categorias", rotulo: "Categorias" },
];

export function Navegacao() {
  const caminho = usePathname();

  return (
    <nav className="menu" aria-label="Seções">
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
