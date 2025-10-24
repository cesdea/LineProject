(function () {
  const { RAWG_API_KEY, RAWG_BASE } = window.CONFIG;

  /* ========== MBTI 선호 매핑 (RAWG 슬러그 기준) ========== */
  const MBTI_PREFS = {
    INFP:{ genres:["indie","adventure","rpg"],     tags:["story-rich","relaxing","singleplayer"] },
    INFJ:{ genres:["adventure","rpg","indie"],     tags:["story-rich","emotional","choices-matter"] },
    INTP:{ genres:["strategy","simulation","rpg"], tags:["management","tactical","turn-based"] },
    INTJ:{ genres:["strategy","simulation","rpg"], tags:["tactical","4x","base-building"] },
    ENFP:{ genres:["adventure","indie","rpg"],     tags:["open-world","exploration","story-rich"] },
    ENFJ:{ genres:["adventure","rpg","indie"],     tags:["choices-matter","story-rich","singleplayer"] },
    ENTP:{ genres:["strategy","indie","simulation"],tags:["roguelike","card-battler","experimental"] },
    ENTJ:{ genres:["strategy","action","simulation"],tags:["competitive","multiplayer","tactical"] },
    ISFP:{ genres:["adventure","indie","simulation"],tags:["relaxing","beautiful","photo-mode"] },
    ISFJ:{ genres:["indie","simulation","adventure"],tags:["casual","cozy","singleplayer"] },
    ISTP:{ genres:["action","racing","shooter"],   tags:["physics","stealth","parkour"] },
    ISTJ:{ genres:["strategy","simulation","action"],tags:["management","realistic","tactical"] },
    ESFP:{ genres:["sports","racing","action"],    tags:["party","multiplayer","arcade"] },
    ESFJ:{ genres:["sports","simulation","indie"], tags:["co-op","local-multiplayer","casual"] },
    ESTP:{ genres:["action","shooter","racing"],   tags:["competitive","multiplayer","fast-paced"] },
    ESTJ:{ genres:["strategy","action","simulation"],tags:["management","tactical","real-time"] },
  };

  const GENRE_SLUGS_6 = ["action","adventure","rpg","shooter","platformer","fighting"];

  /* ========== 헬퍼 ========== */
  const esc = window.esc || (s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[m])));

  function getMbtiGenres(mbti, max = 1){
    const prefs = MBTI_PREFS[mbti] || MBTI_PREFS.INFP;
    return (prefs.genres || []).slice(0, max).join(",");
  }
  function getMbtiTags(mbti, max = 2){
    const prefs = MBTI_PREFS[mbti] || MBTI_PREFS.INFP;
    return (prefs.tags || []).slice(0, max).join(",");
  }

  function placeholderThumb(text = "Game"){
    return `data:image/svg+xml;utf8,` + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'>
        <rect width='640' height='360' fill='#0b0e17'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
              fill='#7c869a' font-family='system-ui,Segoe UI,Roboto,sans-serif' font-size='22'>${text}</text>
      </svg>`
    );
  }

  function renderGameCard(g){
    const img = g.background_image || placeholderThumb(g.name);
    const genres = (g.genres || []).map(x => esc(x.name));
    return `
      <article class="card">
        <img class="thumb" src="${esc(img)}" alt="${esc(g.name)}" loading="lazy" decoding="async">
        <div class="body">
          <h3 class="title">${esc(g.name)}</h3>
          <p class="meta">Metacritic: ${esc(g.metacritic ?? "N/A")}${g.released ? ` · ${esc(g.released)}` : ""}</p>
          <div class="chips">
            ${genres.slice(0,3).map(n => `<span class="chip">${n}</span>`).join("")}
          </div>
        </div>
      </article>
    `;
  }

  /* ========== RAWG: 인기 게임 TOP3 (added 순) — MBTI 장르 반영 ========== */
  async function loadPopularGames(mbti = "INFP") {
    const box = document.getElementById("mbtiTop3") || document.getElementById("guestTop3");
    if (!box) return;
    box.innerHTML = `<div class="empty">불러오는 중…</div>`;

    try {
      const mbtiGenres = getMbtiGenres(mbti, 1); // 필요시 2로 늘려도 됨
      // 예: https://api.rawg.io/api/games?key=...&genres=action&ordering=-added&page_size=3
      const url =
        `${RAWG_BASE}/games?key=${RAWG_API_KEY}` +
        (mbtiGenres ? `&genres=${encodeURIComponent(mbtiGenres)}` : "") +
        `&ordering=-added&page_size=15&dates=${encodeURIComponent("2013-01-01,2030-12-31")}`;

      const data = await apiGet(url);
      const results = data?.results ?? [];
      box.innerHTML = results.length
        ? results.map(renderGameCard).join("")
        : `<div class="empty">표시할 게임이 없어요.</div>`;
    } catch (e) {
      console.error("[RAWG] TOP3 error:", e);
      box.innerHTML = `<div class="empty">목록을 불러오지 못했어요.</div>`;
    }
  }

  /* ========== RAWG: 장르별 인기 게임 TOP1 (6개) — MBTI 태그로 살짝 편향 ========== */
  async function loadGenreTop1(mbti = "INFP") {
    const box = document.getElementById("mbtiYT") || document.getElementById("guestYT");
    if (!box) return;

    box.innerHTML = GENRE_SLUGS_6.map(() => `
      <div class="card"><div class="body"><p class="meta">불러오는 중…</p></div></div>
    `).join("");

    const prefTags = getMbtiTags(mbti, 2);

    const tasks = GENRE_SLUGS_6.map(async (slug) => {
      const params = new URLSearchParams({
        key: RAWG_API_KEY,
        genres: slug,
        ordering: "-rating",
        page_size: "1",
        dates: "2013-01-01,2030-12-31",
      });
      if (prefTags) params.set("tags", prefTags);

      const url = `${RAWG_BASE}/games?${params.toString()}`;
      try {
        const data = await apiGet(url);
        const g = (data?.results ?? [])[0] || null;
        return g;
      } catch (e) {
        console.error(`[RAWG] genre ${slug} error:`, e);
        return null;
      }
    });

    const results = await Promise.all(tasks);
    box.innerHTML = results.map(g => {
      if (!g) {
        return `
          <article class="card">
            <div class="body">
              <h3 class="title">불러오지 못했어요</h3>
              <p class="meta">잠시 후 다시 시도해주세요.</p>
            </div>
          </article>
        `;
      }
      return renderGameCard(g);
    }).join("");
  }

  /* ========== 이벤트 & 초기 로드 ========== */
  const mbtiSelect = document.getElementById("mbtiSelect");
  const applyBtn = document.getElementById("btnApplyMbti");

  applyBtn?.addEventListener("click", async () => {
    const mbti = mbtiSelect?.value || "INFP";
    await Promise.all([loadPopularGames(mbti), loadGenreTop1(mbti)]);
  });

  const initial = mbtiSelect?.value || "INFP";
  loadPopularGames(initial);
  loadGenreTop1(initial);
})();
