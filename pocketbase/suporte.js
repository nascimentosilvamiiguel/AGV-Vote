
(function () {
  "use strict";

  const { $, el } = window.GA;
  const API = window.API;

  const form = $("#form");
  const enviar = $("#enviar");
  const resultado = $("#resultado");

   
  const u = API.usuario();
  if (u) {
    $("#nome").value = u.name || "";
    $("#email").value = u.email || "";
  }

  $("#mensagem").addEventListener("input", (event) => {
    $("#cont").textContent = event.target.value.length;
  });

  const setErro = (campo, texto) => ($("#e-" + campo).textContent = texto || "");

  function validar(v) {
    const erros = {
      nome: v.nome.length < 2 ? "Informe seu nome." : "",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) ? "" : "Informe um e-mail válido.",
      assunto: v.assunto ? "" : "Escolha um assunto.",
      mensagem: v.mensagem.length < 10 ? "Escreva ao menos 10 caracteres." : "",
    };
    for (const [campo, texto] of Object.entries(erros)) setErro(campo, texto);
    return Object.values(erros).every((texto) => !texto);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    resultado.replaceChildren();

    const valores = {
      nome: $("#nome").value.trim(),
      email: $("#email").value.trim(),
      assunto: $("#assunto").value,
      mensagem: $("#mensagem").value.trim(),
    };
    if (!validar(valores)) {
      form.querySelector(".err:not(:empty)")?.previousElementSibling?.focus();
      return;
    }

    enviar.disabled = true;
    enviar.textContent = "Enviando…";
    try {
      await API.enviarSuporte(valores);
      form.reset();
      $("#cont").textContent = "0";
      resultado.append(
        el("div", { class: "banner ok", role: "status", text: "Mensagem enviada! O Grêmio vai ler assim que possível." }),
      );
    } catch (err) {
      resultado.append(el("div", { class: "banner erro", role: "alert", text: err.message }));
    } finally {
      enviar.disabled = false;
      enviar.textContent = "Enviar";
    }
  });
})();
