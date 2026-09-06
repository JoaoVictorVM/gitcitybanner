# gitcitybanner

Gera um banner de cidade noturna a partir do gráfico de contribuições do GitHub.

## Desenvolvimento

```
bun install
bun run dev        # servidor local em http://localhost:3000
bun test
bun run build      # gera dist/
```

## Deploy

Todo push em `main` dispara dois deploys independentes:

- **GitHub Pages** — `.github/workflows/deploy.yml` instala o Bun, roda `bun test` e `bun run build`, e publica `dist/` pelas actions oficiais de Pages. Qualquer falha antes da publicação interrompe o job e o site anterior continua no ar.
- **Vercel** — a integração Git da Vercel reimplanta a função `/api` a partir do mesmo push, sem passo manual.

### Configuração única do repositório

1. **Settings → Pages → Build and deployment → Source:** `GitHub Actions`.
2. **Settings → Secrets and variables → Actions → Variables:** criar a variável `PROD_API_URL` com a URL de produção da função (ex.: `https://gitcitybanner.vercel.app`). O workflow a repassa para o build, que a embute como constante no bundle (`src/config.ts`). Sem a variável, o build usa o fallback local `http://localhost:3000`.
3. **Vercel → New Project:** conectar o repositório, manter o Root Directory na raiz (para que `vercel.json` e `/api` sejam descobertos), Production Branch `main` e o auto-deploy da integração Git ligado.

A URL de produção não é secreta — ela vai pública no bundle — por isso fica em Variables, não em Secrets.
