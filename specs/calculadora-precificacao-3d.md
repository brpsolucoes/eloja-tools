# Spec: Calculadora de Precificação para Impressão 3D

## Objetivo

Ferramenta que permite ao lojista calcular o custo total de produção de uma peça impressa em 3D e obter um **preço de venda sugerido**, com base em uma margem de lucro desejada.

## Requisitos funcionais

### Entradas — Filamento

- **RF01**: Peso de filamento usado na peça (em gramas).
- **RF02**: Valor pago pelo rolo/bobina de filamento (em R$).
- **RF03**: Peso total do rolo/bobina (em gramas) — padrão sugerido: 1000g (1kg), editável.
- A partir de RF01–RF03, calcular o **custo de filamento da peça** = `(peso usado / peso do rolo) * valor do rolo`.

### Entradas — Custos extras

- **RF04**: Tempo de impressão (em horas), usado para ratear custo de energia e desgaste.
- **RF05**: Custo de energia elétrica por hora (R$/h) — valor pode ser pré-calculado a partir do consumo da impressora (W) e tarifa da concessionária, mas o campo aceita direto R$/h para simplificar.
- **RF06**: Custo de desgaste/manutenção do equipamento por hora (R$/h) — depreciação estimada da impressora, bicos, etc.
- **RF07**: Custo de mão de obra (preparação do modelo, pós-processamento/acabamento, embalagem) — pode ser informado como valor fixo (R$) ou como horas × valor/hora, à escolha do usuário.
- **RF08**: Custos extras diversos (embalagem, etiquetas, frete de insumos, falhas de impressão/desperdício) — campo livre de valor fixo em R$, com possibilidade de adicionar múltiplos itens nomeados (ex.: "embalagem: R$ 2,00", "taxa de falha: R$ 1,50").

### Cálculo de custo total

- **RF09**: Custo total da peça = custo de filamento + (tempo de impressão × custo de energia por hora) + (tempo de impressão × custo de desgaste por hora) + mão de obra + soma dos custos extras.

### Margem e preço sugerido

- **RF10**: Campo de margem de lucro desejada, em porcentagem (%).
- **RF11**: Preço sugerido de venda = `custo total / (1 - margem / 100)` (modelo de margem sobre o preço de venda) — **decisão de negócio a confirmar com o usuário**: alternativa mais simples é markup sobre o custo (`custo total * (1 + margem / 100)`). Ver seção "Decisões em aberto".
- **RF12**: Exibir também o **lucro em R$** resultante (preço sugerido − custo total).

### Resultado

- **RF13**: Resumo visual destacado com: custo total, preço sugerido de venda, lucro em R$ e margem aplicada.
- **RF14**: Detalhamento (breakdown) de todos os componentes de custo, para transparência (quanto foi filamento, quanto foi energia, quanto foi mão de obra, etc.) — pode ser em formato de lista ou mini-gráfico simples.

### Persistência (opcional / desejável)

- **RF15**: Salvar a última configuração de custos fixos (preço do rolo, custo de energia/hora, custo de desgaste/hora) em `localStorage`, para que o usuário não precise redigitar a cada novo cálculo — apenas peso de filamento e tempo de impressão mudam entre peças, tipicamente.
- **RF16**: (Desejável, não obrigatório no MVP) Permitir salvar cálculos como "peças" nomeadas, para consulta posterior.

## Requisitos não funcionais

- **RNF01**: Todos os cálculos ocorrem no navegador (client-side), sem envio de dados a servidor algum.
- **RNF02**: Validação de entradas: números não podem ser negativos; peso do rolo não pode ser zero (evitar divisão por zero); mensagens de erro claras.
- **RNF03**: Valores monetários exibidos formatados em R$ (padrão brasileiro, vírgula decimal).
- **RNF04**: Cálculo deve ter cobertura de testes unitários simples (ver [[01-stack-tecnica]]), dado o impacto direto no negócio do usuário.

## Decisões em aberto (a validar com os usuários/donos do produto)

1. **Modelo de margem**: margem sobre o preço de venda (`custo / (1 - m)`) vs. markup sobre o custo (`custo * (1 + m)`). Precisa de confirmação — impacta diretamente o valor final sugerido.
2. **Mão de obra**: valor fixo simples vs. horas × valor/hora — talvez oferecer ambos os modos.
3. **Múltiplos filamentos por peça** (peças com mais de uma cor/material): fora do MVP, mas pode ser um requisito futuro a considerar na modelagem dos dados desde já.
4. **Moeda**: assumido R$ (Real brasileiro) fixo no MVP; internacionalização fora de escopo por ora.

## Fora de escopo desta spec (MVP)

- Multi-filamento por peça.
- Catálogo/histórico completo de produtos.
- Exportação de orçamento em PDF.
- Integração com marketplaces (cálculo de taxas de plataforma como Shopee/Mercado Livre) — pode virar uma ferramenta separada no hub no futuro.
