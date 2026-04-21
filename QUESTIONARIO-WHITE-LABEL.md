# Questionário white label — concessionária

**Para quem é:** comprador/dono da concessionária que recebeu este site em white label.

**Como usar:** preencha todas as seções abaixo (pode em um editor de texto). Depois **cole o texto completo** na conversa de uma IA de código **junto com a pasta do projeto** (ou o link do repositório) e peça algo como: *“Atualize o site com os dados deste questionário; mantenha a estrutura e só altere o necessário.”*

---

## 1. Identidade da loja

| Campo | Sua resposta |
|--------|----------------|
| Nome fantasia / marca (aparece no logo e títulos) | |
| Slogan ou frase curta da home (opcional; se vazio, manter estilo genérico) | |
| Ano para o rodapé © (ex.: 2026) | |

---

## 2. Contato e localização

| Campo | Sua resposta |
|--------|----------------|
| Telefone para exibição (formato que o cliente vê, ex.: (11) 98765-4321) | |
| WhatsApp — **apenas números**, com DDI 55 (ex.: 5511987654321) | |
| E-mail comercial (se quiser no site) | |
| Cidade (texto exibido) | |
| Endereço completo (rua, número, bairro) | |
| CEP (opcional) | |
| Link do Google Maps (URL completa) ou texto “como chegar” | |

---

## 3. Redes sociais (opcional)

Preencha só o que existir. Se não usar, escreva **não usar**.

| Rede | URL completa ou “não usar” |
|------|----------------------------|
| Instagram | |
| Facebook | |
| YouTube | |
| TikTok | |
| Outro | |

---

## 4. Visual (cores e tipografia)

| Campo | Sua resposta |
|--------|----------------|
| Cor principal da marca (hex, ex.: #df0c0c) | |
| Cor de destaque / hover (hex, ex.: #C9A95D) | |
| Fundo: manter escuro atual ou prefere claro? (escrever: escuro / claro / outro) | |
| Fonte: manter Poppins ou indicar outra (nome Google Fonts) | |
| Logo como imagem: tem arquivo? (sim/não) — se sim, nome do arquivo e onde colocar (ex.: `ASSETS/imagens/logo.png`) | |

---

## 5. Textos de marketing (páginas principais)

Ajuste só se quiser personalizar; senão escreva **manter padrão**.

| Onde | Sua resposta |
|------|----------------|
| Título grande da home (hero) | |
| Subtítulo da home | |
| Página “Sobre” — parágrafos ou tópicos principais | |
| Página “Contato” — texto de introdução | |

---

## 6. Páginas / funcionalidades

Marque com **sim** ou **não** o que a loja quer manter visível no menu.

| Item | sim / não |
|------|-----------|
| Estoque | |
| Favoritos | |
| Recomendador (“carro ideal”) | |
| Troca de veículo | |
| Contato | |
| Localização | |
| Sobre | |
| Botão flutuante do WhatsApp | |

Observações (ex.: esconder “Troca”, renomear um item do menu):

```
(escreva aqui)
```

---

## 7. Firebase (banco, login admin, favoritos na nuvem)

Se **não** for usar Firebase, escreva **não usar Firebase** e descreva se quer só site estático / outro backend.

Caso use, preencha com o projeto **novo** da concessionária. Os valores vão em **`JS/firebase-config.js`** (não reutilize chaves de outra loja em produção sem revisar regras).

| Campo | Sua resposta |
|--------|----------------|
| apiKey | |
| authDomain | |
| projectId | |
| storageBucket | |
| messagingSenderId | |
| appId | |
| E-mail do usuário admin (login no painel) | |
| Senha inicial desejada (a IA não deve repetir em chats públicos; prefira trocar depois no Firebase) | |

---

## 8. Cloudinary (upload de fotos no admin)

Se **não** for usar upload na nuvem, escreva **não usar Cloudinary**.

| Campo | Sua resposta |
|--------|----------------|
| Cloud name | |
| Upload preset (unsigned) | |
| Pasta sugerida no Cloudinary (ex.: `minha-loja/carros`) | |

---

## 9. Domínio e hospedagem (só informativo para a IA / deploy)

| Campo | Sua resposta |
|--------|----------------|
| URL pública completa para SEO / Open Graph (sem barra no final; ex.: `https://www.minhaloja.com.br`) — vai em `siteUrl` no `business-config.js` | |
| Domínio final (ex.: www.minhaloja.com.br) ou “ainda não definido” | |
| Onde vai hospedar (Netlify, Vercel, servidor próprio, outro) | |
| Precisa de HTTPS e redirecionamento www? (sim/não/não sei) | |

---

## 10. Estoque inicial

| Campo | Sua resposta |
|--------|----------------|
| Cadastrar carros de exemplo ou começar vazio? | |
| Se tiver lista (modelo, ano, preço, fotos), cole aqui ou anexe referência | |

---

## 11. Jurídico e LGPD (opcional mas recomendado)

| Campo | Sua resposta |
|--------|----------------|
| Razão social e CNPJ (se quiser no rodapé ou página legal) | |
| Texto de política de privacidade: o projeto já inclui **`privacidade.html`** modelo — revisar com advogado / substituir conteúdo (sim/não) | |
| Cookie banner: precisa / não precisa | |

---

## 12. Observações finais para a IA

Cole aqui qualquer detalhe extra (idioma, segunda unidade, horário de atendimento, integração futura, etc.):

```
(escreva aqui)
```

---

## Texto pronto para colar na IA (modelo)

Substitua os colchetes pelo que você preencheu:

```
Sou o comprador do site white label. Atualize o projeto com estes dados:

MARCA: [...]
TELEFONE EXIBIDO: [...]
WHATSAPP (só números, DDI 55): [...]
CIDADE: [...]
ENDEREÇO: [...]
CORES: principal [...], destaque [...]
FIREBASE: [colar objeto ou "não usar"]
CLOUDINARY: [cloud name, preset, pasta ou "não usar"]
PÁGINAS/MENU: [o que manter ou ocultar]
TEXTOS HOME: título [...], subtítulo [...]
DOMÍNIO/HOSPEDAGEM: [...]
OBS: [...]

Mantenha o funcionamento atual; altere arquivos como business-config.js, config.js, firebase-config.js, HTMLs, CSS e qualquer JS que dependa desses valores. Publique as regras do firestore.rules no Firebase.
```

---

*Arquivo gerado para acompanhar o template de concessionária. Preencha e guarde uma cópia para histórico da loja.*
