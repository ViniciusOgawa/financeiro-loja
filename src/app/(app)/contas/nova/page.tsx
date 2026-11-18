import type { Metadata } from "next";
import { dataValida } from "@/lib/formato";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";
import { FormularioConta } from "./formulario";

export const metadata: Metadata = { title: "Lançar boleto" };

export default async function PaginaNovaConta({
  searchParams,
}: PageProps<"/contas/nova">) {
  await exigirUsuario();
  const { salva, vencimento } = await searchParams;
  // Vem preenchido quando a pessoa clica em Lançar boleto com um dia aberto.
  const vencimentoInicial =
    typeof vencimento === "string" && dataValida(vencimento) ? vencimento : "";

  const supabase = await criarClienteServidor();
  const { data: beneficiarios } = await supabase
    .from("favorecidos")
    .select("nome")
    .eq("ativo", true)
    .order("nome");

  return (
    <div className="pagina-estreita">
      <div className="pagina-titulo">
        <h1>Lançar boleto</h1>
      </div>

      {salva && (
        <p className="aviso aviso-sucesso espaco-abaixo" role="status">
          Boleto salvo. Pode lançar o próximo.
        </p>
      )}

      {/* A chave muda a cada boleto salvo, para o formulário recomeçar vazio. */}
      <FormularioConta
        key={typeof salva === "string" ? salva : "novo"}
        vencimentoInicial={vencimentoInicial}
        beneficiarios={(beneficiarios ?? []).map((b) => b.nome)}
      />
    </div>
  );
}
