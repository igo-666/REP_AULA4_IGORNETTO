import { db, collection, getDocs } from "./firebase.js";

let carros = [];

// =====================
// FIREBASE
// =====================
async function carregarCarrosFirebase() {
  const snapshot = await getDocs(collection(db, "carros"));

  carros = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    carros.push({
      id: String(docSnap.id),
      nome: data.nome || "",
      preco: Number(data.preco) || 0,
      ano: Number(data.ano) || 0,
      km: Number(data.km) || 0,
      imagens: data.imagens || [data.imagem || ""]
    });
  });
}

// =====================
// FORMATAÇÃO MOEDA
// =====================
function formatarMoedaInput(input) {
  input.addEventListener("input", () => {
    let valor = input.value.replace(/\D/g, "");

    if (!valor) {
      input.value = "";
      return;
    }

    valor = (Number(valor) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2
    });

    input.value = valor;
  });
}

function parseMoeda(valor) {
  if (!valor) return 0;
  return Number(valor.replace(/\./g, "").replace(",", "."));
}

// =====================
// FAVORITOS
// =====================
function getFavoritos() {
  return JSON.parse(localStorage.getItem("favoritos")) || [];
}

function toggleFavorito(id) {
  let fav = getFavoritos();

  if (fav.includes(id)) {
    fav = fav.filter(f => f !== id);
  } else {
    fav.push(id);
  }

  localStorage.setItem("favoritos", JSON.stringify(fav));
  atualizarContadorFavoritos();

  renderPagina();
}

function atualizarContadorFavoritos() {
  const el = document.getElementById("contador-favoritos");
  if (el) el.textContent = getFavoritos().length;
}

// =====================
// RENDER LISTA
// =====================
function mostrarCarros(listaCarros) {
  const lista = document.getElementById("lista-carros");
  if (!lista) return;

  lista.innerHTML = "";

  const favoritos = getFavoritos();

  listaCarros.forEach(carro => {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <a href="carro.html?id=${carro.id}">
        <img src="${carro.imagens[0]}">
        <span class="favorito">
          ${favoritos.includes(carro.id) ? "❤️" : "🤍"}
        </span>

        <h2>${carro.nome}</h2>
        <p>R$ ${carro.preco.toLocaleString("pt-BR")}</p>
      </a>
    `;

    card.querySelector(".favorito").onclick = (e) => {
      e.preventDefault();
      toggleFavorito(carro.id);
    };

    lista.appendChild(card);
  });
}

// =====================
// FILTRO ESTOQUE
// =====================
function aplicarFiltros() {
  let lista = [...carros];

  const precoMax = parseMoeda(
    document.getElementById("filtro-preco")?.value
  );

  const ordenar = document.getElementById("ordenar")?.value;

  if (precoMax > 0) {
    lista = lista.filter(c => c.preco <= precoMax);
  }

  if (ordenar === "menor") {
    lista.sort((a, b) => a.preco - b.preco);
  }

  if (ordenar === "maior") {
    lista.sort((a, b) => b.preco - a.preco);
  }

  mostrarCarros(lista);
}

// =====================
// CARRO DETALHE + GALERIA
// =====================
function carregarCarro() {
  const id = new URLSearchParams(window.location.search).get("id");
  const carro = carros.find(c => c.id == id);
  if (!carro) return;

  document.getElementById("nome-carro").textContent = carro.nome;
  document.getElementById("preco-carro").textContent =
    "R$ " + carro.preco.toLocaleString("pt-BR");

  const imgPrincipal = document.getElementById("imagem-carro");
  imgPrincipal.src = carro.imagens[0];

  const miniaturas = document.getElementById("miniaturas");

  if (miniaturas) {
    miniaturas.innerHTML = "";

    carro.imagens.forEach(img => {
      const el = document.createElement("img");
      el.src = img;

      el.onclick = () => {
        imgPrincipal.src = img;
      };

      miniaturas.appendChild(el);
    });
  }
}

// =====================
// SIMULAÇÃO
// =====================
function simularFinanciamento() {
  const entrada = parseMoeda(document.getElementById("entrada").value);
  const parcelas = Number(document.getElementById("parcelas").value);

  const id = new URLSearchParams(window.location.search).get("id");
  const carro = carros.find(c => c.id == id);

  const valor = carro.preco - entrada;

  const taxa = 0.018;

  const parcela =
    valor * (taxa * Math.pow(1 + taxa, parcelas)) /
    (Math.pow(1 + taxa, parcelas) - 1);

  document.getElementById("resultado-simulacao").textContent =
    `${parcelas}x de R$ ${parcela.toFixed(2)}`;
}

// =====================
// CONTROLE PÁGINA
// =====================
function renderPagina() {
  const path = window.location.pathname;

  if (path.includes("estoque.html")) {
    mostrarCarros(carros);

    document.getElementById("filtro-preco")
      ?.addEventListener("input", aplicarFiltros);

    document.getElementById("ordenar")
      ?.addEventListener("change", aplicarFiltros);
  }

  if (path.includes("carro.html")) {
    carregarCarro();

    document.getElementById("btn-simular")
      ?.addEventListener("click", simularFinanciamento);

    const entradaInput = document.getElementById("entrada");
    if (entradaInput) formatarMoedaInput(entradaInput);
  }
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", async () => {
  atualizarContadorFavoritos();

  await carregarCarrosFirebase();

  renderPagina();
});