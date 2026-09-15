# Spec: Calculadora de Precificação para Impressão 3D

## Objetivo

Ferramenta que permite ao lojista calcular o custo total de produção de uma peça impressa em 3D e obter um **preço de venda sugerido**, considerando taxas de marketplace e investimento em anúncios, com base em uma margem de lucro desejada.

## Requisitos funcionais

### Entradas — Marketplace

- **RF00**: Campo de seleção do canal de venda: **Somente custo do produto** (venda direta, sem taxas), **Shopee** ou **TikTok Shop**. A tabela de taxas de cada marketplace é mantida em `js/marketplace-fees.js` (percentual + valor fixo por faixa de preço) e deve ser revisada periodicamente, pois as plataformas alteram as taxas com frequência.
- O custo total e o preço sugerido **se recalculam automaticamente** conforme o marketplace selecionado (RF00 afeta diretamente RF09 e RF11).

### Entradas — Filamento

- **RF01**: Peso de filamento usado na peça (em gramas).
- **RF02**: Valor pago pelo rolo/bobina de filamento (em R$).
- **RF03**: Peso total do rolo/bobina (em gramas) — padrão sugerido: 1000g (1kg), editável.
- A partir de RF01–RF03, calcular o **custo de filamento da peça** = `(peso usado / peso do rolo) * valor do rolo`.

### Entradas — Custos extras

- **RF04**: Tempo de impressão (em horas), usado para ratear custo de energia e desgaste.
- **RF05**: Custo de energia elétrica por hora (R$/h).
- **RF06**: Custo de desgaste/manutenção do equipamento por hora (R$/h).
- **RF07**: Custo de mão de obra — usuário escolhe entre **valor fixo (R$)** ou **horas × valor/hora**.
- **RF08**: Lista livre de custos extras nomeados pelo usuário (texto livre + valor em R$), com botão de adicionar/remover item — ex.: "Embalagem", "Gancho", "Frete de insumos", "Taxa de falha".

### Custo base da peça

- **RF09**: Custo base = custo de filamento + (tempo × energia/h) + (tempo × desgaste/h) + mão de obra + soma dos custos extras. Este valor **não** inclui taxas de marketplace nem investimento em anúncio (esses dependem do preço final, calculados junto com RF11).

### Margem, taxas de marketplace e anúncio

- **RF10**: Campo de lucro desejado, em porcentagem (%), como **markup sobre o custo base** (`lucro = custo base × margem%`) — não como fração do preço de venda. Permite qualquer valor ≥ 0, inclusive acima de 100% (ex.: 200% = vender por 3x o custo). Ver "Decisões" abaixo — esse é o segundo modelo tentado; o primeiro (margem sobre o preço de venda) foi descartado por gerar preços absurdos e por travar perto de 100%, ver histórico no fim deste documento.
- **RF11**: Campo opcional de **ROAS** (retorno sobre investimento em anúncio). Quando preenchido, o cálculo assume que uma fração do preço de venda (`1 / ROAS`) é gasta em anúncios para gerar aquela venda, e o preço sugerido sobe para compensar. Vazio/zero = venda orgânica, sem custo de anúncio.
- **RF12**: O preço de venda sugerido é resolvido por:

  ```
  preço = (custo base × (1 + margem%) + taxa fixa do marketplace) / (1 − taxa% do marketplace − 1/ROAS)
  ```

  Como as taxas de marketplace têm faixas por preço (ex.: Shopee), o sistema testa cada faixa e usa a que for consistente com o preço resultante.
- **RF13**: Se a soma de taxa% do marketplace + 1/ROAS for ≥ 100%, o cálculo é impossível — exibir mensagem de erro clara em vez de um número (ex.: negativo ou infinito). A margem/markup **não** entra nessa trava, já que agora é proporcional ao custo, não ao preço.

### Resultado

- **RF14**: Resumo visual destacado com: preço de venda sugerido, custo total, lucro em R$, margem efetiva (%), taxa de marketplace (R$, se aplicável) e investimento em anúncio (R$, se aplicável).
- **RF15**: Detalhamento (breakdown) de todos os componentes de custo, incluindo taxa de marketplace e investimento em anúncio quando aplicáveis, até chegar no preço de venda.

### Persistência (localStorage)

- **RF16**: Salvar a última configuração de custos fixos reutilizáveis entre cálculos: preço/peso do rolo, custo de energia/hora, custo de desgaste/hora, modo e valores de mão de obra, e marketplace selecionado — para que o usuário não precise redigitar a cada nova peça.
- **RF17**: (Desejável, não obrigatório no MVP) Permitir salvar cálculos como "peças" nomeadas, para consulta posterior.

## Requisitos não funcionais

- **RNF01**: Todos os cálculos ocorrem no navegador (client-side), sem envio de dados a servidor algum.
- **RNF02**: Validação de entradas: números não podem ser negativos; peso do rolo não pode ser zero (evitar divisão por zero); mensagens de erro claras (ver RF13).
- **RNF03**: Valores monetários exibidos formatados em R$ (padrão brasileiro, vírgula decimal).
- **RNF04**: Lógica de cálculo implementada como funções puras, testadas com testes unitários (`js/pricing.test.js`, `node --test`), dado o impacto direto no negócio do usuário.
- **RNF05**: As tabelas de taxa de marketplace ficam centralizadas em um único arquivo (`js/marketplace-fees.js`), com data/fonte de referência registrada em comentário, para facilitar atualização quando as plataformas mudarem as taxas.

## Decisões

1. **Modelo de margem — revisado em 2026-09-15**: markup sobre o **custo base** (`lucro = custo × margem%`). Testado inicialmente como margem sobre o preço de venda; descartado após teste real do usuário (custo R$16,90, margem 80%, Shopee) ter gerado um preço de R$714 — a combinação de 80% de margem + 20% de comissão Shopee na faixa barata somava praticamente 100% do preço, e o solver "pulava" para uma faixa de preço distante e sem sentido só para achar uma solução matematicamente viável. O modelo também travava e não deixava usar margem ≥ 100%, o que não batia com a expectativa de poder pedir, por exemplo, 200% de lucro. Com markup sobre custo, o mesmo caso gera ~R$43,01 (plausível) e a margem pode ser qualquer valor positivo.
2. **Mão de obra**: os dois modos (valor fixo OU horas × valor/hora) foram implementados, com seletor no formulário.
3. **Taxas de marketplace**: implementadas para Shopee e TikTok Shop, com tabelas por faixa de preço, pesquisadas em set/2026. **Sujeitas a mudança pelas plataformas** — revisar `js/marketplace-fees.js` periodicamente.
4. **ROAS**: interpretado como "quantos R$ de venda cada R$1 de anúncio gera" (definição padrão de mercado). Investimento em anúncio = preço de venda / ROAS.

## Fora de escopo desta spec (MVP)

- Múltiplos filamentos por peça (peças com mais de uma cor/material).
- Catálogo/histórico completo de produtos.
- Exportação de orçamento em PDF.
- Outros marketplaces além de Shopee e TikTok Shop (podem ser adicionados depois em `js/marketplace-fees.js`).
- Moeda: assumido R$ (Real brasileiro) fixo.
