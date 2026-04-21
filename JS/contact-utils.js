import { BUSINESS_CONFIG } from "./business-config.js";

export function buildWhatsAppUrl(text = "") {
  const number = BUSINESS_CONFIG.whatsappNumber.replace(/\D/g, "");
  const base = `https://wa.me/${number}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

