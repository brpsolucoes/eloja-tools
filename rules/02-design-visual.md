# Regras de Design Visual

## Referência de estilo: Notion

O visual do hub e de todas as ferramentas deve seguir uma linguagem minimalista inspirada no Notion:

- **Tipografia**: fonte sans-serif limpa (ex.: system-ui, Inter), hierarquia clara por peso e tamanho, sem excesso de estilos.
- **Paleta**: neutra (branco/cinza-claro no fundo, texto quase-preto), com uma única cor de destaque (accent) usada com moderação para ações primárias e estados ativos.
- **Espaçamento**: bastante espaço em branco, layout em coluna central com largura máxima confortável de leitura (não usar a tela inteira em telas grandes).
- **Componentes**: bordas finas e sutis, cantos levemente arredondados, sombras discretas (ou nenhuma), sem gradientes ou elementos decorativos pesados.
- **Ícones**: simples, monocromáticos, estilo outline (ex.: Lucide, que é o conjunto usado pelo próprio Notion).
- **Modo escuro**: desejável, mas não obrigatório no MVP — se implementado, seguir a mesma filosofia minimalista (fundo escuro neutro, não preto puro).

## Diretrizes de UX

- Cada ferramenta do hub deve ser acessível a partir de uma tela inicial em formato de "grade de cards" ou "lista", cada item com nome curto, ícone e descrição de uma linha.
- Formulários (como o da calculadora) devem ser organizados em seções curtas e claras, com rótulos explícitos e valores padrão sensatos quando possível.
- Resultados de cálculos devem ser destacados visualmente (ex.: card com o preço sugerido em destaque), separados dos campos de entrada.
- Responsivo: deve funcionar bem tanto em desktop quanto em celular, já que lojistas costumam usar o celular no dia a dia.

## Fora de escopo de design

- Identidade visual/marca definitiva (logo, nome oficial do hub) — pode ser tratado depois, com placeholder simples por enquanto.
