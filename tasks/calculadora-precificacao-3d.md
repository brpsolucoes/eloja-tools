# Tasks: Calculadora de Precificação 3D

Referência: [[calculadora-precificacao-3d]] (spec)

## Antes de começar

- [ ] Validar com os usuários (donos do produto) as "Decisões em aberto" da spec: modelo de margem (markup vs. margem sobre venda) e modo de mão de obra (fixo vs. horas)

## Lógica de cálculo (core)

- [ ] Implementar função pura de cálculo de custo de filamento (peso usado / peso do rolo * valor do rolo)
- [ ] Implementar função pura de cálculo de custos por tempo (energia/hora e desgaste/hora × tempo de impressão)
- [ ] Implementar função pura de soma de custos extras (lista de itens nomeados)
- [ ] Implementar função pura de cálculo de custo total (soma de todos os componentes)
- [ ] Implementar função pura de cálculo de preço sugerido a partir da margem (conforme modelo decidido)
- [ ] Escrever testes unitários para as funções de cálculo, incluindo casos de borda (peso do rolo = 0, margem = 0%, margem = 100%, valores negativos)

## Formulário (UI)

- [ ] Seção "Filamento": peso usado, valor do rolo, peso do rolo (com valor padrão 1000g)
- [ ] Seção "Tempo e custos operacionais": tempo de impressão, custo de energia/hora, custo de desgaste/hora
- [ ] Seção "Mão de obra": conforme modo decidido (fixo ou horas × valor/hora)
- [ ] Seção "Custos extras": lista dinâmica de itens (nome + valor), com botão de adicionar/remover item
- [ ] Campo de margem de lucro desejada (%)
- [ ] Validação de entradas (não negativos, peso do rolo > 0) com mensagens de erro claras

## Resultado (UI)

- [ ] Card de resumo destacado: custo total, preço sugerido, lucro em R$, margem aplicada
- [ ] Breakdown detalhado dos componentes de custo (lista ou mini visualização)
- [ ] Formatação monetária em R$ (padrão brasileiro)

## Persistência local

- [ ] Salvar em `localStorage` os custos fixos reutilizáveis (valor/peso do rolo, custo de energia/hora, custo de desgaste/hora)
- [ ] Pré-preencher formulário com os últimos valores salvos ao abrir a ferramenta
- [ ] (Opcional/futuro) Salvar cálculos como "peças" nomeadas para consulta posterior

## Integração com o hub

- [ ] Registrar a ferramenta no config central do hub (nome, ícone, descrição, rota) — ver `tasks/hub-ferramentas.md`
- [ ] Aplicar layout/tema compartilhado do hub

## Finalização

- [ ] Testar fluxo completo ponta a ponta manualmente com valores reais de exemplo
- [ ] Validar cálculo com os usuários usando um caso real de peça já vendida
