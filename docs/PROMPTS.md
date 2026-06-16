# Prompts usados na geração dos componentes

Registra os prompts exatos enviados à IA em cada cenário, para fins de
reprodutibilidade do estudo.

---

## Painel de Pedidos (`PainelA.jsx` / `PainelB.jsx`)

Os dois prompts têm o mesmo corpo funcional. A única diferença é a instrução
final — presente apenas na versão B — que injeta o A11Y.md no contexto.

### Versão A — sem A11Y.md (baseline)

```
Crie um painel de pedidos em React, num único arquivo .jsx (component-style,
sem libs externas além do React). Ele precisa ter:

1. Um campo de busca com autocomplete: ao digitar, mostra uma lista suspensa
   de clientes que combinam com o texto, e dá pra selecionar um.

2. Uma tabela com a lista de pedidos (colunas: ID, Cliente, Valor, Status),
   com a possibilidade de ordenar clicando no cabeçalho das colunas.

3. Abas (tabs) para filtrar os pedidos por status: "Todos", "Pendentes",
   "Concluídos".

4. Um menu de ações (dropdown) em cada linha da tabela, com as opções
   "Ver detalhes", "Editar" e "Cancelar".

5. Um botão "Novo pedido" que abre um modal com um pequeno formulário
   (cliente e valor) e um botão de salvar.

Use dados de exemplo (mock) direto no componente. Foque em deixar funcional
e com um visual limpo e moderno.
```

### Versão B — com A11Y.md

```
Crie um painel de pedidos em React, num único arquivo .jsx (component-style,
sem libs externas além do React). Ele precisa ter:

1. Um campo de busca com autocomplete: ao digitar, mostra uma lista suspensa
   de clientes que combinam com o texto, e dá pra selecionar um.

2. Uma tabela com a lista de pedidos (colunas: ID, Cliente, Valor, Status),
   com a possibilidade de ordenar clicando no cabeçalho das colunas.

3. Abas (tabs) para filtrar os pedidos por status: "Todos", "Pendentes",
   "Concluídos".

4. Um menu de ações (dropdown) em cada linha da tabela, com as opções
   "Ver detalhes", "Editar" e "Cancelar".

5. Um botão "Novo pedido" que abre um modal com um pequeno formulário
   (cliente e valor) e um botão de salvar.

Use dados de exemplo (mock) direto no componente. Foque em deixar funcional
e com um visual limpo e moderno.

Siga estritamente as regras de desenvolvimento definidas no arquivo A11Y.md
deste repositório. Não viole nenhuma restrição de acessibilidade, mesmo que
isso torne o código mais verboso. Priorize HTML semântico e os padrões de
componentes complexos descritos no A11Y.md.
```

---

## Checkout (`Checkout.jsx` / `CheckoutScreen.jsx`)

> Prompts não registrados. 
