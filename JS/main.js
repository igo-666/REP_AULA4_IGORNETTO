// =====================
// DADOS DOS CARROS
// =====================
const carros = [
  {
    id: 1,
    nome: "Onix 2020",
    preco: "R$ 45.000",
    precoValor: 45000,
    tipo: "carro",
    perfil: "economia",
    ano: 2020,
    km: 40000,
    imagem: "ASSETS/imagens/onix.jpg"
  },
  {
    id: 2,
    nome: "Jeep Compass 2021",
    preco: "R$ 95.000",
    precoValor: 95000,
    tipo: "SUV",
    perfil: "conforto",
    ano: 2021,
    km: 30000,
    imagem: "ASSETS/imagens/compass.jpg"
  },
  {
    id: 3,
    nome: "HB20 2019",
    preco: "R$ 42.000",
    precoValor: 42000,
    tipo: "carro",
    perfil: "economia",
    ano: 2019,
    km: 50000,
    imagem: "ASSETS/imagens/hb20.jpg"
  }
];


// =====================
// FAVORITOS
// =====================
function getFavoritos() {
  return JSON.parse(localStorage.getItem("favoritos")) || [];
}

function salvarFavoritos(lista) {
  localStorage.setItem("favoritos", JSON.stringify(lista));
}

function toggleFavorito(id) {
  let favoritos = getFavoritos();

  if (favoritos.includes(id)) {
    favoritos = favoritos.filter(f => f !== id);
  } else {
    favoritos.push(id);
  }

  salvarFavoritos(favoritos);
  atualizarContadorFavoritos();

  if (document.getElementById("lista-carros")) {
    aplicarFiltros();
  }
}


// =====================
// CONTADOR MENU
// =====================
function atualizarContadorFavoritos() {
  const contador = document.getElementById("contador-favoritos");
  if (!contador) return;

  contador.textContent = getFavoritos().length;
}


