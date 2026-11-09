
(function () {
  "use strict";

  const { $, el, showState, openModal, bindModal, fmtDate } = window.GA;
  const API = window.API;
  const SITE = window.SITE;

  const lista = $("#lista");
  const busca = $("#busca");
  const dlg = $("#dlg");

  let todas = [];

  const normalizar = (texto) =>
    (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  function abrir(noticia) {
    $("#dlg-titulo").textContent = noticia.titulo;
    $("#dlg-data").textContent = fmtDate(noticia.data);
    $("#dlg-texto").textContent = noticia.corpo || noticia.resumo;
    openModal(dlg);
  }

  function render() {
    const termo = normalizar(busca.value.trim());
    const itens = todas.filter(
      (n) => !termo || normalizar(`${n.titulo} ${n.resumo} ${n.corpo}`).includes(termo),
    );

    if (!itens.length)
      return showState(
        lista,
        "empty",
        todas.length ? "Nenhuma notícia encontrada para essa busca." : "Ainda não há notícias publicadas.",
      );

    lista.replaceChildren(
      ...itens.map((noticia, i) => {
        const botao = el(
          "button",
          { class: "btn btn-light btn-small", type: "button", "aria-label": `Ler notícia: ${noticia.titulo}` },
          "Ler mais",
        );
        botao.addEventListener("click", () => abrir(noticia));

        return el(
          "article",
          { class: "news-card", style: `--i:${i}` },
          el(
            "div",
            { class: "body" },
            el("time", { datetime: noticia.data, text: fmtDate(noticia.data) }),
            el("h3", { text: noticia.titulo }),
            el("p", { text: noticia.resumo }),
            botao,
          ),
        );
      }),
    );
  }

  

  const dlgInsta = $("#dlg-insta");
  const insta = SITE.instagram;
  const link = $("#social-link");

  $("#social-user").textContent = insta.usuario ? "@" + insta.usuario : "Instagram do Grêmio";

  if (insta.url) {
    link.href = insta.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    $(".social-note").hidden = true;
  } else {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(dlgInsta);
    });
  }

  bindModal(dlg);
  bindModal(dlgInsta);
  busca.addEventListener("input", render);

  (async function init() {
    showState(lista, "loading", "Carregando notícias…");
    try {
      todas = await API.noticias();
    } catch (err) {
      return showState(lista, "erro", err.message);
    }
    render();
  })();
})();
