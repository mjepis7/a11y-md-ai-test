import React, { useState, useMemo, useRef, useEffect } from "react";

// ─── Dados mock ──────────────────────────────────────────────────────────────
const CLIENTES = [
  "Ana Souza",
  "Bruno Lima",
  "Carla Mendes",
  "Daniel Rocha",
  "Eduarda Alves",
  "Felipe Castro",
  "Gabriela Nunes",
  "Henrique Dias",
  "Isabela Pires",
  "João Carvalho",
];

const PEDIDOS_INICIAIS = [
  { id: 1001, cliente: "Ana Souza", valor: 250.0, status: "Pendente" },
  { id: 1002, cliente: "Bruno Lima", valor: 1320.5, status: "Concluído" },
  { id: 1003, cliente: "Carla Mendes", valor: 89.9, status: "Pendente" },
  { id: 1004, cliente: "Daniel Rocha", valor: 540.0, status: "Concluído" },
  { id: 1005, cliente: "Eduarda Alves", valor: 2100.0, status: "Pendente" },
  { id: 1006, cliente: "Felipe Castro", valor: 75.25, status: "Concluído" },
  { id: 1007, cliente: "Gabriela Nunes", valor: 430.0, status: "Pendente" },
  { id: 1008, cliente: "Henrique Dias", valor: 999.99, status: "Concluído" },
];

const STATUS_OPCOES = ["Pendente", "Concluído"];
const ABAS = [
  { id: "todos", label: "Todos" },
  { id: "pendentes", label: "Pendentes" },
  { id: "concluidos", label: "Concluídos" },
];

