// Renderiza a grade de ferramentas na tela inicial a partir de window.ELOJA_TOOLS.
(function () {
  function createToolCard(tool) {
    const isAvailable = tool.status === "disponivel";

    const card = document.createElement(isAvailable ? "a" : "div");
    card.className = "tool-card";

    if (isAvailable) {
      card.href = tool.url;
    } else {
      card.setAttribute("aria-disabled", "true");
    }

    const icon = document.createElement("div");
    icon.className = "tool-card__icon";
    icon.textContent = tool.icon || "🔧";
    card.appendChild(icon);

    const name = document.createElement("div");
    name.className = "tool-card__name";
    name.textContent = tool.name;
    card.appendChild(name);

    const description = document.createElement("div");
    description.className = "tool-card__description";
    description.textContent = tool.description;
    card.appendChild(description);

    if (!isAvailable) {
      const badge = document.createElement("span");
      badge.className = "tool-card__badge";
      badge.textContent = "Em construção";
      card.appendChild(badge);
    }

    return card;
  }

  function renderTools() {
    const grid = document.getElementById("tool-grid");
    if (!grid) return;

    const tools = window.ELOJA_TOOLS || [];

    if (tools.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Nenhuma ferramenta disponível ainda.";
      grid.appendChild(empty);
      return;
    }

    tools.forEach(function (tool) {
      grid.appendChild(createToolCard(tool));
    });
  }

  document.addEventListener("DOMContentLoaded", renderTools);
})();
