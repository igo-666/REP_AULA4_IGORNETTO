import { db, collection, getDocs } from "./firebase.js";
import { toggleFavorito, isFavorito } from "./favoritos.js";
import { parseMoeda, formatarMoedaInput } from "./utils.js";
import { buildWhatsAppUrl } from "./contact-utils.js";
import { BUSINESS_CONFIG } from "./business-config.js";

let carros = [];
let galeria = {
  imagens: [],
  index: 0,
  touch: {
    startX: 0,
    startY: 0,
    moved: false
  },
  modal: {
    open: false,
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    dragStartX: 0,
    dragStartY: 0,
    dragging: false
  }
};

async function init() {
  const snapshot = await getDocs(collection(db, "carros"));

  snapshot.forEach(docSnap => {
    const d = docSnap.data();

    carros.push({
      id: docSnap.id,
      nome: d.nome,
      preco: Number(d.precoValor ?? d.preco ?? 0),
      ano: d.ano ?? null,
      km: d.km ?? null,
      combustivel: d.combustivel || "",
      cambio: d.cambio || "",
      cor: d.cor || "",
      placaFinal: d.placaFinal || "",
      imagens: d.imagens || [d.imagem]
    });
  });

  carregarCarro();
}

function normalizarImagens(arr) {
  const list = (arr || []).filter(Boolean).map(String);
  // remove strings vazias e valores "undefined"/"null"
  return list.filter(u => u && u !== "undefined" && u !== "null");
}

function setImagemPrincipal(index) {
  const img = document.getElementById("imagem-carro");
  const contador = document.getElementById("galeria-contador");
  const prev = document.getElementById("galeria-prev");
  const next = document.getElementById("galeria-next");
  const mini = document.getElementById("miniaturas");

  if (!img) return;

  if (!galeria.imagens.length) {
    img.src = "ASSETS/imagens/opala1.jpg";
    img.alt = "Sem imagem disponível";
    if (contador) contador.textContent = "";
    if (prev) {
      prev.disabled = true;
      prev.classList.add("hidden");
    }
    if (next) {
      next.disabled = true;
      next.classList.add("hidden");
    }
    if (contador) contador.classList.add("hidden");
    if (mini) mini.innerHTML = "";
    return;
  }

  // wrap (loop)
  const total = galeria.imagens.length;
  galeria.index = ((index % total) + total) % total;

  const url = galeria.imagens[galeria.index];

  img.classList.add("trocando");
  const pre = new Image();
  pre.onload = () => {
    img.src = url;
    img.classList.remove("trocando");
  };
  pre.onerror = () => {
    img.src = url; // tenta mesmo assim
    img.classList.remove("trocando");
  };
  pre.src = url;

  if (contador) {
    contador.textContent = `${galeria.index + 1}/${total}`;
    contador.classList.toggle("hidden", total <= 1);
  }
  if (prev) {
    prev.disabled = total <= 1;
    prev.classList.toggle("hidden", total <= 1);
  }
  if (next) {
    next.disabled = total <= 1;
    next.classList.toggle("hidden", total <= 1);
  }

  if (mini) {
    [...mini.querySelectorAll("img")].forEach((el, i) => {
      if (i === galeria.index) el.classList.add("ativa");
      else el.classList.remove("ativa");
    });
  }
}

function montarMiniaturas() {
  const mini = document.getElementById("miniaturas");
  if (!mini) return;

  mini.innerHTML = "";

  galeria.imagens.forEach((url, i) => {
    const el = document.createElement("img");
    el.src = url;
    el.alt = `Miniatura ${i + 1}`;
    el.loading = "lazy";
    el.onclick = () => setImagemPrincipal(i);
    mini.appendChild(el);
  });
}

function isHorizontalSwipe({ dx, dy }) {
  return Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2;
}

function wireSwipeOnElement(el, { onLeft, onRight }) {
  if (!el) return;

  el.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    galeria.touch.startX = e.touches[0].clientX;
    galeria.touch.startY = e.touches[0].clientY;
    galeria.touch.moved = false;
  }, { passive: true });

  el.addEventListener("touchmove", (e) => {
    if (e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - galeria.touch.startX;
    const dy = e.touches[0].clientY - galeria.touch.startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) galeria.touch.moved = true;
  }, { passive: true });

  el.addEventListener("touchend", (e) => {
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - galeria.touch.startX;
    const dy = t.clientY - galeria.touch.startY;
    if (!isHorizontalSwipe({ dx, dy })) return;
    if (dx < 0) onLeft?.();
    else onRight?.();
  }, { passive: true });
}

function resetModalPanZoom() {
  galeria.modal.zoomLevel = 1;
  galeria.modal.panX = 0;
  galeria.modal.panY = 0;
  applyModalTransform();
}

