import React, { useState, useRef, useEffect, useId, useMemo, useCallback } from "react";

/*
 * PainelPedidos.jsx
 * -----------------------------------------------------------------------------
 * Painel de pedidos acessível (WCAG 2.2 AA), construído em um único arquivo.
 *
 * Conformidade com A11Y.md:
 *  - HTML semântico nativo priorizado (button, table, dialog, label/input).
 *  - Combobox/Autocomplete: padrão APG "Combobox with List Autocomplete".
 *  - Tabs: padrão APG "Tabs" com roving tabindex e navegação por setas.
 *  - Menu de ações: padrão APG "Menu Button" (aria-haspopup, foco gerenciado).
 *  - Modal: <dialog> nativo via showModal() => focus trap + restauração nativos.
 *  - Estado por Ícone + Texto + Cor (nunca somente cor).
 *  - Feedback dinâmico anunciado via região aria-live (role="status").
 *  - Foco sempre visível (anel 2px, contraste >= 3:1), alvos >= 44x44px.
 *
 * NOTA DE TRADE-OFF (Seção 6 do A11Y.md): o guia recomenda fortemente usar
 * bibliotecas headless robustas (ex: Headless UI) para combobox/menu. Como o
 * requisito proíbe libs externas, as lógicas foram reimplementadas seguindo o
 * APG. Em produção, recomenda-se substituir por uma lib auditada.
 * -----------------------------------------------------------------------------
 */

/* ----------------------------- Dados de exemplo ---------------------------- */

const CLIENTES = [
  "Ana Beatriz Souza",
  "Bruno Carvalho",
  "Carla Mendes",
  "Daniel Oliveira",
  "Eduardo Lima",
  "Fernanda Rocha",
  "Gabriel Santos",
  "Helena Martins",
  "Igor Almeida",
  "Juliana Pereira",
];

const PEDIDOS_INICIAIS = [
  { id: 1001, cliente: "Ana Beatriz Souza", valor: 249.9, status: "pendente" },
  { id: 1002, cliente: "Bruno Carvalho", valor: 1320.0, status: "concluido" },
  { id: 1003, cliente: "Carla Mendes", valor: 89.5, status: "pendente" },
  { id: 1004, cliente: "Daniel Oliveira", valor: 540.0, status: "concluido" },
  { id: 1005, cliente: "Eduardo Lima", valor: 75.25, status: "pendente" },
  { id: 1006, cliente: "Fernanda Rocha", valor: 2199.99, status: "concluido" },
  { id: 1007, cliente: "Gabriel Santos", valor: 410.0, status: "pendente" },
];

const STATUS_META = {
  pendente: { rotulo: "Pendente", icone: "⏳", classe: "status--pendente" },
  concluido: { rotulo: "Concluído", icone: "✓", classe: "status--concluido" },
};

const ABAS = [
  { id: "todos", rotulo: "Todos" },
  { id: "pendente", rotulo: "Pendentes" },
  { id: "concluido", rotulo: "Concluídos" },
];

const moeda = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* =========================================================================== */
/*  Região de anúncios (aria-live) — feedback dinâmico para leitores de tela   */
/* =========================================================================== */

function useAnuncio() {
  const [mensagem, setMensagem] = useState("");
  // Limpa antes de reescrever para garantir reanúncio de mensagens repetidas.
  const anunciar = useCallback((texto) => {
    setMensagem("");
    window.requestAnimationFrame(() => setMensagem(texto));
  }, []);
  return [mensagem, anunciar];
}

/* =========================================================================== */
/*  StatusBadge — estado por Ícone + Texto + Cor (Seção 3: Redundância)        */
/* =========================================================================== */

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span className={`status ${meta.classe}`}>
      <span className="status__icone" aria-hidden="true">
        {meta.icone}
      </span>
      {meta.rotulo}
    </span>
  );
}

/* =========================================================================== */
/*  Autocomplete (Combobox) — APG: combobox + listbox                          */
/* =========================================================================== */

