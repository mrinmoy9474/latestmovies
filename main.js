const moviesGrid = document.getElementById('movies-grid');
const headerAd = document.getElementById('header-ad');
const nativeWrapper = document.getElementById('native-ad-wrapper');
const searchInput = document.getElementById('search');
document.getElementById('year').textContent = new Date().getFullYear();

let DATA = null;
let moviesList = [];

function injectScript({src, text, async = true, attrs = {}}) {
  const s = document.createElement('script');
  if (src) s.src = src;
  if (text) s.textContent = text;
  s.async = !!async;
  Object.entries(attrs).forEach(([k,v]) => s.setAttribute(k, v));
  document.body.appendChild(s);
}

fetch('movies.json')
  .then(r => r.json())
  .then(data => {
    DATA = data;
    moviesList = data.movies;

    renderMovies(moviesList);

    if (data.ads.banner) {
      injectScript({text: data.ads.banner.inline, async: false});
      injectScript({src: data.ads.banner.src});
    }

    if (data.ads.native) {
      const container = document.createElement('div');
      container.id = data.ads.native.containerId;
      nativeWrapper.appendChild(container);
      injectScript({src: data.ads.native.src, attrs: {'data-cfasync': 'false'}});
    }
  });

function renderMovies(list) {
  moviesGrid.innerHTML = '';
  list.forEach((movie, idx) => {
    const card = document.createElement('article');
    card.className = 'movie-card';
    card.innerHTML = `
      <img class="thumb" src="${movie.thumbnail}" alt="${movie.title}">
      <div class="card-body">
        <div class="movie-title">${movie.title}</div>
        <div class="actions">
          <a href="#" class="btn btn-play" data-index="${idx}">Play</a>
        </div>
      </div>
    `;
    moviesGrid.appendChild(card);
  });
}

document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-play');
  if (!btn) return;
  e.preventDefault();

  const movie = moviesList[btn.getAttribute('data-index')];
  if (DATA?.ads?.popunder?.src) injectScript({src: DATA.ads.popunder.src});

  setTimeout(() => {
    window.open(movie.link, '_blank');
  }, 300);
});

searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderMovies(moviesList.filter(m => m.title.toLowerCase().includes(q)));
});
