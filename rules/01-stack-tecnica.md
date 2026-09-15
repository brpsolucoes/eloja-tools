# Regras Técnicas

## Restrição fundamental: aplicação estática

O projeto **deve** poder ser publicado no **GitHub Pages**, ou seja:

- Sem servidor/backend próprio (sem API própria, sem banco de dados server-side).
- Todo o build deve resultar em arquivos estáticos (`HTML`/`CSS`/`JS`) servíveis a partir de uma pasta (`dist/`, `build/` ou `docs/`, conforme o gerador escolhido).
- Se algum dado precisar ser salvo entre sessões, usar armazenamento local do navegador (`localStorage`/`IndexedDB`), nunca um backend.
- Rotas devem funcionar em um ambiente de hospedagem estática (atenção ao `base path` do GitHub Pages ao usar roteamento client-side).

## Stack (decidido)

**HTML puro + CSS e JS separados, sem framework, sem build step, sem dependências externas.** Decisão tomada em 2026-09-15 pelo usuário, priorizando "zero complexidade".

- Sem bundlers, sem transpiladores, sem npm/node como requisito para rodar — os arquivos podem ser abertos/servidos diretamente.
- Navegação entre páginas via links `<a href>` normais (multi-page site), não SPA com router client-side — mais simples e 100% compatível com GitHub Pages sem configuração de rewrites.
- CSS em arquivo(s) `.css` separados, JS em arquivo(s) `.js` separados — nada de inline `<style>`/`<script>` grandes.
- Deploy: GitHub Pages servindo direto da branch (ex.: `main` / pasta raiz ou `/docs`), sem passo de build no CI. Se necessário, um GitHub Actions simples só para publicar (sem compilar nada).

## Estrutura de pastas (proposta)

Cada ferramenta vive em sua própria pasta com seu próprio `index.html`, para manter URLs limpas (`/precificacao-3d/`) e o roteamento resolvido pela própria estrutura de arquivos — sem necessidade de router JS. Layout, tema (CSS) e componentes de navegação (JS) compartilhados ficam em pastas comuns na raiz (`/css`, `/js`). Detalhes em [[03-arquitetura-hub]].

## Qualidade

- Sem necessidade de testes automatizados extensivos no início (projeto pequeno, dois usuários). Priorizar simplicidade e velocidade de entrega.
- Cálculos numéricos (a calculadora de precificação) devem ter ao menos testes unitários simples, pois erros de cálculo afetam diretamente o negócio do usuário.
