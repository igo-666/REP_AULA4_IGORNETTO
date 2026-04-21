import { getFavoritos } from "./favoritos.js";
import { BUSINESS_CONFIG } from "./business-config.js";
import { buildWhatsAppUrl } from "./contact-utils.js";

function syncDocumentTitle() {
  const b = BUSINESS_CONFIG.brandName;
  document.title = document.title
    .replace(/PREMIUM MOTORS/gi, b)
    .replace(/Premium Motors/g, b);
}

function syncSeoMeta() {
  const { brandName, city, siteUrl } = BUSINESS_CONFIG;
  const desc = `${brandName} em ${city}: veículos seminovos e usados, estoque online e atendimento pelo WhatsApp.`;
  const title = document.title;

  document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", desc);

  const base = (siteUrl || "").trim().replace(/\/$/, "");
  if (base) {
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    const path = typeof location !== "undefined" ? location.pathname || "/" : "/";
    const q = typeof location !== "undefined" && location.search ? location.search : "";
    ogUrl.setAttribute("content", `${base}${path === "//" ? "/" : path}${q}`);
  }
}

syncDocumentTitle();
syncSeoMeta();

function atualizarContadorFavoritos() {
  const el = document.getElementById("contador-favoritos");
  if (el) el.textContent = getFavoritos().length;
}

function aplicarMarcaEContatos() {
  // Marca
  document.querySelectorAll(".logo").forEach(el => {
    el.textContent = BUSINESS_CONFIG.brandName;
  });

  // Rodapé
  document.querySelectorAll("footer").forEach(footer => {
    const ps = footer.querySelectorAll("p");
    if (ps[0]) ps[0].textContent = `© ${new Date().getFullYear()} ${BUSINESS_CONFIG.brandName}`;
    if (ps[1]) ps[1].textContent = `Contato: ${BUSINESS_CONFIG.contactPhone}`;
  });

  // Links WhatsApp genéricos
  document.querySelectorAll('a.whatsapp-float, a[href*="wa.me/"]').forEach(a => {
    const existing = a.getAttribute("href") || "";
    const hasText = existing.includes("?text=");
    if (hasText) {
      const textPart = existing.split("?text=")[1] || "";
      const decoded = decodeURIComponent(textPart);
      a.setAttribute("href", buildWhatsAppUrl(decoded));
    } else {
      a.setAttribute("href", buildWhatsAppUrl());
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarMarcaEContatos();
  atualizarContadorFavoritos();
  syncDocumentTitle();
  syncSeoMeta();
});

window.addEventListener("favoritos:changed", atualizarContadorFavoritos);
window.addEventListener("storage", atualizarContadorFavoritos);

