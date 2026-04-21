import {
  db,
  auth,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
  onAuthStateChanged
} from "./firebase.js";

/** Só e-mail/senha (ou outro provedor nao-anonimo). Quem veio so pelo site costuma estar anonimo — nao entra no admin. */
function waitForAdminAuth() {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      const ok = Boolean(user && !user.isAnonymous);
      if (!ok) {
        window.location.replace("login.html?next=admin.html");
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

import { uploadImageToCloudinary } from "./cloudinary.js";
import { formatarMoedaInput, parseMoeda } from "./utils.js";

// -----------------------------
// Helpers (UI)
// -----------------------------
function $(id) {
  return document.getElementById(id);
}

function setBusy(isBusy, text = "") {
  const el = $("admin-status");
  if (!el) return;
  el.style.display = text ? "block" : "none";
  el.textContent = text;
  el.dataset.busy = isBusy ? "1" : "0";
}

function assertNotBusy() {
  const el = $("admin-status");
  return !(el && el.dataset.busy === "1");
}

function formatPreco(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return "-";
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

// -----------------------------
// Upload (Cloudinary)
// -----------------------------
async function uploadManyImages({ carroId, files }) {
  const list = Array.from(files || []);
  const onlyImages = list.filter(f => (f?.type || "").startsWith("image/"));
  const urls = [];
  for (const file of onlyImages) {
    urls.push(await uploadImageToCloudinary({ carroId, file }));
  }
  return urls;
}

// -----------------------------
// Cadastro (NOVO)
// -----------------------------
let cadastroFiles = [];

function renderCadastroPreview() {
  const preview = $("preview-imagens");
  if (!preview) return;

  preview.innerHTML = "";

  cadastroFiles.forEach((file, index) => {
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.alignItems = "center";
    wrap.style.gap = "6px";

    const img = document.createElement("img");
    img.width = 100;
    img.height = 70;
    img.style.objectFit = "cover";
    img.src = URL.createObjectURL(file);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Remover";
    btn.onclick = () => {
      cadastroFiles.splice(index, 1);
      renderCadastroPreview();
    };

    wrap.appendChild(img);
    wrap.appendChild(btn);
    preview.appendChild(wrap);
  });
}

function wireCadastroUpload() {
  const input = $("input-imagens");
  if (!input) return;

  input.addEventListener("change", () => {
    const files = Array.from(input.files || []);
    cadastroFiles = files.filter(f => (f?.type || "").startsWith("image/"));
    renderCadastroPreview();
  });
}

window.cadastrar = async () => {
  if (!assertNotBusy()) return;

  const nome = $("nome")?.value?.trim();
  const preco = parseMoeda($("preco")?.value || "");
  const ano = Number($("ano")?.value);
  const km = Number($("km")?.value);
  const combustivel = $("combustivel")?.value || "";
  const cambio = $("cambio")?.value || "";
  const cor = $("cor")?.value?.trim() || "";
  const placaFinal = $("placaFinal")?.value?.trim() || "";

  if (!nome) {
    alert("Informe o nome do veículo.");
    return;
  }
  if (!cadastroFiles.length) {
    alert("Selecione pelo menos 1 imagem.");
    return;
  }

  setBusy(true, "Enviando imagens e cadastrando veículo...");

  try {
    // Gera um ID antes para usar no caminho do Storage
    const carroRef = doc(collection(db, "carros"));
    const carroId = carroRef.id;

    // Upload primeiro para garantir URLs
    const urls = await uploadManyImages({ carroId, files: cadastroFiles });

    await setDoc(carroRef, {
      nome,
      preco: Number.isNaN(preco) ? 0 : preco,
      ano: Number.isNaN(ano) ? null : ano,
      km: Number.isNaN(km) ? null : km,
      combustivel,
      cambio,
      cor,
      placaFinal,
      imagens: urls,
      imagem: urls[0] || null
    });

    alert("Carro cadastrado!");

    // Reset UI
    $("nome").value = "";
    $("preco").value = "";
    $("ano").value = "";
    $("km").value = "";
    if ($("combustivel")) $("combustivel").value = "";
    if ($("cambio")) $("cambio").value = "";
    if ($("cor")) $("cor").value = "";
    if ($("placaFinal")) $("placaFinal").value = "";

    cadastroFiles = [];
    if ($("input-imagens")) $("input-imagens").value = "";
    renderCadastroPreview();

    await carregarAdmin();
  } catch (e) {
    console.error(e);
    alert("Erro ao cadastrar. Verifique Storage/Firestore rules e tente novamente.");
  } finally {
    setBusy(false, "");
  }
};

// -----------------------------
// Listagem (ADMIN)
// -----------------------------
async function carregarAdmin() {
  const lista = $("lista-admin");
  if (!lista) return;

  lista.innerHTML = "";

  const snapshot = await getDocs(collection(db, "carros"));

  snapshot.forEach(docSnap => {
    const c = docSnap.data();
    const imagens = c.imagens || (c.imagem ? [c.imagem] : []);

    const div = document.createElement("div");

    div.innerHTML = `
      <hr>
      <strong>${c.nome || "-"}</strong><br>
      ${formatPreco(c.preco)}<br>
      ${(c.ano ?? "-")} - ${(c.km ?? "-")} km<br><br>

      <div style="display:flex; gap:5px; flex-wrap:wrap;">
        ${imagens.map(img => `<img src="${img}" width="60" height="45" style="object-fit:cover;">`).join("")}
      </div>

      <br>
      <button data-action="editar" data-id="${docSnap.id}">Editar</button>
      <button data-action="excluir" data-id="${docSnap.id}">Excluir</button>
    `;

    div.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button");
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === "editar") window.editarCarro(id);
      if (action === "excluir") window.deletar(id);
    });

    lista.appendChild(div);
  });
}

