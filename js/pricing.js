// Funções puras de cálculo da calculadora de precificação 3D.
// Sem dependências externas — funciona tanto no navegador (window.ElojaPricing)
// quanto no Node (via module.exports), para permitir testes com `node`.

(function (root) {
  "use strict";

  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  /** Custo de filamento da peça, a partir do peso usado e do preço/peso do rolo. */
  function calculateFilamentCost({ weightUsedG, spoolPriceBRL, spoolWeightG }) {
    const weight = toNumber(weightUsedG);
    const spoolPrice = toNumber(spoolPriceBRL);
    const spoolWeight = toNumber(spoolWeightG);
    if (spoolWeight <= 0) return 0;
    return (weight / spoolWeight) * spoolPrice;
  }

  /** Custo de energia + desgaste, proporcional ao tempo de impressão. */
  function calculateTimeCost({ printHours, powerCostPerHour, wearCostPerHour }) {
    const hours = toNumber(printHours);
    const power = toNumber(powerCostPerHour);
    const wear = toNumber(wearCostPerHour);
    return hours * (power + wear);
  }

  /** Custo de mão de obra: valor fixo OU horas x valor/hora, conforme `mode`. */
  function calculateLaborCost({ mode, fixedValue, hours, hourlyRate }) {
    if (mode === "hourly") {
      return toNumber(hours) * toNumber(hourlyRate);
    }
    return toNumber(fixedValue);
  }

  /** Soma uma lista livre de custos extras [{ name, value }, ...]. */
  function sumExtraCosts(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + toNumber(item && item.value), 0);
  }

  /** Custo base da peça (sem taxas de marketplace nem investimento em anúncio). */
  function calculateBaseCost({ filamentCost, timeCost, laborCost, extraCostsTotal }) {
    return toNumber(filamentCost) + toNumber(timeCost) + toNumber(laborCost) + toNumber(extraCostsTotal);
  }

  /**
   * Retorna { pct, fixed } da faixa de taxa aplicável a um preço, dentro de uma
   * tabela de marketplace (ver js/marketplace-fees.js).
   */
  function getFeeTierForPrice(feeTable, price) {
    const tiers = (feeTable && feeTable.tiers) || [{ min: 0, max: Infinity, pct: 0, fixed: 0 }];
    const p = toNumber(price);
    for (const tier of tiers) {
      if (p >= tier.min && p < tier.max) return tier;
    }
    return tiers[tiers.length - 1];
  }

  /**
   * Calcula o preço de venda sugerido resolvendo:
   *   preço = (custoComMarkup * (1 + margem) + custoFixo) + taxaFixa + (taxaPct + taxaAnuncio) * preço
   *
   * A margem é um MARKUP aplicado só sobre `markupCost` (lucro = markupCost *
   * margem%) — não sobre o custo total nem sobre o preço de venda. `flatCost`
   * (mão de obra, energia, desgaste) já é o valor final que se quer cobrar por
   * ele, então entra no preço sem markup em cima. Por isso a margem pode ser
   * qualquer valor positivo, inclusive acima de 100% ("quero vender markupCost
   * por 3x" = margem 200%). Só a soma de taxa de marketplace + taxa de anúncio
   * precisa ficar abaixo de 100%, já que essas duas são as únicas fatias
   * proporcionais ao preço final.
   *
   * taxaAnuncio = 1 / ROAS (fração do preço de venda gasta em anúncios para
   * gerar aquela venda). Se ROAS não for informado (<= 0), assume-se venda
   * orgânica (taxaAnuncio = 0).
   *
   * A tabela de marketplace pode ter faixas por preço (ex.: Shopee), então o
   * preço é resolvido por tentativa em cada faixa até encontrar uma cujo
   * resultado realmente caia dentro do próprio intervalo.
   *
   * Retorna { price, feePct, feeFixed, feeAmount, adSpend, profit, error }.
   * `error` vem preenchido (e os demais campos como 0) quando taxa de
   * marketplace + taxa de anúncio somam 100% ou mais do preço, o que tornaria
   * o cálculo impossível (divisão por zero ou negativa) independente da margem.
   */
  function calculateSuggestedPrice({ markupCost, flatCost, feeTable, marginPercent, roas }) {
    const markupBase = toNumber(markupCost);
    const flat = toNumber(flatCost);
    const cost = markupBase + flat;
    const margin = Math.max(0, toNumber(marginPercent) / 100);
    const roasValue = toNumber(roas);
    const adRate = roasValue > 0 ? 1 / roasValue : 0;
    const costWithMarkup = markupBase * (1 + margin) + flat;

    const tiers = (feeTable && feeTable.tiers) || [{ min: 0, max: Infinity, pct: 0, fixed: 0 }];

    let solution = null;

    for (const tier of tiers) {
      const denominator = 1 - tier.pct - adRate;
      if (denominator <= 0) continue;

      const candidatePrice = (costWithMarkup + tier.fixed) / denominator;
      if (candidatePrice >= tier.min && candidatePrice < tier.max) {
        solution = { price: candidatePrice, feePct: tier.pct, feeFixed: tier.fixed };
        break;
      }
    }

    // Nenhuma faixa produziu um resultado consistente com seu próprio intervalo
    // (ou todas as faixas geram denominador inválido) — usa a última faixa como
    // aproximação, ou reporta erro se nem essa for viável.
    if (!solution) {
      const lastTier = tiers[tiers.length - 1];
      const denominator = 1 - lastTier.pct - adRate;
      if (denominator <= 0) {
        return {
          price: 0,
          feePct: lastTier.pct,
          feeFixed: lastTier.fixed,
          feeAmount: 0,
          adSpend: 0,
          profit: 0,
          error:
            "A soma da taxa de marketplace com a taxa de anúncio (1/ROAS) é maior ou igual a 100% do preço. Reduza o investimento em anúncio (ROAS maior) ou revise o marketplace escolhido.",
        };
      }
      solution = { price: (costWithMarkup + lastTier.fixed) / denominator, feePct: lastTier.pct, feeFixed: lastTier.fixed };
    }

    const feeAmount = solution.price * solution.feePct + solution.feeFixed;
    const adSpend = solution.price * adRate;
    const profit = solution.price - cost - feeAmount - adSpend;

    return {
      price: solution.price,
      feePct: solution.feePct,
      feeFixed: solution.feeFixed,
      feeAmount,
      adSpend,
      profit,
      error: null,
    };
  }

  const ElojaPricing = {
    calculateFilamentCost,
    calculateTimeCost,
    calculateLaborCost,
    sumExtraCosts,
    calculateBaseCost,
    getFeeTierForPrice,
    calculateSuggestedPrice,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = ElojaPricing;
  } else {
    root.ElojaPricing = ElojaPricing;
  }
})(typeof window !== "undefined" ? window : globalThis);
