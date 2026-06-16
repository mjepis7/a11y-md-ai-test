import { useState, useRef, useEffect } from "react";

/**
 * CheckoutScreen
 * -----------------------------------------------------------------------------
 * Tela de checkout acessível em um único componente, em conformidade com o
 * A11Y.md (WCAG 2.2 AA). Decisões-chave de acessibilidade:
 *
 *  - Labels explícitas vinculadas via htmlFor/id; instruções de formato visíveis
 *    FORA do campo (nunca placeholder como label) — A11Y.md §6.
 *  - Erros sinalizados com Ícone + Texto + Cor (nunca só cor), aria-invalid e
 *    aria-errormessage com role="alert" para anúncio imediato — §3 / forms ref.
 *  - Modal usa o elemento NATIVO <dialog> com showModal(): foco movido para
 *    dentro, focus trap, retorno do foco ao acionador e Esc para fechar são
 *    fornecidos pelo browser, evitando lógica proprietária — §6 / modals ref.
 *  - Conteúdo de fundo fica inerte enquanto o modal está aberto (showModal()).
 *  - Feedback dinâmico (sucesso) anunciado via role="status" (aria-live) — §3.
 *  - Foco visível >= 2px, alvos >= 44px, tipografia >= 12px, unidades rem para
 *    zoom até 400%, e prefers-reduced-motion respeitado — §3 / §4.
 */

const styles = `
  .co-root {
    --co-fg: #1a1a1a;           /* texto principal ~ 16:1 sobre branco        */
    --co-bg: #ffffff;
    --co-muted: #595959;        /* helper text 7:1 sobre branco               */
    --co-border: #767676;       /* borda de UI 3:1 sobre branco               */
    --co-accent: #0b5cab;       /* azul de ação 5.3:1 sobre branco            */
    --co-accent-hover: #094b8c;
    --co-error: #b3261e;        /* vermelho de erro 5.9:1 sobre branco        */
    --co-success-bg: #e7f4ea;
    --co-success-fg: #1b5e20;   /* verde sucesso 6.4:1 sobre #e7f4ea          */
    --co-focus: #0b5cab;

    color: var(--co-fg);
    background: var(--co-bg);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 1rem;            /* base 16px                                  */
    line-height: 1.5;
    max-width: 32rem;
    margin: 0 auto;
    padding: 1.5rem;
  }

  .co-root h1 { font-size: 1.5rem; margin: 0 0 1rem; }

  .co-field { margin-bottom: 1.25rem; }

  .co-label {
    display: block;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .co-hint {
    color: var(--co-muted);     /* >= 7:1, acima do mínimo de 12px            */
    font-size: 0.875rem;        /* 14px                                       */
    margin: 0 0 0.375rem;
  }

  .co-input {
    width: 100%;
    box-sizing: border-box;
    min-height: 2.75rem;        /* 44px de alvo de toque                      */
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    color: var(--co-fg);
    background: var(--co-bg);
    border: 1px solid var(--co-border);
    border-radius: 0.25rem;
  }

  .co-input[aria-invalid="true"] {
    border-color: var(--co-error);
    border-width: 2px;
  }

  .co-error {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--co-error);
    font-size: 0.875rem;
    margin: 0.375rem 0 0;
    font-weight: 600;
  }
  /* Ícone decorativo: o texto adjacente carrega o significado (não só cor). */
  .co-error-icon { flex: none; font-style: normal; }

  .co-btn {
    min-height: 2.75rem;        /* 44px                                       */
    min-width: 2.75rem;
    padding: 0.625rem 1.25rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 0.25rem;
    border: 1px solid transparent;
    cursor: pointer;
  }
  .co-btn-primary { background: var(--co-accent); color: #ffffff; }
  .co-btn-primary:hover { background: var(--co-accent-hover); }
  .co-btn-secondary {
    background: var(--co-bg);
    color: var(--co-accent);
    border-color: var(--co-border);
  }

  /* Foco visível: anel >= 2px, contraste >= 3:1. Nunca suprimido. */
  .co-root :focus-visible {
    outline: 3px solid var(--co-focus);
    outline-offset: 2px;
  }

  .co-success {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--co-success-bg);
    color: var(--co-success-fg);
    border: 1px solid var(--co-success-fg);
    border-radius: 0.25rem;
    padding: 0.75rem 1rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .co-dialog {
    border: 1px solid var(--co-border);
    border-radius: 0.5rem;
    padding: 1.5rem;
    max-width: 26rem;
    width: 90vw;
    color: var(--co-fg);
  }
  .co-dialog::backdrop { background: rgba(0, 0, 0, 0.5); }
  .co-dialog h2 { margin: 0 0 0.75rem; font-size: 1.25rem; }
  .co-dialog-summary { margin: 0 0 1.25rem; }
  .co-dialog-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  /* Respeita a preferência por movimento reduzido. */
  @media (prefers-reduced-motion: reduce) {
    .co-root *, .co-dialog, .co-dialog::backdrop {
      animation: none !important;
      transition: none !important;
    }
  }
`;

const initialValues = { name: "", email: "", card: "" };

