import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatarValorDeCampo, hoje } from "@/lib/formato";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario } from "@/lib/usuario";
import { FormularioEdicao } from "./formulario";

export const metadata: Metadata = { title: "Editar boleto" };

type Boleto = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: "aberta" | "paga" | "cancelada";
  pago_em: string | null;
  valor_pago: number | null;
  observacao: string | null;
  parcela_numero: number | null;
  favorecido: { nome: string } | null;
  compra: { num_parcelas: number } | null;
};

export default async function PaginaEditarBoleto({
  params,
}: PageProps<"/contas/[id]">) {
  await exigirUsuario();
  const { id } = await params;

  const supabase = await criarClienteServidor();
  const [{ data }, { data: beneficiarios }] = await Promise.all([
    supabase
      .from("contas")
      .select(
        "id, descricao, valor, vencimento, status, pago_em, valor_pago, observacao, parcela_numero, favorecido:favorecidos(nome), compra:compras(num_parcelas)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("favorecidos").select("nome").eq("ativo", true).order("nome"),
  ]);

  const boleto = data as unknown as Boleto | null;
  if (!boleto || boleto.status === "cancelada") notFound();

  const paga = boleto.status === "paga";
  const parcela =
    boleto.parcela_numero && boleto.compra
      ? `parcela ${boleto.parcela_numero}/${boleto.compra.num_parcelas}`
      : null;

  return (
    <div className="pagina-estreita">
      <div className="pagina-titulo">
        <h1>Editar boleto</h1>
        {paga && <span className="etiqueta etiqueta-verde">Pago</span>}
      </div>

      <FormularioEdicao
        id={boleto.id}
        paga={paga}
        parcela={parcela}
        hoje={hoje()}
        voltarPara={`/mes?mes=${boleto.vencimento.slice(0, 7)}`}
        beneficiarios={(beneficiarios ?? []).map((b) => b.nome)}
        inicial={{
          beneficiario: boleto.favorecido?.nome ?? boleto.descricao,
          valor: formatarValorDeCampo(Number(boleto.valor)),
          vencimento: boleto.vencimento,
          observacao: boleto.observacao ?? "",
          pago_em: boleto.pago_em ?? "",
          valor_pago:
            boleto.valor_pago === null
              ? ""
              : formatarValorDeCampo(Number(boleto.valor_pago)),
        }}
      />
    </div>
  );
}
