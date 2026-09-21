# Futuru Studio

Estúdio interno da Futuru para gerar imagem e vídeo com IA: uma caixa de
prompt, 38 modelos (Soul, Seedance, Kling, Wan, Flux, Ideogram, Recraft, LTX,
MiniMax…) e uma galeria com tudo o que foi gerado.

Por trás, usa a [API da Higgsfield](https://docs.higgsfield.ai/docs) com a
chave da Futuru. A equipa gera, e o que sai entrega-se aos clientes. Os termos
da Higgsfield permitem uso comercial dos resultados, mas **não** dar acesso à
API a terceiros (§11.3 e §11.5). Por isso esta ferramenta é só para a equipa e
não deve ser aberta a clientes.

Baseado no [open-higgsfield](https://github.com/wide-trace/open-higgsfield) de
wide-trace. O repositório original não tem licença; ver
[Licença](#licença).

Next.js 16 · React 19 · CSS simples · Zustand · pnpm

---

## O que muda em relação ao original

- **Marca Futuru**: ícone, cores (azul Futuru, gradiente da marca no botão
  principal) e tipografia Instrument Sans.
- **Login da equipa**: uma password partilhada (`STUDIO_PASSWORD`) protege
  todas as páginas, server actions e uploads. A sessão dura 14 dias; mudar a
  password termina todas as sessões.
- **Chave da equipa no servidor**: com `HF_API_KEY` definida, ninguém introduz
  chaves no browser. O botão "Team key" mostra o estado e permite terminar
  sessão.
- **Uploads protegidos**: `/api/blob` só emite tokens para sessões válidas;
  limite de 100 MB por ficheiro.
- **Não indexável**: `robots.txt` bloqueia tudo, `noindex` em todas as
  páginas, sem sitemap.

---

## Correr localmente

```bash
pnpm install
cp .env.example .env.local   # e preencher
pnpm dev                     # http://localhost:3000
```

Em desenvolvimento, sem `STUDIO_PASSWORD`, o login fica desligado. Em produção,
sem password, o estúdio recusa todos os pedidos.

### Variáveis de ambiente

| Variável | Para quê |
| --- | --- |
| `HF_API_BASE_URL` | Origem da API: `https://api.higgsfield.ai` |
| `HF_API_KEY` | Chave Higgsfield da Futuru, formato `id:secret` |
| `STUDIO_PASSWORD` | Password da equipa para entrar no estúdio |
| `OPEN_HIGGSFIELD_READ_WRITE_TOKEN` | Token do Vercel Blob, para carregar imagens/vídeos/áudio de referência |

---

## Deploy no Vercel

1. Importar o repositório no Vercel (framework: Next.js; o pnpm é detetado).
2. **Storage → Blob → Create**, ligar ao projeto e copiar o token de
   leitura/escrita para `OPEN_HIGGSFIELD_READ_WRITE_TOKEN`.
3. Definir `HF_API_BASE_URL`, `HF_API_KEY` e `STUDIO_PASSWORD` em
   **Settings → Environment Variables** (Production e Preview).
4. Deploy. Opcional: domínio próprio, por exemplo `studio.futuru.pt`.

---

## Custos

Cada geração é cobrada à conta Higgsfield da Futuru. Alguns preços de
referência (setembro de 2026): Soul 2 ≈ $0.003/imagem; Kling 3.0 $0.042/s de
vídeo; Seedance 2.5 $0.144/s. Os ficheiros carregados ficam no Vercel Blob da
Futuru.

---

## Limitações conhecidas

- O histórico fica no browser de cada pessoa (IndexedDB, 60 registos). Não é
  partilhado pela equipa.
- Os links dos resultados pertencem ao CDN da Higgsfield e podem expirar:
  descarregar o que é para guardar.
- Uma password partilhada não identifica quem gerou o quê.

---

## Estrutura

```
src/
  app/          /  é o estúdio; /login é a entrada; /api/blob emite tokens de upload
  auth/         sessão (cookie assinado), login/logout, verificação nas actions
  generation/   pedidos à API, server actions, catálogo de modelos, stores
  openhiggsfield/
                a interface: composer, galeria, viewer, seletor de modelos…
  proxy.ts      bloqueia tudo o que não tem sessão
  brand.ts      nome e cores da marca
```

O catálogo (`src/generation/catalog/`) é a fonte de verdade dos modelos: uma
entrada nova aparece no seletor com as suas definições, sem mexer na interface.

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento na porta 3000 |
| `pnpm build` | Build de produção |
| `pnpm start` | Serve o build de produção |
| `pnpm brand` | Regera os ícones e a imagem de partilha em `public/` |

---

## Licença

O projeto original (wide-trace/open-higgsfield) foi publicado **sem licença**,
o que por omissão significa todos os direitos reservados. Antes de uso
comercial, pedir ao autor que adicione uma licença (por exemplo MIT).
