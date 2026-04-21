import { db, collection, getDocs } from "./firebase.js";
import { getFavoritos, toggleFavorito } from "./favoritos.js";
import { formatarMoedaInput, parseMoeda } from "./utils.js";

let carros = [];
let carregando = false;

function atualizarContadorFavoritos() {
  const el = document.getElementById("contador-favoritos");
  if (el) el.textContent = getFavoritos().length;
}

function setLoading(isLoading) {
  carregando = isLoading;
  const el = document.getElementById("lista-carros");
  if (!el) return;

  if (!isLoading) return;

  el.innerHTML = Array.from({ length: 8 }).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-line mid"></div>
      <div class="skeleton-line short"></div>
    </div>
  `).join("");
}

async function carregarCarros() {
  setLoading(true);
  const snapshot = await getDocs(collection(db, "carros"));

  carros = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();

    carros.push({
      id: docSnap.id,
      nome: d.nome || "",
      tipo: d.tipo || "",
      preco: Number(d.precoValor ?? d.preco ?? 0),
      ano: Number(d.ano ?? 0),
      km: Number(d.km ?? 0),
      combustivel: d.combustivel || "",
      cambio: d.cambio || "",
      imagem: d.imagens?.[0] || d.imagem || "ASSETS/imagens/opala1.jpg"
    });
  });

  setLoading(false);
  aplicarFiltros();
}

function mostrarCarros(lista) {
  const el = document.getElementById("lista-carros");
  el.innerHTML = "";

  const fav = getFavoritos();

  lista.forEach(c => {
    const div = document.createElement("div");

    div.innerHTML = `
      <a class="car-card" href="carro.html?id=${c.id}">
        <button class="fav-btn" type="button" aria-label="Favoritar" data-id="${c.id}">
          ${fav.includes(c.id) ? "❤️" : "🤍"}
        </button>

        <div class="car-image">
          <img src="${c.imagem}" alt="${c.nome}">
        </div>

        <div class="car-body">
          <h3>${c.nome}</h3>
          <div class="price">R$ ${c.preco.toLocaleString("pt-BR")}</div>
          <div class="car-meta">
            <span>${c.ano || "-"}</span>
            <span>${c.km ? `${Number(c.km).toLocaleString("pt-BR")} km` : "-"}</span>
          </div>
          <div class="car-meta" style="margin-top:8px;">
            <span>${c.combustivel || "-"}</span>
            <span>${c.cambio || "-"}</span>
          </div>
        </div>
      </a>
    `;

    div.querySelector(".fav-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = e.currentTarget.dataset.id;
      toggleFavorito(id);
      atualizarContadorFavoritos();
      aplicarFiltros();
    });

    el.appendChild(div);
  });
}

function aplicarFiltros() {
  let lista = [...carros];

  const busca = (document.getElementById("busca-nome")?.value || "").trim().toLowerCase();
  const tipo = (document.getElementById("filtro-tipo")?.value || "").toLowerCase();
  const precoMax = parseMoeda(document.getElementById("filtro-preco")?.value || "");
  const anoMin = Number(document.getElementById("filtro-ano-min")?.value || 0);
  const anoMax = Number(document.getElementById("filtro-ano-max")?.value || 0);
  const kmMax = Number(document.getElementById("filtro-km-max")?.value || 0);
  const ordenar = document.getElementById("ordenar")?.value || "";

  if (busca) {
    lista = lista.filter(c => String(c.nome || "").toLowerCase().includes(busca));
  }

  if (tipo) {
    lista = lista.filter(c => String(c.tipo || "").toLowerCase() === tipo);
  }

  if (precoMax > 0) lista = lista.filter(c => c.preco <= precoMax);

  if (anoMin > 0) lista = lista.filter(c => (c.ano || 0) >= anoMin);
  if (anoMax > 0) lista = lista.filter(c => (c.ano || 0) <= anoMax);
  if (kmMax > 0) lista = lista.filter(c => (c.km || 0) <= kmMax);

  if (ordenar === "menor") lista.sort((a, b) => a.preco - b.preco);
  if (ordenar === "maior") lista.sort((a, b) => b.preco - a.preco);
  if (ordenar === "novo") lista.sort((a, b) => (b.ano || 0) - (a.ano || 0));
  if (ordenar === "km") lista.sort((a, b) => (a.km || 0) - (b.km || 0));

  const contador = document.getElementById("contador-resultados");
  const sem = document.getElementById("sem-resultado");
  if (contador) contador.textContent = `${lista.length} veículo(s) encontrado(s)`;
  if (sem) sem.style.display = lista.length ? "none" : "block";

  mostrarCarros(lista);
}

function limparFiltros() {
  const ids = ["busca-nome", "filtro-tipo", "filtro-preco", "filtro-ano-min", "filtro-ano-max", "filtro-km-max", "ordenar"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "SELECT") el.value = "";
    else el.value = "";
  });
  aplicarFiltros();
}

document.addEventListener("DOMContentLoaded", () => {
  atualizarContadorFavoritos();

  const precoInput = document.getElementById("filtro-preco");
  if (precoInput) formatarMoedaInput(precoInput);

  document.getElementById("busca-nome")?.addEventListener("input", aplicarFiltros);
  document.getElementById("filtro-tipo")?.addEventListener("change", aplicarFiltros);
  document.getElementById("filtro-preco")?.addEventListener("input", aplicarFiltros);
  document.getElementById("filtro-ano-min")?.addEventListener("input", aplicarFiltros);
  document.getElementById("filtro-ano-max")?.addEventListener("input", aplicarFiltros);
  document.getElementById("filtro-km-max")?.addEventListener("input", aplicarFiltros);
  document.getElementById("ordenar")?.addEventListener("change", aplicarFiltros);
  document.getElementById("btn-limpar-filtros")?.addEventListener("click", limparFiltros);

  carregarCarros();
});