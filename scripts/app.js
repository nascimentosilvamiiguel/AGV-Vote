
(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === false || value == null) continue;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("on") && typeof value === "function") {
        node.addEventListener(key.slice(2), value);
      } else node.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  function toast(message, type) {
    let box = $("#toasts");
    if (!box) {
      box = el("div", { id: "toasts", role: "status", "aria-live": "polite" });
      document.body.append(box);
    }
    const item = el("div", { class: "toast " + (type || ""), text: message });
    box.append(item);
    setTimeout(() => {
      item.classList.add("leaving");
      setTimeout(() => item.remove(), 300);
    }, 4200);
  }

  
  function showState(container, kind, message) {
    container.replaceChildren(
      el(
        "div",
        {
          class: "state " + (kind === "erro" ? "erro" : ""),
          role: kind === "erro" ? "alert" : "status",
        },
        kind === "loading" ? el("div", { class: "spinner", "aria-hidden": "true" }) : null,
        message,
      ),
    );
  }

  

  function openModal(dialog) {
    dialog.classList.remove("closing");
    dialog.showModal();
  }

  function closeModal(dialog) {
    if (!dialog.open || dialog.classList.contains("closing")) return Promise.resolve();
    return new Promise((resolve) => {
      let finished = false;
      const onEnd = (event) => {
        if (event.target === dialog) finish();
      };
      const finish = () => {
        if (finished) return;
        finished = true;
        dialog.removeEventListener("animationend", onEnd);
        dialog.classList.remove("closing");
        dialog.close();
        resolve();
      };
      if (reduceMotion()) return finish();
      dialog.classList.add("closing");
      dialog.addEventListener("animationend", onEnd);
      setTimeout(finish, 400);  
    });
  }

  
  function bindModal(dialog) {
    const tryClose = () => {
      if (dialog.dataset.busy !== "true") closeModal(dialog);
    };
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      tryClose();
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target.closest("[data-close]")) tryClose();
    });
  }

  function fmtDate(iso) {
    return new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  
  function safeNext(value, fallback) {
    return /^[a-z0-9_-]+\.html(#[\w-]*)?$/i.test(value || "") ? value : fallback;
  }

  
  const iniciais = (nome) =>
    String(nome || "")
      .split(" ")
      .filter((parte) => parte && !["e", "de", "da", "do", "das", "dos"].includes(parte.toLowerCase()))
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase();

  window.GA = {
    iniciais,
    $,
    el,
    wait,
    toast,
    showState,
    openModal,
    closeModal,
    bindModal,
    fmtDate,
    safeNext,
  };
})();
