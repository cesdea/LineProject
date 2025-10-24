// assets/js/search-enter-to-reasult.js
(function () {
  const inputEl   = document.querySelector("#searchInput");
  // 사용자가 쓴 오타(id="reasult")를 그대로 지원 + 혹시 모를 #result도 보조
  const resultEl  = document.querySelector("#reasult") || document.querySelector("#result");

  if (!inputEl || !resultEl) {
    console.warn("[search] searchInput 또는 reasult/result 요소를 찾지 못했습니다.");
    return;
  }

  // 환경값: window.CONFIG 가 프로젝트에 이미 존재한다고 가정
  const RAWG_BASE = window.CONFIG?.RAWG_BASE || "https://api.rawg.io/api";
  const RAWG_KEY  = window.CONFIG?.RAWG_API_KEY || "";

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  async function runSearch(queryRaw) {
    const q = queryRaw.trim();
    if (!q) {
      resultEl.innerHTML = `<p style="color:#b6b6b6;">검색어를 입력하세요.</p>`;
      return;
    }

    resultEl.innerHTML = `<p style="opacity:.7;">"${esc(q)}" 검색 중…</p>`;

    const url = `${RAWG_BASE}/games?key=${encodeURIComponent(RAWG_KEY)}&search=${encodeURIComponent(q)}&page_size=15&ordering=-metacritic`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const games = data?.results ?? [];

      if (!games.length) {
        resultEl.innerHTML = `<p>검색 결과가 없습니다.</p>`;
        return;
      }

      // 카드 3개 렌더
      resultEl.innerHTML = games.map(g => {
        const img = g.background_image || "";
        const meta = g.metacritic ?? "N/A";
        const genres = (g.genres || []).slice(0, 3).map(x => esc(x.name));
        return `
          <article class="card">
            <img class="thumb" src="${esc(img)}" alt="${esc(g.name)}" loading="lazy" decoding="async">
            <div class="body">
              <h3>${esc(g.name)}</h3>
              <p class="meta">Metacritic: ${esc(meta)}</p>
              <div class="chips">
                ${genres.map(n => `<span class="chip">${n}</span>`).join("")}
              </div>
            </div>
          </article>
        `;
      }).join("");
    } catch (err) {
      console.error(err);
      resultEl.innerHTML = `<p style="color:#ef4444;">검색 중 오류가 발생했습니다.</p>`;
    }
  }

  // Enter로만 실행
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch(inputEl.value);
    }
  });

  // 필요시 외부에서 호출 가능
  window.searchIntoReasult = runSearch;
})();
