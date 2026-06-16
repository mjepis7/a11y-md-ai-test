# Relatório — Teste do A11Y.md na geração de código com IA

**Data:** 16/06/2026

**Objetivo:** Medir se injetar o `A11Y.md` no contexto de um agente de IA produz
mudança considerável na acessibilidade do código gerado, justificando testes mais
a fundo.

---

## 1. Metodologia

Teste A/B controlado. A única variável alterada entre as rodadas foi a presença
do `A11Y.md` no contexto.

| | Versão A (baseline) | Versão B |
|---|---|---|
| Contexto | **Sem** A11Y.md | **Com** A11Y.md + instrução de seguir as regras |
| Prompt | Idêntico nas duas | Idêntico + injeção do A11Y.md |
| Modelo | Claude Opus | Claude Opus |

### Controle de viés (decisão metodológica importante)
A versão A foi gerada em **sessão separada e "cega"**: pasta neutra, sem nenhum
arquivo de acessibilidade por perto e sem mencionar que se tratava de um teste.
Isso evita o *viés do experimentador* — se o mesmo agente que conhece o teste
gerasse o baseline, ele tenderia a escrevê-lo acessível "sem querer", anulando a
comparação.

### Como foi medido
- **axe-core** (automático, via `@axe-core/react`) — varredura no navegador.
- **Teste manual de teclado** — navegação só com Tab / setas / Esc.
- **Inspeção de código** — semântica, ARIA, foco, contraste.

> Limitação conhecida: ferramentas automáticas como o axe cobrem apenas
> ~30–40% dos critérios WCAG. Os defeitos de teclado/foco só aparecem no teste
> manual.

---

## 2. Cenário 1 — Checkout (componente simples)

Form + modal + aviso de sucesso. Arquivos: `Checkout.jsx` (A) e
`CheckoutScreen.jsx` (B).

| Critério | A (sem) | B (com) |
|---|---|---|
| `<button>` / `<label>` nativos | ✅ | ✅ |
| Modal com foco preso (trap) | ❌ | ✅ `<dialog>` nativo |
| Modal fecha no ESC | ❌ | ✅ |
| Foco retorna ao acionador | ❌ | ✅ |
| Foco visível | ❌ `outline:none` | ✅ anel 3px |
| Erro associado ao campo | ❌ só `aria-invalid` | ✅ `aria-errormessage` |
| Contraste do erro | ❌ ~3.7:1 | ✅ ~5.9:1 |
| Alvo ≥44px / reduced-motion / autocomplete | ❌ | ✅ |

**Leitura:** num componente simples, o baseline do Claude já sai razoável
(tem label, button nativo, roles). O ganho do A11Y.md existe, mas é **marginal** —
concentrado no modal, no foco e no contraste.

---

## 3. Cenário 2 — Painel de Pedidos (componente complexo)

Autocomplete + tabela ordenável + tabs + menu de ações + modal.
Arquivos: `PainelA.jsx` (A) e `PainelB.jsx` (B).

| Componente | A (cega) | B (A11Y.md) |
|---|---|---|
| Autocomplete | `<li onClick>` — **só mouse**, sem teclado/ARIA | Combobox APG (setas, Enter, Esc, `aria-activedescendant`) |
| Tabela ordenável | `<th onClick>` — **teclado não ordena**, sem `aria-sort` | `<button>` + `aria-sort` + anúncio |
| Tabs | botões soltos, sem `role=tablist`/setas | APG roving tabindex + `tabpanel` |
| Menu de ações (⋮) | **sem nome acessível**, sem foco/Esc/setas | Menu Button APG completo |
| Modal | `<div>` sem role, **sem ESC/trap/retorno** | `<dialog>` nativo |
| Feedback dinâmico | ❌ nada anunciado | ✅ região `aria-live` |
| Foco visível / 44px / rem / reduced-motion | ❌ | ✅ |
| Linhas de código | ~607 | ~1185 |

**Leitura:** num componente complexo, o baseline **desmorona**. Seis barreiras
que impedem totalmente uso por teclado/leitor de tela: autocomplete, tabs sem
navegação por setas, ordenação, menu sem nome, modal sem ESC e ausência de
anúncios. A versão B resolve todas seguindo os padrões oficiais (WAI-ARIA APG).

---

