import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";
import { FormularioConta } from "./formulario";

export const metadata: Metadata = { title: "Lançar conta" };

export default async function PaginaNovaConta({
  searchParams,
}: PageProps<"/contas/nova">) {
  await exigirUsuario();
  const { salva } = await searchParams;

  const supabase = await criarClienteServidor();
  const [categorias, favorecidos] = await Promise.all([
    supabase.from("categorias").select("id, nome").order("nome"),
    supabase
      .from("favorecidos")
      .select("nome")
      .eq("ativo", true)
      .order("nome"),
  ]);

  return (
    <div className="pagina-estreita">
      <div className="pagina-titulo">
        <h1>Lançar conta</h1>
      </div>

      {salva && (
        <p className="aviso aviso-sucesso espaco-abaixo" role="status">
          Conta salva. Pode lançar a próxima.
        </p>
      )}

      <FormularioConta
        categorias={categorias.data ?? []}
        favorecidos={(favorecidos.data ?? []).map((f) => f.nome)}
      />
    </div>
  );
}
