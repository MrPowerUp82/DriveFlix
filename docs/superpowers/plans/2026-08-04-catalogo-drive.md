# Catálogo de Filmes e Séries (GitHub Pages + Google Drive) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static site (HTML/CSS/JS, no build step) that lists movies and series from a repository-hosted `catalog.json`, plays them via embedded Google Drive iframes, and includes a password-gated admin page that edits the catalog in-memory and exports an updated `catalog.json` for manual commit.

**Architecture:** Three static pages (`index.html`, `titulo.html`, `admin.html`) share a dark theme stylesheet (`assets/style.css`). Public pages share catalog-loading/rendering logic in `assets/app.js`. The admin page has its own state and CRUD logic in `assets/admin.js`, reusing the shared embed-URL helper from `app.js`. Data lives in `data/catalog.json`, fetched client-side — no server, no framework, no npm.

**Tech Stack:** Plain HTML5, CSS3, vanilla JavaScript (ES2020+, `fetch`, template literals, ES modules not required — plain scripts). Local verification server: Python's built-in `http.server` (already installed, confirmed `Python 3.14.5`).

## Global Constraints

- No build step, no npm, no frameworks — plain HTML/CSS/JS only (per spec).
- No backend/server — everything runs client-side as static files, hostable as-is on GitHub Pages.
- No automated tests — verification is manual, in a browser, via a local static server (per spec: "Sem testes automatizados").
- All file references must use **relative paths** (no absolute domain paths), since GitHub Pages may serve from a subpath (`username.github.io/repo-name/`).
- `data/catalog.json` structure is fixed: top-level `movies: []` and `series: []` arrays, matching the shapes in the spec exactly (`id`, `title`, `year`, `poster`, `description`, `driveId` for movies; `id`, `title`, `poster`, `description`, `seasons: [{season, episodes: [{episode, title, driveId}]}]` for series).
- `admin.html` is never linked from public pages and is password-gated client-side (not real security, just friction — per spec).
- Player embed URL format is fixed: `https://drive.google.com/file/d/<driveId>/preview`.

---

## File Structure

```
index.html          # catalog/home page
titulo.html          # detail page (movie or series) + player
admin.html           # admin page (password gate + CRUD forms)
assets/
  style.css          # shared dark theme, grid, detail, and form styles
  app.js             # shared: fetch catalog, render grid, render detail, embed URL helper
  admin.js           # admin-only: password gate, in-memory CRUD, drive-link parsing, JSON export
data/
  catalog.json       # the "database" — starts as { "movies": [], "series": [] }
```

---

### Task 1: Scaffold, shared stylesheet, and empty catalog

**Files:**
- Create: `data/catalog.json`
- Create: `assets/style.css`
- Create: `index.html`

**Interfaces:**
- Produces: CSS custom properties consumed by all later pages: `--bg`, `--bg-elevated`, `--text`, `--text-dim`, `--accent`, `--danger`, `--radius`, `--gap`. CSS classes: `.top-nav`, `.grid`, `.card`, `.card img`, `.card .card-title`, `.empty-state`, `.form-field`, `.form-row`, `.btn`, `.btn-primary`, `.btn-danger`.
- Produces: `data/catalog.json` with shape `{ "movies": [], "series": [] }`, which Task 2 will `fetch()`.

- [ ] **Step 1: Create the empty catalog database**

Create `data/catalog.json`:

```json
{
  "movies": [],
  "series": []
}
```

- [ ] **Step 2: Create the shared stylesheet**

Create `assets/style.css`:

