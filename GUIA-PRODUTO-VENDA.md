# Guia de Produto para Venda

Este projeto esta preparado para modelo white-label (mesmo sistema para varias lojas).

## 1) Troca rapida de marca (white-label)

Altere apenas `JS/business-config.js`:

- `brandName`
- `contactPhone`
- `whatsappNumber`
- `city`
- `address`
- `siteUrl` (opcional: URL publica do site, sem barra no final, para `og:url`)

Ao alterar esse arquivo, o sistema atualiza automaticamente:

- logo no topo (`.logo`)
- rodape (`© ano + marca`, telefone)
- links gerais de WhatsApp
- titulo da pagina (quando contem `PREMIUM MOTORS` / `Premium Motors`) e metas de SEO/Open Graph
- URL canonica em `og:url` se o campo `siteUrl` estiver preenchido

## 2) Fluxo comercial que ja esta pronto

- Estoque com filtros reais (preco, ano, km, ordenacao, busca)
- Pagina do carro com galeria premium, financiamento e CTA WhatsApp
- Favoritos com sync Firebase (anonimo) + fallback local
- Recomendador com score, top 3, tags e historico
- Troca com envio de fotos via Cloudinary e mensagem estruturada no WhatsApp
- Admin com upload de imagens e ficha tecnica (combustivel, cambio, cor etc)

## 3) Checklist de implantacao por cliente

1. Duplicar projeto/repo
2. Atualizar `JS/business-config.js`
3. Criar dominio/subdominio
4. Configurar Firebase (Auth + Firestore) — preencher **`JS/firebase-config.js`** com o projeto do cliente (nao reutilizar chaves em producao)
5. Configurar Cloudinary (`JS/config.js`)
6. Publicar regras do arquivo **`firestore.rules`** no Firebase (ou copiar o conteudo para o console). Ajuste se o admin usar outro provedor de login alem de e-mail/senha
7. Conferir links nos HTML: pasta do CSS e `src` de scripts usam **`CSS/`** e **`JS/`** (Linux diferencia maiusculas)
8. Cadastrar 10-20 carros iniciais no admin
9. Testar WhatsApp, recomendador e troca
10. Entregar com mini treinamento

## 4) Regras Firestore recomendadas (base)

Use o arquivo **`firestore.rules`** na raiz como ponto de partida (deploy via Firebase CLI ou copie no console).

Resumo:
- `carros`: leitura publica; escrita apenas para usuario autenticado **nao anonimo** (login e-mail/senha do admin).
- `users/{uid}/favoritos/{carroId}`: leitura/escrita somente do proprio `uid` (favoritos usam Auth anonima ou outra conta).

## 5) Operacao mensal (padrao)

- atualizacao de estoque
- pequenos ajustes de layout/texto
- monitoramento de erros
- backup/export de dados

## 6) Proximas evolucoes para escalar

- multi-tenant real por `lojaId`
- painel de leads (sem depender apenas de WhatsApp)
- export CSV de leads e estoque
- SLA de suporte por plano

