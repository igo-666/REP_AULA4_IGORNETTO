import { db, collection, getDocs } from "./firebase.js";

let carros = [];
const RECO_STORAGE_KEY = "reco-filtros-v1";
const RECO_HISTORY_KEY = "reco-history-v1";

function getValue(id) {
  return document.getElementById(id)?.value || "";
}

function normalizeTipo(v) {
  return String(v || "").toLowerCase().trim();
}

function chooseCarro({ tipo, precoMax, perfil }) {
  // MVP: tenta usar campos se existirem, mas não quebra se não existir.
  // Se não tiver perfil/tipo no Firestore, pelo menos respeita orçamento e retorna um carro "melhor".
  const list = [...carros];

  // filtra por orçamento
  const dentro = list.filter(c => c.precoValor <= precoMax);
  const base = dentro.length ? dentro : list;

  const tipoNorm = normalizeTipo(tipo);
  const perfilNorm = String(perfil || "").toLowerCase().trim();

  const comTipo = base.filter(c => normalizeTipo(c.tipo) === tipoNorm);
  const base2 = comTipo.length ? comTipo : base;

  const comPerfil = base2.filter(c => String(c.perfil || "").toLowerCase().trim() === perfilNorm);
  const base3 = comPerfil.length ? comPerfil : base2;

  // heurística: se desempenho, pega mais caro dentro do orçamento; economia pega mais barato; conforto pega meio termo
  if (perfilNorm === "economia") {
    return base3.sort((a, b) => a.precoValor - b.precoValor)[0] || null;
  }
  if (perfilNorm === "desempenho") {
    return base3.sort((a, b) => b.precoValor - a.precoValor)[0] || null;
  }
  // conforto (padrão): pega um próximo do teto do orçamento sem estourar
  return base3.sort((a, b) => b.precoValor - a.precoValor)[0] || null;
}

function scoreCarro({ carro, tipo, precoMax, perfil, combustivel, cambio }) {
  const tipoNorm = normalizeTipo(tipo);
  const perfilNorm = String(perfil || "").toLowerCase().trim();
  const comb = String(combustivel || "").trim();
  const camb = String(cambio || "").trim();

  let score = 0;

  // Orçamento
  if (carro.precoValor <= precoMax) score += 40;
  else score -= 60;

  // Tipo
  if (tipoNorm && normalizeTipo(carro.tipo) === tipoNorm) score += 18;

  // Preferências opcionais
  if (comb && carro.combustivel === comb) score += 10;
  if (camb && carro.cambio === camb) score += 10;

  // Perfil
  if (perfilNorm === "economia") {
    // menos preço e km melhor
    score += Math.max(0, 20 - carro.precoValor / 5000);
    score += Math.max(0, 10 - (Number(carro.km || 0) / 20000));
  }
  if (perfilNorm === "conforto") {
    // automático/cvt conta pontos
    if (["Automático", "CVT"].includes(carro.cambio)) score += 10;
  }
  if (perfilNorm === "desempenho") {
    // mais caro dentro do orçamento e mais novo tende a ser melhor (heurística)
    score += Math.min(15, carro.precoValor / 10000);
    score += Math.min(10, Number(carro.ano || 0) - 2000);
  }

  return score;
}

function scorePercent(score) {
  // Normaliza score para 0-100 (faixa prática deste algoritmo)
  const min = -60;
  const max = 95;
  const p = Math.round(((score - min) / (max - min)) * 100);
  return Math.max(0, Math.min(100, p));
}

function chooseCarroScored({ tipo, precoMax, perfil, combustivel, cambio }) {
  const list = [...carros];
  if (!list.length) return null;

  let best = null;
  let bestScore = -Infinity;

  for (const carro of list) {
    const s = scoreCarro({ carro, tipo, precoMax, perfil, combustivel, cambio });
    if (s > bestScore) {
      bestScore = s;
      best = carro;
    }
  }

  return best;
}

function explainMatch({ carro, tipo, precoMax, combustivel, cambio }) {
  const parts = [];
  if (carro.precoValor <= precoMax) parts.push("dentro do orçamento");
  if (tipo && normalizeTipo(carro.tipo) === normalizeTipo(tipo)) parts.push(`tipo ${carro.tipo}`);
  if (combustivel && carro.combustivel === combustivel) parts.push(`combustível ${combustivel}`);
  if (cambio && carro.cambio === cambio) parts.push(`câmbio ${cambio}`);
  if (!parts.length) return "Boa opção geral com base no seu perfil";
  return `Combina com você por: ${parts.join(", ")}`;
}

function buildTags({ carro, perfil, precoMax }) {
  const tags = [];
  const perfilNorm = String(perfil || "").toLowerCase();
  const preco = Number(carro.precoValor || 0);
  const km = Number(carro.km || 0);
  const ano = Number(carro.ano || 0);

  if (preco <= precoMax * 0.8) tags.push({ key: "value", label: "Melhor custo-beneficio" });
  if (perfilNorm === "desempenho" && preco >= precoMax * 0.85) tags.push({ key: "perf", label: "Melhor desempenho" });
  if (perfilNorm === "conforto" && ["Automático", "CVT"].includes(carro.cambio)) tags.push({ key: "comfort", label: "Conforto" });
  if (km > 0 && km < 50000) tags.push({ key: "km", label: "Baixa quilometragem" });
  if (ano >= new Date().getFullYear() - 3) tags.push({ key: "new", label: "Mais novo" });

  return tags.slice(0, 3);
}

