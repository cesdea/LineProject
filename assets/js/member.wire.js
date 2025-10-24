// member.wire.js
function esc(v){
  return String(v ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
// 로그인 상태 확인 + 사용자 정보 표시 + 로그아웃
function isLoggedIn() {
}

function isLoggedIn() {
  return localStorage.getItem('gt_isLoggedIn') === '1';
}
function getUserEmail() {
  return localStorage.getItem('gt_userEmail') || '';
}
function logout() {
  localStorage.removeItem('gt_isLoggedIn');
  localStorage.removeItem('gt_userEmail');
  alert('로그아웃되었습니다.');
  location.href = './index.html';
}

// 페이지 진입 시 로그인 여부 확인
if (!isLoggedIn()) {
  alert('로그인 후 이용해주세요.');
  location.href = './index.html';
} else {
  // 이메일에서 닉네임 추출
  const email = getUserEmail();
  const nickname = email.split('@')[0];

  // 페이지에 표시
  const nicknameLabel = document.getElementById('nicknameLabel');
  const emailSpan = document.getElementById('userEmail');
  if (nicknameLabel) nicknameLabel.textContent = nickname;
  if (emailSpan) emailSpan.textContent = email;

  // 로그아웃 버튼이 있다면 연결 (dropdown-menu 안에 직접 추가)
  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = '로그아웃';
  logoutBtn.className = 'btn btn-ghost';
  logoutBtn.style.marginTop = '8px';
  logoutBtn.addEventListener('click', logout);
  const profileMenu = document.querySelector('.profile-menu');
  if (profileMenu) profileMenu.appendChild(logoutBtn);
}


// 진단/도움 유틸 (배너, 키체크, 플레이스홀더, 로깅 fetch)


function showBanner(msg) {
  const b = document.createElement('div');
  b.style.cssText = `
    position:fixed; right:16px; bottom:16px; z-index:99999;
    background:#1d2433; color:#fff; border:1px solid rgba(120,160,255,.3);
    padding:10px 12px; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,.4);
    max-width:420px; font-size:13px; line-height:1.4;
  `;
  b.innerHTML = msg;
  document.body.appendChild(b);
  setTimeout(()=>b.remove(), 8000);
}

function guardKeys() {
  const cfg = window.CONFIG || {};
  const missing = [];
  if (!cfg.RAWG_API_KEY) missing.push('RAWG_API_KEY');
  if (!cfg.YT_API_KEY) missing.push('YT_API_KEY');
  if (!cfg.GEMINI_API_KEY) missing.push('GEMINI_API_KEY (회원 페이지 AI)');
  if (missing.length) {
    showBanner(`⚠️ API 키가 비어 있습니다:<br>${missing.join(', ')}`);
    console.warn('EMPTY_KEYS:', missing);
  }
}
guardKeys();

function renderPlaceholders() {
  const top3 = document.getElementById('memberTop3');
  const yt = document.getElementById('memberYT');
  if (top3 && !top3.children.length) {
    top3.innerHTML = Array.from({length:3}).map((_,i)=>`
      <article class="card">
        <div class="thumb" style="background:#0f1626;display:block"></div>
        <div class="body">
          <h3>Loading… #${i+1}</h3>
          <p class="meta">데이터 수신 대기</p>
          <div class="chips">
            <span class="chip">genre</span><span class="chip">tag</span>
          </div>
        </div>
      </article>
    `).join('');
  }
  if (yt && !yt.children.length) {
    yt.innerHTML = Array.from({length:3}).map(()=>`
      <div style="width:100%;aspect-ratio:16/9;border-radius:14px;background:#0f1626;opacity:.5"></div>
    `).join('');
  }
}

// 로깅 포함 GET 유틸 (apiGet 대체용)
async function apiGetLogged(name, url) {
  console.log(`[${name}] GET`, url);
  try {
    const res = await fetch(url);
    console.log(`[${name}] status`, res.status);
    if (!res.ok) throw new Error(`${name} request failed: ${res.status}`);
    const data = await res.json();
    console.log(`[${name}] data`, data);
    return data;
  } catch (e) {
    console.error(`[${name}] error`, e);
    throw e;
  }
}



(function () {
  const { RAWG_API_KEY, RAWG_BASE, YT_API_KEY, YT_BASE, GEMINI_API_KEY, GEMINI_MODEL } = window.CONFIG || {};

  // RAWG: 메타크리틱 높은 게임 TOP3
  async function loadMemberTop3() {
    const url = `${RAWG_BASE}/games?key=${encodeURIComponent(RAWG_API_KEY)}&ordering=-metacritic&page_size=3`;
    try {
      const data = await apiGetLogged('RAWG', url);
      const box = document.getElementById("memberTop3");
      if (!box || !data?.results) return;

      box.innerHTML = data.results.map(g => {
        const img = g.background_image || "";
        const genres = (g.genres || []).map(x => esc(x.name));
        return `
          <article class="card">
            <img class="thumb" src="${esc(img)}" alt="${esc(g.name)}" loading="lazy" decoding="async">
            <div class="body">
              <h3>${esc(g.name)}</h3>
              <p class="meta">Released: ${esc(g.released ?? "N/A")}</p>
              <div class="chips">
                ${genres.slice(0,4).map(n => `<span class="chip">${n}</span>`).join("")}
              </div>
            </div>
          </article>
        `;
      }).join("");
    } catch (e) {
      showBanner('❌ RAWG 호출 실패: 콘솔을 확인하세요');
      renderPlaceholders();
    }
  }

  // YouTube: 인기 트레일러 3개
  async function loadMemberYT() {
    const query = "top game trailers 4K official";
    const url = `${YT_BASE}/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(query)}&key=${encodeURIComponent(YT_API_KEY)}`;
    try {
      const data = await apiGetLogged('YT', url);
      const box = document.getElementById("memberYT");
      if (!box || !data?.items) return;

      box.innerHTML = data.items.map(v => {
        const vid = v.id.videoId;
        return `<iframe src="https://www.youtube.com/embed/${esc(vid)}" title="${esc(v.snippet.title)}" allowfullscreen loading="lazy"></iframe>`;
      }).join("");
    } catch (e) {
      showBanner('❌ YouTube 호출 실패: API 키 제한(도메인/쿼터) 또는 애드블록을 확인하세요');
      renderPlaceholders();
    }
  }

  // Gemini: AI 추천 섹션 추가
  async function loadGeminiRecommendation() {
    const email = localStorage.getItem("gt_userEmail") || "user";
    const prompt = `게이머 ${email.split('@')[0]}에게 어울리는 최신 게임 3개를 간단 설명과 함께 추천해줘.
- 게임명: 한 줄 설명 (장르, 분위기, 플레이타임 힌트)
- 마지막 줄에 장르 키워드 3개만 쉼표로`;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
      console.log('[Gemini] POST', endpoint);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      console.log('[Gemini] status', res.status);
      const data = await res.json();
      console.log('[Gemini] data', data);

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "추천 결과를 불러올 수 없었습니다.";

      // 간단 파싱 (줄 단위 → 카드 3개)
      const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
      const items = [];
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^\s*[-*]?\s*([^:：]+)\s*[:：]\s*(.+)$/); // "게임명: 설명"
        if (m) items.push({ title: m[1], desc: m[2] });
        if (items.length === 3) break;
      }
      if (!items.length) items.push({ title: "AI 추천", desc: text });

      const zone = document.createElement("section");
      zone.className = "zone ai";
      zone.innerHTML = `
        <h2 class="section-title">AI 추천 (Gemini)</h2>
        <div class="cards grid-3">
          ${items.map(it => `
            <article class="card">
              <div class="body">
                <h3>${esc(it.title)}</h3>
                <p class="meta">${esc(it.desc)}</p>
              </div>
            </article>
          `).join("")}
        </div>
      `;
      document.querySelector(".content")?.appendChild(zone);
    } catch (e) {
      console.error('[Gemini] error', e);
      showBanner('❌ Gemini 호출 실패: API 키/프로젝트 권한 또는 결제 설정을 확인하세요');
    }
  }
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
    // 실행
  loadHotVideos();
  loadMemberTop3();
  loadMemberYT();
  loadGeminiRecommendation();

  // 네트워크 실패하더라도 레이아웃을 확인할 수 있게 플레이스홀더 사후 렌더
  setTimeout(renderPlaceholders, 1200);
})();
