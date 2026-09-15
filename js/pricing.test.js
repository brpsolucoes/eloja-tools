// Testes unitários das funções puras de cálculo (js/pricing.js).
// Rodar com: node --test js/pricing.test.js
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateFilamentCost,
  calculateTimeCost,
  calculateLaborCost,
  sumExtraCosts,
  calculateBaseCost,
  calculateSuggestedPrice,
} = require("./pricing.js");

const NO_FEE_TABLE = { tiers: [{ min: 0, max: Infinity, pct: 0, fixed: 0 }] };

test("calculateFilamentCost calcula proporcional ao peso usado", () => {
  const cost = calculateFilamentCost({ weightUsedG: 100, spoolPriceBRL: 100, spoolWeightG: 1000 });
  assert.equal(cost, 10);
});

test("calculateFilamentCost retorna 0 se peso do rolo for 0 (evita divisão por zero)", () => {
  const cost = calculateFilamentCost({ weightUsedG: 100, spoolPriceBRL: 100, spoolWeightG: 0 });
  assert.equal(cost, 0);
});

test("calculateTimeCost soma energia e desgaste multiplicados pelas horas", () => {
  const cost = calculateTimeCost({ printHours: 4, powerCostPerHour: 0.5, wearCostPerHour: 1 });
  assert.equal(cost, 6);
});

test("calculateLaborCost no modo fixo retorna o valor fixo", () => {
  const cost = calculateLaborCost({ mode: "fixed", fixedValue: 15, hours: 2, hourlyRate: 10 });
  assert.equal(cost, 15);
});

test("calculateLaborCost no modo horas multiplica horas x valor/hora", () => {
  const cost = calculateLaborCost({ mode: "hourly", fixedValue: 15, hours: 2, hourlyRate: 10 });
  assert.equal(cost, 20);
});

test("sumExtraCosts soma itens nomeados e ignora lista vazia/inválida", () => {
  assert.equal(sumExtraCosts([{ name: "Embalagem", value: 2 }, { name: "Gancho", value: 1.5 }]), 3.5);
  assert.equal(sumExtraCosts([]), 0);
  assert.equal(sumExtraCosts(undefined), 0);
});

test("calculateBaseCost soma todos os componentes", () => {
  const total = calculateBaseCost({ filamentCost: 10, timeCost: 6, laborCost: 15, extraCostsTotal: 3.5 });
  assert.equal(total, 34.5);
});

test("calculateSuggestedPrice sem taxas nem anúncio: preço = markupCost * (1 + margem) + flatCost", () => {
  const result = calculateSuggestedPrice({ markupCost: 10, flatCost: 0, feeTable: NO_FEE_TABLE, marginPercent: 30, roas: 0 });
  assert.equal(result.error, null);
  assert.ok(Math.abs(result.price - 13) < 1e-9);
  assert.ok(Math.abs(result.profit - 3) < 1e-9);
});

test("calculateSuggestedPrice com margem 0% cobre exatamente o custo", () => {
  const result = calculateSuggestedPrice({ markupCost: 50, flatCost: 0, feeTable: NO_FEE_TABLE, marginPercent: 0, roas: 0 });
  assert.ok(Math.abs(result.price - 50) < 1e-9);
  assert.ok(Math.abs(result.profit - 0) < 1e-9);
});

test("calculateSuggestedPrice permite margem acima de 100% (markup sobre markupCost, não trava)", () => {
  const result = calculateSuggestedPrice({ markupCost: 50, flatCost: 0, feeTable: NO_FEE_TABLE, marginPercent: 200, roas: 0 });
  assert.equal(result.error, null);
  assert.ok(Math.abs(result.price - 150) < 1e-9); // 50 + 200% de 50 = 150
  assert.ok(Math.abs(result.profit - 100) < 1e-9);
});

test("calculateSuggestedPrice: flatCost (mão de obra/energia/desgaste) entra no preço sem markup", () => {
  // markupCost 10 com 30% de margem => 13; flatCost 5 soma sem markup => preço 18
  const result = calculateSuggestedPrice({ markupCost: 10, flatCost: 5, feeTable: NO_FEE_TABLE, marginPercent: 30, roas: 0 });
  assert.equal(result.error, null);
  assert.ok(Math.abs(result.price - 18) < 1e-9);
  // lucro é só sobre o markupCost (10 * 30% = 3), não sobre o custo total (15)
  assert.ok(Math.abs(result.profit - 3) < 1e-9);
});

