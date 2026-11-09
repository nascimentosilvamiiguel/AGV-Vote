
(function () {
  "use strict";

  const { $, el, toast } = window.GA;
  const API = window.API;

  const MAX_PROPOSTAS = 8;
  const MAX_INTEGRANTES = 15;
  const MAX_IMAGEM = 2 * 1024 * 1024;  

  const form = $("#form");
  const resultado = $("#resultado");
  const enviar = $("#enviar");

   
  if (!API.podeCadastrarChapa()) {
    form.hidden = true;
    $("#sem-permissao").hidden = false;
    return;
  }

  

  function linhaProposta() {
    const remover = el("button", { class: "btn-remover", type: "button" }, "Remover");
    const linha = el(
      "div",
      { class: "linha-dinamica linha-proposta" },
      el("input", { type: "text", name: "p-titulo", placeholder: "Título da proposta", maxlength: "80", "aria-label": "Título da proposta" }),
      el("input", { type: "text", name: "p-texto", placeholder: "Explicação (opcional)", maxlength: "240", "aria-label": "Explicação da proposta" }),
      remover,
    );
    remover.addEventListener("click", () => linha.remove());
    return linha;
  }

  function linhaIntegrante() {
    const remover = el("button", { class: "btn-remover", type: "button" }, "Remover");
    const linha = el(
      "div",
      { class: "linha-dinamica linha-integrante" },
      el("input", { type: "text", name: "i-nome", placeholder: "Nome", maxlength: "80", "aria-label": "Nome do integrante" }),
      el("input", { type: "text", name: "i-cargo", placeholder: "Cargo (ex.: Presidente)", maxlength: "60", "aria-label": "Cargo do integrante" }),
      el("input", { type: "text", name: "i-turma", placeholder: "Turma (ex.: 3º A)", maxlength: "20", "aria-label": "Turma do integrante" }),
      remover,
    );
    remover.addEventListener("click", () => linha.remove());
    return linha;
  }

  function adicionar(listaId, criarLinha, max) {
    const lista = $(listaId);
    if (lista.children.length >= max) return toast(`Limite de ${max} itens.`, "erro");
    const linha = criarLinha();
    lista.append(linha);
    linha.querySelector("input").focus();
  }

  $("#add-proposta").addEventListener("click", () =>
    adicionar("#lista-propostas", linhaProposta, MAX_PROPOSTAS),
  );
  $("#add-integrante").addEventListener("click", () =>
    adicionar("#lista-integrantes", linhaIntegrante, MAX_INTEGRANTES),
  );
  function reiniciarListas() {
    $("#lista-propostas").replaceChildren(linhaProposta());
    $("#lista-integrantes").replaceChildren(linhaIntegrante());
  }
  reiniciarListas();

  

  const valor = (raiz, nome) => raiz.querySelector(`[name="${nome}"]`).value.trim();
  const setErro = (campo, texto) => ($("#e-" + campo).textContent = texto || "");

  function coletar() {
    const propostas = [...$("#lista-propostas").children]
      .map((l) => ({ titulo: valor(l, "p-titulo"), texto: valor(l, "p-texto") }))
      .filter((p) => p.titulo);
    const integrantes = [...$("#lista-integrantes").children]
      .map((l) => ({ nome: valor(l, "i-nome"), cargo: valor(l, "i-cargo"), turma: valor(l, "i-turma") }))
      .filter((i) => i.nome);
    return {
      nome: $("#name").value.trim(),
      slogan: $("#slogan").value.trim(),
      sobre: $("#sobre").value.trim(),
      propostas,
      integrantes,
      imagem: $("#imagem").files[0] || null,
    };
  }

  function validar(d) {
    const erros = {
      name: d.nome.length < 3 ? "Informe o nome da chapa." : "",
      slogan: d.slogan ? "" : "Informe o slogan.",
      sobre: d.sobre.length < 20 ? "Escreva ao menos 20 caracteres sobre a chapa." : "",
      propostas: d.propostas.length ? "" : "Informe pelo menos uma proposta.",
      imagem: !d.imagem
        ? ""
        : !/^image\/(png|jpeg|webp)$/.test(d.imagem.type)
          ? "Use uma imagem PNG, JPG ou WEBP."
          : d.imagem.size > MAX_IMAGEM
            ? "A imagem deve ter até 2 MB."
            : "",
    };
    for (const [campo, texto] of Object.entries(erros)) setErro(campo, texto);
    return Object.values(erros).every((t) => !t);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    resultado.replaceChildren();

    const dados = coletar();
    if (!validar(dados)) {
      form.querySelector(".err:not(:empty)")?.parentElement.querySelector("input, textarea, button")?.focus();
      return;
    }

    enviar.disabled = true;
    enviar.textContent = "Enviando…";
    try {
      await API.criarChapa(dados);
      form.reset();
      reiniciarListas();
      resultado.append(
        el("div", { class: "banner ok", role: "status" }, "Chapa cadastrada! ", el("a", { href: "chapas.html" }, "Ver na página de chapas.")),
      );
    } catch (err) {
      resultado.append(el("div", { class: "banner erro", role: "alert", text: err.message }));
    } finally {
      enviar.disabled = false;
      enviar.textContent = "Cadastrar chapa";
    }
  });
})();
