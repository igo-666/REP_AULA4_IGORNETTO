import { db, collection, getDocs } from "./firebase.js";
import { getFavoritos, toggleFavorito } from "./favoritos.js";
import { buildWhatsAppUrl } from "./contact-utils.js";
import { BUSINESS_CONFIG } from "./business-config.js";

let carros = [];

function atualizarContador() {
  const el = document.getElementById("contador-favoritos");
  if (el) el.textContent = getFavoritos().length;
}

async function carregarCarros() {
  const snapshot = await getDocs(collection(db, "carros"));
  carros = [];
  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    carros.push({
      id: docSnap.id,
      nome: d.nome || "",
      preco: Number(d.precoValor ?? d.preco ?? 0),
      imagem: d.imagens?.[0] || d.imagem || "ASSETS/imagens/opala1.jpg"
    });
  });
}

function render() {
  const lista = document.getElementById("lista-carros");
  const empty = document.getElementById("sem-favoritos");
  if (!lista) return;

  const favIds = getFavoritos();
  const favCarros = carros.filter(c => favIds.includes(c.id));

  lista.innerHTML = "";

  if (!favCarros.length) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  favCarros.forEach(c => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <a href="carro.html?id=${c.id}">
        <img src="${c.imagem}">
        <h2>${c.nome}</h2>
        <p>R$ ${c.preco.toLocaleString("pt-BR")}</p>
      </a>
      <div style="padding: 12px 14px;">
        <button class="btn btn-secundario" data-id="${c.id}" type="button">Remover dos favoritos</button>
      </div>
    `;

    card.querySelector("button")?.addEventListener("click", (e) => {
      e.preventDefault();
      const id = e.currentTarget.dataset.id;
      toggleFavorito(id);
      atualizarContador();
      render();
    });

    lista.appendChild(card);
  });
}

function wireActions() {
  document.getElementById("btn-limpar")?.addEventListener("click", () => {
    localStorage.removeItem("favoritos");
    atualizarContador();
    render();
  });

  document.getElementById("btn-enviar-whatsapp")?.addEventListener("click", () => {
    const favIds = getFavoritos();
    const favCarros = carros.filter(c => favIds.includes(c.id));
    if (!favCarros.length) {
      alert("Você ainda não tem favoritos.");
      return;
    }

    const texto = favCarros
      .map(c => `- ${c.nome} (R$ ${c.preco.toLocaleString("pt-BR")})`)
      .join("\n");

    const msg = encodeURIComponent(
      `Olá! Tenho interesse nesses veículos:\n\n${texto}\n\nEnviado pelo ${BUSINESS_CONFIG.brandName}`
    );
    window.open(buildWhatsAppUrl(decodeURIComponent(msg)), "_blank");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  atualizarContador();
  await carregarCarros();
  wireActions();
  render();
});

