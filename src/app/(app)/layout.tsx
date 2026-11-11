import Link from "next/link";
import { Navegacao } from "@/componentes/navegacao";
import { exigirUsuario } from "@/lib/usuario";
import { sair } from "../login/actions";

// As telas internas dependem de quem está logado: nunca são geradas no build.
export const dynamic = "force-dynamic";

export default async function LayoutInterno({ children }: LayoutProps<"/">) {
  const usuario = await exigirUsuario();

  return (
    <>
      <header className="cabecalho">
        <Link href="/" className="cabecalho-marca">
          Financeiro da loja
        </Link>

        <Navegacao />

        <div className="cabecalho-usuario">
          <span className="suave">{usuario.nome}</span>
          <form action={sair}>
            <button type="submit" className="botao">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="pagina">{children}</main>
    </>
  );
}
