import type { Metadata } from "next";
import { hoje } from "@/lib/formato";
import { chaveMes, lerMes } from "@/lib/meses";
import { exigirUsuario } from "@/lib/usuario";
import { FormularioContaFixa } from "../formulario";
import { carregarOpcoes } from "../opcoes";

export const metadata: Metadata = { title: "Nova conta fixa" };

export default async function PaginaNovaContaFixa() {
  await exigirUsuario();
  const opcoes = await carregarOpcoes();

  return (
    <div className="pagina-estreita">
      <div className="pagina-titulo">
        <h1>Nova conta fixa</h1>
      </div>

      <FormularioContaFixa
        {...opcoes}
        inicial={{
          descricao: "",
          favorecido: "",
          categoria_id: "",
          valor: "",
          dia_vencimento: "",
          inicio: chaveMes(lerMes(undefined, hoje())),
          fim: "",
        }}
      />
    </div>
  );
}
