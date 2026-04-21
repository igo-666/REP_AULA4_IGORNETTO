import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_FOLDER
} from "./config.js";

function assertCloudinaryConfigured() {
  const cloud = String(CLOUDINARY_CLOUD_NAME || "").trim().toLowerCase();
  const preset = String(CLOUDINARY_UPLOAD_PRESET || "").trim().toLowerCase();
  const looksPlaceholder =
    !cloud ||
    !preset ||
    cloud.includes("seu_cloud") ||
    cloud.includes("coloque") ||
    preset.includes("nome_do_preset") ||
    preset.includes("coloque") ||
    preset.includes("unsigned_placeholder");
  if (looksPlaceholder) {
    throw new Error("Cloudinary não configurado em JS/config.js (cloud name e upload preset reais).");
  }
}

export async function uploadImageToCloudinary({ file, carroId }) {
  assertCloudinaryConfigured();

  if (!file || !(file instanceof File)) {
    throw new Error("Arquivo inválido para upload");
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  // Organização no painel
  if (CLOUDINARY_FOLDER) form.append("folder", CLOUDINARY_FOLDER);
  if (carroId) form.append("context", `carroId=${carroId}`);

  const res = await fetch(url, {
    method: "POST",
    body: form
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha no upload Cloudinary (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.secure_url || data.url;
}

