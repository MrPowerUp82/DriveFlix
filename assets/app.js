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