```css
:root {
  --bg: #0b0b0f;
  --bg-elevated: #17171f;
  --text: #f2f2f5;
  --text-dim: #a0a0ad;
  --accent: #e63946;
  --danger: #ff5c5c;
  --radius: 8px;
  --gap: 16px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

a { color: inherit; text-decoration: none; }

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--bg-elevated);
  gap: var(--gap);
  flex-wrap: wrap;
}

.top-nav .brand {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent);
}

.top-nav input[type="search"] {
  flex: 1;
  min-width: 160px;
  max-width: 320px;
  padding: 8px 12px;
  border-radius: var(--radius);
  border: 1px solid #2a2a35;
  background: var(--bg);
  color: var(--text);
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-buttons button {
  padding: 6px 12px;
  border-radius: var(--radius);
  border: 1px solid #2a2a35;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
}

.filter-buttons button.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

main {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--gap);
}

.card {
  background: var(--bg-elevated);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.card:hover { transform: scale(1.04); }

.card img {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  display: block;
  background: #22222c;
}

.card .card-title {
  padding: 8px 10px;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  color: var(--text-dim);
  padding: 60px 20px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

.detail-header {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.detail-header img {
  width: 200px;
  border-radius: var(--radius);
  flex-shrink: 0;
}

.player-wrap iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: none;
  border-radius: var(--radius);
  background: black;
}

.player-note {
  color: var(--text-dim);
  font-size: 0.85rem;
  margin-top: 8px;
}

.season-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.season-tabs button {
  padding: 6px 12px;
  border-radius: var(--radius);
  border: 1px solid #2a2a35;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
}

.season-tabs button.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.episode-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.episode-list .episode-item {
  padding: 10px 12px;
  border-radius: var(--radius);
  background: var(--bg-elevated);
  cursor: pointer;
}

.episode-list .episode-item.active {
  outline: 2px solid var(--accent);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.form-field label { font-size: 0.85rem; color: var(--text-dim); }

.form-field input, .form-field textarea {
  padding: 8px 10px;
  border-radius: var(--radius);
  border: 1px solid #2a2a35;
  background: var(--bg-elevated);
  color: var(--text);
  font-family: inherit;
}

.form-field .field-error {
  color: var(--danger);
  font-size: 0.8rem;
}

.form-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.form-row .form-field { flex: 1; min-width: 140px; }

.btn {
  padding: 8px 16px;
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary { background: var(--accent); color: white; }
.btn-danger { background: transparent; color: var(--danger); border: 1px solid var(--danger); }
.btn-secondary { background: #2a2a35; color: var(--text); }

.admin-item {
  background: var(--bg-elevated);
  border-radius: var(--radius);
  padding: 12px 16px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.admin-item .admin-item-actions { display: flex; gap: 8px; }

.season-block {
  border: 1px solid #2a2a35;
  border-radius: var(--radius);
  padding: 12px;
  margin-bottom: 12px;
}

.password-gate {
  max-width: 320px;
  margin: 80px auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

- [ ] **Step 3: Create the index.html shell**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meu Catálogo</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <nav class="top-nav">
    <a class="brand" href="index.html">Meu Catálogo</a>
    <input type="search" id="search-input" placeholder="Buscar por título...">
    <div class="filter-buttons" id="filter-buttons">
      <button data-filter="all" class="active">Todos</button>
      <button data-filter="movie">Filmes</button>
      <button data-filter="series">Séries</button>
    </div>
  </nav>
  <main>
    <div class="grid" id="catalog-grid"></div>
  </main>
</body>
</html>
```

- [ ] **Step 4: Verify manually**

Run a local static server from the project root:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/index.html` in a browser. Expected: dark page, top nav with "Meu Catálogo", search box, filter buttons, and an empty grid area below (no errors in the DevTools console — the grid script doesn't exist yet, so nothing renders, which is expected at this step). Stop the server with Ctrl+C when done.

- [ ] **Step 5: Commit**

```bash
git add data/catalog.json assets/style.css index.html
git commit -m "feat: scaffold site shell, dark theme, and empty catalog"
```

---

### Task 2: Catalog listing — fetch, render grid, search, filter

**Files:**
- Create: `assets/app.js`
- Modify: `index.html` (add script tag)

**Interfaces:**
- Consumes: `data/catalog.json` shape from Task 1 (`{ movies: [], series: [] }`); CSS classes `.grid`, `.card`, `.card-title`, `.empty-state` from Task 1's `style.css`.
- Produces (used by Task 3 and Task 4's public-facing needs): `async function loadCatalog()`, `function buildDriveEmbedUrl(driveId)`, `function getQueryParam(name)`, `function findItemById(catalog, id)` returning `{ type: 'movie' | 'series', item }` or `null`.

- [ ] **Step 1: Write `assets/app.js`**

Create `assets/app.js`:

```javascript
// Shared catalog logic used by index.html and titulo.html.

async function loadCatalog() {
  try {
    const res = await fetch('data/catalog.json', { cache: 'no-store' });
    if (!res.ok) return { movies: [], series: [] };
    const data = await res.json();
    return {
      movies: Array.isArray(data.movies) ? data.movies : [],
      series: Array.isArray(data.series) ? data.series : []
    };
  } catch (err) {
    console.error('Falha ao carregar catalog.json', err);
    return { movies: [], series: [] };
  }
}

