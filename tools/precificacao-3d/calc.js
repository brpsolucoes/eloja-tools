// Wiring da UI da calculadora de precificação 3D.
// Depende de window.ELOJA_MARKETPLACE_FEES (js/marketplace-fees.js) e
// window.ElojaPricing (js/pricing.js), carregados antes deste arquivo.
(function () {
  "use strict";

  const STORAGE_KEY = "eloja-tools:precificacao-3d:custos-fixos";
  const PRESETS_KEY = "eloja-tools:precificacao-3d:presets";

  const form = document.getElementById("calc-form");
  const marketplaceSelect = document.getElementById("marketplace");
  const marketplaceNote = document.getElementById("marketplace-note");
  const extraItemsContainer = document.getElementById("extra-items");
  const addExtraItemButton = document.getElementById("add-extra-item");
  const resultContainer = document.getElementById("result");

  const laborFixedField = document.getElementById("labor-fixed-field");
  const laborHoursField = document.getElementById("labor-hours-field");
  const laborRateField = document.getElementById("labor-rate-field");

  const weightDirectField = document.getElementById("weight-direct-field");
  const weightBeforeField = document.getElementById("weight-before-field");
  const weightAfterField = document.getElementById("weight-after-field");
  const weightDiffNote = document.getElementById("weight-diff-note");

  const presetSelect = document.getElementById("preset-select");
  const presetNameInput = document.getElementById("preset-name");
  const presetSaveButton = document.getElementById("preset-save");
  const presetDeleteButton = document.getElementById("preset-delete");
  const presetNote = document.getElementById("preset-note");

  const mobilePriceBar = document.getElementById("mobile-price-bar");
  const mobilePriceValue = document.getElementById("mobile-price-value");

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

  // --- Peso do filamento: direto ou por diferença de peso do carretel -----

  function getWeightMode() {
    const checked = form.querySelector('input[name="weightMode"]:checked');
    return checked ? checked.value : "direct";
  }

  function updateWeightFieldsVisibility() {
    const mode = getWeightMode();
    weightDirectField.hidden = mode !== "direct";
    weightBeforeField.hidden = mode !== "diff";
    weightAfterField.hidden = mode !== "diff";
    weightDiffNote.hidden = mode !== "diff";
  }

  function getWeightUsedG() {
    if (getWeightMode() === "diff") {
      const before = Number(form.weightBeforeG.value) || 0;
      const after = Number(form.weightAfterG.value) || 0;
      return Math.max(0, before - after);
    }
    return Number(form.weightUsedG.value) || 0;
  }

  function updateWeightDiffNote() {
    if (getWeightMode() !== "diff") return;
    const weight = getWeightUsedG();
    weightDiffNote.hidden = false;
    weightDiffNote.textContent = "Peso usado na peça: " + weight.toFixed(1) + " g";
  }

  // --- Tempo de impressão: horas + minutos ---------------------------------

  function getPrintHours() {
    const hoursPart = Number(form.printHoursPart.value) || 0;
    const minutesPart = Number(form.printMinutesPart.value) || 0;
    return hoursPart + minutesPart / 60;
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

  function setExtraItems(items) {
    extraItemsContainer.innerHTML = "";
    if (Array.isArray(items) && items.length > 0) {
      items.forEach(function (item) {
        addExtraItemRow(item.name, item.value);
      });
    } else {
      addExtraItemRow("Embalagem", "");
    }
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

  // --- Modelos salvos (presets) --------------------------------------------

  function loadPresets() {
    try {
      const data = JSON.parse(localStorage.getItem(PRESETS_KEY));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function savePresets(presets) {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch (e) {
      // localStorage indisponível — segue sem persistir.
    }
  }

  function snapshotFormData() {
    return {
      marketplace: marketplaceSelect.value,
      weightMode: getWeightMode(),
      weightUsedG: form.weightUsedG.value,
      weightBeforeG: form.weightBeforeG.value,
      weightAfterG: form.weightAfterG.value,
      spoolPriceBRL: form.spoolPriceBRL.value,
      spoolWeightKg: form.spoolWeightKg.value,
      printHoursPart: form.printHoursPart.value,
      printMinutesPart: form.printMinutesPart.value,
      powerCostPerHour: form.powerCostPerHour.value,
      wearCostPerHour: form.wearCostPerHour.value,
      laborMode: form.laborMode.value,
      laborFixedValue: form.laborFixedValue.value,
      laborHours: form.laborHours.value,
      laborHourlyRate: form.laborHourlyRate.value,
      marginPercent: form.marginPercent.value,
      roas: form.roas.value,
      extraItems: getExtraItems(),
    };
  }

  function applyFormData(data) {
    if (!data) return;
    if (data.marketplace && window.ELOJA_MARKETPLACE_FEES && window.ELOJA_MARKETPLACE_FEES[data.marketplace]) {
      marketplaceSelect.value = data.marketplace;
    }
    if (data.weightMode) {
      const radio = form.querySelector('input[name="weightMode"][value="' + data.weightMode + '"]');
      if (radio) radio.checked = true;
    }
    if (data.weightUsedG != null) form.weightUsedG.value = data.weightUsedG;
    if (data.weightBeforeG != null) form.weightBeforeG.value = data.weightBeforeG;
    if (data.weightAfterG != null) form.weightAfterG.value = data.weightAfterG;
    if (data.spoolPriceBRL != null) form.spoolPriceBRL.value = data.spoolPriceBRL;
    if (data.spoolWeightKg != null) form.spoolWeightKg.value = data.spoolWeightKg;
    if (data.printHoursPart != null) form.printHoursPart.value = data.printHoursPart;
    if (data.printMinutesPart != null) form.printMinutesPart.value = data.printMinutesPart;
    if (data.powerCostPerHour != null) form.powerCostPerHour.value = data.powerCostPerHour;
    if (data.wearCostPerHour != null) form.wearCostPerHour.value = data.wearCostPerHour;
    if (data.laborMode) {
      const radio = form.querySelector('input[name="laborMode"][value="' + data.laborMode + '"]');
      if (radio) radio.checked = true;
    }
    if (data.laborFixedValue != null) form.laborFixedValue.value = data.laborFixedValue;
    if (data.laborHours != null) form.laborHours.value = data.laborHours;
    if (data.laborHourlyRate != null) form.laborHourlyRate.value = data.laborHourlyRate;
    if (data.marginPercent != null) form.marginPercent.value = data.marginPercent;
    if (data.roas != null) form.roas.value = data.roas;
    setExtraItems(data.extraItems);

    updateMarketplaceNote();
    updateLaborFieldsVisibility();
    updateWeightFieldsVisibility();
  }

  function populatePresetSelect(selectedId) {
    const presets = loadPresets();
    presetSelect.innerHTML = "";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "— Nenhum modelo carregado —";
    presetSelect.appendChild(emptyOption);
    presets.forEach(function (preset) {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.name;
      presetSelect.appendChild(option);
    });
    presetSelect.value = selectedId || "";
    presetDeleteButton.hidden = !presetSelect.value;
  }

  function showPresetNote(text) {
    presetNote.hidden = !text;
    presetNote.textContent = text || "";
    if (text) {
      window.setTimeout(function () {
        presetNote.hidden = true;
      }, 3000);
    }
  }

  presetSaveButton.addEventListener("click", function () {
    const name = presetNameInput.value.trim();
    if (!name) {
      presetNameInput.focus();
      showPresetNote("Dê um nome para o modelo antes de salvar.");
      return;
    }
    const presets = loadPresets();
    const id = "preset-" + Date.now();
    presets.push({ id: id, name: name, data: snapshotFormData() });
    savePresets(presets);
    populatePresetSelect(id);
    showPresetNote('Modelo "' + name + '" salvo.');
  });

  presetSelect.addEventListener("change", function () {
    const presets = loadPresets();
    const preset = presets.find(function (p) {
      return p.id === presetSelect.value;
    });
    presetDeleteButton.hidden = !presetSelect.value;
    if (preset) {
      applyFormData(preset.data);
      presetNameInput.value = preset.name;
      onAnyChange();
    }
  });

  presetDeleteButton.addEventListener("click", function () {
    const presets = loadPresets();
    const preset = presets.find(function (p) {
      return p.id === presetSelect.value;
    });
    if (!preset) return;
    if (!window.confirm('Excluir o modelo "' + preset.name + '"?')) return;
    const remaining = presets.filter(function (p) {
      return p.id !== preset.id;
    });
    savePresets(remaining);
    populatePresetSelect(null);
    showPresetNote('Modelo "' + preset.name + '" excluído.');
  });

  // --- Cálculo e renderização do resultado --------------------------------

  function recalculate() {
    const pricing = window.ElojaPricing;
    const fees = window.ELOJA_MARKETPLACE_FEES || {};
    const feeTable = fees[marketplaceSelect.value];

    updateWeightDiffNote();

    const filamentCost = pricing.calculateFilamentCost({
      weightUsedG: getWeightUsedG(),
      spoolPriceBRL: form.spoolPriceBRL.value,
      spoolWeightG: Number(form.spoolWeightKg.value) * 1000,
    });

    const timeCost = pricing.calculateTimeCost({
      printHours: getPrintHours(),
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
    updateMobilePriceBar(result);
  }

  function updateMobilePriceBar(result) {
    if (!mobilePriceBar) return;
    if (result.error) {
      mobilePriceBar.hidden = true;
      return;
    }
    mobilePriceBar.hidden = false;
    mobilePriceValue.textContent = formatCurrency(result.price);
  }

  // --- Selo de lucro (verde/amarelo/vermelho conforme margem sobre o preço) --

  function getProfitBadge(result) {
    if (!result.price) return null;
    const marginOnPrice = result.profit / result.price;
    if (marginOnPrice < 0.15) {
      return { className: "profit-badge--bad", icon: "🔴", label: "Margem apertada" };
    }
    if (marginOnPrice < 0.3) {
      return { className: "profit-badge--ok", icon: "🟡", label: "Margem razoável" };
    }
    return { className: "profit-badge--good", icon: "🟢", label: "Margem saudável" };
  }

  // --- Copiar resumo do resultado -------------------------------------------

  function getSelectedPresetName() {
    if (!presetSelect.value) return "";
    const preset = loadPresets().find(function (p) {
      return p.id === presetSelect.value;
    });
    return preset ? preset.name : "";
  }

  function buildSummaryText(data) {
    const feeTable = data.feeTable;
    const marketplaceLabel = feeTable ? feeTable.label : marketplaceSelect.value;
    const productName = presetNameInput.value.trim() || getSelectedPresetName();
    const lines = [];
    if (productName) lines.push(productName);
    lines.push(
      "Preço de venda sugerido: " + formatCurrency(data.result.price),
      "Custo total: " + formatCurrency(data.baseCost),
      "Lucro: " + formatCurrency(data.result.profit),
      "Marketplace: " + marketplaceLabel
    );
    return lines.join("\n");
  }

  function copySummary(data, feedbackEl) {
    const text = buildSummaryText(data);
    const done = function () {
      feedbackEl.textContent = "Copiado!";
      window.setTimeout(function () {
        feedbackEl.textContent = "";
      }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        feedbackEl.textContent = "Não foi possível copiar.";
      });
    } else {
      feedbackEl.textContent = "Cópia não suportada neste navegador.";
    }
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

    const priceRow = document.createElement("div");
    priceRow.className = "result-card__price-row";

    const price = document.createElement("div");
    price.className = "result-card__price";
    price.textContent = formatCurrency(result.price);
    priceRow.appendChild(price);

    const badge = getProfitBadge(result);
    if (badge) {
      const badgeEl = document.createElement("span");
      badgeEl.className = "profit-badge " + badge.className;
      badgeEl.textContent = badge.icon + " " + badge.label;
      priceRow.appendChild(badgeEl);
    }
    card.appendChild(priceRow);

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

    if (result.feeAmount > 0 || result.feePct > 0) {
      const tierNote = document.createElement("p");
      tierNote.className = "fee-tier-note";
      const pctText = percentFormatter.format(result.feePct * 100) + "%";
      const fixedText = result.feeFixed > 0 ? " + " + formatCurrency(result.feeFixed) : "";
      tierNote.textContent =
        "Nessa faixa de preço, a taxa do marketplace é " + pctText + fixedText + " por item vendido.";
      card.appendChild(tierNote);
    }

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

    const actions = document.createElement("div");
    actions.className = "result-card__actions";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "button";
    copyButton.textContent = "📋 Copiar resumo";
    const feedback = document.createElement("span");
    feedback.className = "copy-feedback";
    copyButton.addEventListener("click", function () {
      copySummary(data, feedback);
    });
    actions.appendChild(copyButton);
    actions.appendChild(feedback);
    card.appendChild(actions);

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
  updateWeightFieldsVisibility();
  populatePresetSelect();

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

  Array.from(form.querySelectorAll('input[name="weightMode"]')).forEach(function (radio) {
    radio.addEventListener("change", function () {
      updateWeightFieldsVisibility();
      onAnyChange();
    });
  });

  form.addEventListener("input", onAnyChange);
  extraItemsContainer.addEventListener("input", onAnyChange);

  recalculate();
})();