// =====================
// MOSTRAR CARROS
// =====================
function mostrarCarros(listaCarros) {
  const lista = document.getElementById("lista-carros");
  if (!lista) return;

  const favoritos = getFavoritos();
  lista.innerHTML = "";

  listaCarros.forEach(carro => {

    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <a href="carro.html?id=${carro.id}" class="card-link">

        <div class="card-top">
          <img src="${carro.imagem}">
          <span class="favorito ${favoritos.includes(carro.id) ? 'ativo' : ''}">
            ${favoritos.includes(carro.id) ? "❤️" : "🤍"}
          </span>
        </div>

        <div class="card-body">
          <h2>${carro.nome}</h2>
          <p class="preco">${carro.preco}</p>

          <div class="card-meta">
            <span>${carro.ano}</span>
            <span>${carro.km} km</span>
          </div>
        </div>

      </a>
    `;

    // 👉 clique no coração NÃO abre o card
    card.querySelector(".favorito").onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorito(carro.id);
    };

    lista.appendChild(card);
  });
}


// =====================
// FILTROS
// =====================
function aplicarFiltros() {
  const tipo = document.getElementById("filtro-tipo")?.value;
  const preco = document.getElementById("filtro-preco")?.value;
  const ordenar = document.getElementById("ordenar")?.value;

  let filtrados = [...carros];

  if (tipo) filtrados = filtrados.filter(c => c.tipo === tipo);
  if (preco) filtrados = filtrados.filter(c => c.precoValor <= preco);

  switch (ordenar) {
    case "menor":
      filtrados.sort((a, b) => a.precoValor - b.precoValor);
      break;
    case "maior":
      filtrados.sort((a, b) => b.precoValor - a.precoValor);
      break;
    case "novo":
      filtrados.sort((a, b) => b.ano - a.ano);
      break;
    case "km":
      filtrados.sort((a, b) => a.km - b.km);
      break;
  }

  mostrarCarros(filtrados);
}


// =====================
// PÁGINA DO CARRO
// =====================
function carregarCarro() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  const carro = carros.find(c => c.id == id);
  if (!carro) return;

  document.getElementById("nome-carro").textContent = carro.nome;
  document.getElementById("imagem-carro").src = carro.imagem;
  document.getElementById("preco-carro").textContent = carro.preco;

  const btnZap = document.getElementById("btn-whatsapp");
  if (btnZap) {
    btnZap.href = `https://wa.me/5527992821705?text=Olá, tenho interesse no ${carro.nome}`;
  }

  // BOTÃO FAVORITO
  const btnFav = document.getElementById("btn-favorito");

  if (btnFav) {

    const atualizar = () => {
      const fav = getFavoritos().includes(carro.id);
      btnFav.textContent = fav ? "FAVORITO ❤️" : "ADICIONAR AOS FAVORITOS 🤍";
    };

    atualizar();

    btnFav.onclick = () => {
      toggleFavorito(carro.id);
      atualizar();
    };
  }
}


// =====================
// FAVORITOS PAGE
// =====================
function mostrarFavoritos() {
  const favoritos = getFavoritos();
  const lista = carros.filter(c => favoritos.includes(c.id));

  mostrarCarros(lista);
}


// =====================
// LIMPAR FAVORITOS
// =====================
function limparFavoritos() {
  localStorage.removeItem("favoritos");
  mostrarFavoritos();
  atualizarContadorFavoritos();
}


// =====================
// WHATSAPP FAVORITOS
// =====================
function enviarFavoritosWhatsApp() {
  const favoritos = getFavoritos();
  const lista = carros.filter(c => favoritos.includes(c.id));

  if (lista.length === 0) {
    alert("Nenhum favorito.");
    return;
  }

  let msg = "Olá, tenho interesse nesses veículos:%0A%0A";

  lista.forEach(c => {
    msg += `- ${c.nome} - ${c.preco}%0A`;
  });

  window.open(`https://wa.me/5527992821705?text=${msg}`, "_blank");
}


// =====================
// SIMULAÇÃO
// =====================
function simularFinanciamento() {

  const entradaRaw = document.getElementById("entrada").value;
  const entrada = Number(entradaRaw.replace(/\D/g, "")) / 100;
  const parcelas = Number(document.getElementById("parcelas").value);

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const carro = carros.find(c => c.id == id);

  if (!carro) return;

  const restante = carro.precoValor - entrada;

  if (restante <= 0) {
    document.getElementById("resultado-simulacao").textContent =
      "Entrada cobre o valor total.";
    return;
  }

  const taxa = 0.02;

  const parcela =
    (restante * (1 + taxa * parcelas)) / parcelas;

  document.getElementById("resultado-simulacao").textContent =
    `${parcelas}x de R$ ${parcela.toFixed(2)}`;

  const btn = document.getElementById("btn-financiamento");

  if (btn) {
    btn.style.display = "block";

    btn.onclick = () => {
      const mensagem = `Olá! Fiz uma simulação no site:

Veículo: ${carro.nome}
Entrada: R$ ${entrada}
Parcelas: ${parcelas}x de R$ ${parcela.toFixed(2)}

Isso é apenas uma simulação.`;

      window.open(
        `https://wa.me/5527992821705?text=${encodeURIComponent(mensagem)}`,
        "_blank"
      );
    };
  }
}


// =====================
// FORMATAR ENTRADA
// =====================
const inputEntrada = document.getElementById("entrada");

if (inputEntrada) {
  inputEntrada.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    v = (Number(v) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    e.target.value = v;
  });
}


// =====================
// INICIALIZAÇÃO
// =====================
document.addEventListener("DOMContentLoaded", () => {

  atualizarContadorFavoritos();

  if (document.getElementById("lista-carros")) {
    aplicarFiltros();
  }

  if (window.location.pathname.includes("carro.html")) {
    carregarCarro();
  }

  if (window.location.pathname.includes("favoritos.html")) {
    mostrarFavoritos();
  }

  const filtros = [
    document.getElementById("filtro-tipo"),
    document.getElementById("filtro-preco"),
    document.getElementById("ordenar")
  ];

  filtros.forEach(el => {
    if (el) el.addEventListener("change", aplicarFiltros);
  });

});