function buildDriveEmbedUrl(driveId) {
  return `https://drive.google.com/file/d/${driveId}/preview`;
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function findItemById(catalog, id) {
  const movie = catalog.movies.find(m => m.id === id);
  if (movie) return { type: 'movie', item: movie };
  const series = catalog.series.find(s => s.id === id);
  if (series) return { type: 'series', item: series };
  return null;
}

function createCard(item, type) {
  const card = document.createElement('a');
  card.className = 'card';
  card.href = `titulo.html?id=${encodeURIComponent(item.id)}`;
  const poster = item.poster || '';
  card.innerHTML = `
    <img src="${poster}" alt="${item.title}" loading="lazy">
    <div class="card-title">${item.title}</div>
  `;
  return card;
}

function renderGrid(catalog, container, options) {
  const query = (options.query || '').trim().toLowerCase();
  const filter = options.filter || 'all';

  const movies = filter === 'series' ? [] : catalog.movies;
  const series = filter === 'movie' ? [] : catalog.series;

  const items = [
    ...movies.map(m => ({ item: m, type: 'movie' })),
    ...series.map(s => ({ item: s, type: 'series' }))
  ].filter(({ item }) => item.title.toLowerCase().includes(query));

  container.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = query ? 'Nada encontrado.' : 'Nenhum título cadastrado ainda.';
    container.appendChild(empty);
    return;
  }

  for (const { item, type } of items) {
    container.appendChild(createCard(item, type));
  }
}
```

- [ ] **Step 2: Wire it into `index.html`**

Modify `index.html`, replacing the `</body>` line with:

```html
  <script src="assets/app.js"></script>
  <script>
    (async function initIndex() {
      const grid = document.getElementById('catalog-grid');
      const searchInput = document.getElementById('search-input');
      const filterButtons = document.getElementById('filter-buttons');
      const catalog = await loadCatalog();
      let currentFilter = 'all';

      function draw() {
        renderGrid(catalog, grid, { query: searchInput.value, filter: currentFilter });
      }

      searchInput.addEventListener('input', draw);
      filterButtons.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-filter]');
        if (!btn) return;
        currentFilter = btn.dataset.filter;
        for (const b of filterButtons.querySelectorAll('button')) b.classList.remove('active');
        btn.classList.add('active');
        draw();
      });

      draw();
    })();
  </script>
</body>
```

- [ ] **Step 3: Verify manually**

```bash
python -m http.server 8000
```

Open `http://localhost:8000/index.html`. Expected: grid area shows "Nenhum título cadastrado ainda." (since `catalog.json` is still empty), no console errors. Typing in the search box and clicking filter buttons should not throw errors. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add assets/app.js index.html
git commit -m "feat: render catalog grid with search and type filter"
```

---

### Task 3: Detail page — movie and series playback

**Files:**
- Create: `titulo.html`
- Modify: `assets/app.js` (add detail-rendering functions)

**Interfaces:**
- Consumes: `loadCatalog()`, `findItemById()`, `buildDriveEmbedUrl()`, `getQueryParam()` from Task 2.
- Produces: `function renderMovieDetail(container, movie)`, `function renderSeriesDetail(container, series)`, `function showNotFound(container)` — self-contained, not consumed elsewhere.

- [ ] **Step 1: Create `titulo.html`**

Create `titulo.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Detalhes — Meu Catálogo</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <nav class="top-nav">
    <a class="brand" href="index.html">Meu Catálogo</a>
  </nav>
  <main>
    <div id="detail-container"></div>
  </main>
  <script src="assets/app.js"></script>
  <script>
    (async function initDetail() {
      const container = document.getElementById('detail-container');
      const catalog = await loadCatalog();
      const id = getQueryParam('id');
      const found = id ? findItemById(catalog, id) : null;

      if (!found) {
        showNotFound(container);
        return;
      }

      if (found.type === 'movie') {
        renderMovieDetail(container, found.item);
      } else {
        renderSeriesDetail(container, found.item);
      }
    })();
  </script>
</body>
</html>
```

- [ ] **Step 2: Add detail-rendering functions to `assets/app.js`**

Append to `assets/app.js`:

```javascript
function playerNoteHtml() {
  return `<p class="player-note">Se o vídeo não carregar, verifique se o link do Google Drive está compartilhado como "qualquer pessoa com o link".</p>`;
}

function showNotFound(container) {
  container.innerHTML = `
    <div class="empty-state">
      <p>Título não encontrado.</p>
      <a class="btn btn-secondary" href="index.html">Voltar ao catálogo</a>
    </div>
  `;
}

function renderMovieDetail(container, movie) {
  container.innerHTML = `
    <div class="detail">
      <div class="detail-header">
        <img src="${movie.poster || ''}" alt="${movie.title}">
        <div>
          <h1>${movie.title}${movie.year ? ` (${movie.year})` : ''}</h1>
          <p>${movie.description || ''}</p>
        </div>
      </div>
      <div class="player-wrap">
        <iframe src="${buildDriveEmbedUrl(movie.driveId)}" allow="autoplay" allowfullscreen></iframe>
        ${playerNoteHtml()}
      </div>
    </div>
  `;
}

