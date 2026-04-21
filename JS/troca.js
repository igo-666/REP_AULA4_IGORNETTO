import { uploadImageToCloudinary } from "./cloudinary.js";
import { formatarMoedaInput, parseMoeda } from "./utils.js";
import { buildWhatsAppUrl } from "./contact-utils.js";
import { BUSINESS_CONFIG } from "./business-config.js";

function $(id) {
  return document.getElementById(id);
}

let files = [];

function setStatus(text) {
  const el = $("troca-status");
  if (!el) return;
  el.style.display = text ? "block" : "none";
  el.textContent = text;
}

function renderPreview() {
  const wrap = $("troca-preview");
  if (!wrap) return;
  wrap.innerHTML = "";

  files.forEach((f, idx) => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.alignItems = "center";
    div.style.gap = "6px";

    const img = document.createElement("img");
    img.width = 110;
    img.height = 70;
    img.style.objectFit = "cover";
    img.style.borderRadius = "10px";
    img.src = URL.createObjectURL(f);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-secundario";
    btn.textContent = "Remover";
    btn.style.padding = "8px 10px";
    btn.onclick = () => {
      files.splice(idx, 1);
      renderPreview();
    };

    div.appendChild(img);
    div.appendChild(btn);
    wrap.appendChild(div);
  });
}

function limpar() {
  ["troca-nome", "troca-whatsapp", "troca-modelo", "troca-ano", "troca-km", "troca-valor"]
    .forEach(id => { if ($(id)) $(id).value = ""; });
  if ($("troca-combustivel")) $("troca-combustivel").value = "";
  if ($("troca-fotos")) $("troca-fotos").value = "";
  files = [];
  renderPreview();
  setStatus("");
}

async function enviar() {
  const nome = $("troca-nome")?.value?.trim() || "";
  const whatsapp = $("troca-whatsapp")?.value?.trim() || "";
  const modelo = $("troca-modelo")?.value?.trim() || "";
  const ano = $("troca-ano")?.value?.trim() || "";
  const km = $("troca-km")?.value?.trim() || "";
  const combustivel = $("troca-combustivel")?.value || "";
  const valor = parseMoeda($("troca-valor")?.value || "");

  if (!nome || !whatsapp || !modelo) {
    alert("Preencha pelo menos: nome, WhatsApp e modelo.");
    return;
  }

  const only = files.slice(0, 6).filter(f => (f?.type || "").startsWith("image/"));
  let urls = [];
  let uploadError = "";

  if (only.length) {
    setStatus("Enviando fotos...");
    try {
      const batchId = `troca-${Date.now()}`;
      for (const f of only) {
        urls.push(await uploadImageToCloudinary({ file: f, carroId: batchId }));
      }
    } catch (e) {
      console.error(e);
      uploadError =
        e instanceof Error ? e.message : "Falha ao enviar fotos para o Cloudinary.";
    }
    setStatus("");
  }

  let textoFotos = "";
  if (urls.length) {
    textoFotos = `\n\nFotos (links para abrir no navegador):\n${urls.join("\n")}`;
  } else if (only.length) {
    textoFotos =
      `\n\n⚠️ As fotos NÃO foram anexadas automaticamente.` +
      (uploadError ? ` Motivo: ${uploadError}` : "") +
      `\nAnexe as imagens manualmente nesta conversa ou tente de novo pelo site após conferir JS/config.js (Cloudinary).`;
    alert(
      "Não foi possível enviar as fotos para a nuvem. A mensagem do WhatsApp foi aberta mesmo assim, com um aviso no texto — confira Cloudinary em JS/config.js ou anexe as fotos manualmente."
    );
  }

  const msg = encodeURIComponent(
    `Olá! Quero avaliar meu carro na troca.\n\n` +
    `Nome: ${nome}\n` +
    `WhatsApp: ${whatsapp}\n\n` +
    `Carro: ${modelo}\n` +
    `Ano: ${ano || "-"}\n` +
    `KM: ${km || "-"}\n` +
    `Combustível: ${combustivel || "-"}\n` +
    `Valor desejado: ${valor ? `R$ ${valor.toLocaleString("pt-BR")}` : "-"}\n` +
    `${textoFotos}\n\n` +
    `Enviado pelo ${BUSINESS_CONFIG.brandName}`
  );

  setStatus("");
  window.open(buildWhatsAppUrl(decodeURIComponent(msg)), "_blank");
}

document.addEventListener("DOMContentLoaded", () => {
  const title = document.querySelector("main h1");
  if (title) title.textContent = `Avaliação de troca - ${BUSINESS_CONFIG.brandName}`;

  const valor = $("troca-valor");
  if (valor) formatarMoedaInput(valor);

  $("troca-fotos")?.addEventListener("change", () => {
    const incoming = Array.from($("troca-fotos").files || []);
    files = incoming.filter(f => (f?.type || "").startsWith("image/"));
    renderPreview();
  });

  $("troca-limpar")?.addEventListener("click", limpar);
  $("troca-enviar")?.addEventListener("click", enviar);
});

