export function parseMoeda(valor) {
  return Number(valor.replace(/\./g, "").replace(",", "."));
}

export function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2
  });
}

export function formatarMoedaInput(input) {
  input.addEventListener("input", () => {
    let v = input.value.replace(/\D/g, "");

    if (!v) {
      input.value = "";
      return;
    }

    input.value = (Number(v) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2
    });
  });
}