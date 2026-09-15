# Spec: Hub de Ferramentas

## Objetivo

Página inicial que centraliza o acesso a todas as ferramentas do eloja-tools, servindo como ponto de entrada único da aplicação.

## Requisitos funcionais

- **RF01**: A tela inicial exibe uma lista/grade de "cards", um por ferramenta disponível.
- **RF02**: Cada card exibe: ícone, nome da ferramenta e uma descrição curta (1 linha) do que ela faz.
- **RF03**: Clicar em um card navega para a rota da ferramenta correspondente.
- **RF04**: Dentro de qualquer ferramenta, existe um caminho claro de volta para o hub (ex.: link/botão no cabeçalho, ou logo clicável).
- **RF05**: Quando ainda não houver ferramentas suficientes para preencher a grade, o layout continua coerente (não deve parecer "vazio" ou quebrado com 1-2 itens).

## Requisitos não funcionais

- **RNF01**: Aplicação 100% estática, compatível com GitHub Pages (ver [[01-stack-tecnica]]).
- **RNF02**: Visual minimalista estilo Notion (ver [[02-design-visual]]).
- **RNF03**: Responsivo (desktop e mobile).
- **RNF04**: Tempo de carregamento inicial rápido — sem dependências pesadas desnecessárias.

## Conteúdo inicial do hub

Na primeira versão, o hub lista apenas uma ferramenta:

- **Calculadora de Precificação 3D** — ver [[calculadora-precificacao-3d]].

## Fora de escopo desta spec

- Busca/filtro de ferramentas (só relevante quando houver muitas ferramentas).
- Categorização de ferramentas em grupos.
- Favoritos/personalização por usuário.
