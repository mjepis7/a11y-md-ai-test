import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// axe-core: roda análise de acessibilidade em tempo real e reporta no console.
// O atraso (1000ms) dá tempo do React montar antes da varredura.
if (import.meta.env.DEV) {
  import("@axe-core/react").then(({ default: axe }) => {
    axe(React, ReactDOM, 1000);
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