function renderSeriesDetail(container, series) {
  const seasons = series.seasons || [];

  container.innerHTML = `
    <div class="detail">
      <div class="detail-header">
        <img src="${series.poster || ''}" alt="${series.title}">
        <div>
          <h1>${series.title}</h1>
          <p>${series.description || ''}</p>
        </div>
      </div>
      <div class="season-tabs" id="season-tabs"></div>
      <div class="episode-list" id="episode-list"></div>
      <div class="player-wrap" id="player-wrap">
        <p class="empty-state">Selecione um episódio.</p>
      </div>
    </div>
  `;

  const seasonTabs = container.querySelector('#season-tabs');
  const episodeList = container.querySelector('#episode-list');
  const playerWrap = container.querySelector('#player-wrap');

  function renderPlayer(episode) {
    playerWrap.innerHTML = `
      <iframe src="${buildDriveEmbedUrl(episode.driveId)}" allow="autoplay" allowfullscreen></iframe>
      ${playerNoteHtml()}
    `;
  }

  function renderEpisodes(season) {
    episodeList.innerHTML = '';
    const episodes = season.episodes || [];
    episodes.forEach((ep, idx) => {
      const row = document.createElement('div');
      row.className = 'episode-item';
      row.textContent = `${ep.episode}. ${ep.title}`;
      row.addEventListener('click', () => {
        for (const el of episodeList.querySelectorAll('.episode-item')) el.classList.remove('active');
        row.classList.add('active');
        renderPlayer(ep);
      });
      episodeList.appendChild(row);
      if (idx === 0) {
        row.classList.add('active');
        renderPlayer(ep);
      }
    });
  }

  seasons.forEach((season, idx) => {
    const btn = document.createElement('button');
    btn.textContent = `Temporada ${season.season}`;
    btn.addEventListener('click', () => {
      for (const b of seasonTabs.querySelectorAll('button')) b.classList.remove('active');
      btn.classList.add('active');
      renderEpisodes(season);
    });
    seasonTabs.appendChild(btn);
    if (idx === 0) {
      btn.classList.add('active');
      renderEpisodes(season);
    }
  });

  if (seasons.length === 0) {
    playerWrap.innerHTML = '<p class="empty-state">Nenhuma temporada cadastrada.</p>';
  }
}
```

- [ ] **Step 3: Verify manually with a temporary test entry (not committed)**

Temporarily edit `data/catalog.json` to:

```json
{
  "movies": [
    { "id": "m-test", "title": "Filme Teste", "year": 2024, "poster": "", "description": "Descrição teste", "driveId": "TEST_ID" }
  ],
  "series": [
    { "id": "s-test", "title": "Série Teste", "poster": "", "description": "Descrição teste",
      "seasons": [ { "season": 1, "episodes": [ { "episode": 1, "title": "Piloto", "driveId": "TEST_ID" } ] } ] }
  ]
}
```

```bash
python -m http.server 8000
```

Open `http://localhost:8000/titulo.html?id=m-test` — expect movie title, description, and an iframe (it will show a Google "can't find file" page since `TEST_ID` is fake, but the iframe itself must render with no JS console errors). Open `http://localhost:8000/titulo.html?id=s-test` — expect "Temporada 1" tab, "1. Piloto" episode row (auto-selected), and the iframe. Open `http://localhost:8000/titulo.html?id=does-not-exist` — expect "Título não encontrado." with a working "Voltar ao catálogo" link. Stop the server.

Revert `data/catalog.json` back to `{ "movies": [], "series": [] }` — **do not commit the test data.**

- [ ] **Step 4: Commit**

```bash
git add titulo.html assets/app.js
git commit -m "feat: add detail page with movie and series playback"
```

---

### Task 4: Admin shell and password gate

**Files:**
- Create: `admin.html`
- Create: `assets/admin.js`

**Interfaces:**
- Consumes: `loadCatalog()` from `assets/app.js`.
- Produces: module-level `state = { movies: [], series: [] }` and `function renderAdminList()` (empty for now — filled in by Task 5/6), both consumed by later tasks in this same file.

- [ ] **Step 1: Create `admin.html`**

Create `admin.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Meu Catálogo</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <div class="password-gate" id="password-gate">
    <h2>Área restrita</h2>
    <div class="form-field">
      <label for="password-input">Senha</label>
      <input type="password" id="password-input">
      <span class="field-error" id="password-error" style="display:none;">Senha incorreta.</span>
    </div>
    <button class="btn btn-primary" id="password-submit">Entrar</button>
  </div>

  <div id="admin-app" style="display:none;">
    <nav class="top-nav">
      <span class="brand">Admin — Meu Catálogo</span>
      <button class="btn btn-primary" id="export-btn">Exportar catalog.json</button>
    </nav>
    <main>
      <div class="form-row">
        <button class="btn btn-secondary" id="add-movie-btn">+ Adicionar Filme</button>
        <button class="btn btn-secondary" id="add-series-btn">+ Adicionar Série</button>
      </div>
      <h3>Filmes</h3>
      <div id="movies-list"></div>
      <h3>Séries</h3>
      <div id="series-list"></div>
      <div id="form-modal"></div>
    </main>
  </div>

  <script src="assets/app.js"></script>
  <script src="assets/admin.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `assets/admin.js` with password gate and empty-state rendering**

Create `assets/admin.js`:

```javascript
// Admin-only logic: password gate, in-memory CRUD, JSON export.
// Not real security — the source is public. Just friction against casual access.
const ADMIN_PASSWORD = 'changeme';

