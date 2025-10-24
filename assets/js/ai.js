/* GameTeller AI – external JS (ai.js)
   Requires: window.CONFIG = { MODEL_FAST, MODEL_PRECISE, API_KEY, BASE, MODEL_FALLBACKS? }
   Optional: marked (for Markdown rendering)
*/
(function(){
  'use strict';

  // ====== 환경 확인 ======
  const CFG = (window.CONFIG || {});
  const hasMarked = typeof window.marked !== 'undefined';
  const FALLBACKS = CFG.MODEL_FALLBACKS || [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  // DOM 캐시
  const logEl    = document.getElementById('aiLog');
  const formEl   = document.getElementById('aiForm');
  const inputEl  = document.getElementById('aiInput');
  const clearBtn = document.getElementById('clearBtn');
  const streamToggle = document.getElementById('streamToggle');

  // 세그먼트 토글 상태
  const modeSeg = document.querySelectorAll('[data-mode]');
  let currentMode = 'fast';
  modeSeg.forEach(btn=>btn.addEventListener('click', ()=>{
    modeSeg.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
  }));

  const fmtSeg = document.querySelectorAll('[data-format]');
  let currentFormat = 'markdown';
  fmtSeg.forEach(btn=>btn.addEventListener('click', ()=>{
    fmtSeg.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentFormat = btn.dataset.format;
  }));

  // 프리셋 클릭으로 입력창 채우기
  document.querySelectorAll('[data-prompt]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      inputEl.value = btn.dataset.prompt;
      inputEl.focus();
    });
  });

  // ====== 유틸 ======
  function renderMarkdown(md){
    if(!hasMarked) return md;
    try { return window.marked.parse(md); }
    catch { return md; }
  }

  function appendBubble(htmlOrText, who='me', isMarkdown=false){
    const div = document.createElement('div');
    div.className = `bubble ${who}`;
    if(isMarkdown && currentFormat === 'markdown'){
      div.innerHTML = renderMarkdown(htmlOrText);
    } else {
      div.textContent = htmlOrText;
    }
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
    return div;
  }

  // 로딩 애니메이션 관리
  let loaderEl = null;
  function showLoader(){
    if(loaderEl) return;
    loaderEl = document.createElement('div');
    loaderEl.className = 'bubble ai loading';
    loaderEl.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    logEl.appendChild(loaderEl);
    logEl.scrollTop = logEl.scrollHeight;
  }
  function hideLoader(){
    if(loaderEl){ loaderEl.remove(); loaderEl = null; }
  }
  function setLoading(on){ on ? showLoader() : hideLoader(); }

  async function safeJson(res){
    try{ return await res.json(); }catch{ return null; }
  }

  function isOverloaded(errMessage){
    if(!errMessage) return false;
    const msg = String(errMessage).toLowerCase();
    return msg.includes('overloaded') || msg.includes('rate') || msg.includes('quota') || msg.includes('exceeded') || msg.includes('503') || msg.includes('429');
  }

  // 간단 재시도: 429/503/네트워크 오류에 백오프
  async function retryFetch(url, options, {tries=3, baseDelay=500}={}){
    let attempt = 0;
    while(true){
      try{
        const res = await fetch(url, options);
        if(res.status === 429 || res.status === 503){
          throw new Error(`HTTP ${res.status}`);
        }
        return res; // ok 또는 다른 상태는 상위에서 처리
      }catch(e){
        attempt++;
        if(attempt >= tries) throw e;
        const wait = baseDelay * Math.pow(2, attempt-1) + Math.random()*150;
        await new Promise(r=>setTimeout(r, wait));
      }
    }
  }

  // ====== API 콜 (모델 폴백 포함) ======
  async function generateOnceWithModel(prompt, model){
    const endpoint = `${CFG.BASE}${model}:generateContent?key=${CFG.API_KEY}`;
    const body = { contents: [{ parts: [{ text: prompt }] }] };
    const res = await retryFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if(!res.ok){
      const err = await safeJson(res);
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 찾을 수 없습니다';
  }

  async function streamWithModel(prompt, model, onChunk){
    const endpoint = `${CFG.BASE}${model}:streamGenerateContent?key=${CFG.API_KEY}`;
    const body = { contents: [{ parts: [{ text: prompt }] }] };
    const res = await retryFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if(!res.ok){
      const err = await safeJson(res);
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    while(true){
      const {value, done} = await reader.read();
      if(done) break;
      const chunks = value.split(/\n+/).map(s=>s.trim()).filter(Boolean);
      for(const ch of chunks){
        const slice = ch.startsWith('{') ? ch : ch.slice(1);
        try{
          const json = JSON.parse(slice);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if(text) onChunk(text);
        }catch(e){ /* ignore partials */ }
      }
    }
  }

  // 오버로드 시 모델 폴백 로직
  async function requestOnce(prompt, primaryModel){
    const tryModels = [primaryModel, ...FALLBACKS.filter(m=>m!==primaryModel)];
    let lastErr;
    for(const m of tryModels){
      try{ return await generateOnceWithModel(prompt, m); }
      catch(e){ lastErr = e; if(!isOverloaded(e.message)) break; }
    }
    throw lastErr || new Error('요청 실패');
  }

  async function requestStream(prompt, primaryModel, onChunk){
    const tryModels = [primaryModel, ...FALLBACKS.filter(m=>m!==primaryModel)];
    let lastErr;
    for(const m of tryModels){
      try{ return await streamWithModel(prompt, m, onChunk); }
      catch(e){ lastErr = e; if(!isOverloaded(e.message)) break; }
    }
    throw lastErr || new Error('요청 실패');
  }

  // ====== Enter 제출: Shift+Enter 줄바꿈 ======
  inputEl.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      formEl.requestSubmit();
    }
  });

  // ====== 이벤트 바인딩 ======
  formEl.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const prompt = inputEl.value.trim();
    if(!prompt){ inputEl.focus(); return; }

    appendBubble(prompt, 'me');
    inputEl.value = '';
    const model = currentMode === 'fast' ? CFG.MODEL_FAST : CFG.MODEL_PRECISE;

    if(!CFG.API_KEY || CFG.API_KEY === 'YOUR_API_KEY_HERE'){
      appendBubble('⚠️ API 키를 설정하세요 (CONFIG.API_KEY). 실서비스는 서버 프록시를 사용하세요.', 'ai');
      return;
    }

    if(streamToggle.checked){
      const holder = appendBubble('', 'ai', true);
      holder.innerHTML = '';
      try{
        setLoading(true);
        await requestStream(prompt, model, (text)=>{
          const acc = (holder.__acc || '') + text;
          holder.__acc = acc;
          holder.innerHTML = renderMarkdown(acc);
          logEl.scrollTop = logEl.scrollHeight;
        });
        setLoading(false);
      }catch(err){
        setLoading(false);
        const hint = isOverloaded(err.message) ? '\n(잠시 후 다시 시도하거나 좌측에서 "빠른" 모드로 전환하세요.)' : '';
        holder.textContent = `오류: ${err.message}${hint}`;
      }
    } else {
      setLoading(true);
      try{
        const out = await requestOnce(prompt, model);
        setLoading(false);
        appendBubble(out, 'ai', true);
      }catch(err){
        setLoading(false);
        const hint = isOverloaded(err.message) ? '\n(잠시 후 다시 시도하거나 좌측에서 "빠른" 모드로 전환하세요.)' : '';
        appendBubble(`오류: ${err.message}${hint}`, 'ai');
      }
    }
  });

  clearBtn.addEventListener('click', ()=>{ logEl.innerHTML = ''; });
})();