# Catálogo de Filmes e Séries (GitHub Pages + Google Drive)

## Objetivo

Site estático para reproduzir filmes e séries hospedados no Google Drive pessoal do usuário, hospedado no GitHub Pages. O banco de dados é um arquivo JSON versionado no próprio repositório. Uma área administrativa permite montar/editar o catálogo via formulário e exportar um novo JSON, que o administrador sobe manualmente no repositório para publicar as mudanças.

## Premissas

- Os arquivos de vídeo no Google Drive são compartilhados publicamente ("qualquer pessoa com o link"), permitindo embutir o player via iframe sem autenticação.
- O site público (catálogo e player) é aberto para qualquer visitante, sem login.
- Não há backend/servidor: tudo roda client-side, hospedado como arquivos estáticos.
- A atualização do catálogo é manual: o admin exporta o JSON atualizado e o admin mesmo substitui o arquivo no repositório (commit via GitHub web ou git push). Não há automação de deploy/commit a partir da página admin.
- Sem etapa de build (sem npm/bundler/framework) — HTML, CSS e JS puros.
- Sem testes automatizados (projeto pessoal, validação manual no navegador).

## Estrutura de arquivos

```
index.html        # catálogo/home
titulo.html        # página de detalhe (filme ou série) + player
admin.html         # área administrativa (sem link público, protegida por senha simples)
assets/
  style.css
  app.js           # lógica do catálogo (listagem, busca, filtro) + player
  admin.js         # lógica do formulário admin (CRUD local + exportação)
data/
  catalog.json     # banco de dados do catálogo
```

## Estrutura de dados (`data/catalog.json`)

```json
{
  "movies": [
    {
      "id": "m-abc123",
      "title": "Nome do Filme",
      "year": 2023,
      "poster": "https://...",
      "description": "Sinopse opcional",
      "driveId": "1AbCxyz..."
    }
  ],
  "series": [
    {
      "id": "s-def456",
      "title": "Nome da Série",
      "poster": "https://...",
      "description": "Sinopse opcional",
      "seasons": [
        {
          "season": 1,
          "episodes": [
            { "episode": 1, "title": "Piloto", "driveId": "1XyZ..." }
          ]
        }
      ]
    }
  ]
}
```

- `id`: gerado automaticamente pelo admin (slug do título + sufixo aleatório), único por item.
- `poster`: URL de imagem (colada manualmente pelo admin — ex.: TMDB, Imgur, ou imagem hospedada no Drive).
- `driveId`: extraído automaticamente pelo admin.js a partir do link colado do Google Drive. Formatos aceitos:
  - `https://drive.google.com/file/d/<ID>/view...`
  - `https://drive.google.com/open?id=<ID>`
  - `https://drive.google.com/uc?id=<ID>`
- Player embutido via iframe: `https://drive.google.com/file/d/<driveId>/preview`.

## Páginas

### `index.html` — Catálogo

- Grade de pôsteres com filmes e séries.
- Campo de busca por título (filtro client-side sobre o JSON carregado).
- Filtro por tipo (Todos / Filmes / Séries).
- Tema escuro estilo streaming.
- Cada card leva para `titulo.html?id=<id>`.

### `titulo.html?id=<id>` — Detalhe

- Carrega `catalog.json`, localiza o item pelo `id` (procura em `movies` e depois em `series`).
- Se for filme: mostra pôster, título, ano, sinopse e o player (iframe) já carregado com o `driveId` do filme.
- Se for série: mostra pôster, título, sinopse, seletor de temporada e lista de episódios da temporada selecionada; ao clicar em um episódio, o player troca para o `driveId` daquele episódio (primeiro episódio da primeira temporada carrega por padrão).
- Item não encontrado (`id` inválido ou ausente) → mensagem "Título não encontrado" com link de volta ao catálogo.

### `admin.html` — Administração

- Não é linkado em nenhuma página pública; acesso apenas via URL direta.
- Tela de senha simples (client-side, armazenada em admin.js) antes de exibir qualquer formulário ou dado. Não é segurança real — apenas evita acesso casual, já que o código-fonte é público.
- Ao autenticar, carrega `data/catalog.json` via fetch relativo para popular a lista atual.
- Lista de filmes e séries já cadastrados, cada um com botões "Editar" e "Remover".
- Botão "+ Adicionar Filme": formulário com título, ano, pôster (URL), sinopse, link do Drive.
- Botão "+ Adicionar Série": formulário com título, pôster (URL), sinopse, e gerenciamento de temporadas/episódios:
  - "+ Adicionar Temporada" cria uma nova temporada (numerada sequencialmente).
  - Dentro de cada temporada, "+ Adicionar Episódio" (título do episódio + link do Drive).
- Todas as edições acontecem em memória (estado local da página), refletindo na lista exibida.
- Botão fixo "Exportar catalog.json": serializa o estado atual para JSON formatado e dispara o download do arquivo (`catalog.json`), pronto para substituir o existente no repositório.

## Tratamento de erros / casos-limite

- Link do Drive colado sem ID reconhecível → mensagem de erro no campo, impede salvar o item/episódio.
- `catalog.json` ausente, vazio ou corrompido no carregamento do admin → inicia com listas vazias (`movies: []`, `series: []`) sem travar a página.
- Vídeo do Drive indisponível (arquivo tornado privado/removido) → página de detalhe mostra mensagem amigável no lugar do iframe (não deixa iframe quebrado silencioso). Detecção simples via evento de erro do iframe, quando suportado; caso contrário, apenas uma nota informativa próxima ao player orientando o usuário a verificar o compartilhamento.
- Busca no catálogo sem resultados → mensagem "Nada encontrado".
- Senha incorreta no admin → mensagem de erro, permanece na tela de senha.

## Fora de escopo (YAGNI)

- Autenticação real / backend.
- Upload de imagens (pôsteres são sempre URLs externas).
- Automação de commit/push a partir da página admin.
- Testes automatizados.
- Suporte a múltiplos idiomas/legendas, avaliações, recomendações, etc.