let state = { movies: [], series: [] };

function renderAdminList() {
  const moviesList = document.getElementById('movies-list');
  const seriesList = document.getElementById('series-list');

  moviesList.innerHTML = state.movies.length
    ? ''
    : '<p class="empty-state">Nenhum filme cadastrado.</p>';
  for (const movie of state.movies) {
    const row = document.createElement('div');
    row.className = 'admin-item';
    row.innerHTML = `
      <span>${movie.title}</span>
      <span class="admin-item-actions">
        <button class="btn btn-secondary" data-edit-movie="${movie.id}">Editar</button>
        <button class="btn btn-danger" data-delete-movie="${movie.id}">Remover</button>
      </span>
    `;
    moviesList.appendChild(row);
  }

  seriesList.innerHTML = state.series.length
    ? ''
    : '<p class="empty-state">Nenhuma série cadastrada.</p>';
  for (const series of state.series) {
    const row = document.createElement('div');
    row.className = 'admin-item';
    row.innerHTML = `
      <span>${series.title}</span>
      <span class="admin-item-actions">
        <button class="btn btn-secondary" data-edit-series="${series.id}">Editar</button>
        <button class="btn btn-danger" data-delete-series="${series.id}">Remover</button>
      </span>
    `;
    seriesList.appendChild(row);
  }
}

async function initAdmin() {
  const gate = document.getElementById('password-gate');
  const app = document.getElementById('admin-app');
  const input = document.getElementById('password-input');
  const error = document.getElementById('password-error');

  document.getElementById('password-submit').addEventListener('click', async () => {
    if (input.value !== ADMIN_PASSWORD) {
      error.style.display = 'block';
      return;
    }
    error.style.display = 'none';
    gate.style.display = 'none';
    app.style.display = 'block';
    state = await loadCatalog();
    renderAdminList();
  });
}

initAdmin();
```

- [ ] **Step 3: Verify manually**

```bash
python -m http.server 8000
```

Open `http://localhost:8000/admin.html`. Expected: only the password screen is visible. Enter a wrong password → "Senha incorreta." appears. Enter `changeme` → password screen hides, admin app shows with "Nenhum filme cadastrado." and "Nenhuma série cadastrada." (since `catalog.json` is empty). No console errors. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add admin.html assets/admin.js
git commit -m "feat: add admin shell with password gate"
```

---

### Task 4b: Password note

Before moving on: the placeholder password `changeme` in `assets/admin.js` should be changed to something only you know before you actually publish this repository (see Task 8's checklist, which reminds you of this). It's plain text in a public file — treat it as a speed bump, not a secret.

---

### Task 5: Admin — movie CRUD

**Files:**
- Modify: `assets/admin.js` (add drive-link parsing, movie form, save/delete)
- Modify: `admin.html` (none needed — `#form-modal` already exists from Task 4)

**Interfaces:**
- Consumes: `state`, `renderAdminList()` from Task 4.
- Produces: `function extractDriveId(url)`, `function openMovieForm(existingMovie)`, `function closeForm()` — the latter two also consumed by Task 6's series form and Task 7 is unaffected.

- [ ] **Step 1: Add drive-link parsing and form helpers to `assets/admin.js`**

Append to `assets/admin.js`:

```javascript
function extractDriveId(url) {
  if (!url) return null;
  const patterns = [
    /\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function makeId(title) {
  const slug = title.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${slug}-${Math.random().toString(36).slice(2, 8)}`;
}

