import type { Metadata } from "next";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { FormularioEntrada } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrada() {
  return (
    <main className="entrar">
      <h1 className="entrar-titulo">Harmonia</h1>

      {!supabaseConfigurado && (
        <p className="aviso aviso-atencao">
          O sistema ainda não foi ligado ao banco de dados. Crie o arquivo{" "}
          <code>.env.local</code> seguindo o <code>.env.example</code> e
          reinicie o servidor.
        </p>
      )}

      <FormularioEntrada desligado={!supabaseConfigurado} />

      <p className="entrar-rodape suave">
        Acesso restrito. Não há cadastro: peça seu usuário a quem administra o
        sistema.
      </p>
    </main>
  );
}