window.deletar = async (id) => {
  if (!id) return;
  await deleteDoc(doc(db, "carros", id));
  await carregarAdmin();
};

// -----------------------------
// Editar (MODAL)
// -----------------------------
let carroEditandoId = null;
let imagensEditando = []; // URLs existentes
let editNewFiles = []; // Files selecionados agora

function renderEditPreview() {
  const preview = $("edit-preview");
  if (!preview) return;

  preview.innerHTML = "";

  imagensEditando.forEach((url, index) => {
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.alignItems = "center";
    wrap.style.gap = "6px";

    const img = document.createElement("img");
    img.width = 80;
    img.height = 60;
    img.style.objectFit = "cover";
    img.src = url;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Remover";
    btn.onclick = () => {
      imagensEditando.splice(index, 1);
      renderEditPreview();
    };

    wrap.appendChild(img);
    wrap.appendChild(btn);
    preview.appendChild(wrap);
  });

  // Preview das novas (ainda não enviadas)
  editNewFiles.forEach((file, index) => {
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.alignItems = "center";
    wrap.style.gap = "6px";
    wrap.style.opacity = "0.85";

    const img = document.createElement("img");
    img.width = 80;
    img.height = 60;
    img.style.objectFit = "cover";
    img.src = URL.createObjectURL(file);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Remover (novo)";
    btn.onclick = () => {
      editNewFiles.splice(index, 1);
      renderEditPreview();
    };

    wrap.appendChild(img);
    wrap.appendChild(btn);
    preview.appendChild(wrap);
  });
}

window.editarCarro = async (id) => {
  carroEditandoId = id;

  const snapshot = await getDocs(collection(db, "carros"));
  snapshot.forEach(docSnap => {
    if (docSnap.id === id) {
      const c = docSnap.data();
      $("edit-nome").value = c.nome || "";
      $("edit-preco").value = c.preco ?? "";
      $("edit-ano").value = c.ano ?? "";
      $("edit-km").value = c.km ?? "";
      if ($("edit-combustivel")) $("edit-combustivel").value = c.combustivel || "";
      if ($("edit-cambio")) $("edit-cambio").value = c.cambio || "";
      if ($("edit-cor")) $("edit-cor").value = c.cor || "";
      if ($("edit-placaFinal")) $("edit-placaFinal").value = c.placaFinal || "";
      imagensEditando = c.imagens || (c.imagem ? [c.imagem] : []);
      editNewFiles = [];
      if ($("edit-input-imagens")) $("edit-input-imagens").value = "";
    }
  });

  $("modal-editar").style.display = "flex";
  renderEditPreview();
};

function wireEditarUpload() {
  const input = $("edit-input-imagens");
  if (!input) return;

  input.addEventListener("change", () => {
    const files = Array.from(input.files || []);
    editNewFiles = files.filter(f => (f?.type || "").startsWith("image/"));
    renderEditPreview();
  });
}

window.salvarEdicao = async () => {
  if (!carroEditandoId) return;
  if (!assertNotBusy()) return;

  const nome = $("edit-nome")?.value?.trim();
  const preco = parseMoeda($("edit-preco")?.value || "");
  const ano = Number($("edit-ano")?.value);
  const km = Number($("edit-km")?.value);
  const combustivel = $("edit-combustivel")?.value || "";
  const cambio = $("edit-cambio")?.value || "";
  const cor = $("edit-cor")?.value?.trim() || "";
  const placaFinal = $("edit-placaFinal")?.value?.trim() || "";

  setBusy(true, "Salvando alterações...");

  try {
    // Se o admin selecionou novas imagens, envia e adiciona nas existentes
    if (editNewFiles.length) {
      const newUrls = await uploadManyImages({
        carroId: carroEditandoId,
        files: editNewFiles
      });
      imagensEditando = [...imagensEditando, ...newUrls];
      editNewFiles = [];
      if ($("edit-input-imagens")) $("edit-input-imagens").value = "";
    }

    await updateDoc(doc(db, "carros", carroEditandoId), {
      nome: nome || "",
      preco: Number.isNaN(preco) ? 0 : preco,
      ano: Number.isNaN(ano) ? null : ano,
      km: Number.isNaN(km) ? null : km,
      combustivel,
      cambio,
      cor,
      placaFinal,
      imagens: imagensEditando,
      imagem: imagensEditando[0] || null
    });

    alert("Atualizado!");
    window.fecharModal();
    await carregarAdmin();
  } catch (e) {
    console.error(e);
    alert("Erro ao atualizar. Verifique Storage/Firestore rules e tente novamente.");
  } finally {
    setBusy(false, "");
  }
};

window.fecharModal = () => {
  $("modal-editar").style.display = "none";
};

// -----------------------------
// Init
// -----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const allowed = await waitForAdminAuth();
  if (!allowed) return;

  const precoInput = $("preco");
  if (precoInput) formatarMoedaInput(precoInput);

  const editPrecoInput = $("edit-preco");
  if (editPrecoInput) formatarMoedaInput(editPrecoInput);

  wireCadastroUpload();
  wireEditarUpload();
  await carregarAdmin();
});

