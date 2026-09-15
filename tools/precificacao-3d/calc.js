// Wiring da UI da calculadora de precificação 3D.
// Depende de window.ELOJA_MARKETPLACE_FEES (js/marketplace-fees.js) e
// window.ElojaPricing (js/pricing.js), carregados antes deste arquivo.
(function () {
  "use strict";

  const STORAGE_KEY = "eloja-tools:precificacao-3d:custos-fixos";

  const form = document.getElementById("calc-form");
  const marketplaceSelect = document.getElementById("marketplace");
  const marketplaceNote = document.getElementById("marketplace-note");
  const extraItemsContainer = document.getElementById("extra-items");
  const addExtraItemButton = document.getElementById("add-extra-item");
  const resultContainer = document.getElementById("result");

  const laborFixedField = document.getElementById("labor-fixed-field");
  const laborHoursField = document.getElementById("labor-hours-field");
  const laborRateField = document.getElementById("labor-rate-field");

  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const percentFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

  function formatCurrency(value) {
    return currencyFormatter.format(Number.isFinite(value) ? value : 0);
  }

  // --- Marketplace select -------------------------------------------------

  function populateMarketplaceSelect() {
    const fees = window.ELOJA_MARKETPLACE_FEES || {};
    Object.keys(fees).forEach(function (key) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = fees[key].label;
      marketplaceSelect.appendChild(option);
    });
  }

  function updateMarketplaceNote() {
    const fees = window.ELOJA_MARKETPLACE_FEES || {};
    const selected = fees[marketplaceSelect.value];
    if (!selected) {
      marketplaceNote.textContent = "";
      return;
    }
    const parts = [selected.description];
    if (selected.referencia) parts.push(selected.referencia + ".");
    marketplaceNote.textContent = parts.join(" ");
  }

  // --- Mão de obra: alterna campos conforme o modo ------------------------

  function updateLaborFieldsVisibility() {
    const mode = form.laborMode.value;
    laborFixedField.hidden = mode !== "fixed";
    laborHoursField.hidden = mode !== "hourly";
    laborRateField.hidden = mode !== "hourly";
  }

  // --- Custos extras: lista dinâmica --------------------------------------

  function addExtraItemRow(name, value) {
    const row = document.createElement("div");
    row.className = "extra-item";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Ex.: Embalagem";
    nameInput.className = "extra-item__name";
    nameInput.value = name || "";

    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.min = "0";
    valueInput.step = "0.01";
    valueInput.placeholder = "R$ 0,00";
    valueInput.className = "extra-item__value";
    valueInput.value = value != null ? value : "";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "extra-item__remove";
    removeButton.setAttribute("aria-label", "Remover custo extra");
    removeButton.textContent = "×";
    removeButton.addEventListener("click", function () {
      row.remove();
      recalculate();
    });

    row.appendChild(nameInput);
    row.appendChild(valueInput);
    row.appendChild(removeButton);
    extraItemsContainer.appendChild(row);
  }

  function getExtraItems() {
    return Array.from(extraItemsContainer.querySelectorAll(".extra-item")).map(function (row) {
      return {
        name: row.querySelector(".extra-item__name").value,
        value: Number(row.querySelector(".extra-item__value").value) || 0,
      };
    });
  }

  // --- Persistência local dos custos fixos --------------------------------

  function saveFixedCosts() {
    const data = {
      spoolPriceBRL: form.spoolPriceBRL.value,
      spoolWeightKg: form.spoolWeightKg.value,
      powerCostPerHour: form.powerCostPerHour.value,
      wearCostPerHour: form.wearCostPerHour.value,
      laborMode: form.laborMode.value,
      laborFixedValue: form.laborFixedValue.value,
      laborHourlyRate: form.laborHourlyRate.value,
      marketplace: marketplaceSelect.value,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage indisponível (modo privado, etc.) — segue sem persistir.
    }
  }

  function loadFixedCosts() {
    let data = null;
    try {
      data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      data = null;
    }
    if (!data) return;

    if (data.spoolPriceBRL != null) form.spoolPriceBRL.value = data.spoolPriceBRL;
    if (data.spoolWeightKg != null) form.spoolWeightKg.value = data.spoolWeightKg;
    if (data.powerCostPerHour != null) form.powerCostPerHour.value = data.powerCostPerHour;
    if (data.wearCostPerHour != null) form.wearCostPerHour.value = data.wearCostPerHour;
    if (data.laborFixedValue != null) form.laborFixedValue.value = data.laborFixedValue;
    if (data.laborHourlyRate != null) form.laborHourlyRate.value = data.laborHourlyRate;
    if (data.laborMode) {
      const radio = form.querySelector('input[name="laborMode"][value="' + data.laborMode + '"]');
      if (radio) radio.checked = true;
    }
    if (data.marketplace && window.ELOJA_MARKETPLACE_FEES && window.ELOJA_MARKETPLACE_FEES[data.marketplace]) {
      marketplaceSelect.value = data.marketplace;
    }
  }

  // --- Cálculo e renderização do resultado --------------------------------

  function recalculate() {
    const pricing = window.ElojaPricing;
    const fees = window.ELOJA_MARKETPLACE_FEES || {};
    const feeTable = fees[marketplaceSelect.value];

    const filamentCost = pricing.calculateFilamentCost({
      weightUsedG: form.weightUsedG.value,
      spoolPriceBRL: form.spoolPriceBRL.value,
      spoolWeightG: Number(form.spoolWeightKg.value) * 1000,
    });

    const timeCost = pricing.calculateTimeCost({
      printHours: form.printHours.value,
      powerCostPerHour: form.powerCostPerHour.value,
      wearCostPerHour: form.wearCostPerHour.value,
    });

    const laborCost = pricing.calculateLaborCost({
      mode: form.laborMode.value,
      fixedValue: form.laborFixedValue.value,
      hours: form.laborHours.value,
      hourlyRate: form.laborHourlyRate.value,
    });

    const extraItems = getExtraItems();
    const extraCostsTotal = pricing.sumExtraCosts(extraItems);

    const baseCost = pricing.calculateBaseCost({ filamentCost, timeCost, laborCost, extraCostsTotal });

    // Filamento e extras (insumos reais) recebem a margem de lucro; mão de obra,
    // energia e desgaste já são o valor final que se quer cobrar, sem markup.
    const markupCost = filamentCost + extraCostsTotal;
    const flatCost = timeCost + laborCost;

    const result = pricing.calculateSuggestedPrice({
      markupCost,
      flatCost,
      feeTable,
      marginPercent: form.marginPercent.value,
      roas: form.roas.value,
    });

    renderResult({ baseCost, filamentCost, timeCost, laborCost, extraCostsTotal, extraItems, result, feeTable });
  }

  function renderResult(data) {
    resultContainer.innerHTML = "";
    const { result } = data;

    if (result.error) {
      const banner = document.createElement("div");
      banner.className = "error-banner";
      banner.textContent = result.error;
      resultContainer.appendChild(banner);
      return;
    }

    const card = document.createElement("div");
    card.className = "result-card";

    const priceLabel = document.createElement("div");
    priceLabel.className = "result-card__price-label";
    priceLabel.textContent = "Preço de venda sugerido";
    card.appendChild(priceLabel);

    const price = document.createElement("div");
    price.className = "result-card__price";
    price.textContent = formatCurrency(result.price);
    card.appendChild(price);

    const stats = document.createElement("div");
    stats.className = "result-card__stats";
    stats.appendChild(makeStat("Custo total", formatCurrency(data.baseCost)));
    stats.appendChild(makeStat("Lucro", formatCurrency(result.profit)));
    stats.appendChild(
      makeStat(
        "Lucro sobre o custo",
        percentFormatter.format(data.baseCost > 0 ? (result.profit / data.baseCost) * 100 : 0) + "%"
      )
    );
    stats.appendChild(
      makeStat(
        "Margem sobre o preço",
        percentFormatter.format(result.price > 0 ? (result.profit / result.price) * 100 : 0) + "%"
      )
    );
    if (result.feeAmount > 0) {
      stats.appendChild(makeStat("Taxa de marketplace", formatCurrency(result.feeAmount)));
    }
    if (result.adSpend > 0) {
      stats.appendChild(makeStat("Investimento em anúncio", formatCurrency(result.adSpend)));
    }
    card.appendChild(stats);

    const breakdown = document.createElement("div");
    breakdown.className = "breakdown";
    breakdown.appendChild(breakdownRow("Filamento", formatCurrency(data.filamentCost)));
    breakdown.appendChild(breakdownRow("Energia + desgaste", formatCurrency(data.timeCost)));
    breakdown.appendChild(breakdownRow("Mão de obra", formatCurrency(data.laborCost)));
    data.extraItems
      .filter(function (item) {
        return item.value > 0;
      })
      .forEach(function (item) {
        breakdown.appendChild(breakdownRow(item.name || "Custo extra", formatCurrency(item.value)));
      });
    if (result.feeAmount > 0) {
      breakdown.appendChild(breakdownRow("Taxa de marketplace", formatCurrency(result.feeAmount)));
    }
    if (result.adSpend > 0) {
      breakdown.appendChild(breakdownRow("Investimento em anúncio", formatCurrency(result.adSpend)));
    }
    breakdown.appendChild(breakdownRow("Preço de venda", formatCurrency(result.price)));
    card.appendChild(breakdown);

    resultContainer.appendChild(card);
  }

  function makeStat(label, value) {
    const stat = document.createElement("div");
    stat.className = "result-stat";
    const l = document.createElement("div");
    l.className = "result-stat__label";
    l.textContent = label;
    const v = document.createElement("div");
    v.className = "result-stat__value";
    v.textContent = value;
    stat.appendChild(l);
    stat.appendChild(v);
    return stat;
  }

  function breakdownRow(label, value) {
    const row = document.createElement("div");
    row.className = "breakdown__row";
    const l = document.createElement("span");
    l.textContent = label;
    const v = document.createElement("span");
    v.textContent = value;
    row.appendChild(l);
    row.appendChild(v);
    return row;
  }

  function onAnyChange() {
    saveFixedCosts();
    recalculate();
  }

  // --- Inicialização -------------------------------------------------------

  populateMarketplaceSelect();
  loadFixedCosts();
  updateMarketplaceNote();
  updateLaborFieldsVisibility();

  if (extraItemsContainer.children.length === 0) {
    addExtraItemRow("Embalagem", "");
  }

  addExtraItemButton.addEventListener("click", function () {
    addExtraItemRow("", "");
  });

  marketplaceSelect.addEventListener("change", function () {
    updateMarketplaceNote();
    onAnyChange();
  });

  Array.from(form.querySelectorAll('input[name="laborMode"]')).forEach(function (radio) {
    radio.addEventListener("change", function () {
      updateLaborFieldsVisibility();
      onAnyChange();
    });
  });

  form.addEventListener("input", onAnyChange);
  extraItemsContainer.addEventListener("input", onAnyChange);

  recalculate();
})();
