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
