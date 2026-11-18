"use client";

import { useId, useState } from "react";

/** Quantas sugestões aparecem de uma vez. */
const MAXIMO_DE_SUGESTOES = 8;

/** Sem acentos e sem maiúsculas: "Confecções" e "confeccoes" batem. */
const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();

type Props = {
  id: string;
  name: string;
  opcoes: string[];
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * Campo de beneficiário com busca: ao digitar, mostra os cadastrados que
 * contêm o texto em qualquer parte do nome. Setas escolhem, Enter confirma e
 * Esc fecha. Um nome que não está na lista é aceito e vira um cadastro novo.
 */
export function CampoBeneficiario({
  id,
  name,
  opcoes,
  defaultValue = "",
  placeholder,
  autoFocus,
}: Props) {
  const idDaLista = useId();
  const [texto, setTexto] = useState(defaultValue);
  const [aberto, setAberto] = useState(false);
  const [destacado, setDestacado] = useState(-1);

  const procurado = normalizar(texto);
  const sugestoes = opcoes
    .filter((nome) => normalizar(nome).includes(procurado))
    .sort((a, b) => {
      // Quem começa com o texto vem primeiro.
      const inicioA = normalizar(a).startsWith(procurado) ? 0 : 1;
      const inicioB = normalizar(b).startsWith(procurado) ? 0 : 1;
      return inicioA - inicioB || a.localeCompare(b, "pt-BR");
    })
    .slice(0, MAXIMO_DE_SUGESTOES);
  const existe = opcoes.some((nome) => normalizar(nome) === procurado);
  const novo = procurado !== "" && !existe;
  const mostrar = aberto && (sugestoes.length > 0 || novo);

  function escolher(nome: string) {
    setTexto(nome);
    setAberto(false);
    setDestacado(-1);
  }

  function aoTeclar(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setAberto(true);
      setDestacado((atual) => Math.min(atual + 1, sugestoes.length - 1));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setDestacado((atual) => Math.max(atual - 1, -1));
    } else if (evento.key === "Enter" && mostrar && destacado >= 0) {
      // Escolhe a sugestão em vez de enviar o formulário.
      evento.preventDefault();
      escolher(sugestoes[destacado]);
    } else if (evento.key === "Escape" && mostrar) {
      evento.preventDefault();
      setAberto(false);
    }
  }

  return (
    <div className="combo">
      <input
        id={id}
        name={name}
        className="entrada"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={idDaLista}
        aria-autocomplete="list"
        aria-activedescendant={
          mostrar && destacado >= 0 ? `${idDaLista}-${destacado}` : undefined
        }
        value={texto}
        onChange={(evento) => {
          setTexto(evento.target.value);
          setAberto(true);
          setDestacado(-1);
        }}
        // Abre ao clicar, e não ao receber o foco: o campo já começa focado
        // e a lista cobriria o resto do formulário ao abrir a tela.
        onClick={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={aoTeclar}
        placeholder={placeholder}
        maxLength={120}
        autoComplete="off"
        autoFocus={autoFocus}
        required
      />

      {mostrar && (
        <ul id={idDaLista} className="combo-lista" role="listbox">
          {sugestoes.map((nome, indice) => (
            <li
              key={nome}
              id={`${idDaLista}-${indice}`}
              className="combo-opcao"
              role="option"
              aria-selected={indice === destacado}
              // mousedown, e não click: assim o campo não perde o foco antes.
              onMouseDown={(evento) => {
                evento.preventDefault();
                escolher(nome);
              }}
              onMouseEnter={() => setDestacado(indice)}
            >
              {nome}
            </li>
          ))}
          {novo && (
            <li className="combo-novo" role="presentation">
              “{texto.trim()}” será cadastrado como novo beneficiário.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
