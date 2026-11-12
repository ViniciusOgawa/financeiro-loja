import { Suspense } from "react";
import { BotaoEnviar } from "@/componentes/botao-enviar";
import { Navegacao } from "@/componentes/navegacao";
import { ProgressoDaNavegacao } from "@/componentes/progresso-da-navegacao";
import { exigirUsuario } from "@/lib/usuario";
import { sair } from "../login/actions";

// As telas internas dependem de quem está logado: nunca são geradas no build.
export const dynamic = "force-dynamic";

export default async function LayoutInterno({ children }: LayoutProps<"/">) {
  const usuario = await exigirUsuario();

  return (
    <>
      <Suspense>
        <ProgressoDaNavegacao />
      </Suspense>

      <header className="cabecalho">
        {/* Mesma largura da página, para o menu e o Sair alinharem ao conteúdo. */}
        <div className="cabecalho-dentro">
          <Navegacao />

          <div className="cabecalho-usuario">
            <span className="suave">{usuario.nome}</span>
            <form action={sair}>
              <BotaoEnviar>Sair</BotaoEnviar>
            </form>
          </div>
        </div>
      </header>

      <main className="pagina">{children}</main>
    </>
  );
}