function applyModalTransform() {
  const img = document.getElementById("galeria-modal-img");
  if (!img) return;

  img.classList.remove("zoom-2x", "zoom-3x");
  if (galeria.modal.zoomLevel === 2) img.classList.add("zoom-2x");
  if (galeria.modal.zoomLevel === 3) img.classList.add("zoom-3x");

  img.style.transform = `translate(${galeria.modal.panX}px, ${galeria.modal.panY}px) scale(${galeria.modal.zoomLevel})`;
}

function openModal() {
  const modal = document.getElementById("galeria-modal");
  const img = document.getElementById("galeria-modal-img");
  if (!modal || !img) return;
  if (!galeria.imagens.length) return;

  galeria.modal.open = true;
  modal.classList.add("ativa");
  modal.setAttribute("aria-hidden", "false");

  img.src = galeria.imagens[galeria.index];
  resetModalPanZoom();

  // trava scroll do body
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("galeria-modal");
  if (!modal) return;
  galeria.modal.open = false;
  modal.classList.remove("ativa");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function wireModal() {
  const modal = document.getElementById("galeria-modal");
  const closeBtn = document.getElementById("galeria-modal-fechar");
  const prev = document.getElementById("galeria-modal-prev");
  const next = document.getElementById("galeria-modal-next");
  const zoomBtn = document.getElementById("galeria-modal-zoom");
  const stage = document.querySelector(".galeria-modal-stage");
  const modalImg = document.getElementById("galeria-modal-img");

  // abrir no click da imagem principal
  document.getElementById("imagem-carro")?.addEventListener("click", () => {
    openModal();
  });

  closeBtn?.addEventListener("click", closeModal);

  // clicar fora do stage fecha
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  prev?.addEventListener("click", () => {
    setImagemPrincipal(galeria.index - 1);
    if (modalImg) modalImg.src = galeria.imagens[galeria.index];
    resetModalPanZoom();
  });
  next?.addEventListener("click", () => {
    setImagemPrincipal(galeria.index + 1);
    if (modalImg) modalImg.src = galeria.imagens[galeria.index];
    resetModalPanZoom();
  });

  zoomBtn?.addEventListener("click", () => {
    galeria.modal.zoomLevel = galeria.modal.zoomLevel === 1 ? 2 : (galeria.modal.zoomLevel === 2 ? 3 : 1);
    if (galeria.modal.zoomLevel === 1) {
      galeria.modal.panX = 0;
      galeria.modal.panY = 0;
    }
    applyModalTransform();
  });

  // arrastar para pan quando zoomado
  stage?.addEventListener("pointerdown", (e) => {
    if (!galeria.modal.open) return;
    if (galeria.modal.zoomLevel === 1) return;
    galeria.modal.dragging = true;
    galeria.modal.dragStartX = e.clientX - galeria.modal.panX;
    galeria.modal.dragStartY = e.clientY - galeria.modal.panY;
    stage.setPointerCapture?.(e.pointerId);
  });
  stage?.addEventListener("pointermove", (e) => {
    if (!galeria.modal.dragging) return;
    galeria.modal.panX = e.clientX - galeria.modal.dragStartX;
    galeria.modal.panY = e.clientY - galeria.modal.dragStartY;
    applyModalTransform();
  });
  stage?.addEventListener("pointerup", () => {
    galeria.modal.dragging = false;
  });
  stage?.addEventListener("pointercancel", () => {
    galeria.modal.dragging = false;
  });

  // swipe no modal
  wireSwipeOnElement(modal, {
    onLeft: () => {
      setImagemPrincipal(galeria.index + 1);
      if (modalImg) modalImg.src = galeria.imagens[galeria.index];
      resetModalPanZoom();
    },
    onRight: () => {
      setImagemPrincipal(galeria.index - 1);
      if (modalImg) modalImg.src = galeria.imagens[galeria.index];
      resetModalPanZoom();
    }
  });

  // swipe na imagem principal (fora do modal)
  wireSwipeOnElement(document.querySelector(".imagem-principal"), {
    onLeft: () => setImagemPrincipal(galeria.index + 1),
    onRight: () => setImagemPrincipal(galeria.index - 1)
  });
}

function wireGaleriaControles() {
  const prev = document.getElementById("galeria-prev");
  const next = document.getElementById("galeria-next");

  prev?.addEventListener("click", () => setImagemPrincipal(galeria.index - 1));
  next?.addEventListener("click", () => setImagemPrincipal(galeria.index + 1));

  // Teclado (somente na página do carro)
  document.addEventListener("keydown", (e) => {
    if (!galeria.imagens.length) return;
    if (galeria.modal.open) {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") {
        setImagemPrincipal(galeria.index - 1);
        const modalImg = document.getElementById("galeria-modal-img");
        if (modalImg) modalImg.src = galeria.imagens[galeria.index];
        resetModalPanZoom();
      }
      if (e.key === "ArrowRight") {
        setImagemPrincipal(galeria.index + 1);
        const modalImg = document.getElementById("galeria-modal-img");
        if (modalImg) modalImg.src = galeria.imagens[galeria.index];
        resetModalPanZoom();
      }
      return;
    }
    if (e.key === "ArrowLeft") setImagemPrincipal(galeria.index - 1);
    if (e.key === "ArrowRight") setImagemPrincipal(galeria.index + 1);
  });
}

