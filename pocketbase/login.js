
(function() {
  "use strict";

  const { $, el, safeNext } = window.GA;
  const API = window.API;
  const SITE = window.SITE;

  const form = $("#form");
  const msg = $("#msg");
  const enviar = $("#enviar");
  const next = safeNext(new URLSearchParams(location.search).get("next"), "home.html");

  const MODOS = {
    login: {
      titulo: "Entrar",
      botao: "Login",
      senha: true,
      senha2: false,
      alt: "Primeiro acesso",
      esqueci: true,
    },
    cadastro: {
      titulo: "Primeiro acesso",
      botao: "Criar conta",
      senha: true,
      senha2: true,
      alt: "Já tenho conta",
      esqueci: true,
    },
    recuperar: {
      titulo: "Recuperar senha",
      botao: "Enviar link",
      senha: false,
      senha2: false,
      alt: "Voltar ao login",
      esqueci: false,
    },
  };
  let modo = "login";

  function mostrar(tipo, texto) {
    msg.replaceChildren(
      texto
        ? el("div", {
          class: "login-msg " + tipo,
          role: tipo === "erro" ? "alert" : "status",
          text: texto,
        })
        : "",
    );
  }

  function setModo(novo) {
    modo = novo;
    const cfg = MODOS[ novo ];
    mostrar("", "");
    $("#titulo").textContent = cfg.titulo;
    enviar.textContent = cfg.botao;
    $("#campo-senha").hidden = !cfg.senha;
    $("#campo-senha2").hidden = !cfg.senha2;
    $("#senha").required = cfg.senha;
    $("#senha2").required = cfg.senha2;
    $("#senha").autocomplete = novo === "cadastro" ? "new-password" : "current-password";
    $("#alt-modo").textContent = cfg.alt;
    $("#esqueci").hidden = !cfg.esqueci;
  }

  $("#alt-modo").addEventListener("click", () => setModo(modo === "login" ? "cadastro" : "login"));
  $("#esqueci").addEventListener("click", () => setModo("recuperar"));
  $("#email").placeholder = "E-mail institucional";
  $("#dominio").textContent = SITE.dominioEmail;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = $("#email").value.trim().toLowerCase();
    const senha = $("#senha").value;
    const senha2 = $("#senha2").value;

    const erroEmail = API.validarEmail(email);
    if (erroEmail) return mostrar("erro", erroEmail);
    if (modo !== "recuperar") {
      const erroSenha = API.validarSenha(senha);
      if (erroSenha) return mostrar("erro", erroSenha);
    }
    if (modo === "cadastro" && senha !== senha2) return mostrar("erro", "As senhas não conferem.");

    enviar.disabled = true;
    mostrar("", "");
    try {
      if (modo === "recuperar") {
        await API.recuperarSenha(email);
        mostrar("ok", "Enviamos um link de redefinição para o seu e-mail. Confira a caixa de entrada.");
        return;
      }
      if (modo === "cadastro") await API.cadastrar(email, senha);
      else await API.entrar(email, senha);
      mostrar("ok", "Tudo certo! Redirecionando…");
      location.href = next;
    } catch (err) {
      mostrar("erro", err.message);
    } finally {
      enviar.disabled = false;
    }
  });

  if (API.logado()) location.replace(next);
})();
