/* main.js
 - Loads movies.json
 - Renders movie cards
 - Injects ad scripts from JSON (banner, native)
 - Popunder script is injected when user clicks Play (click-initiated)
*/

const moviesGrid = document.getElementById('movies-grid');
const headerAd = document.getElementById('header-ad');
const nativeWrapper = document.getElementById('native-ad-wrapper');
const searchInput = document.getElementById('search');
document.getElementById('year').textContent = new Date().getFullYear();

let DATA = null;
let moviesList = [];

/* Utility to inject scripts safely so they run */
function injectScript({src, text, async = true, attrs = {}}) {
  const s = document.createElement('script');
  if (src) s.src = src;
  if (text) s.textContent = text;
  s.async = !!async;
  Object.entries(attrs || {}).forEach(([k,v]) => s.setAttribute(k, v));
  document.body.appendChild(s);
  return s;
}

/* Load JSON file (must be served over HTTP) */
fetch('movies.json')
  .then(r => r.json())
  .then(data => {
    DATA = data;
    moviesList = data.movies || [];
    renderMovies(moviesList);

    // Inject Banner ad (structured in JSON)
    if (data.ads && data.ads.banner) {
      const b = data.ads.banner;
      // create container for inline global options (if provided)
      if (b.inline) {
        injectScript({text: b.inline, async: false});
      }
      // external script
      if (b.src) {
        // append to headerAd container then inject external script
        const holder = document.createElement('div');
        holder.innerHTML = b.placeholderHTML || '';
        headerAd.appendChild(holder);
        injectScript({src: b.src, async: true});
      } else {
        // if banner provides rawHTML (rare), inject it
        if (b.rawHTML) {
          headerAd.innerHTML = b.rawHTML;
        }
      }
    }

    // Inject Native ad (we add the container, then script)
    if (data.ads && data.ads.native) {
      const n = data.ads.native;
      // create placeholder container
      const containerId = n.containerId || 'container-native';
      const cont = document.createElement('div');
      cont.id = containerId;
      nativeWrapper.appendChild(cont);

      if (n.src) {
        injectScript({src: n.src, async: true, attrs: {'data-cfasync': 'false'}});
      }
    }
  })
  .catch(err => {
    moviesGrid.innerHTML = `<div style="padding:20px;color:#f88">Failed to load movies.json — check console (must be served over http/https).<br>${err}</div>`;
    console.error(err);
  });


/* Build movie card DOM */
function createCard(movie, index) {
  const card = document.createElement('article');
  card.className = 'movie-card';
  card.innerHTML = `
    <img class="thumb" loading="lazy" src="${escapeHtml(movie.thumbnail || '')}" alt="${escapeHtml(movie.title)} thumbnail" />
    <div class="card-body">
      <div class="movie-title">${escapeHtml(movie.title)}</div>
      <div class="movie-meta">${escapeHtml(movie.year || '')} • ${escapeHtml(movie.tags ? movie.tags.join(', ') : '')}</div>
      <div class="movie-desc">${escapeHtml(movie.description || '')}</div>
      <div class="actions">
        <a href="#" class="btn btn-play" data-index="${index}" role="button">Play ▶</a>
        <a href="${escapeHtml(movie.info || '#')}" target="_blank" rel="noopener" class="btn btn-info">Details</a>
      </div>
    </div>
  `;
  // event delegation for play handled globally
  return card;
}

/* Render list */
function renderMovies(list) {
  moviesGrid.innerHTML = '';
  list.forEach((m,i) => {
    moviesGrid.appendChild(createCard(m,i));
  });
}

/* filter */
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = moviesList.filter(m => (
    (m.title||'').toLowerCase().includes(q) ||
    (m.tags||[]).join(' ').toLowerCase().includes(q) ||
    (m.description||'').toLowerCase().includes(q)
  ));
  renderMovies(filtered);
});

/* Delegate play clicks (so popunder script can be injected then redirect) */
document.body.addEventListener('click', (ev) => {
  const el = ev.target.closest('.btn-play');
  if (!el) return;
  ev.preventDefault();

  const idx = el.getAttribute('data-index');
  const movie = moviesList[Number(idx)];
  if (!movie) return;

  // If popunder info provided in JSON, inject popunder script on click (user-initiated)
  if (DATA && DATA.ads && DATA.ads.popunder && DATA.ads.popunder.src) {
    // inject script then open link
    injectScript({src: DATA.ads.popunder.src, async: true});
    // some popunder providers run on script load; give tiny time then open
    setTimeout(() => {
      openMovieLink(movie);
    }, 300);
  } else {
    openMovieLink(movie);
  }
});

/* open link behavior - use new tab/window so site remains visible */
function openMovieLink(movie) {
  // prefer movie.link; fallback to externalPlay
  const url = movie.link || movie.external || movie.playUrl || '#';
  if (!url || url === '#') {
    alert('No play link specified for this movie.');
    return;
  }
  // Open in new tab/window (target _blank)
  window.open(url, '_blank', 'noopener');
}

/* Basic escaping helper */
function escapeHtml(s){
  if (!s && s !== 0) return '';
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}