function closeForm() {
  document.getElementById('form-modal').innerHTML = '';
}
```

- [ ] **Step 2: Add the movie form to `assets/admin.js`**

Append to `assets/admin.js`:

```javascript
function openMovieForm(existingMovie) {
  const modal = document.getElementById('form-modal');
  const movie = existingMovie || { id: '', title: '', year: '', poster: '', description: '', driveLink: '' };

  modal.innerHTML = `
    <div class="season-block">
      <h3>${existingMovie ? 'Editar Filme' : 'Adicionar Filme'}</h3>
      <div class="form-row">
        <div class="form-field">
          <label>Título</label>
          <input type="text" id="movie-title" value="${movie.title || ''}">
        </div>
        <div class="form-field">
          <label>Ano</label>
          <input type="number" id="movie-year" value="${movie.year || ''}">
        </div>
      </div>
      <div class="form-field">
        <label>Pôster (URL)</label>
        <input type="text" id="movie-poster" value="${movie.poster || ''}">
      </div>
      <div class="form-field">
        <label>Sinopse</label>
        <textarea id="movie-description">${movie.description || ''}</textarea>
      </div>
      <div class="form-field">
        <label>Link do Google Drive</label>
        <input type="text" id="movie-drive-link" value="">
        <span class="field-error" id="movie-drive-error" style="display:none;">Não foi possível extrair um ID válido desse link.</span>
      </div>
      <div class="form-row">
        <button class="btn btn-primary" id="movie-save-btn">Salvar</button>
        <button class="btn btn-secondary" id="movie-cancel-btn">Cancelar</button>
      </div>
    </div>
  `;

  document.getElementById('movie-cancel-btn').addEventListener('click', closeForm);

  document.getElementById('movie-save-btn').addEventListener('click', () => {
    const title = document.getElementById('movie-title').value.trim();
    const driveLinkInput = document.getElementById('movie-drive-link').value.trim();
    const driveError = document.getElementById('movie-drive-error');

    const driveId = driveLinkInput ? extractDriveId(driveLinkInput) : movie.driveId;

    if (!title || !driveId) {
      driveError.style.display = driveId ? 'none' : 'block';
      if (!title) alert('Título é obrigatório.');
      return;
    }

    const record = {
      id: existingMovie ? existingMovie.id : makeId(title),
      title,
      year: Number(document.getElementById('movie-year').value) || undefined,
      poster: document.getElementById('movie-poster').value.trim(),
      description: document.getElementById('movie-description').value.trim(),
      driveId
    };

    if (existingMovie) {
      const idx = state.movies.findIndex(m => m.id === existingMovie.id);
      state.movies[idx] = record;
    } else {
      state.movies.push(record);
    }

    closeForm();
    renderAdminList();
  });
}

function deleteMovie(id) {
  state.movies = state.movies.filter(m => m.id !== id);
  renderAdminList();
}
```

- [ ] **Step 3: Wire the buttons in `assets/admin.js`**

Modify the `renderAdminList` function's movie row `innerHTML` block from Task 4 — after building each movie row, attach listeners. Replace the movie-loop body:

```javascript
  for (const movie of state.movies) {
    const row = document.createElement('div');
    row.className = 'admin-item';
    row.innerHTML = `
      <span>${movie.title}</span>
      <span class="admin-item-actions">
        <button class="btn btn-secondary" data-edit-movie="${movie.id}">Editar</button>
        <button class="btn btn-danger" data-delete-movie="${movie.id}">Remover</button>
      </span>
    `;
    row.querySelector(`[data-edit-movie]`).addEventListener('click', () => openMovieForm(movie));
    row.querySelector(`[data-delete-movie]`).addEventListener('click', () => deleteMovie(movie.id));
    moviesList.appendChild(row);
  }
```

Then, in `initAdmin`, after `renderAdminList();` inside the password-submit handler, and also at the top level (outside any function) add the "add movie" button wiring:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-movie-btn').addEventListener('click', () => openMovieForm(null));
});
```

- [ ] **Step 4: Verify manually**

```bash
python -m http.server 8000
```