function validate(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = "Informe seu nome completo.";
  }

  if (!values.email.trim()) {
    errors.email = "Informe seu e-mail.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Digite um e-mail válido, por exemplo nome@dominio.com.";
  }

  const digits = values.card.replace(/\s/g, "");
  if (!digits) {
    errors.card = "Informe o número do cartão.";
  } else if (!/^\d{16}$/.test(digits)) {
    errors.card = "O número do cartão deve conter 16 dígitos.";
  }

  return errors;
}

export default function CheckoutScreen() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const dialogRef = useRef(null);
  const successRef = useRef(null);

  // Abre/fecha o <dialog> nativo. showModal() gerencia foco, focus trap,
  // inert do fundo e o retorno do foco ao acionador automaticamente.
  function openDialog() {
    dialogRef.current?.showModal();
  }
  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Revalida em tempo real apenas após a primeira tentativa de envio,
    // para não interromper quem ainda está digitando pela primeira vez.
    if (submitted) {
      setErrors(validate({ ...values, [name]: value }));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      openDialog();
    } else {
      // Move o foco para o primeiro campo inválido (ordem do formulário).
      const order = ["name", "email", "card"];
      const firstInvalid = order.find((key) => nextErrors[key]);
      if (firstInvalid) {
        document.getElementById(`co-${firstInvalid}`)?.focus();
      }
    }
  }

  function handleConfirm() {
    closeDialog();
    setSuccess(true);
  }

  // Após confirmar, leva o foco ao aviso de sucesso para que usuários de
  // teclado/leitor de tela percebam a conclusão (role="status" anuncia o texto).
  useEffect(() => {
    if (success) {
      successRef.current?.focus();
    }
  }, [success]);

  return (
    <div className="co-root">
      <style>{styles}</style>

      <h1>Finalizar compra</h1>

      {/* Feedback dinâmico de sucesso — região aria-live (role="status"). */}
      {success && (
        <p
          className="co-success"
          role="status"
          ref={successRef}
          tabIndex={-1}
        >
          <span className="co-error-icon" aria-hidden="true">✓</span>
          Pedido concluído com sucesso.
        </p>
      )}

      {!success && (
        <form noValidate onSubmit={handleSubmit}>
          {/* Nome ------------------------------------------------------- */}
          <div className="co-field">
            <label className="co-label" htmlFor="co-name">
              Nome completo
            </label>
            <input
              className="co-input"
              id="co-name"
              name="name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={handleChange}
              aria-invalid={errors.name ? "true" : undefined}
              aria-errormessage={errors.name ? "co-name-error" : undefined}
            />
            {errors.name && (
              <p className="co-error" id="co-name-error" role="alert">
                <span className="co-error-icon" aria-hidden="true">⚠</span>
                {errors.name}
              </p>
            )}
          </div>

          {/* E-mail ----------------------------------------------------- */}
          <div className="co-field">
            <label className="co-label" htmlFor="co-email">
              E-mail
            </label>
            <p className="co-hint" id="co-email-hint">
              Enviaremos a confirmação do pedido para este endereço.
            </p>
            <input
              className="co-input"
              id="co-email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              aria-describedby="co-email-hint"
              aria-invalid={errors.email ? "true" : undefined}
              aria-errormessage={errors.email ? "co-email-error" : undefined}
            />
            {errors.email && (
              <p className="co-error" id="co-email-error" role="alert">
                <span className="co-error-icon" aria-hidden="true">⚠</span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Cartão ----------------------------------------------------- */}
          <div className="co-field">
            <label className="co-label" htmlFor="co-card">
              Número do cartão
            </label>
            {/* Instrução de formato visível fora do campo (não no placeholder). */}
            <p className="co-hint" id="co-card-hint">
              16 dígitos, somente números.
            </p>
            <input
              className="co-input"
              id="co-card"
              name="card"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={values.card}
              onChange={handleChange}
              aria-describedby="co-card-hint"
              aria-invalid={errors.card ? "true" : undefined}
              aria-errormessage={errors.card ? "co-card-error" : undefined}
            />
            {errors.card && (
              <p className="co-error" id="co-card-error" role="alert">
                <span className="co-error-icon" aria-hidden="true">⚠</span>
                {errors.card}
              </p>
            )}
          </div>

          <button className="co-btn co-btn-primary" type="submit">
            Finalizar
          </button>
        </form>
      )}

      {/* Modal de confirmação — <dialog> nativo. -------------------------
          showModal() fornece focus trap, fundo inerte, Esc para fechar e
          retorno do foco ao botão acionador. aria-labelledby/-describedby
          dão o contexto ao leitor de tela. */}
      <dialog
        className="co-dialog"
        ref={dialogRef}
        aria-labelledby="co-dialog-title"
        aria-describedby="co-dialog-desc"
      >
        <h2 id="co-dialog-title">Confirmar pedido</h2>
        <p className="co-dialog-summary" id="co-dialog-desc">
          Confirma a finalização da compra com o cartão terminado em{" "}
          {values.card.replace(/\s/g, "").slice(-4) || "----"}?
        </p>
        <div className="co-dialog-actions">
          <button
            className="co-btn co-btn-secondary"
            type="button"
            onClick={closeDialog}
          >
            Cancelar
          </button>
          <button
            className="co-btn co-btn-primary"
            type="button"
            onClick={handleConfirm}
          >
            Confirmar pedido
          </button>
        </div>
      </dialog>
    </div>
  );
}