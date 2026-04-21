# Site concessionária (white label)

Template estático (HTML + JS) com estoque, página do veículo, favoritos (Firebase), recomendador, troca com upload (Cloudinary), admin e login.

## Documentação do produto

- **`GUIA-PRODUTO-VENDA.md`** — o que o sistema já faz e checklist de implantação.
- **`QUESTIONARIO-WHITE-LABEL.md`** — formulário para o cliente preencher e colar em uma IA ao personalizar o projeto.

## Antes de publicar (obrigatório)

1. **`JS/business-config.js`** — marca, telefone, WhatsApp, cidade, endereço e, se quiser `og:url` correto nas redes sociais, preencha **`siteUrl`** (ex.: `https://www.sualoja.com.br`).
2. **`JS/firebase-config.js`** — cole o objeto `firebaseConfig` do Console Firebase (um projeto **por cliente**). Não distribua chaves reais em repositório público.
3. **`JS/config.js`** — Cloudinary (cloud name, preset unsigned, pasta) para upload no admin e na troca.
4. **Firestore** — faça deploy das regras em **`firestore.rules`** (CLI ou console). Leia o comentário no arquivo: escrita em `carros` só para login **não anônimo** (admin e-mail/senha); favoritos ficam em `users/{uid}/favoritos`.

## Deploy

- Publique a pasta do site como site estático (Netlify, Vercel, Apache, Nginx, etc.).
- Em servidores **Linux**, caminhos são sensíveis a maiúsculas/minúsculas: pastas **`CSS`** e **`JS`** e **`ASSETS`** devem bater exatamente com os links nos HTML.

## O que foi ajustado para white label

- `JS/site.js` sincroniza `<title>`, meta description e Open Graph (quando as tags existem no HTML), logo, rodapé e links de WhatsApp.
- Página **`privacidade.html`** (modelo LGPD) e link no rodapé.
- **`robots.txt`** bloqueia `admin.html` e `login.html` para crawlers comuns.

## Licença e suporte

Defina com o seu cliente (este repositório não inclui termos legais prontos).
