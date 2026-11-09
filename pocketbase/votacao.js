
(function () {
  "use strict";

  const { $, el, wait, showState, openModal, closeModal, bindModal, iniciais } = window.GA;
  const API = window.API;
  const SITE = window.SITE;

  const grid = $("#grid");
  const aviso = $("#aviso");
  const brancoWrap = $("#branco");
  const resultadoSec = $("#resultado");
  const dlgVoto = $("#dlg-voto");
  const dlgInfo = $("#dlg-info");

  let chapas = [];
  let voto = null;  
  let pendente = null;  

  const jaVotou = () => voto !== null;
  const nomeDe = (id) =>
    id === "branco" ? "Voto em branco" : chapas.find((c) => c.id === id)?.nome || "";

  function logoEl(chapa, classe, tamanho) {
    if (chapa.logo)
      return el("img", {
        class: classe,
        src: chapa.logo,
        alt: `Logotipo da ${chapa.nome}`,
        width: String(tamanho),
        height: String(tamanho),
      });
    return el("span", {
      class: classe + " logo-vazio",
      role: "img",
      "aria-label": `Chapa ${chapa.nome}`,
      text: iniciais(chapa.nome.replace(/^Chapa /, "")),
    });
  }

  

  function renderAviso() {
    const texto = jaVotou()
      ? `Seu voto foi registrado: ${voto.branco ? "voto em branco" : nomeDe(voto.chapaId)}. Obrigado por participar!`
      : "Votação aberta. Depois de confirmado, o voto não pode ser alterado.";
    aviso.replaceChildren(
      el("div", { class: "banner " + (jaVotou() ? "ok" : "info"), role: "status", text: texto }),
    );
  }

  

  function renderCards() {
    const bloqueado = jaVotou();

    grid.replaceChildren(
      ...chapas.map((chapa, i) => {
        const escolhida = voto?.chapaId === chapa.id;

        const logoBtn = el(
          "button",
          { class: "logo-btn", type: "button", "aria-label": `Ver propostas da ${chapa.nome}` },
          logoEl(chapa, "logo", 150),
        );
        logoBtn.addEventListener("click", () => abrirInfo(chapa));

        const votarBtn = el(
          "button",
          {
            class: "btn votar",
            type: "button",
            "aria-label": `Votar na ${chapa.nome}`,
            disabled: bloqueado,
          },
          escolhida ? "Seu voto" : "Votar",
        );
        votarBtn.addEventListener("click", () => iniciarVoto(chapa.id));

        return el(
          "article",
          { class: "chapa-card" + (escolhida ? " chosen" : ""), style: `--i:${i}` },
          el("h2", { class: "sr-only", text: chapa.nome }),
          logoBtn,
          votarBtn,
        );
      }),
    );

    brancoWrap.hidden = !SITE.votoBranco;
    $("button", brancoWrap).disabled = bloqueado;
  }

  

  async function renderResultado() {
    if (!SITE.resultadoParcial || !jaVotou()) {
      resultadoSec.hidden = true;
      return;
    }
    let dados;
    try {
      dados = await API.resultado();
    } catch {
      resultadoSec.hidden = true;
      return;
    }
    const total = dados.reduce((soma, r) => soma + r.votos, 0) || 1;

    $("#resultado-lista").replaceChildren(
      ...dados.map((r) => {
        const pct = Math.round((r.votos / total) * 100);
        const preenchimento = el("span");
        preenchimento.dataset.pct = pct;
        return el(
          "div",
          { class: "bar-row" },
          el("span", { text: r.nome }),
          el("div", { class: "bar", role: "img", "aria-label": `${r.nome}: ${pct}%` }, preenchimento),
          el("span", { text: `${r.votos} (${pct}%)` }),
        );
      }),
    );
    resultadoSec.hidden = false;
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        resultadoSec
          .querySelectorAll(".bar > span")
          .forEach((s) => (s.style.width = s.dataset.pct + "%")),
      ),
    );
  }

  

  function abrirInfo(chapa) {
    $("#info-logo-wrap").replaceChildren(logoEl(chapa, "modal-logo", 76));
    $("#info-titulo").textContent = chapa.nome;

    const partes = [];
    if (chapa.slogan) partes.push(`“${chapa.slogan}”`);
    if (chapa.sobre) partes.push(chapa.sobre);
    if (chapa.propostas.length)
      partes.push("Propostas:\n" + chapa.propostas.map((p) => "• " + p.titulo).join("\n"));
    $("#info-texto").textContent = partes.join("\n\n") || "Esta chapa ainda não publicou propostas.";

    const votar = $("#info-votar");
    votar.hidden = jaVotou();
    votar.onclick = async () => {
      await closeModal(dlgInfo);
      iniciarVoto(chapa.id);
    };
    openModal(dlgInfo);
  }

  

  function resetarJanelaVoto() {
    $("#voto-confirmar-view").hidden = false;
    $("#voto-pronto-view").hidden = true;
    $("#voto-erro").textContent = "";
    const ok = $("#voto-ok");
    ok.disabled = false;
    ok.textContent = "Confirmar";
    dlgVoto.dataset.busy = "false";
  }

  function iniciarVoto(id) {
    if (jaVotou()) return;
    pendente = id;
    resetarJanelaVoto();

    const chapa = chapas.find((c) => c.id === id);
    $("#voto-logo-wrap").replaceChildren(chapa ? logoEl(chapa, "modal-logo", 76) : "");
    $("#voto-nome").textContent = nomeDe(id);
    openModal(dlgVoto);
    $("#voto-ok").focus();
  }

  async function confirmarVoto() {
    if (pendente === null) return;
    const ok = $("#voto-ok");
    dlgVoto.dataset.busy = "true";
    ok.disabled = true;
    ok.textContent = "Registrando…";
    $("#voto-erro").textContent = "";

    try {
      await API.votar(pendente);
      voto = pendente === "branco" ? { branco: true } : { chapaId: pendente };
    } catch (err) {
      if (err.jaVotou) {
        voto = await API.meuVoto().catch(() => ({ branco: true }));
        dlgVoto.dataset.busy = "false";
        await closeModal(dlgVoto);
        atualizar();
        return;
      }
      $("#voto-erro").textContent = err.message;
      ok.disabled = false;
      ok.textContent = "Tentar de novo";
      dlgVoto.dataset.busy = "false";
      return;
    }
    pendente = null;

    $("#voto-confirmar-view").hidden = true;
    $("#voto-pronto-view").hidden = false;
    await wait(1500);

    dlgVoto.dataset.busy = "false";
    await closeModal(dlgVoto);
    atualizar();
    if (!resultadoSec.hidden) resultadoSec.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  

  function atualizar() {
    renderAviso();
    renderCards();
    renderResultado();
  }

  [dlgVoto, dlgInfo].forEach(bindModal);
  dlgVoto.addEventListener("close", () => {
    pendente = null;
    resetarJanelaVoto();
  });
  $("#voto-ok").addEventListener("click", confirmarVoto);
  $("#btn-branco").addEventListener("click", () => iniciarVoto("branco"));

  (async function init() {
    if (!API.logado()) {
      location.replace("login.html?next=votacao.html");
      return;
    }
    showState(grid, "loading", "Carregando chapas…");
    try {
      [chapas, voto] = await Promise.all([API.chapas(), API.meuVoto()]);
    } catch (err) {
      return showState(grid, "erro", err.message || "Não foi possível carregar a votação.");
    }
    if (!chapas.length) return showState(grid, "empty", "Nenhuma chapa cadastrada ainda.");
    atualizar();
  })();
})();
