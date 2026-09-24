# gitcitybanner

Transforme os últimos 365 dias de contribuições do GitHub em um banner de cidade noturna para o X e o LinkedIn.

**[gitcitybanner.vercel.app](https://gitcitybanner.vercel.app)**

## Como ler a cidade

- **Cada casa é um mês** — doze casas, os últimos doze meses, da esquerda para a direita.
- **Cada janela é um dia**, em ordem: de cima para baixo, coluna a coluna.
- **O brilho é a quantidade de contribuições do dia**, na mesma escala de verdes do gráfico do GitHub. Janela apagada é dia sem contribuição.

O banner sai em dois tamanhos: 1500×500 para o X e 1584×396 para o LinkedIn.

## Como funciona

O navegador desenha o banner num `<canvas>` e exporta o PNG localmente. Os dados vêm de uma função serverless na Vercel, que lê o calendário público de contribuições do perfil e devolve as 53 semanas em JSON. Nenhum dado é armazenado além de um cache em memória de 30 minutos.

## API

```
GET /api/contributions?username=<usuario>
```

Responde `200` com `{ username, totalContributions, weeks }`, onde cada semana tem 7 dias com `date`, `count` e `level` (0 a 4).

| Status | Código | Quando |
|---|---|---|
| 400 | `INVALID_USERNAME` | nome fora do formato do GitHub |
| 404 | `USER_NOT_FOUND` | perfil não existe |
| 422 | `PARSE_FAILED` | o GitHub respondeu num formato inesperado |
| 429 | `RATE_LIMITED` | mais de 20 requisições por hora do mesmo IP; ver `Retry-After` |
| 502 | `UPSTREAM_UNAVAILABLE` | o GitHub não respondeu |

## Desenvolvimento

Requer [Bun](https://bun.sh) 1.4.

```bash
bun install
bun run dev        # http://localhost:3000, com a API local
bun test
bun run typecheck
bun run build      # gera dist/
```

## Estrutura

```
api/                 função serverless /api/contributions
src/
  index.html         landing (PT); en/index.html é a versão em inglês
  gerar/             gerador (PT); en/generate/ é a versão em inglês
  landing/           cidade de exemplo que acende na landing
  contributions/     busca dos dados e estado do formulário
  layout/            geometria da cidade: casas, telhados, janelas
  render/            desenho no canvas e paleta
  downloads/         exportação dos PNGs
  i18n/              textos em português e inglês
  styles/            tokens e CSS
tests/               espelha src/ e api/
build.ts             build estático para dist/
dev.ts               servidor local
```

## Deploy

Todo push na `main` publica na Vercel: `bun run build` gera o site estático em `dist/` e a pasta `api/` vira a função serverless, no mesmo domínio. A configuração está em `vercel.json`.

O workflow `.github/workflows/ci.yml` roda `bun test` e `bun run build` em cada push e pull request.

## Licença

[MIT](LICENSE)
