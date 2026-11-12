import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  supabaseChave,
  supabaseConfigurado,
  supabaseUrl,
} from "@/lib/supabase/config";

/**
 * Roda antes de cada página: renova a sessão do Supabase e manda para a tela
 * de entrada quem não está logado. É uma primeira barreira; cada página e
 * ação confere o usuário de novo, e o banco só responde a usuários logados.
 */
export async function proxy(request: NextRequest) {
  const naTelaDeEntrada = request.nextUrl.pathname === "/login";

  if (!supabaseConfigurado) {
    return naTelaDeEntrada ? NextResponse.next() : irPara(request, "/login");
  }

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseChave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(novos) {
        for (const { name, value } of novos) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of novos) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !naTelaDeEntrada) {
    return irPara(request, "/login", resposta);
  }
  if (user && naTelaDeEntrada) {
    return irPara(request, "/", resposta);
  }
  return resposta;
}

/** Redireciona mantendo os cookies de sessão que acabaram de ser renovados. */
function irPara(request: NextRequest, caminho: string, origem?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = caminho;
  url.search = "";
  const redirecionamento = NextResponse.redirect(url);
  for (const cookie of origem?.cookies.getAll() ?? []) {
    redirecionamento.cookies.set(cookie);
  }
  return redirecionamento;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
