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
    row.querySelector(`[data-edit-movie]`).addEventListener('click', () => openMovieForm(movie));
    row.querySelector(`[data-delete-movie]`).addEventListener('click', () => deleteMovie(movie.id));
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
    row.querySelector(`[data-edit-series]`).addEventListener('click', () => openSeriesForm(series));
    row.querySelector(`[data-delete-series]`).addEventListener('click', () => deleteSeries(series.id));
    seriesList.appendChild(row);
  }
}

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
        syncDraftFields();
        draft.seasons.splice(sIdx, 1);
        draft.seasons.forEach((s, i) => { s.season = i + 1; });
        renderForm();
      });

      block.querySelector(`[data-add-episode="${sIdx}"]`).addEventListener('click', () => {
        syncDraftFields();
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
          syncDraftFields();
          const [sI, eI] = btn.dataset.removeEpisode.split(':').map(Number);
          draft.seasons[sI].episodes.splice(eI, 1);
          draft.seasons[sI].episodes.forEach((ep, i) => { ep.episode = i + 1; });
          renderForm();
        });
      });
    });

    document.getElementById('add-season-btn').addEventListener('click', () => {
      syncDraftFields();
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

  // Helper to sync top-level form fields from DOM back to draft
  // before re-rendering (prevents field values from being wiped on season/episode mutations)
  function syncDraftFields() {
    const titleEl = document.getElementById('series-title');
    const posterEl = document.getElementById('series-poster');
    const descEl = document.getElementById('series-description');
    if (titleEl) draft.title = titleEl.value;
    if (posterEl) draft.poster = posterEl.value;
    if (descEl) draft.description = descEl.value;
  }

  renderForm();
}

function deleteSeries(id) {
  state.series = state.series.filter(s => s.id !== id);
  renderAdminList();
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

initAdmin();

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-movie-btn').addEventListener('click', () => openMovieForm(null));
  document.getElementById('add-series-btn').addEventListener('click', () => openSeriesForm(null));
  document.getElementById('export-btn').addEventListener('click', exportCatalog);
});
