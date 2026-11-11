import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatarValorDeCampo } from "@/lib/formato";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";
import { FormularioContaFixa } from "../formulario";
import { carregarOpcoes } from "../opcoes";

export const metadata: Metadata = { title: "Editar conta fixa" };

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

type Fixa = {
  id: string;
  descricao: string;
  valor: number;
  dia_vencimento: number;
  inicio: string;
  fim: string | null;
  categoria_id: string | null;
  favorecido: { nome: string } | null;
};

export default async function PaginaEditarContaFixa({
  params,
}: PageProps<"/recorrencias/[id]">) {
  await exigirUsuario();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await criarClienteServidor();
  const [{ data }, opcoes] = await Promise.all([
    supabase
      .from("recorrencias")
      .select(
        "id, descricao, valor, dia_vencimento, inicio, fim, categoria_id, favorecido:favorecidos(nome)",
      )
      .eq("id", id)
      .maybeSingle(),
    carregarOpcoes(),
  ]);
  if (!data) notFound();
  const fixa = data as unknown as Fixa;

  return (
    <div className="pagina-estreita">
      <div className="pagina-titulo">
        <h1>Editar conta fixa</h1>
      </div>

      <FormularioContaFixa
        {...opcoes}
        id={fixa.id}
        inicial={{
          descricao: fixa.descricao,
          favorecido: fixa.favorecido?.nome ?? "",
          categoria_id: fixa.categoria_id ?? "",
          valor: formatarValorDeCampo(Number(fixa.valor)),
          dia_vencimento: String(fixa.dia_vencimento),
          inicio: fixa.inicio.slice(0, 7),
          fim: fixa.fim?.slice(0, 7) ?? "",
        }}
      />
    </div>
  );
}
