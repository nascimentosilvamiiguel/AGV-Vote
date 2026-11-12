(function () {
  "use strict";

  const { $, el, safeNext } = window.GA;
  const API = window.API;

  const msg = $("#msg");
  const btnGoogle = $("#btn-google");
  const next = safeNext(
    new URLSearchParams(location.search).get("next"),
    "home.html",
  );

  // URL fallback garantida do PocketBase
  const POCKETBASE_URL =
    API?.baseURL || "https://lgg6kemizx53xeo.pwz5.pocketbasecloud.com";

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

  if (btnGoogle) {
    btnGoogle.addEventListener("click", async () => {
      btnGoogle.disabled = true;
      mostrar("", "");
      try {
        if (API && typeof API.entrarComGoogle === "function") {
          await API.entrarComGoogle();
        } else {
          const pbInstance =
            window.pb ||
            (window.PocketBase ? new PocketBase(POCKETBASE_URL) : null);

          if (pbInstance) {
            await pbInstance.collection("users").authWithOAuth2({
              provider: "google",
              createData: {
                emailVisibility: true,
              },
            });
          } else {
            throw new Error(
              "Não foi possível inicializar a autenticação do PocketBase.",
            );
          }
        }
        mostrar("ok", "Tudo certo! Redirecionando…");
        location.href = next;
      } catch (err) {
        mostrar("erro", err.message || "Falha ao autenticar com o Google.");
      } finally {
        btnGoogle.disabled = false;
      }
    });
  }

  if (API && typeof API.logado === "function" && API.logado()) {
    location.replace(next);
  }
})();