function saveHistorico({ filtros, ranked }) {
  const raw = localStorage.getItem(RECO_HISTORY_KEY);
  const list = raw ? JSON.parse(raw) : [];

  const item = {
    ts: Date.now(),
    filtros,
    top: ranked.slice(0, 3).map(x => ({
      id: x.carro.id,
      nome: x.carro.nome,
      precoValor: x.carro.precoValor
    }))
  };

  const next = [item, ...list].slice(0, 5);
  localStorage.setItem(RECO_HISTORY_KEY, JSON.stringify(next));
}

function renderHistorico() {
  const wrap = document.getElementById("reco-historico");
  if (!wrap) return;

  const raw = localStorage.getItem(RECO_HISTORY_KEY);
  const list = raw ? JSON.parse(raw) : [];

  if (!list.length) {
    wrap.innerHTML = `<p class="reco-history-empty">Nenhuma recomendação recente.</p>`;
    return;
  }

  wrap.innerHTML = list.map(item => {
    const data = new Date(item.ts);
    const hora = `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")} ${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`;
    return `
      <article class="reco-history-item">
        <div class="reco-history-time">${hora}</div>
        <div class="reco-history-top">
          ${item.top.map(c => `
            <a href="carro.html?id=${c.id}">
              ${c.nome} - R$ ${Number(c.precoValor || 0).toLocaleString("pt-BR")}
            </a>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderResultado(lista, filtros) {
  const resultado = document.getElementById("resultado");
  if (!resultado) return;

  if (!lista.length) {
    resultado.innerHTML = `<p>Não encontramos uma opção exata, mas temos outras disponíveis no estoque.</p>`;
    return;
  }

  resultado.innerHTML = lista.map((item, i) => {
    const carro = item.carro;
    const percent = scorePercent(item.score);
    const tags = buildTags({ carro, perfil: filtros.perfil, precoMax: filtros.precoMax });

    return `
    <article class="reco-card">
      <img src="${carro.imagem}" alt="${carro.nome}">
      <div class="reco-body">
        <span class="reco-rank">Sugestão #${i + 1}</span>
        <div class="reco-score">
          <div class="reco-score-label">Compatibilidade ${percent}%</div>
          <div class="reco-score-bar"><span style="width:${percent}%"></span></div>
        </div>
        <h3 class="reco-title">${carro.nome}</h3>
        <div class="reco-price">R$ ${carro.precoValor.toLocaleString("pt-BR")}</div>
        <div class="reco-meta">
          <span>${carro.ano || "-"}</span>
          <span>${carro.km ? `${Number(carro.km).toLocaleString("pt-BR")} km` : "-"}</span>
        </div>
        <div class="reco-tags">
          ${tags.map(t => `<span class="reco-tag reco-tag-${t.key}">${t.label}</span>`).join("")}
        </div>
        <p class="reco-why">${explainMatch({ carro, ...filtros })}</p>
        <a href="carro.html?id=${carro.id}" class="btn">Ver detalhes</a>
      </div>
    </article>
  `;
  }).join("");
}

async function carregarCarros() {
  const snapshot = await getDocs(collection(db, "carros"));
  carros = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    carros.push({
      id: docSnap.id,
      nome: d.nome || "",
      precoValor: Number(d.precoValor ?? d.preco ?? 0),
      tipo: d.tipo || "",
      perfil: d.perfil || "",
      ano: d.ano ?? null,
      km: d.km ?? null,
      combustivel: d.combustivel || "",
      cambio: d.cambio || "",
      imagem: d.imagens?.[0] || d.imagem || "ASSETS/imagens/opala1.jpg"
    });
  });
}

async function recomendar() {
  const tipo = getValue("tipo");
  const precoMax = Number(getValue("preco")) || 0;
  const perfil = getValue("perfil");
  const combustivel = getValue("combustivel");
  const cambio = getValue("cambio");
  const filtros = { tipo, precoMax, perfil, combustivel, cambio };

  localStorage.setItem(RECO_STORAGE_KEY, JSON.stringify(filtros));

  if (!carros.length) await carregarCarros();

  const ranked = [...carros]
    .map(carro => ({
      carro,
      score: scoreCarro({ carro, tipo, precoMax, perfil, combustivel, cambio })
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!ranked.length) {
    const fallback = chooseCarroScored({ tipo, precoMax, perfil, combustivel, cambio }) ||
      chooseCarro({ tipo, precoMax, perfil });
    renderResultado(fallback ? [{ carro: fallback, score: 50 }] : [], filtros);
    return;
  }

  renderResultado(ranked, filtros);
  saveHistorico({ filtros, ranked });
  renderHistorico();
}

function limpar() {
  ["tipo", "preco", "perfil", "combustivel", "cambio"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === "preco") el.value = "50000";
    else if (id === "tipo") el.value = "carro";
    else if (id === "perfil") el.value = "economia";
    else el.value = "";
  });
  const r = document.getElementById("resultado");
  if (r) r.innerHTML = "";
  localStorage.removeItem(RECO_STORAGE_KEY);
}

function limparHistorico() {
  localStorage.removeItem(RECO_HISTORY_KEY);
  renderHistorico();
}

function restoreFiltros() {
  try {
    const raw = localStorage.getItem(RECO_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.tipo) document.getElementById("tipo").value = data.tipo;
    if (data.precoMax) document.getElementById("preco").value = String(data.precoMax);
    if (data.perfil) document.getElementById("perfil").value = data.perfil;
    if (data.combustivel !== undefined) document.getElementById("combustivel").value = data.combustivel;
    if (data.cambio !== undefined) document.getElementById("cambio").value = data.cambio;
  } catch {
    // ignora
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  restoreFiltros();
  await carregarCarros();
  renderHistorico();
  document.getElementById("btn-recomendar")?.addEventListener("click", recomendar);
  document.getElementById("btn-limpar-reco")?.addEventListener("click", limpar);
  document.getElementById("btn-limpar-historico")?.addEventListener("click", limparHistorico);
});