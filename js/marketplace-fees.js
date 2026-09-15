// Tabelas de taxas de marketplace usadas pela calculadora de precificação.
//
// IMPORTANTE: essas taxas mudam com frequência (a Shopee e o TikTok Shop já
// alteraram suas tabelas mais de uma vez em 2026). Sempre que a plataforma
// anunciar mudança, atualize os valores aqui — é o único lugar que precisa
// mudar. Fontes e data de referência ficam registradas em cada tabela.
//
// Cada faixa (`tier`) tem: min (inclusive), max (exclusivo, Infinity se não houver teto),
// pct (percentual sobre o preço de venda, 0-1) e fixed (valor fixo em R$ por item vendido).

window.ELOJA_MARKETPLACE_FEES = {
  nenhuma: {
    label: "Somente custo do produto",
    description: "Sem taxas de marketplace — venda direta, feira, WhatsApp, etc.",
    referencia: null,
    tiers: [{ min: 0, max: Infinity, pct: 0, fixed: 0 }],
  },

  shopee: {
    label: "Shopee",
    description: "Comissão por faixa de preço + taxa fixa por item.",
    referencia: "Tabela vigente a partir de mar/2026 (verifique no Seller Center antes de confiar 100%)",
    tiers: [
      { min: 0, max: 8, pct: 0.5, fixed: 0 },
      { min: 8, max: 80, pct: 0.2, fixed: 4 },
      { min: 80, max: 100, pct: 0.14, fixed: 16 },
      { min: 100, max: 200, pct: 0.14, fixed: 20 },
      { min: 200, max: Infinity, pct: 0.14, fixed: 26 },
    ],
  },

  tiktok: {
    label: "TikTok Shop",
    description: "Comissão por faixa de preço + taxa fixa por item.",
    referencia: "Tabela vigente a partir de 15/jul/2026 (verifique no Seller Center antes de confiar 100%)",
    tiers: [
      { min: 0, max: 50, pct: 0.1, fixed: 6 },
      { min: 50, max: Infinity, pct: 0.06, fixed: 6 },
    ],
  },
};
