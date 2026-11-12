(function () {
  "use strict";

  const pb = window.pb;
  const SITE = window.SITE;

  const usuario = () =>
    pb.authStore.isValid ? pb.authStore.record || pb.authStore.model : null;

  function mensagemDeErro(err, padrao) {
    if (!err) return padrao;
    if (err.status === 0)
      return "Não foi possível conectar ao servidor. Verifique a rede da escola.";
    if (err.status === 403) return "Você não tem permissão para fazer isso.";
    if (err.status === 429)
      return "Muitas tentativas. Aguarde um instante e tente de novo.";
    return padrao;
  }

  async function entrarComGoogle() {
    try {
      await pb.collection("users").authWithOAuth2({ provider: "google" });
    } catch (err) {
      throw new Error(
        mensagemDeErro(
          err,
          "Não foi possível autenticar com o Google. Tente novamente.",
        ),
      );
    }
  }

  function sair() {
    pb.authStore.clear();
  }

  const linhas = (texto) =>
    String(texto)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

  function normalizarPropostas(valor) {
    if (!valor) return [];
    if (typeof valor === "string")
      return linhas(valor).map((titulo) => ({ titulo, texto: "" }));
    if (Array.isArray(valor))
      return valor
        .map((p) => (typeof p === "string" ? { titulo: p, texto: "" } : p))
        .filter((p) => p && p.titulo);
    return [];
  }

  function normalizarChapa(registro) {
    return {
      id: registro.id,
      nome: registro.name,
      slogan: registro.slogan || "",
      sobre: registro.sobre || "",
      logo: registro.imagem ? pb.files.getUrl(registro, registro.imagem) : null,
      propostas: normalizarPropostas(registro.proposals),
      integrantes: Array.isArray(registro.integrantes)
        ? registro.integrantes
        : [],
    };
  }

  async function chapas() {
    try {
      const lista = await pb.collection("chapas").getFullList({ sort: "name" });
      return lista.map(normalizarChapa);
    } catch (err) {
      throw new Error(
        mensagemDeErro(err, "Não foi possível carregar as chapas."),
      );
    }
  }

  async function criarChapa({
    nome,
    slogan,
    sobre,
    propostas,
    integrantes,
    imagem,
  }) {
    const dados = new FormData();
    dados.append("name", nome);
    dados.append("slogan", slogan);
    dados.append("sobre", sobre);
    dados.append("proposals", JSON.stringify(propostas));
    dados.append("integrantes", JSON.stringify(integrantes));
    dados.append("createdby", usuario().id);
    if (imagem) dados.append("imagem", imagem);
    try {
      await pb.collection("chapas").create(dados);
    } catch (err) {
      throw new Error(
        mensagemDeErro(
          err,
          "Não foi possível cadastrar a chapa. Confira os campos e tente de novo.",
        ),
      );
    }
  }

  async function meuVoto() {
    const lista = await pb.collection("votos").getList(1, 1, {
      filter: `user = "${usuario().id}" && election_id = "${SITE.eleicaoId}"`,
    });
    if (!lista.totalItems) return null;
    const voto = lista.items[0];
    return voto.branco ? { branco: true } : { chapaId: voto.chapa };
  }

  async function votar(escolha) {
    const branco = escolha === "branco";
    const dados = { user: usuario().id, election_id: SITE.eleicaoId, branco };
    if (!branco) dados.chapa = escolha;
    try {
      await pb.collection("votos").create(dados);
    } catch (err) {
      const e = new Error(
        err.status === 400
          ? "Você já votou nesta eleição."
          : mensagemDeErro(
              err,
              "Não foi possível registrar seu voto. Tente novamente.",
            ),
      );
      e.jaVotou = err.status === 400;
      throw e;
    }
  }

  async function resultado() {
    const [linhasDb, todas] = await Promise.all([
      pb
        .collection("resultados")
        .getFullList({ filter: `election_id = "${SITE.eleicaoId}"` }),
      chapas(),
    ]);
    const porChapa = new Map(
      linhasDb.map((l) => [l.chapa || "branco", l.total]),
    );
    const itens = todas.map((c) => ({
      id: c.id,
      nome: c.nome,
      votos: porChapa.get(c.id) || 0,
    }));
    if (SITE.votoBranco)
      itens.push({
        id: "branco",
        nome: "Votos em branco",
        votos: porChapa.get("branco") || 0,
      });
    return itens;
  }

  async function noticias() {
    try {
      const lista = await pb.collection("noticias").getFullList({
        filter: "publicado = true",
        sort: "-data",
      });
      return lista.map((n) => ({
        id: n.id,
        titulo: n.titulo,
        resumo: n.resumo || "",
        corpo: n.corpo || "",
        data: String(n.data || n.created).slice(0, 10),
      }));
    } catch (err) {
      throw new Error(
        mensagemDeErro(err, "Não foi possível carregar as notícias."),
      );
    }
  }

  async function enviarSuporte({ nome, email, assunto, mensagem }) {
    const u = usuario();
    try {
      await pb.collection("mensagens").create({
        nome,
        email,
        assunto,
        mensagem,
        ...(u ? { user: u.id } : {}),
      });
    } catch (err) {
      throw new Error(
        mensagemDeErro(
          err,
          "Não foi possível enviar a mensagem. Tente novamente.",
        ),
      );
    }
  }

  window.API = {
    usuario,
    logado: () => Boolean(usuario()),
    podeCadastrarChapa: () => ["leader", "admin"].includes(usuario()?.role),
    entrarComGoogle,
    sair,
    chapas,
    criarChapa,
    meuVoto,
    votar,
    resultado,
    noticias,
    enviarSuporte,
  };
})();
