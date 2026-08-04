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