function carregarCarro() {
  const id = new URLSearchParams(window.location.search).get("id");
  const carro = carros.find(c => c.id == id);

  if (!carro) return;

  document.getElementById("nome-carro").textContent = carro.nome;
  document.getElementById("preco-carro").textContent =
    "R$ " + carro.preco.toLocaleString("pt-BR");

  const marca = BUSINESS_CONFIG.brandName;
  document.title = `${carro.nome} — ${marca}`;
  const carDesc =
    `${carro.nome} — R$ ${carro.preco.toLocaleString("pt-BR")} · ${marca} (${BUSINESS_CONFIG.city}). Fotos, ficha e contato pelo WhatsApp.`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", carDesc);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", carDesc);

  // Ficha técnica
  const setText = (elId, v) => {
    const el = document.getElementById(elId);
    if (el) el.textContent = (v === null || v === undefined || v === "") ? "-" : String(v);
  };

  setText("ft-ano", carro.ano ?? "-");
  setText("ft-km", carro.km ? `${Number(carro.km).toLocaleString("pt-BR")} km` : "-");
  setText("ft-combustivel", carro.combustivel);
  setText("ft-cambio", carro.cambio);
  setText("ft-cor", carro.cor);
  setText("ft-placaFinal", carro.placaFinal);

  // WhatsApp CTA (mensagem automática + link do veículo)
  const btnWhats = document.getElementById("btn-whatsapp");
  if (btnWhats) {
    const url = window.location.href;
    const msg = encodeURIComponent(
      `Olá! Tenho interesse no veículo: ${carro.nome}\n` +
      `Preço: R$ ${carro.preco.toLocaleString("pt-BR")}\n\n` +
      `Link: ${url}\n\n` +
      `${marca}`
    );
    btnWhats.href = buildWhatsAppUrl(decodeURIComponent(msg));
  }

  galeria.imagens = normalizarImagens(carro.imagens);
  galeria.index = 0;

  const imgOg = galeria.imagens[0];
  if (imgOg) {
    document.querySelector('meta[property="og:image"]')?.setAttribute("content", imgOg);
  }

  const base = (BUSINESS_CONFIG.siteUrl || "").trim().replace(/\/$/, "");
  if (base) {
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute("content", `${base}${location.pathname}${location.search || ""}`);
  }

  montarMiniaturas();
  setImagemPrincipal(0);
  wireGaleriaControles();
  wireModal();

  const btnFav = document.getElementById("btn-favorito");

  function renderFav() {
    btnFav.textContent = isFavorito(id)
      ? "❤️ Remover"
      : "🤍 Favoritar";
  }

  renderFav();

  btnFav.onclick = () => {
    toggleFavorito(id);
    renderFav();
  };

  document.getElementById("btn-simular").onclick = () => {
    const entrada = parseMoeda(document.getElementById("entrada").value);
    const parcelas = Number(document.getElementById("parcelas").value);

    const valor = carro.preco - entrada;
    const taxa = 0.018;

    const p =
      valor *
      (taxa * Math.pow(1 + taxa, parcelas)) /
      (Math.pow(1 + taxa, parcelas) - 1);

    document.getElementById("resultado-simulacao").textContent =
      `${parcelas}x de R$ ${p.toFixed(2)}`;

    const totalEl = document.getElementById("resultado-total");
    if (totalEl) {
      const total = p * parcelas + entrada;
      totalEl.textContent = `Total estimado: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    }

    const btnFin = document.getElementById("btn-financiamento");
    if (btnFin) {
      btnFin.style.display = "inline-block";
      btnFin.onclick = () => {
        const url = window.location.href;
        const msg = encodeURIComponent(
          `Olá! Quero simular financiamento desse veículo:\n\n` +
          `Veículo: ${carro.nome}\n` +
          `Preço: R$ ${carro.preco.toLocaleString("pt-BR")}\n` +
          `Entrada: R$ ${entrada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
          `Parcelas: ${parcelas}x\n` +
          `Parcela estimada: R$ ${p.toFixed(2)}\n\n` +
          `Link: ${url}\n\n` +
          `${marca}`
        );
        window.open(buildWhatsAppUrl(decodeURIComponent(msg)), "_blank");
      };
    }
  };
}

document.addEventListener("DOMContentLoaded", init);

document.addEventListener("DOMContentLoaded", () => {
  const entrada = document.getElementById("entrada");
  if (entrada) formatarMoedaInput(entrada);
});