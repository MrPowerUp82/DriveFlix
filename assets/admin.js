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

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-movie-btn').addEventListener('click', () => openMovieForm(null));
});
