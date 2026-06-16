import { useState } from "react";
import Checkout from "./Checkout.jsx";
import CheckoutScreen from "./CheckoutScreen.jsx";
import PainelA from "./PainelA.jsx";
import PainelB from "./PainelB.jsx";

// Alterna entre as versões A (sem A11Y.md) e B (com A11Y.md).
// O axe-core reporta as violações de cada uma no console do navegador
// sempre que o componente em tela muda.
const VIEWS = {
  "painel-A": { label: "Painel A — sem A11Y.md", Comp: PainelA },
  "painel-B": { label: "Painel B — com A11Y.md", Comp: PainelB },
  "checkout-A": { label: "Checkout A — sem", Comp: Checkout },
  "checkout-B": { label: "Checkout B — com", Comp: CheckoutScreen },
};

export default function App() {
  const [view, setView] = useState("painel-A");
  const Atual = VIEWS[view].Comp;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          padding: "12px 16px",
          borderBottom: "1px solid #ddd",
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <strong>Teste A11Y:</strong>
        {Object.entries(VIEWS).map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            style={tabStyle(view === key)}
          >
            {label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#555" }}>
          Console (F12) → relatório do axe-core ↘
        </span>
      </header>

      <main>
        <Atual />
      </main>
    </div>
  );
}

function tabStyle(ativo) {
  return {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid #2563eb",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    background: ativo ? "#2563eb" : "#fff",
    color: ativo ? "#fff" : "#2563eb",
  };
}
