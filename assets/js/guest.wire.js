(function () {
  const { RAWG_API_KEY, RAWG_BASE, YT_API_KEY, YT_BASE } = window.CONFIG;

  // RAWG: 인기 게임 TOP3 (added 순)
  async function loadPopularGames() {
    const url = `${RAWG_BASE}/games?key=${RAWG_API_KEY}&ordering=-added&page_size=3`;
    const data = await apiGet(url);
    const box = document.getElementById("guestTop3");
    if (!box || !data?.results) return;

    box.innerHTML = data.results.map(g => {
      const img = g.background_image || "";
      const genres = (g.genres || []).map(x => esc(x.name));
      return `
        <article class="card">
          <img class="thumb" src="${esc(img)}" alt="${esc(g.name)}" loading="lazy" decoding="async">
          <div class="body">
            <h3>${esc(g.name)}</h3>
            <p class="meta">Metacritic: ${esc(g.metacritic ?? "N/A")}</p>
            <div class="chips">
              ${genres.slice(0,3).map(n => `<span class="chip">${n}</span>`).join("")}
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  // YouTube: 핫한 게임 트레일러 3개
  async function loadHotVideos() {
    const query = "trending game trailer";
    const url = `${YT_BASE}/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`;
    const data = await apiGet(url);
    const box = document.getElementById("guestYT");
    if (!box || !data?.items) return;

    box.innerHTML = data.items.map(v => {
      const vid = v.id.videoId;
      return `<iframe src="https://www.youtube.com/embed/${esc(vid)}" title="${esc(v.snippet.title)}" allowfullscreen loading="lazy"></iframe>`;
    }).join("");
  }

  loadPopularGames();
  loadHotVideos();
})();
