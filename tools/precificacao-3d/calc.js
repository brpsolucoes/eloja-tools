// Wiring da UI da calculadora de precificação 3D.
// Depende de window.ELOJA_MARKETPLACE_FEES (js/marketplace-fees.js) e
// window.ElojaPricing (js/pricing.js), carregados antes deste arquivo.
(function () {
  "use strict";

  const STORAGE_KEY = "eloja-tools:precificacao-3d:custos-fixos";
  const PRESETS_KEY = "eloja-tools:precificacao-3d:presets";
  const PRESETS_EXPORT_TYPE = "eloja-tools:precificacao-3d:presets";

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

  const presetExportButton = document.getElementById("preset-export");
  const presetImportTriggerButton = document.getElementById("preset-import-trigger");
  const presetImportFileInput = document.getElementById("preset-import-file");
  const importPicker = document.getElementById("import-picker");
  const importPickerList = document.getElementById("import-picker-list");
  const importPickerConfirmButton = document.getElementById("import-picker-confirm");
  const importPickerCancelButton = document.getElementById("import-picker-cancel");

  const mobilePriceBar = document.getElementById("mobile-price-bar");
  const mobilePriceValue = document.getElementById("mobile-price-value");
  const mobileSheetOpenButton = document.getElementById("mobile-sheet-open");

  const resultPanel = document.querySelector(".result-panel");
  const sheetBackdrop = document.getElementById("sheet-backdrop");
  const bottomSheet = document.getElementById("bottom-sheet");
  const sheetBody = document.getElementById("sheet-body");
  const sheetCloseButton = document.getElementById("sheet-close");

  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const percentFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

  function formatCurrency(value) {
    return currencyFormatter.format(Number.isFinite(value) ? value : 0);
  }

  // Lê o valor de um campo numérico (aceita "," ou "." como separador
  // decimal — ver enhanceNumericInput, que já digita normalizado pra ",").
  function parseNumber(value) {
    const n = Number(String(value).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  // --- Digitação dos campos numéricos ---------------------------------------
  // Os campos numéricos são <input type="text"> (não type="number") de
  // propósito: só type="text" permite ler/mover o cursor (selectionStart),
  // necessário pra corrigir o zero à esquerda e aceitar vírgula sem que o
  // comportamento dependa do idioma do navegador/SO.

  function normalizeNumericValue(raw, allowDecimal) {
    let value = raw.replace(/\./g, ",");
    value = value.replace(allowDecimal ? /[^\d,]/g : /[^\d]/g, "");
    if (allowDecimal) {
      const firstComma = value.indexOf(",");
      if (firstComma !== -1) {
        value = value.slice(0, firstComma + 1) + value.slice(firstComma + 1).replace(/,/g, "");
      }
    }
    // "0" e "0,5" continuam como estão; "0" seguido de outro dígito (ex.: ao
    // digitar "1" com o "0" já lá) vira só o dígito novo, sem prefixo.
    value = value.replace(/^0+(\d)/, "$1");
    return value;
  }

  function enhanceNumericInput(input, allowDecimal) {
    input.addEventListener("focus", function () {
      input.select();
    });
    input.addEventListener("input", function () {
      const original = input.value;
      const cursor = input.selectionStart == null ? original.length : input.selectionStart;
      const normalized = normalizeNumericValue(original, allowDecimal);
      if (normalized === original) return;
      const newCursor = Math.max(0, Math.min(normalized.length, cursor + (normalized.length - original.length)));
      input.value = normalized;
      input.setSelectionRange(newCursor, newCursor);
    });
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
      const before = parseNumber(form.weightBeforeG.value);
      const after = parseNumber(form.weightAfterG.value);
      return Math.max(0, before - after);
    }
    return parseNumber(form.weightUsedG.value);
  }

  function updateWeightDiffNote() {
    if (getWeightMode() !== "diff") return;
    const weight = getWeightUsedG();
    weightDiffNote.hidden = false;
    weightDiffNote.textContent = "Peso usado na peça: " + weight.toFixed(1) + " g";
  }

  // --- Tempo de impressão: horas + minutos ---------------------------------

  function getPrintHours() {
    const hoursPart = parseNumber(form.printHoursPart.value);
    const minutesPart = parseNumber(form.printMinutesPart.value);
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
    valueInput.type = "text";
    valueInput.inputMode = "decimal";
    valueInput.placeholder = "R$ 0,00";
    valueInput.className = "extra-item__value";
    valueInput.value = value != null ? value : "";
    enhanceNumericInput(valueInput, true);

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
        value: parseNumber(row.querySelector(".extra-item__value").value),
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

  // --- Exportar / importar modelos salvos -----------------------------------

  // Garante um nome único acrescentando " (2)", " (3)"... — nunca sobrescreve
  // um modelo existente nem descarta o que está sendo importado.
  function uniquePresetName(name, existingNames) {
    if (!existingNames.has(name)) return name;
    let n = 2;
    let candidate = name + " (" + n + ")";
    while (existingNames.has(candidate)) {
      n++;
      candidate = name + " (" + n + ")";
    }
    return candidate;
  }

  let pendingImportItems = [];

  presetExportButton.addEventListener("click", function () {
    const presets = loadPresets();
    if (presets.length === 0) {
      showPresetNote("Nenhum modelo salvo para exportar.");
      return;
    }
    const payload = {
      type: PRESETS_EXPORT_TYPE,
      version: 1,
      exportedAt: new Date().toISOString(),
      presets: presets.map(function (p) {
        return { name: p.name, data: p.data };
      }),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "eloja-tools-modelos-precificacao-3d.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  presetImportTriggerButton.addEventListener("click", function () {
    presetImportFileInput.click();
  });

  presetImportFileInput.addEventListener("change", function () {
    const file = presetImportFileInput.files && presetImportFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (e) {
        showPresetNote("Arquivo inválido: não é um JSON legível.");
        presetImportFileInput.value = "";
        return;
      }
      const items = Array.isArray(parsed && parsed.presets) ? parsed.presets : null;
      if (!items || items.length === 0) {
        showPresetNote("Arquivo inválido ou sem modelos para importar.");
        presetImportFileInput.value = "";
        return;
      }
      openImportPicker(items);
    };
    reader.onerror = function () {
      showPresetNote("Não foi possível ler o arquivo.");
      presetImportFileInput.value = "";
    };
    reader.readAsText(file);
  });

  function openImportPicker(items) {
    pendingImportItems = items;
    const existingNames = new Set(
      loadPresets().map(function (p) {
        return p.name;
      })
    );
    importPickerList.innerHTML = "";
    items.forEach(function (item, index) {
      const row = document.createElement("label");
      row.className = "import-picker__item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.dataset.index = String(index);
      row.appendChild(checkbox);

      const nameSpan = document.createElement("span");
      nameSpan.textContent = (item && item.name) || "(sem nome)";
      row.appendChild(nameSpan);

      if (item && item.name && existingNames.has(item.name)) {
        const renameNote = document.createElement("span");
        renameNote.className = "import-picker__item-rename";
        renameNote.textContent = "já existe — será renomeado";
        row.appendChild(renameNote);
      }

      importPickerList.appendChild(row);
    });
    importPicker.hidden = false;
  }

  function closeImportPicker() {
    importPicker.hidden = true;
    importPickerList.innerHTML = "";
    pendingImportItems = [];
    presetImportFileInput.value = "";
  }

  importPickerCancelButton.addEventListener("click", closeImportPicker);

  importPickerConfirmButton.addEventListener("click", function () {
    const checkboxes = Array.from(importPickerList.querySelectorAll('input[type="checkbox"]:checked'));
    if (checkboxes.length === 0) {
      closeImportPicker();
      return;
    }
    const presets = loadPresets();
    const existingNames = new Set(
      presets.map(function (p) {
        return p.name;
      })
    );
    let counter = 0;
    let importedCount = 0;

    checkboxes.forEach(function (checkbox) {
      const item = pendingImportItems[Number(checkbox.dataset.index)];
      if (!item || !item.data) return;
      const baseName = ((item.name || "").trim()) || "Modelo importado";
      const finalName = uniquePresetName(baseName, existingNames);
      existingNames.add(finalName);
      counter++;
      presets.push({
        id: "preset-import-" + Date.now() + "-" + counter,
        name: finalName,
        data: item.data,
      });
      importedCount++;
    });

    savePresets(presets);
    populatePresetSelect(null);
    closeImportPicker();
    showPresetNote(importedCount + " modelo(s) importado(s).");
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
      spoolWeightG: parseNumber(form.spoolWeightKg.value) * 1000,
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

  // --- Acordeão de seções (mobile) ------------------------------------------
  // O clique/toque funciona em qualquer largura, mas só tem efeito visual no
  // celular: a regra que esconde `.form-section__body` fica só dentro do
  // media query de calc.css, então no desktop as seções continuam sempre
  // abertas, do jeito que já estava.

  function initSectionAccordion() {
    const headers = Array.from(document.querySelectorAll(".form-section__title[role='button']"));
    headers.forEach(function (header) {
      function toggle() {
        const section = header.closest(".form-section");
        const collapsed = section.classList.toggle("is-collapsed");
        header.setAttribute("aria-expanded", String(!collapsed));
      }
      header.addEventListener("click", toggle);
      header.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      });
    });
  }

  // --- Bottom sheet do resultado (mobile) ------------------------------------
  // No desktop #result mora sempre dentro de .result-panel. No celular ele é
  // fisicamente movido pra dentro do bottom sheet, que só aparece quando o
  // usuário toca em "Ver detalhes" na barra de preço fixa.

  const mobileMediaQuery = window.matchMedia("(max-width: 640px)");

  function placeResultNode() {
    if (mobileMediaQuery.matches) {
      if (resultContainer.parentElement !== sheetBody) sheetBody.appendChild(resultContainer);
    } else {
      if (resultContainer.parentElement !== resultPanel) resultPanel.appendChild(resultContainer);
      closeSheet();
    }
  }

  function openSheet() {
    bottomSheet.hidden = false;
    sheetBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(function () {
      bottomSheet.classList.add("is-open");
      sheetBackdrop.classList.add("is-open");
    });
    bottomSheet.setAttribute("aria-hidden", "false");
  }

  function closeSheet() {
    if (bottomSheet.hidden) return;
    bottomSheet.classList.remove("is-open");
    sheetBackdrop.classList.remove("is-open");
    bottomSheet.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    window.setTimeout(function () {
      if (!bottomSheet.classList.contains("is-open")) {
        bottomSheet.hidden = true;
        sheetBackdrop.hidden = true;
      }
    }, 300);
  }

  function initBottomSheet() {
    placeResultNode();
    mobileMediaQuery.addEventListener("change", placeResultNode);
    mobileSheetOpenButton.addEventListener("click", openSheet);
    sheetCloseButton.addEventListener("click", closeSheet);
    sheetBackdrop.addEventListener("click", closeSheet);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeSheet();
    });
  }

  // --- Inicialização -------------------------------------------------------

  populateMarketplaceSelect();
  loadFixedCosts();
  updateMarketplaceNote();
  updateLaborFieldsVisibility();
  updateWeightFieldsVisibility();
  populatePresetSelect();

  [
    "weightUsedG",
    "weightBeforeG",
    "weightAfterG",
    "spoolPriceBRL",
    "spoolWeightKg",
    "powerCostPerHour",
    "wearCostPerHour",
    "laborFixedValue",
    "laborHours",
    "laborHourlyRate",
    "marginPercent",
    "roas",
  ].forEach(function (id) {
    enhanceNumericInput(document.getElementById(id), true);
  });
  ["printHoursPart", "printMinutesPart"].forEach(function (id) {
    enhanceNumericInput(document.getElementById(id), false);
  });

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

  initSectionAccordion();
  initBottomSheet();

  recalculate();
})();