test("calculateSuggestedPrice retorna erro quando taxa de marketplace + taxa de anúncio >= 100%, independente da margem", () => {
  const feeTable = { tiers: [{ min: 0, max: Infinity, pct: 0.5, fixed: 0 }] };
  const result = calculateSuggestedPrice({ markupCost: 50, flatCost: 0, feeTable, marginPercent: 30, roas: 1.5 }); // 50% taxa + 66% anúncio
  assert.ok(result.error);
  assert.equal(result.price, 0);
});

test("calculateSuggestedPrice considera ROAS como taxa de anúncio (1/ROAS)", () => {
  const semAnuncio = calculateSuggestedPrice({ markupCost: 20, flatCost: 0, feeTable: NO_FEE_TABLE, marginPercent: 20, roas: 0 });
  const comAnuncio = calculateSuggestedPrice({ markupCost: 20, flatCost: 0, feeTable: NO_FEE_TABLE, marginPercent: 20, roas: 4 });
  // ROAS 4 => 25% do preço vai para anúncio, então o preço sugerido deve ser maior
  assert.ok(comAnuncio.price > semAnuncio.price);
  assert.ok(Math.abs(comAnuncio.adSpend - comAnuncio.price * 0.25) < 1e-9);
});

test("calculateSuggestedPrice resolve corretamente a faixa de taxa por preço (tiers)", () => {
  const feeTable = {
    tiers: [
      { min: 0, max: 80, pct: 0.2, fixed: 4 },
      { min: 80, max: Infinity, pct: 0.14, fixed: 16 },
    ],
  };
  // custo baixo -> deve cair na primeira faixa
  const barato = calculateSuggestedPrice({ markupCost: 10, flatCost: 0, feeTable, marginPercent: 10, roas: 0 });
  assert.equal(barato.feeFixed, 4);
  assert.ok(barato.price < 80);

  // custo alto -> deve cair na segunda faixa
  const caro = calculateSuggestedPrice({ markupCost: 200, flatCost: 0, feeTable, marginPercent: 10, roas: 0 });
  assert.equal(caro.feeFixed, 16);
  assert.ok(caro.price >= 80);
});

test("calculateSuggestedPrice: lucro reportado bate com preço - custo - taxa - anúncio, e com markupCost * margem", () => {
  const feeTable = { tiers: [{ min: 0, max: Infinity, pct: 0.14, fixed: 20 }] };
  const result = calculateSuggestedPrice({ markupCost: 30, flatCost: 0, feeTable, marginPercent: 25, roas: 5 });
  const expectedProfit = result.price - 30 - result.feeAmount - result.adSpend;
  assert.ok(Math.abs(result.profit - expectedProfit) < 1e-9);
  assert.ok(Math.abs(result.profit - 30 * 0.25) < 1e-6);
});

test("calculateSuggestedPrice: caso real reportado pelo usuário (Shopee, custo 16,895, margem 80%)", () => {
  const feeTable = {
    tiers: [
      { min: 0, max: 8, pct: 0.5, fixed: 0 },
      { min: 8, max: 80, pct: 0.2, fixed: 4 },
      { min: 80, max: 100, pct: 0.14, fixed: 16 },
      { min: 100, max: 200, pct: 0.14, fixed: 20 },
      { min: 200, max: Infinity, pct: 0.14, fixed: 26 },
    ],
  };
  const result = calculateSuggestedPrice({ markupCost: 16.895, flatCost: 0, feeTable, marginPercent: 80, roas: 0 });
  assert.equal(result.error, null);
  // custo*(1+80%) = 30,411; faixa 8-80 (20% + R$4 fixo): (30,411+4)/0,8 = 43,01...
  assert.ok(Math.abs(result.price - 43.01375) < 1e-2);
  assert.ok(result.price >= 8 && result.price < 80);
  assert.ok(Math.abs(result.profit - 16.895 * 0.8) < 1e-6);
});
