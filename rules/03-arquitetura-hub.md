# Regras de Arquitetura do Hub

## Conceito

O hub é a "casa" de todas as ferramentas. Ele deve:

1. Ter uma tela inicial (`/`) listando todas as ferramentas disponíveis.
2. Cada ferramenta vive em sua própria rota (ex.: `/precificacao-3d`).
3. Compartilhar layout, tema e componentes de UI entre as ferramentas (cabeçalho, navegação de volta ao hub, estilo visual consistente descrito em [[02-design-visual]]).

## Registro de ferramentas

Novas ferramentas devem ser fáceis de adicionar: idealmente, um único ponto de registro (ex.: um array/config de "ferramentas disponíveis" com nome, ícone, descrição e rota) que alimenta tanto a tela inicial quanto a navegação.

## Convenção para novas ferramentas

Ao adicionar uma nova ferramenta ao hub, ela deve:

- Ter sua própria spec em `specs/` descrevendo o que faz e suas regras de negócio.
- Ter suas tasks de implementação em `tasks/`.
- Seguir as regras técnicas ([[01-stack-tecnica]]) e visuais ([[02-design-visual]]) já estabelecidas.
- Ser adicionada ao registro central de ferramentas do hub.

## Estado atual

- [x] Hub definido conceitualmente (este documento)
- [x] Implementação do hub — `index.html`, `css/main.css`, `js/tools.js`, `js/hub.js` (ver `tasks/hub-ferramentas.md`)
- [ ] Publicação no GitHub Pages
- [ ] Primeira ferramenta: calculadora de precificação 3D (ver `specs/calculadora-precificacao-3d.md`)