## 4. Resultados do axe-core (números reais)

### Painel A — sem A11Y.md
- 🟠 **`color-contrast` (serious)** — abas inativas (`#64748b`) e badges de status:
  - "Pendente": `#ca8a04` sobre `#fef9c3` ≈ **2.6:1** (mínimo 4.5:1)
  - "Concluído": `#16a34a` sobre `#dcfce7` ≈ **2.4:1**
  - Múltiplas ocorrências (uma por linha da tabela).
- 🔵 **`empty-table-header` (minor)** — `<th>` da coluna de ações sem texto.

### Painel B — com A11Y.md
- 🔴 **`aria-valid-attr-value` (critical)** — 1 ocorrência.
  - **Causa:** as abas usam `aria-controls={baseId-painel}` com um `useId()`
    gerado dentro de `FiltroAbas`, mas o `tabpanel` usa um `useId()` diferente,
    gerado em `PainelPedidos`. Os IDs não batem → `aria-controls` aponta para um
    elemento inexistente.
- Contraste e cabeçalho vazio: **resolvidos** (cores de alto contraste; `<th>` de
  ações com texto `sr-only`).

---

## 5. Achado-chave

> **O A11Y.md eleva muito a qualidade do código — mas não substitui a verificação.**

Mesmo a versão guiada pelo A11Y.md saiu com **1 bug crítico de ARIA**. Isso mostra
que a ferramenta é uma **alavanca**, não uma garantia: ainda é necessário rodar
axe + teste de teclado no resultado.

Também ficou evidente a **divisão de cobertura** entre os métodos:
- O axe pegou o que é automatizável (contraste, header vazio, ARIA inválido).
- O axe **não pegou** os piores defeitos da versão A (autocomplete sem teclado,
  modal sem ESC, menu sem foco) — só o teste manual revelou.

---

## 6. Conclusão e recomendação

| Pergunta | Resposta |
|---|---|
| O A11Y.md traz mudança considerável? | **Sim — em componentes complexos.** Em UI simples, o ganho é marginal. |
| Vale aprofundar os testes? | **Sim.** O maior valor aparece nos componentes que a IA mais erra (combobox, tabela, menu, tabs). |
| O A11Y.md dispensa auditoria? | **Não.** A versão guiada ainda teve 1 bug crítico. |

**Próximos passos sugeridos para um teste mais profundo:**
1. Repetir com **modelos mais fracos** (ex: Gemini Flash) no baseline — a
   distância A↔B deve aumentar ainda mais.
2. Ampliar a amostra de componentes complexos (date picker, drag-and-drop,
   tabela com paginação/seleção).

---

## 7. Testes Manuais de Teclado

Navegação **só por teclado** (mouse parado), mesma sequência em A e B.

| Passo | O que mostra | Resultado A | Resultado B |
|---|---|---|---|
| 1. Tab pela página | foco visível? | Em algumas partes | Sim |
| 2. Busca + setas ↑↓ | autocomplete por teclado | Não | Sim |
| 3. Tab nas abas + setas ←→ | troca de aba | Não | Sim |
| 4. Tab no cabeçalho + Enter | ordenar coluna | Não | Sim |
| 5. Menu ⋮ (foco/Esc) | foco entra e Esc volta | Não | Sim |
| 6. Novo pedido → Esc | modal fecha | Não | Sim |

---

## 8. Scores Lighthouse

DevTools → aba *Lighthouse* → modo **Snapshot** (Navigation recarrega e volta pro
Painel A, mascarando o resultado) → Desktop → apenas *Accessibility*.

| Tela | Passou / Aplicáveis | Única falha |
|---|---|---|
| Painel A (sem) | **11 / 12** | Contraste (badges/abas) |
| Painel B (com) | **24 / 25** | `aria-*` inválido (bug do `aria-controls` das abas) |
| Checkout A (sem) | **16 / 16** | Nenhuma falha automática detectada |
| Checkout B (com) | **17/17** | Nenhuma falha automática detectada |

---
 
## Anexos
- Harness de teste: `teste-a11y/` (projeto Vite com as 4 telas e axe-core plugado).
- Arquivos gerados: `Checkout.jsx`, `CheckoutScreen.jsx`, `PainelA.jsx`,
  `PainelB.jsx` (mantidos exatamente como gerados pela IA).
