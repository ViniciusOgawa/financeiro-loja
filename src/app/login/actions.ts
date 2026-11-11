"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";

export type EstadoEntrada = {
  erro?: string;
  email?: string;
};

export async function entrar(
  _anterior: EstadoEntrada,
  formData: FormData,
): Promise<EstadoEntrada> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!supabaseConfigurado) {
    return { erro: "O sistema ainda não foi ligado ao banco de dados.", email };
  }
  if (!email || !senha) {
    return { erro: "Preencha o e-mail e a senha.", email };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    const credenciaisErradas = error.code === "invalid_credentials";
    return {
      erro: credenciaisErradas
        ? "E-mail ou senha incorretos."
        : "Não foi possível entrar agora. Tente de novo em instantes.",
      email,
    };
  }

  redirect("/");
}

export async function sair() {
  if (supabaseConfigurado) {
    const supabase = await criarClienteServidor();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
