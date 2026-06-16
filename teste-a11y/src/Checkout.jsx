import { useState } from "react";

// Validações simples
const validators = {
  nome: (v) => {
    if (!v.trim()) return "Informe seu nome.";
    if (v.trim().length < 3) return "O nome deve ter ao menos 3 caracteres.";
    return "";
  },
  email: (v) => {
    if (!v.trim()) return "Informe seu e-mail.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "E-mail inválido.";
    return "";
  },
  cartao: (v) => {
    const digits = v.replace(/\s+/g, "");
    if (!digits) return "Informe o número do cartão.";
    if (!/^\d{16}$/.test(digits)) return "O cartão deve ter 16 dígitos.";
    return "";
  },
};

// Formata o cartão em grupos de 4 dígitos: 1234 5678 9012 3456
function formatCartao(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

export default function Checkout() {
  const [form, setForm] = useState({ nome: "", email: "", cartao: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [modalAberto, setModalAberto] = useState(false);
  const [concluido, setConcluido] = useState(false);

  function validarTudo() {
    const novosErros = {};
    Object.keys(validators).forEach((campo) => {
      const erro = validators[campo](form[campo]);
      if (erro) novosErros[campo] = erro;
    });
    return novosErros;
  }

  function handleChange(campo, valor) {
    const valorFinal = campo === "cartao" ? formatCartao(valor) : valor;
    setForm((f) => ({ ...f, [campo]: valorFinal }));
    if (touched[campo]) {
      setErrors((e) => ({ ...e, [campo]: validators[campo](valorFinal) }));
    }
  }

  function handleBlur(campo) {
    setTouched((t) => ({ ...t, [campo]: true }));
    setErrors((e) => ({ ...e, [campo]: validators[campo](form[campo]) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const novosErros = validarTudo();
    setErrors(novosErros);
    setTouched({ nome: true, email: true, cartao: true });
    if (Object.keys(novosErros).length === 0) {
      setModalAberto(true);
    }
  }

  function confirmar() {
    setModalAberto(false);
    setConcluido(true);
  }

  const campos = [
    { id: "nome", label: "Nome", type: "text", placeholder: "Seu nome completo" },
    { id: "email", label: "E-mail", type: "email", placeholder: "voce@exemplo.com" },
    { id: "cartao", label: "Cartão", type: "text", placeholder: "1234 5678 9012 3456", inputMode: "numeric" },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.titulo}>Checkout</h1>

        {concluido && (
          <div style={styles.sucesso} role="status">
            ✅ Pedido concluído com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {campos.map((campo) => {
            const erro = touched[campo.id] && errors[campo.id];
            return (
              <div key={campo.id} style={styles.grupo}>
                <label htmlFor={campo.id} style={styles.label}>
                  {campo.label}
                </label>
                <input
                  id={campo.id}
                  type={campo.type}
                  inputMode={campo.inputMode}
                  placeholder={campo.placeholder}
                  value={form[campo.id]}
                  onChange={(e) => handleChange(campo.id, e.target.value)}
                  onBlur={() => handleBlur(campo.id)}
                  aria-invalid={!!erro}
                  style={{ ...styles.input, ...(erro ? styles.inputErro : {}) }}
                />
                {erro && (
                  <span style={styles.mensagemErro} role="alert">
                    {erro}
                  </span>
                )}
              </div>
            );
          })}

          <button type="submit" style={styles.botao}>
            Finalizar
          </button>
        </form>
      </div>

      {modalAberto && (
        <div
          style={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
          onClick={() => setModalAberto(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 id="modal-titulo" style={styles.modalTitulo}>
              Confirmar pedido
            </h2>
            <p style={styles.modalTexto}>
              Confira seus dados antes de concluir:
            </p>
            <ul style={styles.resumo}>
              <li><strong>Nome:</strong> {form.nome}</li>
              <li><strong>E-mail:</strong> {form.email}</li>
              <li><strong>Cartão:</strong> •••• {form.cartao.replace(/\s+/g, "").slice(-4)}</li>
            </ul>
            <div style={styles.modalAcoes}>
              <button
                type="button"
                style={{ ...styles.botao, ...styles.botaoSecundario }}
                onClick={() => setModalAberto(false)}
              >
                Voltar
              </button>
              <button type="button" style={styles.botao} onClick={confirmar}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: 16,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: 32,
    width: "100%",
    maxWidth: 420,
  },
  titulo: { margin: "0 0 24px", fontSize: 24, color: "#0f172a" },
  grupo: { marginBottom: 18, display: "flex", flexDirection: "column" },
  label: { marginBottom: 6, fontSize: 14, fontWeight: 600, color: "#334155" },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 15,
    outline: "none",
  },
  inputErro: { borderColor: "#ef4444" },
  mensagemErro: { marginTop: 6, fontSize: 13, color: "#ef4444" },
  botao: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },
  botaoSecundario: { background: "#e2e8f0", color: "#0f172a" },
  sucesso: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 20,
    fontWeight: 600,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    padding: 28,
    width: "100%",
    maxWidth: 380,
  },
  modalTitulo: { margin: "0 0 12px", fontSize: 20, color: "#0f172a" },
  modalTexto: { margin: "0 0 12px", color: "#475569", fontSize: 14 },
  resumo: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 20px",
    fontSize: 14,
    color: "#334155",
    lineHeight: 1.8,
  },
  modalAcoes: { display: "flex", gap: 12 },
};
