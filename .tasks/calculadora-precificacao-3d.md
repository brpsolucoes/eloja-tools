# Tasks: Calculadora de Precificação 3D

Referência: [[calculadora-precificacao-3d]] (spec)

## Antes de começar

- [x] Validar/decidir modelo de margem, modo de mão de obra e regras de taxas de marketplace + ROAS (ver "Decisões" na spec)
- [x] Pesquisar taxas atuais de Shopee e TikTok Shop (set/2026) para popular `js/marketplace-fees.js`

## Lógica de cálculo (core)

- [x] Função pura de custo de filamento
- [x] Função pura de custo por tempo (energia + desgaste)
- [x] Função pura de custo de mão de obra (fixo ou horas × valor/hora)
- [x] Função pura de soma de custos extras (lista livre)
- [x] Função pura de custo base total
- [x] Tabela + função de taxa de marketplace por faixa de preço (`js/marketplace-fees.js`)
- [x] Função pura de preço sugerido resolvendo margem + taxa de marketplace + ROAS simultaneamente
- [x] Testes unitários (`js/pricing.test.js`, 13 testes, `node --test`) cobrindo casos de borda (peso do rolo = 0, margem = 0%, margem ≥ 100%, ROAS, faixas de taxa)

## Formulário (UI)

- [x] Seção "Marketplace": seletor (Somente produto / Shopee / TikTok Shop) com nota explicativa
- [x] Seção "Filamento": peso usado, valor do rolo, peso do rolo (padrão 1000g)
- [x] Seção "Tempo e custos operacionais": tempo de impressão, energia/h, desgaste/h
- [x] Seção "Mão de obra": alternância fixo / horas × valor-hora
- [x] Seção "Custos extras": lista dinâmica de itens (nome livre + valor), adicionar/remover
- [x] Campo de margem de lucro desejada (%)
- [x] Campo opcional de ROAS
- [ ] Validação de entradas mais explícita (mensagens inline por campo — hoje `min`/`max` do HTML5 cobre o básico, mas sem feedback customizado)

## Resultado (UI)

- [x] Card de resumo destacado: preço sugerido, custo total, lucro, margem efetiva, taxa de marketplace, investimento em anúncio
- [x] Breakdown detalhado dos componentes de custo até o preço de venda
- [x] Formatação monetária em R$ (`Intl.NumberFormat`)
- [x] Mensagem de erro clara quando taxa + ROAS + margem ≥ 100%

## Persistência local

- [x] Salvar em `localStorage` os custos fixos reutilizáveis (rolo, energia/h, desgaste/h, mão de obra, marketplace)
- [x] Pré-preencher formulário com os últimos valores salvos ao abrir a ferramenta
- [ ] (Opcional/futuro) Salvar cálculos como "peças" nomeadas para consulta posterior

## Integração com o hub

- [x] Registrar a ferramenta no config central do hub (`js/tools.js`, status "disponivel")
- [x] Aplicar layout/tema compartilhado do hub (`css/main.css`)

## Finalização

- [x] Testar sintaticamente todos os arquivos JS (`node --check`) e servir localmente (`python3 -m http.server`)
- [ ] Testar fluxo completo no navegador (sessão atual não tinha ferramenta de browser disponível — pendente validação visual)
- [ ] Validar cálculo com os usuários usando um caso real de peça já vendida, incluindo checagem das taxas de marketplace atuais no Seller Center