Open `http://localhost:8000/admin.html`, log in with `changeme`. Click "+ Adicionar Filme", fill in Título "Filme Teste", Link do Google Drive `https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view`, click Salvar. Expected: form closes, "Filme Teste" appears in the movies list. Click "Editar" → form pre-fills title (drive link field is blank — expected, since you only need to re-enter it if changing). Click "Remover" → item disappears. Try saving with an invalid drive link (e.g. `not-a-link`) → error message appears, item is not saved. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add assets/admin.js
git commit -m "feat: add movie CRUD to admin page"
```

---

### Task 6: Admin — series CRUD with seasons and episodes

**Files:**
- Modify: `assets/admin.js` (add series form, season/episode management)

**Interfaces:**
- Consumes: `state`, `renderAdminList()`, `extractDriveId()`, `makeId()`, `closeForm()` from Tasks 4-5.
- Produces: `function openSeriesForm(existingSeries)` — self-contained, not consumed elsewhere.

- [ ] **Step 1: Add the series form to `assets/admin.js`**

Append to `assets/admin.js`:

```javascript
function openSeriesForm(existingSeries) {
  const modal = document.getElementById('form-modal');
  // Work on a deep copy so Cancel doesn't mutate state.
  const draft = existingSeries
    ? JSON.parse(JSON.stringify(existingSeries))
    : { id: '', title: '', poster: '', description: '', seasons: [] };

  function renderForm() {
    modal.innerHTML = `
      <div class="season-block">
        <h3>${existingSeries ? 'Editar Série' : 'Adicionar Série'}</h3>
        <div class="form-field">
          <label>Título</label>
          <input type="text" id="series-title" value="${draft.title || ''}">
        </div>
        <div class="form-field">
          <label>Pôster (URL)</label>
          <input type="text" id="series-poster" value="${draft.poster || ''}">
        </div>
        <div class="form-field">
          <label>Sinopse</label>
          <textarea id="series-description">${draft.description || ''}</textarea>
        </div>
        <div id="seasons-container"></div>
        <button class="btn btn-secondary" id="add-season-btn">+ Adicionar Temporada</button>
        <div class="form-row" style="margin-top:16px;">
          <button class="btn btn-primary" id="series-save-btn">Salvar</button>
          <button class="btn btn-secondary" id="series-cancel-btn">Cancelar</button>
        </div>
      </div>
    `;

    const seasonsContainer = document.getElementById('seasons-container');
    draft.seasons.forEach((season, sIdx) => {
      const block = document.createElement('div');
      block.className = 'season-block';
      block.innerHTML = `
        <div class="form-row">
          <strong>Temporada ${season.season}</strong>
          <button class="btn btn-danger" data-remove-season="${sIdx}">Remover Temporada</button>
        </div>
        <div class="episode-list" id="episodes-${sIdx}"></div>
        <div class="form-row">
          <input type="text" placeholder="Título do episódio" id="new-ep-title-${sIdx}">
          <input type="text" placeholder="Link do Google Drive" id="new-ep-link-${sIdx}">
          <button class="btn btn-secondary" data-add-episode="${sIdx}">+ Episódio</button>
        </div>
      `;
      seasonsContainer.appendChild(block);

      const epList = block.querySelector(`#episodes-${sIdx}`);
      season.episodes.forEach((ep, eIdx) => {
        const row = document.createElement('div');
        row.className = 'episode-item';
        row.innerHTML = `${ep.episode}. ${ep.title} <button class="btn btn-danger" data-remove-episode="${sIdx}:${eIdx}">Remover</button>`;
        epList.appendChild(row);
      });

      block.querySelector(`[data-remove-season="${sIdx}"]`).addEventListener('click', () => {
        draft.seasons.splice(sIdx, 1);
        renderForm();
      });

      block.querySelector(`[data-add-episode="${sIdx}"]`).addEventListener('click', () => {
        const titleInput = document.getElementById(`new-ep-title-${sIdx}`);
        const linkInput = document.getElementById(`new-ep-link-${sIdx}`);
        const title = titleInput.value.trim();
        const driveId = extractDriveId(linkInput.value.trim());
        if (!title || !driveId) {
          alert('Informe o título do episódio e um link válido do Google Drive.');
          return;
        }
        season.episodes.push({ episode: season.episodes.length + 1, title, driveId });
        renderForm();
      });

      block.querySelectorAll('[data-remove-episode]').forEach(btn => {
        btn.addEventListener('click', () => {
          const [sI, eI] = btn.dataset.removeEpisode.split(':').map(Number);
          draft.seasons[sI].episodes.splice(eI, 1);
          draft.seasons[sI].episodes.forEach((ep, i) => { ep.episode = i + 1; });
          renderForm();
        });
      });
    });

    document.getElementById('add-season-btn').addEventListener('click', () => {
      draft.seasons.push({ season: draft.seasons.length + 1, episodes: [] });
      renderForm();
    });

    document.getElementById('series-cancel-btn').addEventListener('click', closeForm);

    document.getElementById('series-save-btn').addEventListener('click', () => {
      const title = document.getElementById('series-title').value.trim();
      if (!title) {
        alert('Título é obrigatório.');
        return;
      }
      const record = {
        id: existingSeries ? existingSeries.id : makeId(title),
        title,
        poster: document.getElementById('series-poster').value.trim(),
        description: document.getElementById('series-description').value.trim(),
        seasons: draft.seasons
      };
      if (existingSeries) {
        const idx = state.series.findIndex(s => s.id === existingSeries.id);
        state.series[idx] = record;
      } else {
        state.series.push(record);
      }
      closeForm();
      renderAdminList();
    });
  }

  renderForm();
}

function deleteSeries(id) {
  state.series = state.series.filter(s => s.id !== id);
  renderAdminList();
}
```

- [ ] **Step 2: Wire the series buttons**

Modify the `renderAdminList` function's series-loop body (added in Task 4) to attach listeners, same pattern as movies:

```javascript
  for (const series of state.series) {
    const row = document.createElement('div');
    row.className = 'admin-item';
    row.innerHTML = `
      <span>${series.title}</span>
      <span class="admin-item-actions">
        <button class="btn btn-secondary" data-edit-series="${series.id}">Editar</button>
        <button class="btn btn-danger" data-delete-series="${series.id}">Remover</button>
      </span>
    `;
    row.querySelector(`[data-edit-series]`).addEventListener('click', () => openSeriesForm(series));
    row.querySelector(`[data-delete-series]`).addEventListener('click', () => deleteSeries(series.id));
    seriesList.appendChild(row);
  }
