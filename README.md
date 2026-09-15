# eloja-tools

Hub de ferramentas web para lojistas — em construção.

O contexto do produto está documentado em três pastas (prefixadas com `.` por serem material de apoio, não parte do site publicado):

- **`.rules/`** — regras e diretrizes gerais do projeto (visão, stack técnica, design visual, arquitetura do hub).
- **`.specs/`** — especificações funcionais de cada parte do produto (o hub em si, cada ferramenta).
- **`.tasks/`** — listas de tarefas de implementação, derivadas das specs.

Comece por [`.rules/00-visao-geral.md`](.rules/00-visao-geral.md).

## Estrutura do site

- `index.html`, `css/`, `js/` — o hub (página inicial e assets compartilhados).
- `tools/<nome-da-ferramenta>/` — cada ferramenta, com seu próprio `index.html`.

## Rodar localmente

Site 100% estático, sem build. Basta servir a pasta raiz, por exemplo:

```
python3 -m http.server 8000
```

e acessar `http://localhost:8000/`.

## Testes

A lógica de cálculo da calculadora de precificação tem testes unitários (Node, sem dependências):

```
node --test js/pricing.test.js
```
