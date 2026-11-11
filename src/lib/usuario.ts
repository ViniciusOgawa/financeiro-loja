import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "./supabase/server";
import { supabaseConfigurado } from "./supabase/config";

export type Usuario = {
  id: string;
  email: string;
  nome: string;
};

/**
 * Usuário logado, conferido com o servidor do Supabase. Manda para a tela de
 * entrada se não houver sessão válida. Chamado por toda página e ação interna.
 */
export const exigirUsuario = cache(async (): Promise<Usuario> => {
  if (!supabaseConfigurado) {
    redirect("/login");
  }

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const email = user.email ?? "";
  const nomeCadastrado = user.user_metadata?.nome;
  const nome =
    typeof nomeCadastrado === "string" && nomeCadastrado.trim()
      ? nomeCadastrado.trim()
      : email.split("@")[0];

  return { id: user.id, email, nome };
});
