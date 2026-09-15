# Visão Geral do Projeto

## O que é

**eloja-tools** é um hub (central) de ferramentas web voltado para lojistas — inicialmente para um casal de amigos que está começando no ramo de vendas de produtos impressos em 3D.

A ideia é que o hub cresça ao longo do tempo: novas ferramentas serão adicionadas conforme surgirem necessidades do negócio. A primeira ferramenta a ser desenvolvida é uma **calculadora de custos e preço sugerido de venda** para produtos de impressão 3D.

## Objetivos do projeto

1. **Hub central** — uma página inicial por onde todas as ferramentas desenvolvidas podem ser acessadas. Deve ser fácil adicionar novas ferramentas no futuro sem redesenhar a navegação.
2. **Calculadora de precificação 3D** — primeira ferramenta concreta, com campos como filamento usado, valor pago pelo filamento, custos extras (energia, mão de obra, desgaste de equipamento, embalagem, etc.), e cálculo de preço sugerido de venda com margem.
3. **Aplicação estática** — sem backend/servidor próprio. Todo o processamento acontece no navegador (client-side). Hospedagem prevista: **GitHub Pages**.
4. **Visual minimalista estilo Notion** — interface limpa, tipografia simples, bastante espaço em branco, paleta neutra, poucos elementos decorativos.

## Público-alvo

Pequenos lojistas / produtores independentes, começando no negócio, sem grande familiaridade técnica. A ferramenta precisa ser simples de usar, sem jargões técnicos desnecessários.

## Fora de escopo (por enquanto)

- Autenticação de usuários
- Persistência em backend/banco de dados (uso de `localStorage` no navegador é aceitável para salvar preferências/histórico local)
- Múltiplos usuários colaborando em tempo real
- Cobrança/pagamentos

## Relacionados

Ver [[01-stack-tecnica]], [[02-design-visual]] e [[03-arquitetura-hub]] para detalhes técnicos e de produto.
