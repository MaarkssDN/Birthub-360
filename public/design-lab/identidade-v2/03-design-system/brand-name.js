/* Ponto único de troca da grafia da marca (PROVISÓRIO P-01: "Birthub 360°" nos novos textos).
   Fontes oficiais do repositório usam "Birth Hub 360°/º"; decisão humana pendente.
   Para trocar a grafia em todas as páginas do DS/biblioteca, altere SOMENTE a constante abaixo. */
(function () {
  var BRAND_NAME = 'Birthub 360°';
  window.BH_BRAND_NAME = BRAND_NAME;
  document.querySelectorAll('[data-brand-name]').forEach(function (el) { el.textContent = BRAND_NAME; });
  document.title = document.title.replace(/Birthub 360°/g, BRAND_NAME);
})();
