// guest.wire.js — RAWG 기반 전체 구현
// 필요 헬퍼: apiGet(url: string) => Promise<json>, RAWG_BASE, RAWG_API_KEY, esc(str)
// HTML 훅: #guestTop3, #guestYT, #mbtiSelect, #btnApplyMbti, #genreSelect, #btnApplyFilters, #btnResetFilters, #guestList

(function () {
  // -------------------- DOM --------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const els = {
    top3:    $("#guestTop3"),
    yt:      $("#guestYT"),
    mbti:    $("#mbtiSelect"),
    gsel:    $("#genreSelect"),
    applyMbti: $("#btnApplyMbti"),
    apply:     $("#btnApplyFilters"),
    reset:     $("#btnResetFilters"),
    list:      $("#guestList"),
    title:   $(".results .page-title"),
  };

  // -------------------- RAWG 공통 --------------------
  const RAWG = {
    BASE: RAWG_BASE,            // ex: "https://api.rawg.io/api"
    KEY:  RAWG_API_KEY,         // ex: "xxxxx"
    ORDERING_POPULAR: "-added", // 인기
    ORDERING_RATING:  "-rating",
    PAGE_TOP3: 3,
    PAGE_TOP1: 1,
    PAGE_LIST: 30,
    DATE_RANGE: "2013-01-01,2030-12-31", // 오래된 게임 과도 제외(선택)
    META_MIN: "70,100",                 // 메타크리틱 하한(선택)
  };

  function rawgUrl(path, params = {}) {
    const url = new URL(path, RAWG.BASE);
    url.searchParams.set("key", RAWG.KEY);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
    return url.toString();
  }

  function placeholderThumb(text = "Game") {
    return `data:image/svg+xml;utf8,` + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'>
        <rect width='640' height='360' fill='#0b0e17'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
              fill='#7c869a' font-family='system-ui,Segoe UI,Roboto,sans-serif' font-size='22'>${text}</text>
      </svg>`
    );
  }

  // -------------------- 라벨/맵 --------------------
  const GENRE_SLUGS_6 = ["action","adventure","rpg","shooter","platformer","fighting"];
  const GENRE_KR = {
    action:"액션", adventure:"어드벤처", rpg:"RPG", shooter:"슈터",
    platformer:"플랫포머", fighting:"격투", strategy:"전략", sports:"스포츠",
    racing:"레이싱", simulation:"시뮬레이션", indie:"인디", all:"전체",
  };
  const genreKR = (slug) => GENRE_KR[slug] || slug;

  // MBTI → 선호 장르/태그(느슨하게 적용)
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

  // -------------------- 카드 렌더 --------------------
  function renderGameCard(g) {
    const img = g.background_image || g.thumb || placeholderThumb(g.name);
    const genres = (g.genres || []).map(x => esc(x.name));
    const metaBits = [
      g.metacritic != null ? `MC ${esc(g.metacritic)}` : null,
      g.released ? esc(g.released) : null,
      g.rating != null ? `★ ${Number(g.rating).toFixed(1)}` : null,
    ].filter(Boolean).join(" · ");

    return `
      <article class="card">
        <img class="thumb" src="${esc(img)}" alt="${esc(g.name)}" loading="lazy" decoding="async">
        <div class="body">
          <h3 class="title">${esc(g.name)}</h3>
          ${metaBits ? `<p class="meta">${metaBits}</p>` : ""}
          <div class="chips">
            ${genres.slice(0,3).map(n => `<span class="chip">${n}</span>`).join("")}
          </div>
        </div>
      </article>
    `;
  }

  // -------------------- TOP3: 인기 게임 --------------------
  async function loadPopularGames() {
    if (!els.top3) return;
    els.top3.innerHTML = `<div class="empty">불러오는 중…</div>`;
    try {
      const url = rawgUrl("/games", {
        ordering: RAWG.ORDERING_POPULAR,
        page_size: RAWG.PAGE_TOP3,
      });
      const data = await apiGet(url);
      const results = data?.results ?? [];
      els.top3.innerHTML = results.length
        ? results.map(renderGameCard).join("")
        : `<div class="empty">표시할 게임이 없어요.</div>`;
    } catch (err) {
      console.error("[RAWG] TOP3 error:", err);
      els.top3.innerHTML = `<div class="empty">목록을 불러오지 못했어요.</div>`;
    }
  }

  // -------------------- 장르별 TOP1: 6개 --------------------
  async function loadGenreTop1() {
    if (!els.yt) return;
    els.yt.innerHTML = GENRE_SLUGS_6.map(() => `
      <div class="card"><div class="body"><p class="meta">불러오는 중…</p></div></div>
    `).join("");

    const tasks = GENRE_SLUGS_6.map(async (slug) => {
      const url = rawgUrl("/games", {
        genres: slug,
        ordering: RAWG.ORDERING_RATING,
        page_size: RAWG.PAGE_TOP1,
        dates: RAWG.DATE_RANGE,
      });
      try {
        const data = await apiGet(url);
        const g = (data?.results ?? [])[0];
        return { slug, game: g || null };
      } catch (e) {
        console.error(`[RAWG] genre ${slug} error:`, e);
        return { slug, game: null };
      }
    });

    const results = await Promise.all(tasks);
    els.yt.innerHTML = results.map(({ slug, game }) => {
      if (!game) {
        return `
          <article class="card">
            <div class="body">
              <h3 class="title">${esc(genreKR(slug))}</h3>
              <p class="meta">불러오지 못했어요.</p>
            </div>
          </article>
        `;
      }
      return renderGameCard(game);
    }).join("");
  }

  // -------------------- 필터 목록: MBTI/장르 결과 --------------------
  const state = { mbti: "INFP", genre: "all" };

  function updateListTitle() {
    if (!els.title) return;
    els.title.textContent = `게스트 추천 목록${state.genre !== "all" ? " · " + genreKR(state.genre) : ""}`;
  }

  async function loadFilteredList() {
    if (!els.list) return;
    els.list.innerHTML = `<div class="empty">불러오는 중…</div>`;

    // 장르 전체면 MBTI 선호 장르/태그 일부만 넣어 살짝 편향, 장르 지정 시엔 해당 장르만
    const prefs = MBTI_PREFS[state.mbti] || MBTI_PREFS["INFP"];
    const params = {
      ordering: RAWG.ORDERING_RATING,
      page_size: RAWG.PAGE_LIST,
      dates: RAWG.DATE_RANGE,
      metacritic: RAWG.META_MIN,
    };

    if (state.genre !== "all") {
      params.genres = state.genre;
    } else {
      const g = (prefs.genres || []).slice(0, 2);     // 과도한 좁힘 방지
      const t = (prefs.tags   || []).slice(0, 3);
      if (g.length) params.genres = g.join(",");
      if (t.length) params.tags   = t.join(",");
    }

    try {
      const url = rawgUrl("/games", params);
      const data = await apiGet(url);
      const items = data?.results ?? [];
      updateListTitle();
      els.list.innerHTML = items.length
        ? items.map(renderGameCard).join("")
        : `<div class="empty">조건에 맞는 추천이 없어요. 필터를 바꿔보세요.</div>`;
    } catch (e) {
      console.error("[RAWG] filtered list error:", e);
      els.list.innerHTML = `<div class="empty">목록을 불러오지 못했어요.</div>`;
    }
  }

  function bindFilterEvents() {
    els.applyMbti?.addEventListener("click", () => {
      state.mbti = els.mbti?.value || "INFP";
      loadFilteredList();
    });

    els.apply?.addEventListener("click", () => {
      state.mbti = els.mbti?.value || state.mbti;
      state.genre = els.gsel?.value || "all";
      loadFilteredList();
    });

    els.reset?.addEventListener("click", () => {
      if (els.mbti) els.mbti.value = "INFP";
      if (els.gsel) els.gsel.value = "all";
      state.mbti = "INFP";
      state.genre = "all";
      loadFilteredList();
    });
  }

  // -------------------- 부트스트랩 --------------------
  document.addEventListener("DOMContentLoaded", () => {
    // 초기 상태 동기화
    state.mbti = els.mbti?.value || state.mbti;
    state.genre = els.gsel?.value || state.genre;

    bindFilterEvents();
    loadPopularGames();
    loadGenreTop1();
    loadFilteredList();
  });
})();
