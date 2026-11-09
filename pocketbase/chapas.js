
(function () {
  "use strict";

  const { $, el, showState, iniciais } = window.GA;
  const API = window.API;

  const tabs = $("#tabs");
  const painel = $("#painel");

  let lista = [];
  let atual = null;  

  function logoDe(chapa, classe, tamanho) {
    if (chapa.logo)
      return el("img", {
        class: classe,
        src: chapa.logo,
        alt: classe === "chapa-hero-logo" ? `Logotipo da ${chapa.nome}` : "",
        width: String(tamanho),
        height: String(tamanho),
      });
    return el("span", {
      class: classe + " logo-vazio",
      "aria-hidden": "true",
      text: iniciais(chapa.nome.replace(/^Chapa /, "")),
    });
  }

  

  function renderTabs() {
    tabs.replaceChildren(
      ...lista.map((chapa) => {
        const selecionada = chapa.id === atual;
        const aba = el(
          "button",
          {
            class: "chapa-tab",
            id: "tab-" + chapa.id,
            type: "button",
            role: "tab",
            "aria-selected": String(selecionada),
            "aria-controls": "painel",
            tabindex: selecionada ? "0" : "-1",
          },
          logoDe(chapa, "chapa-tab-logo", 72),
          el("span", { text: chapa.nome.replace(/^Chapa /, "") }),
        );
        aba.addEventListener("click", () => {
          selecionar(chapa.id);
          $("#tab-" + chapa.id).focus();  
        });
        return aba;
      }),
    );
  }

   
  tabs.addEventListener("keydown", (event) => {
    const ids = lista.map((c) => c.id);
    let i = ids.indexOf(atual);
    if (event.key === "ArrowRight") i = (i + 1) % ids.length;
    else if (event.key === "ArrowLeft") i = (i - 1 + ids.length) % ids.length;
    else if (event.key === "Home") i = 0;
    else if (event.key === "End") i = ids.length - 1;
    else return;
    event.preventDefault();
    selecionar(ids[i]);
    $("#tab-" + ids[i]).focus();
  });

  

  const secao = (titulo, conteudo) =>
    el("section", { class: "info-section" }, el("h3", { text: titulo }), conteudo);

  function renderPainel(chapa) {
    painel.setAttribute("aria-labelledby", "tab-" + chapa.id);

    const blocos = [
      el(
        "header",
        { class: "chapa-hero" },
        logoDe(chapa, "chapa-hero-logo", 160),
        el(
          "div",
          { class: "chapa-hero-text" },
          el("h2", { text: chapa.nome }),
          chapa.slogan ? el("p", { class: "slogan", text: `“${chapa.slogan}”` }) : null,
          chapa.sobre ? el("p", { text: chapa.sobre }) : null,
          el("a", { class: "btn btn-small", href: "votacao.html" }, "Votar nesta chapa"),
        ),
      ),
    ];

    if (chapa.propostas.length)
      blocos.push(
        secao(
          "Propostas",
          el(
            "ol",
            { class: "prop-grid" },
            chapa.propostas.map((proposta, i) =>
              el(
                "li",
                { class: "prop-card", style: `--i:${i}` },
                el("span", { class: "prop-num", "aria-hidden": "true", text: i + 1 }),
                el("h4", { text: proposta.titulo }),
                proposta.texto ? el("p", { text: proposta.texto }) : null,
              ),
            ),
          ),
        ),
      );

    if (chapa.integrantes.length)
      blocos.push(
        secao(
          "Integrantes",
          el(
            "ul",
            { class: "member-grid" },
            chapa.integrantes.map((pessoa, i) =>
              el(
                "li",
                { class: "member-card", style: `--i:${i}` },
                el("span", { class: "avatar", "aria-hidden": "true", text: iniciais(pessoa.nome) }),
                el(
                  "div",
                  {},
                  el("strong", { text: pessoa.nome }),
                  pessoa.cargo ? el("span", { class: "member-role", text: pessoa.cargo }) : null,
                  pessoa.turma ? el("span", { class: "member-class", text: pessoa.turma }) : null,
                ),
              ),
            ),
          ),
        ),
      );

    painel.replaceChildren(...blocos);

     
    painel.classList.remove("enter");
    void painel.offsetWidth;
    painel.classList.add("enter");
  }

  

  function selecionar(id, { atualizarEndereco = true } = {}) {
    const chapa = lista.find((c) => c.id === id) || lista[0];
    atual = chapa.id;
    renderTabs();
    renderPainel(chapa);
    if (atualizarEndereco) history.replaceState(null, "", "#" + chapa.id);
  }

  window.addEventListener("hashchange", () => {
    if (lista.length) selecionar(location.hash.slice(1), { atualizarEndereco: false });
  });

  (async function init() {
    showState(painel, "loading", "Carregando chapas…");
    try {
      lista = await API.chapas();
    } catch (err) {
      return showState(painel, "erro", err.message);
    }
    if (!lista.length) return showState(painel, "empty", "Nenhuma chapa cadastrada ainda.");
    selecionar(location.hash.slice(1), { atualizarEndereco: false });
  })();
})();
