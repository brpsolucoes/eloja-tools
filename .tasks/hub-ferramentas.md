# Tasks: Hub de Ferramentas

Referência: [[hub-ferramentas]] (spec)

## Setup do projeto

- [x] Definir e configurar a stack técnica (HTML/CSS/JS puro, sem build, ver [[01-stack-tecnica]])
- [ ] Configurar deploy automático para GitHub Pages (GitHub Actions ou publicação direta da branch)
- [ ] Confirmar funcionamento em `usuario.github.io/eloja-tools` (paths relativos já usados no código)

## Layout base

- [x] Criar layout compartilhado (cabeçalho com logo/nome do hub)
- [x] Aplicar tema visual minimalista estilo Notion (ver [[02-design-visual]]): tipografia, paleta, espaçamentos — `css/main.css`
- [x] Garantir responsividade (grade fluida com `auto-fill`/`minmax`)

## Tela inicial (hub)

- [x] Criar componente de "card de ferramenta" (ícone + nome + descrição curta) — `js/hub.js`
- [x] Criar config/registro central de ferramentas disponíveis — `js/tools.js`
- [x] Renderizar grade/lista de cards a partir do registro
- [x] Ligar navegação: clique no card → rota da ferramenta (card fica desabilitado com badge "Em construção" enquanto a ferramenta não existe)

## Roteamento

- [x] Roteamento resolvido via estrutura de pastas (multi-page, sem router JS) — decisão em [[01-stack-tecnica]]
- [x] Rota reservada para a primeira ferramenta (`tools/precificacao-3d/`, a criar)

## Finalização

- [x] Testar localmente (servidor estático simples)
- [ ] Publicar primeira versão no GitHub Pages
- [ ] Validar em desktop e mobile (dispositivo real)