function ClienteAutocomplete({ onSelecionar, onAnunciar }) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(-1);

  const inputId = useId();
  const listboxId = useId();
  const helperId = useId();
  const inputRef = useRef(null);
  const listboxRef = useRef(null);

  const sugestoes = useMemo(() => {
    const t = texto.trim().toLowerCase();
    if (!t) return [];
    return CLIENTES.filter((c) => c.toLowerCase().includes(t)).slice(0, 6);
  }, [texto]);

  const temSugestoes = aberto && sugestoes.length > 0;

  const fechar = useCallback(() => {
    setAberto(false);
    setIndiceAtivo(-1);
  }, []);

  const selecionar = useCallback(
    (nome) => {
      setTexto(nome);
      fechar();
      onSelecionar(nome);
      onAnunciar(`Cliente ${nome} selecionado.`);
    },
    [fechar, onSelecionar, onAnunciar]
  );

  function aoDigitar(e) {
    setTexto(e.target.value);
    setAberto(true);
    setIndiceAtivo(-1);
  }

  function aoTeclar(e) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!aberto) {
          setAberto(true);
          return;
        }
        if (sugestoes.length) {
          setIndiceAtivo((i) => (i + 1) % sugestoes.length);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (sugestoes.length) {
          setIndiceAtivo((i) => (i <= 0 ? sugestoes.length - 1 : i - 1));
        }
        break;
      case "Enter":
        if (temSugestoes && indiceAtivo >= 0) {
          e.preventDefault();
          selecionar(sugestoes[indiceAtivo]);
        }
        break;
      case "Escape":
        e.preventDefault();
        fechar();
        break;
      case "Home":
        if (temSugestoes) {
          e.preventDefault();
          setIndiceAtivo(0);
        }
        break;
      case "End":
        if (temSugestoes) {
          e.preventDefault();
          setIndiceAtivo(sugestoes.length - 1);
        }
        break;
      default:
        break;
    }
  }

  // Fecha ao clicar fora do componente.
  const wrapRef = useRef(null);
  useEffect(() => {
    function aoClicarFora(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) fechar();
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [fechar]);

  const idOpcaoAtiva =
    indiceAtivo >= 0 ? `${listboxId}-opt-${indiceAtivo}` : undefined;

  return (
    <div className="campo" ref={wrapRef}>
      {/* Label explícita e visível (nunca placeholder como rótulo). */}
      <label htmlFor={inputId} className="campo__label">
        Buscar cliente
      </label>
      <p id={helperId} className="campo__ajuda">
        Digite parte do nome e use as setas para escolher na lista.
      </p>

      {/*
        Estrutura combobox 1.1 (APG): o input é o combobox.
        aria-expanded reflete a lista; aria-activedescendant aponta a opção.
      */}
      <div className="combobox">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          className="combobox__input"
          role="combobox"
          aria-expanded={temSugestoes}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={idOpcaoAtiva}
          aria-describedby={helperId}
          autoComplete="off"
          value={texto}
          onChange={aoDigitar}
          onKeyDown={aoTeclar}
          onFocus={() => texto && setAberto(true)}
        />

        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label="Sugestões de clientes"
          className="combobox__lista"
          hidden={!temSugestoes}
        >
          {sugestoes.map((nome, i) => (
            <li
              key={nome}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={i === indiceAtivo}
              className={
                "combobox__opcao" +
                (i === indiceAtivo ? " combobox__opcao--ativa" : "")
              }
              // mousedown evita perder o foco do input antes do clique.
              onMouseDown={(e) => {
                e.preventDefault();
                selecionar(nome);
              }}
              onMouseEnter={() => setIndiceAtivo(i)}
            >
              {nome}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* =========================================================================== */
/*  Tabs — APG: tablist + tab + tabpanel, roving tabindex                      */
/* =========================================================================== */

function FiltroAbas({ abaAtiva, onMudar, contagens }) {
  const baseId = useId();
  const refs = useRef([]);

  function aoTeclar(e, indice) {
    let alvo = null;
    switch (e.key) {
      case "ArrowRight":
        alvo = (indice + 1) % ABAS.length;
        break;
      case "ArrowLeft":
        alvo = (indice - 1 + ABAS.length) % ABAS.length;
        break;
      case "Home":
        alvo = 0;
        break;
      case "End":
        alvo = ABAS.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    onMudar(ABAS[alvo].id);
    refs.current[alvo]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Filtrar pedidos por status"
      className="abas"
    >
      {ABAS.map((aba, i) => {
        const selecionada = aba.id === abaAtiva;
        return (
          <button
            key={aba.id}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="tab"
            id={`${baseId}-tab-${aba.id}`}
            aria-selected={selecionada}
            aria-controls={`${baseId}-painel`}
            tabIndex={selecionada ? 0 : -1}
            className={"aba" + (selecionada ? " aba--ativa" : "")}
            onClick={() => onMudar(aba.id)}
            onKeyDown={(e) => aoTeclar(e, i)}
          >
            {aba.rotulo}
            <span className="aba__contagem" aria-hidden="true">
              {contagens[aba.id]}
            </span>
            <span className="sr-only">{`(${contagens[aba.id]} pedidos)`}</span>
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================== */
/*  Menu de ações por linha — APG: Menu Button                                 */
/* =========================================================================== */

function MenuAcoes({ pedido, onAcao }) {
  const [aberto, setAberto] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const itensRef = useRef([]);
  const menuId = useId();

  const acoes = useMemo(
    () => [
      { id: "detalhes", rotulo: "Ver detalhes" },
      { id: "editar", rotulo: "Editar" },
      { id: "cancelar", rotulo: "Cancelar", perigoso: true },
    ],
    []
  );

  const abrir = useCallback((focoNoFim = false) => {
    setAberto(true);
    // Move o foco para o primeiro (ou último) item ao abrir.
    window.requestAnimationFrame(() => {
      const alvo = focoNoFim
        ? itensRef.current[itensRef.current.length - 1]
        : itensRef.current[0];
      alvo?.focus();
    });
  }, []);

  const fechar = useCallback((devolverFoco = true) => {
    setAberto(false);
    if (devolverFoco) btnRef.current?.focus();
  }, []);

  function aoTeclarBotao(e) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      abrir(false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      abrir(true);
    }
  }

  function aoTeclarItem(e, indice) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        itensRef.current[(indice + 1) % acoes.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        itensRef.current[
          (indice - 1 + acoes.length) % acoes.length
        ]?.focus();
        break;
      case "Home":
        e.preventDefault();
        itensRef.current[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        itensRef.current[acoes.length - 1]?.focus();
        break;
      case "Escape":
        e.preventDefault();
        fechar(true);
        break;
      case "Tab":
        fechar(false);
        break;
      default:
        break;
    }
  }

  function acionar(acao) {
    fechar(true);
    onAcao(acao, pedido);
  }

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e) {
      if (
        !menuRef.current?.contains(e.target) &&
        !btnRef.current?.contains(e.target)
      ) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  return (
    <div className="menu">
      <button
        ref={btnRef}
        type="button"
        className="btn-icone"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? menuId : undefined}
        onClick={() => (aberto ? fechar(false) : abrir(false))}
        onKeyDown={aoTeclarBotao}
      >
        {/* Rótulo acessível inclui o ID do pedido para diferenciar linhas. */}
        <span className="sr-only">{`Ações do pedido ${pedido.id}`}</span>
        <span aria-hidden="true" className="btn-icone__glifo">
          ⋮
        </span>
      </button>

      {aberto && (
        <ul
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`Ações do pedido ${pedido.id}`}
          className="menu__lista"
        >
          {acoes.map((acao, i) => (
            <li key={acao.id} role="none">
              <button
                ref={(el) => (itensRef.current[i] = el)}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={
                  "menu__item" + (acao.perigoso ? " menu__item--perigo" : "")
                }
                onClick={() => acionar(acao.id)}
                onKeyDown={(e) => aoTeclarItem(e, i)}
              >
                {acao.rotulo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* =========================================================================== */
/*  Tabela ordenável — table nativa + aria-sort + botões no cabeçalho          */
/* =========================================================================== */

const COLUNAS = [
  { id: "id", rotulo: "ID", numerico: true },
  { id: "cliente", rotulo: "Cliente", numerico: false },
  { id: "valor", rotulo: "Valor", numerico: true },
  { id: "status", rotulo: "Status", numerico: false },
];

function TabelaPedidos({ pedidos, ordenacao, onOrdenar, onAcao }) {
  function ariaSort(colId) {
    if (ordenacao.coluna !== colId) return "none";
    return ordenacao.direcao === "asc" ? "ascending" : "descending";
  }

  return (
    <div className="tabela-wrap">
      <table className="tabela">
        <caption className="sr-only">
          Lista de pedidos. Use os botões do cabeçalho para ordenar as colunas.
        </caption>
        <thead>
          <tr>
            {COLUNAS.map((col) => {
              const ativa = ordenacao.coluna === col.id;
              return (
                <th key={col.id} scope="col" aria-sort={ariaSort(col.id)}>
                  <button
                    type="button"
                    className="th-ordenar"
                    onClick={() => onOrdenar(col.id)}
                  >
                    <span>{col.rotulo}</span>
                    <span className="th-ordenar__seta" aria-hidden="true">
                      {ativa ? (ordenacao.direcao === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              );
            })}
            <th scope="col">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {pedidos.length === 0 ? (
            <tr>
              <td colSpan={COLUNAS.length + 1} className="tabela__vazio">
                Nenhum pedido encontrado para este filtro.
              </td>
            </tr>
          ) : (
            pedidos.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.cliente}</td>
                <td className="celula-num">{moeda(p.valor)}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td className="celula-acoes">
                  <MenuAcoes pedido={p} onAcao={onAcao} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================================== */
/*  Modal "Novo pedido" — <dialog> nativo (focus trap + restauração)           */
/* =========================================================================== */

function ModalNovoPedido({ aberto, onFechar, onSalvar }) {
  const dialogRef = useRef(null);
  const [cliente, setCliente] = useState("");
  const [valor, setValor] = useState("");
  const [erros, setErros] = useState({});

  const clienteId = useId();
  const valorId = useId();
  const tituloId = useId();
  const valorAjudaId = useId();
  const clienteErroId = useId();
  const valorErroId = useId();

  // showModal()/close() nativos gerenciam o focus trap e a restauração de foco.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (aberto && !dlg.open) {
      setCliente("");
      setValor("");
      setErros({});
      dlg.showModal();
    } else if (!aberto && dlg.open) {
      dlg.close();
    }
  }, [aberto]);

  function validar() {
    const novos = {};
    if (!cliente.trim()) novos.cliente = "Informe o nome do cliente.";
    const num = Number(valor.replace(",", "."));
    if (!valor.trim()) {
      novos.valor = "Informe o valor do pedido.";
    } else if (Number.isNaN(num) || num <= 0) {
      novos.valor = "O valor deve ser um número maior que zero.";
    }
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  function aoSubmeter(e) {
    e.preventDefault();
    if (!validar()) return;
    onSalvar({
      cliente: cliente.trim(),
      valor: Number(valor.replace(",", ".")),
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={tituloId}
      // Evento nativo disparado por Esc ou close(); sincroniza o estado.
      onClose={onFechar}
      onCancel={onFechar}
    >
      <form className="modal__form" onSubmit={aoSubmeter} noValidate>
        <div className="modal__cabecalho">
          <h2 id={tituloId} className="modal__titulo">
            Novo pedido
          </h2>
          <button
            type="button"
            className="btn-icone"
            onClick={onFechar}
          >
            <span className="sr-only">Fechar</span>
            <span aria-hidden="true" className="btn-icone__glifo">
              ✕
            </span>
          </button>
        </div>

        <div className="campo">
          <label htmlFor={clienteId} className="campo__label">
            Cliente
          </label>
          <input
            id={clienteId}
            type="text"
            className="entrada"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            aria-invalid={erros.cliente ? "true" : undefined}
            aria-describedby={erros.cliente ? clienteErroId : undefined}
            autoFocus
          />
          {erros.cliente && (
            <p id={clienteErroId} className="campo__erro" role="alert">
              <span aria-hidden="true">⚠ </span>
              {erros.cliente}
            </p>
          )}
        </div>

        <div className="campo">
          <label htmlFor={valorId} className="campo__label">
            Valor (R$)
          </label>
          <p id={valorAjudaId} className="campo__ajuda">
            Use ponto ou vírgula para os centavos. Ex: 199,90
          </p>
          <input
            id={valorId}
            type="text"
            inputMode="decimal"
            className="entrada"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            aria-invalid={erros.valor ? "true" : undefined}
            aria-describedby={
              erros.valor ? `${valorAjudaId} ${valorErroId}` : valorAjudaId
            }
          />
          {erros.valor && (
            <p id={valorErroId} className="campo__erro" role="alert">
              <span aria-hidden="true">⚠ </span>
              {erros.valor}
            </p>
          )}
        </div>

        <div className="modal__rodape">
          <button type="button" className="btn btn--neutro" onClick={onFechar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primario">
            Salvar pedido
          </button>
        </div>
      </form>
    </dialog>
  );
}

/* =========================================================================== */
/*  Componente principal                                                       */
/* =========================================================================== */

export default function PainelPedidos() {
  const [pedidos, setPedidos] = useState(PEDIDOS_INICIAIS);
  const [abaAtiva, setAbaAtiva] = useState("todos");
  const [ordenacao, setOrdenacao] = useState({ coluna: "id", direcao: "asc" });
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteBusca, setClienteBusca] = useState("");
  const [mensagem, anunciar] = useAnuncio();

  const baseId = useId();
  const novoPedidoBtnRef = useRef(null);

  const contagens = useMemo(
    () => ({
      todos: pedidos.length,
      pendente: pedidos.filter((p) => p.status === "pendente").length,
      concluido: pedidos.filter((p) => p.status === "concluido").length,
    }),
    [pedidos]
  );

  const pedidosVisiveis = useMemo(() => {
    let lista = pedidos;

    if (abaAtiva !== "todos") {
      lista = lista.filter((p) => p.status === abaAtiva);
    }
    if (clienteBusca) {
      lista = lista.filter((p) => p.cliente === clienteBusca);
    }

    const { coluna, direcao } = ordenacao;
    const fator = direcao === "asc" ? 1 : -1;
    return [...lista].sort((a, b) => {
      const va = a[coluna];
      const vb = b[coluna];
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * fator;
      }
      return String(va).localeCompare(String(vb), "pt-BR") * fator;
    });
  }, [pedidos, abaAtiva, clienteBusca, ordenacao]);

  function ordenarPor(coluna) {
    setOrdenacao((atual) => {
      const direcao =
        atual.coluna === coluna && atual.direcao === "asc" ? "desc" : "asc";
      const col = COLUNAS.find((c) => c.id === coluna);
      anunciar(
        `Ordenado por ${col?.rotulo}, ${
          direcao === "asc" ? "crescente" : "decrescente"
        }.`
      );
      return { coluna, direcao };
    });
  }

  function aoFiltrarAba(id) {
    setAbaAtiva(id);
    const aba = ABAS.find((a) => a.id === id);
    anunciar(`Exibindo ${aba?.rotulo}. ${contagens[id]} pedidos.`);
  }

  function aoSelecionarCliente(nome) {
    setClienteBusca(nome);
  }

  function limparBuscaCliente() {
    setClienteBusca("");
    anunciar("Filtro de cliente removido.");
  }

  function aoAcaoLinha(acao, pedido) {
    if (acao === "cancelar") {
      setPedidos((atual) =>
        atual.map((p) =>
          p.id === pedido.id ? { ...p, status: "concluido" } : p
        )
      );
      anunciar(`Pedido ${pedido.id} cancelado.`);
    } else if (acao === "detalhes") {
      anunciar(`Exibindo detalhes do pedido ${pedido.id}.`);
    } else if (acao === "editar") {
      anunciar(`Editando pedido ${pedido.id}.`);
    }
  }

  function aoSalvarPedido({ cliente, valor }) {
    const novoId = Math.max(...pedidos.map((p) => p.id)) + 1;
    setPedidos((atual) => [
      { id: novoId, cliente, valor, status: "pendente" },
      ...atual,
    ]);
    setModalAberto(false);
    anunciar(`Pedido ${novoId} criado para ${cliente}.`);
  }

  return (
    <div className="painel">
      <style>{CSS}</style>

      {/* Região de status: anúncios dinâmicos para leitores de tela. */}
      <div role="status" aria-live="polite" className="sr-only">
        {mensagem}
      </div>

      <header className="painel__topo">
        <h1 className="painel__titulo">Painel de pedidos</h1>
        <button
          ref={novoPedidoBtnRef}
          type="button"
          className="btn btn--primario"
          onClick={() => setModalAberto(true)}
        >
          <span aria-hidden="true">＋ </span>Novo pedido
        </button>
      </header>

      <section
        className="painel__busca"
        aria-label="Buscar pedidos por cliente"
      >
        <ClienteAutocomplete
          onSelecionar={aoSelecionarCliente}
          onAnunciar={anunciar}
        />
        {clienteBusca && (
          <p className="filtro-ativo">
            <span>
              Filtrando por: <strong>{clienteBusca}</strong>
            </span>
            <button
              type="button"
              className="btn btn--neutro btn--pequeno"
              onClick={limparBuscaCliente}
            >
              Limpar filtro
            </button>
          </p>
        )}
      </section>

      <FiltroAbas
        abaAtiva={abaAtiva}
        onMudar={aoFiltrarAba}
        contagens={contagens}
      />

      {/* O tabpanel acompanha a tabela filtrada pelas abas. */}
      <div
        id={`${baseId}-painel`}
        role="tabpanel"
        aria-label={`Pedidos: ${ABAS.find((a) => a.id === abaAtiva)?.rotulo}`}
        tabIndex={0}
        className="painel__conteudo"
      >
        <TabelaPedidos
          pedidos={pedidosVisiveis}
          ordenacao={ordenacao}
          onOrdenar={ordenarPor}
          onAcao={aoAcaoLinha}
        />
      </div>

      <ModalNovoPedido
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvar={aoSalvarPedido}
      />
    </div>
  );
}

/* =========================================================================== */
/*  Estilos — unidades relativas (rem), foco visível 2px, alvos 44px           */
/* =========================================================================== */

const CSS = `
.painel {
  --cor-fundo: #f7f8fa;
  --cor-superficie: #ffffff;
  --cor-borda: #c2c8d0;
  --cor-texto: #1a1d23;          /* contraste >= 12:1 sobre branco */
  --cor-texto-suave: #4a515c;    /* contraste >= 7:1 sobre branco  */
  --cor-primaria: #1b4fd4;       /* contraste >= 4.5:1 com texto branco */
  --cor-primaria-escura: #163fa8;
  --cor-foco: #0b3ad1;
  --cor-perigo: #b00020;
  --raio: 8px;

  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--cor-texto);
  background: var(--cor-fundo);
  font-size: 1rem;
  line-height: 1.5;
  padding: 1.5rem;
  max-width: 70rem;
  margin: 0 auto;
}

/* Conteúdo visível só para leitores de tela. */
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* Foco visível e consistente (Seção 4: anel 2px, contraste >= 3:1). */
.painel :focus-visible {
  outline: 2px solid var(--cor-foco);
  outline-offset: 2px;
  border-radius: 4px;
}

.painel__topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.painel__titulo {
  font-size: 1.5rem;
  margin: 0;
}

/* Botões — alvo mínimo 44x44px. */
.btn {
  min-height: 44px;
  padding: 0 1.1rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: var(--raio);
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.btn--pequeno { min-height: 36px; padding: 0 0.75rem; font-size: 0.85rem; }
.btn--primario {
  background: var(--cor-primaria);
  color: #fff;
}
.btn--primario:hover { background: var(--cor-primaria-escura); }
.btn--neutro {
  background: #fff;
  color: var(--cor-texto);
  border-color: var(--cor-borda);
}
.btn--neutro:hover { background: #eef1f5; }

.painel__busca { margin-bottom: 1.25rem; }

/* Campos de formulário. */
.campo { display: flex; flex-direction: column; position: relative; max-width: 28rem; }
.campo__label { font-weight: 600; margin-bottom: 0.25rem; font-size: 0.95rem; }
.campo__ajuda { margin: 0 0 0.4rem; font-size: 0.8rem; color: var(--cor-texto-suave); }
.campo__erro { margin: 0.35rem 0 0; font-size: 0.85rem; color: var(--cor-perigo); font-weight: 600; }

.entrada, .combobox__input {
  min-height: 44px;
  padding: 0 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  background: #fff;
  color: var(--cor-texto);
  width: 100%;
  box-sizing: border-box;
}
.entrada[aria-invalid="true"], .combobox__input[aria-invalid="true"] {
  border-color: var(--cor-perigo);
  border-width: 2px;
}

/* Combobox / autocomplete. */
.combobox { position: relative; }
.combobox__lista {
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0.25rem;
  position: absolute;
  z-index: 20;
  left: 0; right: 0;
  background: #fff;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  max-height: 16rem;
  overflow-y: auto;
}
.combobox__opcao {
  padding: 0.6rem 0.6rem;
  min-height: 44px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  cursor: pointer;
}
.combobox__opcao--ativa { background: #e7edfb; }

.filtro-ativo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 0.75rem 0 0;
  font-size: 0.95rem;
}

/* Abas (tabs). */
.abas {
  display: flex;
  gap: 0.25rem;
  border-bottom: 2px solid var(--cor-borda);
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.aba {
  min-height: 44px;
  padding: 0 1rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--cor-texto-suave);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.aba--ativa {
  color: var(--cor-primaria);
  border-bottom-color: var(--cor-primaria);
}
.aba__contagem {
  background: #e3e7ee;
  color: var(--cor-texto);
  border-radius: 999px;
  padding: 0 0.5rem;
  font-size: 0.78rem;
  min-width: 1.4rem;
  text-align: center;
}
.aba--ativa .aba__contagem { background: var(--cor-primaria); color: #fff; }

.painel__conteudo:focus-visible {
  outline: 2px solid var(--cor-foco);
  outline-offset: 4px;
}

/* Tabela. */
.tabela-wrap {
  overflow-x: auto;
  background: var(--cor-superficie);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
}
.tabela { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
.tabela th, .tabela td {
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e3e7ee;
}
.tabela thead th { background: #eef1f5; }
.tabela tbody tr:hover { background: #f4f7fb; }
.celula-num { font-variant-numeric: tabular-nums; }
.celula-acoes { text-align: right; width: 1%; white-space: nowrap; }
.tabela__vazio {
  text-align: center;
  padding: 2rem;
  color: var(--cor-texto-suave);
}

/* Botão de ordenação no cabeçalho (preenche toda a célula => hit area ampla). */
.th-ordenar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  font: inherit;
  font-weight: 700;
  color: var(--cor-texto);
  cursor: pointer;
  min-height: 44px;
  padding: 0 0.25rem;
  width: 100%;
}
.th-ordenar__seta { font-size: 0.8rem; color: var(--cor-texto-suave); }

/* Badge de status: Ícone + Texto + Cor. */
.status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  border: 1px solid transparent;
}
.status__icone { font-size: 0.9rem; }
.status--pendente { background: #fff3d6; color: #6b4a00; border-color: #d9a400; }
.status--concluido { background: #d9f2e2; color: #0a5a32; border-color: #1f9d57; }

/* Botão de ícone (menu, fechar) — alvo 44x44. */
.btn-icone {
  width: 44px; height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--raio);
  cursor: pointer;
  color: var(--cor-texto);
}
.btn-icone:hover { background: #eef1f5; }
.btn-icone__glifo { font-size: 1.25rem; line-height: 1; }

/* Menu de ações. */
.menu { position: relative; display: inline-block; }
.menu__lista {
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0.25rem;
  position: absolute;
  right: 0;
  z-index: 30;
  min-width: 11rem;
  background: #fff;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}
.menu__item {
  display: block;
  width: 100%;
  text-align: left;
  min-height: 44px;
  padding: 0 0.75rem;
  background: none;
  border: none;
  border-radius: 6px;
  font: inherit;
  color: var(--cor-texto);
  cursor: pointer;
}
.menu__item:hover, .menu__item:focus-visible { background: #eef1f5; }
.menu__item--perigo { color: var(--cor-perigo); font-weight: 600; }
.menu__item--perigo:hover, .menu__item--perigo:focus-visible { background: #fbe3e6; }

/* Modal nativo. */
.modal {
  border: none;
  border-radius: 12px;
  padding: 0;
  width: min(30rem, 92vw);
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
}
.modal::backdrop { background: rgba(15, 18, 25, 0.55); }
.modal__form { padding: 1.25rem 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.modal__cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal__titulo { margin: 0; font-size: 1.25rem; }
.modal__rodape {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Respeita a preferência de movimento reduzido. */
@media (prefers-reduced-motion: reduce) {
  .painel * { transition: none !important; animation: none !important; }
}
`;