```

Add the "add series" button wiring in the same `DOMContentLoaded` listener from Task 5 Step 3:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-movie-btn').addEventListener('click', () => openMovieForm(null));
  document.getElementById('add-series-btn').addEventListener('click', () => openSeriesForm(null));
});
```

- [ ] **Step 3: Verify manually**

```bash
python -m http.server 8000
```

Open `http://localhost:8000/admin.html`, log in. Click "+ Adicionar Série", set title "Série Teste", click "+ Adicionar Temporada" (shows "Temporada 1"), fill episode title "Piloto" + a valid-looking Drive link, click "+ Episódio" → appears as "1. Piloto" with a Remover button. Click Salvar → series appears in the séries list. Click "Editar" → form reopens with Temporada 1 and the episode preserved. Remove the episode, then remove the season, then Salvar. Click "Remover" on the series row → disappears. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add assets/admin.js
git commit -m "feat: add series CRUD with seasons and episodes to admin page"
```

---

### Task 7: Export catalog.json

**Files:**
- Modify: `assets/admin.js` (add export function)

**Interfaces:**
- Consumes: `state` from Tasks 4-6.
- Produces: none consumed elsewhere — terminal feature.

- [ ] **Step 1: Add the export function**

Append to `assets/admin.js`:

```javascript
function exportCatalog() {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'catalog.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

Wire the button inside the existing `DOMContentLoaded` listener:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-movie-btn').addEventListener('click', () => openMovieForm(null));
  document.getElementById('add-series-btn').addEventListener('click', () => openSeriesForm(null));
  document.getElementById('export-btn').addEventListener('click', exportCatalog);
});
```

- [ ] **Step 2: Verify manually**

```bash
python -m http.server 8000
```

Open `http://localhost:8000/admin.html`, log in, add one movie and one series (as in Tasks 5-6), click "Exportar catalog.json". Expected: browser downloads `catalog.json`. Open the downloaded file and confirm it's valid JSON matching the shape `{ "movies": [...], "series": [...] }` with the items you added, correct `driveId` values, and sequential episode numbers. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add assets/admin.js
git commit -m "feat: add catalog.json export from admin page"
```

---

### Task 8: Final end-to-end verification and GitHub Pages readiness

**Files:**
- Modify: `data/catalog.json` (only if the temporary test data from Task 3 was accidentally left in — confirm it wasn't)
- No new files.

**Interfaces:**
- Consumes: everything from Tasks 1-7.
- Produces: nothing — this is a verification-only task.

- [ ] **Step 1: Confirm `data/catalog.json` is clean**

Open `data/catalog.json` and confirm it is exactly:

```json
{
  "movies": [],
  "series": []
}
```

If any test data remains from Task 3's manual verification, remove it now.

- [ ] **Step 2: Full manual walkthrough**

```bash
python -m http.server 8000
```

Walk through, in order:
1. `http://localhost:8000/index.html` — empty state shows, search/filter don't error.
2. `http://localhost:8000/admin.html` — log in, add a movie with a real Google Drive share link (one of your own public files) and a real poster URL.
3. Add a series with at least one season and one episode, using a real Drive share link.
4. Export `catalog.json`, and manually copy its contents over `data/catalog.json` in the project (simulating the real publish workflow).
5. Reload `http://localhost:8000/index.html` — the movie and series cards now appear with real posters.
6. Click into the movie card — the real video should play in the iframe.
7. Click into the series card — select the episode — the real video should play.
8. Confirm no absolute URLs (e.g. `http://localhost...` or `file://...`) are hardcoded anywhere in the HTML/JS/CSS — all internal references must be relative (`assets/...`, `data/...`, `titulo.html?id=...`).

Stop the server.

- [ ] **Step 3: Change the admin password**

In `assets/admin.js`, change `const ADMIN_PASSWORD = 'changeme';` to a password only you know, before this repository is pushed publicly.

- [ ] **Step 4: Commit**

```bash
git add data/catalog.json assets/admin.js
git commit -m "chore: finalize catalog data and admin password for launch"
```

- [ ] **Step 5: Note next steps for GitHub Pages (manual, outside this plan)**

Once committed, publishing requires (outside the scope of this plan, since it involves your GitHub account):
1. Create a GitHub repository and push this project to it.
2. In the repo's Settings → Pages, set the source to the branch containing these files (root folder).
3. Visit the published `https://<username>.github.io/<repo>/index.html` URL to confirm it works the same as the local server test.