const brl = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Componente principal ─────────────────────────────────────────────────────
export default function OrdersPanel() {
  const [pedidos, setPedidos] = useState(PEDIDOS_INICIAIS);
  const [busca, setBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [aba, setAba] = useState("todos");
  const [ordenacao, setOrdenacao] = useState({ campo: "id", dir: "asc" });
  const [menuAberto, setMenuAberto] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  const buscaRef = useRef(null);

  // Fecha sugestões e menus ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) {
        setMostrarSugestoes(false);
      }
      if (!e.target.closest("[data-menu]")) {
        setMenuAberto(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Autocomplete: clientes que combinam com o texto
  const sugestoes = useMemo(() => {
    if (!busca.trim()) return [];
    const termo = busca.toLowerCase();
    return CLIENTES.filter((c) => c.toLowerCase().includes(termo)).slice(0, 6);
  }, [busca]);

  // Pipeline: filtra por aba → filtra por cliente selecionado → ordena
  const pedidosVisiveis = useMemo(() => {
    let lista = [...pedidos];

    if (aba === "pendentes") lista = lista.filter((p) => p.status === "Pendente");
    if (aba === "concluidos") lista = lista.filter((p) => p.status === "Concluído");

    if (clienteSelecionado) {
      lista = lista.filter((p) => p.cliente === clienteSelecionado);
    }

    const { campo, dir } = ordenacao;
    lista.sort((a, b) => {
      let r;
      if (campo === "valor" || campo === "id") r = a[campo] - b[campo];
      else r = String(a[campo]).localeCompare(String(b[campo]), "pt-BR");
      return dir === "asc" ? r : -r;
    });

    return lista;
  }, [pedidos, aba, clienteSelecionado, ordenacao]);

  const ordenarPor = (campo) => {
    setOrdenacao((o) =>
      o.campo === campo
        ? { campo, dir: o.dir === "asc" ? "desc" : "asc" }
        : { campo, dir: "asc" }
    );
  };

  const setaOrdenacao = (campo) => {
    if (ordenacao.campo !== campo) return "↕";
    return ordenacao.dir === "asc" ? "↑" : "↓";
  };

  const selecionarCliente = (cliente) => {
    setBusca(cliente);
    setClienteSelecionado(cliente);
    setMostrarSugestoes(false);
  };

  const limparBusca = () => {
    setBusca("");
    setClienteSelecionado(null);
  };

  const acaoLinha = (acao, pedido) => {
    setMenuAberto(null);
    if (acao === "detalhes") {
      alert(
        `Pedido #${pedido.id}\nCliente: ${pedido.cliente}\nValor: ${brl(
          pedido.valor
        )}\nStatus: ${pedido.status}`
      );
    } else if (acao === "editar") {
      alert(`Editar pedido #${pedido.id} (placeholder)`);
    } else if (acao === "cancelar") {
      if (window.confirm(`Cancelar o pedido #${pedido.id}?`)) {
        setPedidos((ps) => ps.filter((p) => p.id !== pedido.id));
      }
    }
  };

  const salvarNovoPedido = ({ cliente, valor }) => {
    const novoId = Math.max(...pedidos.map((p) => p.id), 1000) + 1;
    setPedidos((ps) => [
      ...ps,
      { id: novoId, cliente, valor: Number(valor), status: "Pendente" },
    ]);
    setModalAberto(false);
  };

  return (
    <div style={S.page}>
      <style>{GLOBAL_CSS}</style>

      <div style={S.container}>
        <header style={S.header}>
          <div>
            <h1 style={S.title}>Painel de Pedidos</h1>
            <p style={S.subtitle}>
              {pedidosVisiveis.length} pedido(s) exibido(s)
            </p>
          </div>
          <button style={S.btnPrimary} onClick={() => setModalAberto(true)}>
            + Novo pedido
          </button>
        </header>

        {/* Busca com autocomplete */}
        <div style={S.searchWrap} ref={buscaRef}>
          <input
            style={S.searchInput}
            placeholder="Buscar cliente..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setClienteSelecionado(null);
              setMostrarSugestoes(true);
            }}
            onFocus={() => setMostrarSugestoes(true)}
          />
          {busca && (
            <button style={S.clearBtn} onClick={limparBusca} aria-label="Limpar">
              ×
            </button>
          )}
          {mostrarSugestoes && sugestoes.length > 0 && (
            <ul style={S.suggestions}>
              {sugestoes.map((c) => (
                <li
                  key={c}
                  style={S.suggestionItem}
                  className="suggestion-item"
                  onClick={() => selecionarCliente(c)}
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Abas */}
        <div style={S.tabs}>
          {ABAS.map((t) => (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              style={{
                ...S.tab,
                ...(aba === t.id ? S.tabActive : {}),
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {[
                  { campo: "id", label: "ID" },
                  { campo: "cliente", label: "Cliente" },
                  { campo: "valor", label: "Valor" },
                  { campo: "status", label: "Status" },
                ].map((col) => (
                  <th
                    key={col.campo}
                    style={S.th}
                    className="th-sort"
                    onClick={() => ordenarPor(col.campo)}
                  >
                    {col.label} <span style={S.sortIcon}>{setaOrdenacao(col.campo)}</span>
                  </th>
                ))}
                <th style={{ ...S.th, cursor: "default", width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {pedidosVisiveis.length === 0 ? (
                <tr>
                  <td colSpan={5} style={S.empty}>
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                pedidosVisiveis.map((p) => (
                  <tr key={p.id} className="row">
                    <td style={S.td}>#{p.id}</td>
                    <td style={S.td}>{p.cliente}</td>
                    <td style={S.td}>{brl(p.valor)}</td>
                    <td style={S.td}>
                      <span
                        style={{
                          ...S.badge,
                          ...(p.status === "Concluído"
                            ? S.badgeOk
                            : S.badgePending),
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ ...S.td, position: "relative" }} data-menu>
                      <button
                        style={S.kebab}
                        onClick={() =>
                          setMenuAberto(menuAberto === p.id ? null : p.id)
                        }
                      >
                        ⋮
                      </button>
                      {menuAberto === p.id && (
                        <div style={S.dropdown}>
                          <button
                            style={S.dropdownItem}
                            className="dropdown-item"
                            onClick={() => acaoLinha("detalhes", p)}
                          >
                            Ver detalhes
                          </button>
                          <button
                            style={S.dropdownItem}
                            className="dropdown-item"
                            onClick={() => acaoLinha("editar", p)}
                          >
                            Editar
                          </button>
                          <button
                            style={{ ...S.dropdownItem, color: "#dc2626" }}
                            className="dropdown-item"
                            onClick={() => acaoLinha("cancelar", p)}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <ModalNovoPedido
          onFechar={() => setModalAberto(false)}
          onSalvar={salvarNovoPedido}
        />
      )}
    </div>
  );
}

// ─── Modal de novo pedido ─────────────────────────────────────────────────────
function ModalNovoPedido({ onFechar, onSalvar }) {
  const [cliente, setCliente] = useState("");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");

  const submeter = (e) => {
    e.preventDefault();
    if (!cliente.trim()) return setErro("Informe o cliente.");
    if (!valor || Number(valor) <= 0) return setErro("Informe um valor válido.");
    onSalvar({ cliente: cliente.trim(), valor });
  };

  return (
    <div style={S.overlay} onClick={onFechar}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <h2 style={S.modalTitle}>Novo pedido</h2>
          <button style={S.modalClose} onClick={onFechar}>
            ×
          </button>
        </div>
        <form onSubmit={submeter}>
          <label style={S.label}>Cliente</label>
          <input
            style={S.input}
            list="clientes-mock"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Nome do cliente"
            autoFocus
          />
          <datalist id="clientes-mock">
            {CLIENTES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <label style={S.label}>Valor (R$)</label>
          <input
            style={S.input}
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
          />

          {erro && <p style={S.erro}>{erro}</p>}

          <div style={S.modalFooter}>
            <button type="button" style={S.btnGhost} onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" style={S.btnPrimary}>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  .th-sort:hover { background: #f1f5f9; }
  .row:hover { background: #f8fafc; }
  .suggestion-item:hover { background: #eff6ff; }
  .dropdown-item:hover { background: #f1f5f9; }
`;

const S = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#0f172a",
    padding: "32px 16px",
  },
  container: {
    maxWidth: 920,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 10px 30px rgba(0,0,0,0.04)",
    padding: 28,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: { margin: 0, fontSize: 24, fontWeight: 700 },
  subtitle: { margin: "4px 0 0", color: "#64748b", fontSize: 14 },
  searchWrap: { position: "relative", marginBottom: 20 },
  searchInput: {
    width: "100%",
    padding: "11px 38px 11px 14px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    outline: "none",
  },
  clearBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
    color: "#94a3b8",
    lineHeight: 1,
  },
  suggestions: {
    listStyle: "none",
    margin: "6px 0 0",
    padding: 6,
    position: "absolute",
    width: "100%",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    zIndex: 20,
  },
  suggestionItem: {
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },
  tabs: {
    display: "flex",
    gap: 6,
    marginBottom: 18,
    background: "#f1f5f9",
    padding: 4,
    borderRadius: 10,
    width: "fit-content",
  },
  tab: {
    border: "none",
    background: "transparent",
    padding: "8px 18px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#64748b",
  },
  tabActive: {
    background: "#fff",
    color: "#0f172a",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    borderBottom: "2px solid #e2e8f0",
    color: "#475569",
    fontWeight: 600,
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  },
  sortIcon: { color: "#94a3b8", fontSize: 12 },
  td: { padding: "12px 14px", borderBottom: "1px solid #f1f5f9" },
  empty: { padding: 32, textAlign: "center", color: "#94a3b8" },
  badge: {
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  badgeOk: { background: "#dcfce7", color: "#16a34a" },
  badgePending: { background: "#fef9c3", color: "#ca8a04" },
  kebab: {
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
    color: "#64748b",
    padding: "0 8px",
    lineHeight: 1,
  },
  dropdown: {
    position: "absolute",
    right: 14,
    top: "100%",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    padding: 6,
    zIndex: 10,
    minWidth: 150,
  },
  dropdownItem: {
    display: "block",
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: "9px 12px",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 14,
    color: "#0f172a",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: { margin: 0, fontSize: 19, fontWeight: 700 },
  modalClose: {
    border: "none",
    background: "transparent",
    fontSize: 24,
    cursor: "pointer",
    color: "#94a3b8",
    lineHeight: 1,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 9,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    outline: "none",
  },
  erro: { color: "#dc2626", fontSize: 13, margin: "12px 0 0" },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 22,
  },
  btnPrimary: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnGhost: {
    background: "transparent",
    color: "#475569",
    border: "1px solid #e2e8f0",
    padding: "10px 18px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};
