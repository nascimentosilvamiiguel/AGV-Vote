
(function () {
  "use strict";
  const { el } = window.GA;
  const SVG = "http://www.w3.org/2000/svg";

  function svg(w, h, children, attrs) {
    const s = document.createElementNS(SVG, "svg");
    s.setAttribute("viewBox", `0 0 ${w} ${h}`);
    s.setAttribute("width", String(w));
    s.setAttribute("height", String(h));
    s.setAttribute("aria-hidden", "true");
    for (const [k, v] of Object.entries(attrs || {})) s.setAttribute(k, v);
    s.innerHTML = children;  
    return s;
  }

  const page = (document.body.dataset.page || "").toLowerCase();
  const API = window.API;

   
  if (document.body.dataset.auth === "required" && !API.logado()) {
    const atual = location.pathname.split("/").pop() || "home.html";
    location.replace("login.html?next=" + encodeURIComponent(atual));
    return;
  }

  const links = [
    ["home", "home.html", "Home"],
    ["sobre", "home.html#sobre", "Sobre"],
    ["chapas", "chapas.html", "Chapas"],
    ["votacao", "votacao.html", "Votar"],
    ["noticias", "noticias.html", "Notícias"],
    ["suporte", "suporte.html", "Suporte"],
  ];
  if (API.podeCadastrarChapa()) links.push(["form", "form.html", "Nova chapa"]);

  
  function authLink() {
    if (!API.logado()) {
      const next = encodeURIComponent(location.pathname.split("/").pop() || "home.html");
      return el("a", { class: "nav-auth", href: "login.html?next=" + next }, "Entrar");
    }
    const sair = el("button", { class: "nav-auth", type: "button" }, "Sair");
    sair.addEventListener("click", () => {
      API.sair();
      location.href = "login.html";
    });
    return el(
      "span",
      { class: "nav-user" },
      el("span", { class: "nav-email", title: API.usuario().email, text: API.usuario().email }),
      sair,
    );
  }

   
  const header = document.getElementById("site-header");
  if (header) {
    const nav = el(
      "nav",
      { class: "nav", id: "menu", "aria-label": "Principal" },
      links.map(([key, href, label]) =>
        el("a", { href, "aria-current": key === page ? "page" : false }, label),
      ),
      authLink(),
    );
    const btn = el(
      "button",
      {
        class: "menu-btn",
        type: "button",
        "aria-expanded": "false",
        "aria-controls": "menu",
        "aria-label": "Abrir menu",
      },
      svg(
        28,
        28,
        '<path d="M3 7h22M3 14h22M3 21h22" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>',
      ),
    );
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) nav.classList.remove("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        btn.focus();
      }
    });

    header.className = "site-header";

    const updateShadow = () => header.classList.toggle("scrolled", window.scrollY > 4);
    window.addEventListener("scroll", updateShadow, { passive: true });
    updateShadow();
    header.append(
      el(
        "a",
        { class: "brand", href: "home.html", "aria-label": "Grêmio Estudantil — página inicial" },
        el("img", { src: "../assets/logo.png", alt: "", width: "65", height: "38" }),
        el("span", { text: "Grêmio Estudantil" }),
      ),
      btn,
      nav,
    );
  }

   
  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    const phone = svg(
      26,
      26,
      '<circle cx="13" cy="13" r="13" fill="#fff"/><path d="M8.6 7.5c.5-.5 1.3-.5 1.8 0l1.4 1.8c.4.5.3 1.200-.1 1.600l-.8.800c.8 1.600 2.100 2.900 3.700 3.700l.8-.8c.4-.4 1.100-.5 1.600-.1l1.800 1.400c.5.500.5 1.300 0 1.800l-.9.900c-.8.800-2 1-3 .6-4-1.600-6.700-4.300-8.300-8.300-.4-1 -.2-2.200.6-3z" fill="#000435"/>',
    );
    const mail = svg(
      26,
      26,
      '<circle cx="13" cy="13" r="13" fill="#fff"/><rect x="6" y="8.500" width="14" height="9.500" rx="1.500" fill="none" stroke="#000435" stroke-width="1.800"/><path d="M6.500 9.500l6.500 5 6.500-5" fill="none" stroke="#000435" stroke-width="1.800"/>',
    );
    footer.append(
      el("address", { text: "R. Júlia da Costa, 780 - Campo Grande, Paranaguá - PR, 83203-060" }),
      el(
        "div",
        { class: "footer-contacts" },
        el("a", { href: "tel:+554134233819" }, phone, "(41) 3423-3819"),
        el(
          "a",
          { href: "mailto:pngalbertogomes@seed.pr.gov.br" },
          mail,
          "pngalbertogomes@seed.pr.gov.br",
        ),
      ),
      el("small", { text: "© 2026  Rafael N. Silva. Todos os direitos reservados." }),
    );
  }

   
  const revealItems = document.querySelectorAll(".reveal");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (revealItems.length && "IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("js-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 },
    );
    revealItems.forEach((item) => observer.observe(item));
  }
})();
