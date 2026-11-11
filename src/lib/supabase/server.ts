import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseChave, supabaseUrl } from "./config";

/** Cliente do Supabase para páginas, ações e rotas no servidor. */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseChave, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(novos) {
        try {
          for (const { name, value, options } of novos) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Páginas não podem gravar cookies; a renovação da sessão é feita
          // no proxy, então aqui basta ignorar.
        }
      },
    },
  });
}
