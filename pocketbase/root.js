const POCKETBASE_URL = "http://127.0.0.1:8020";

window.pb = new PocketBase(POCKETBASE_URL);

window.SITE = {
  eleicaoId: "gremio_2026",

  votoBranco: true,

  resultadoParcial: false,

  instagram: { usuario: "", url: "" },

  dominioEmail: "@escola.pr.gov.br",
  senhaMinima: 6,
};
