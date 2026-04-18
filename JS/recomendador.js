function recomendar() {
  const tipo = document.getElementById("tipo").value;
  const preco = document.getElementById("preco").value;
  const perfil = document.getElementById("perfil").value;

  const resultado = document.getElementById("resultado");

  const carro = carros.find(c =>
    c.tipo === tipo &&
    c.precoValor <= preco &&
    c.perfil === perfil
  );

  if (carro) {
    resultado.innerHTML = `
      <h2>Seu carro ideal pode ser:</h2>
      <img src="${carro.imagem}" width="300">
      <h3>${carro.nome}</h3>
      <p>${carro.preco}</p>
      <a href="carro.html?id=${carro.id}" class="btn">Ver detalhes</a>
    `;
  } else {
    resultado.innerHTML = `
      <p>Não encontramos uma opção exata, mas temos outras disponíveis no estoque.</p>
    `;
  }
}