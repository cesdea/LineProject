/**
 * Floating game icons (as a group + subtle individual floating)
 * 경로만 교체하면 바로 사용 가능.
 */

const ICONS = [
  "https://api.iconify.design/mdi/controller-classic-outline.svg?height=72&color=%23D8E9FF",
  "https://api.iconify.design/icon-park-outline/joystick.svg?height=72&color=%23D8E9FF",
  "https://api.iconify.design/tabler/sword.svg?height=72&color=%23D8E9FF",
  "https://api.iconify.design/mdi/shield-outline.svg?height=72&color=%23D8E9FF",
  "https://api.iconify.design/mdi/heart-outline.svg?height=72&color=%23D8E9FF",
  "https://api.iconify.design/mdi/star-four-points-outline.svg?height=72&color=%23D8E9FF",
  "https://api.iconify.design/mdi/coin-outline.svg?height=72&color=%23D8E9FF",
  "https://api.iconify.design/fluent-emoji-high-contrast/game-die.svg?height=72&color=%23D8E9FF",
  "https://api.iconify.design/mdi/space-invaders.svg?height=72&color=%23D8E9FF",
  "https://api.iconify.design/mdi/alien-outline.svg?height=72&color=%23D8E9FF",
  "https://api.iconify.design/mdi/lightning-bolt-outline.svg?height=72&color=%23D8E9FF"
];

const COUNT = 30;             // 생성할 아이콘 수
const SIZE_RANGE = [48, 96];  // px
const SPEED_RANGE = [10, 26]; // s (개별 아이콘 플로팅 속도)
const AMP_RANGE = [10, 24];   // px (상하 파동)
const DX_RANGE  = [16, 40];   // px (좌우 파동)
const SPREAD = 0.92;     // 0.80~0.95: 화면 사용 비율 (값↑ → 더 넓게 흩어짐)
const DXV_RANGE  = [2.8, 6.8]; // vw: 좌우 흔들림 폭
const AMPV_RANGE = [1.2, 3.2]; // vh: 상하 흔들림 폭

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max)); }

function spawnIcons() {
  const field = document.getElementById('iconField');
  if (!field) return;

  const { innerWidth: W, innerHeight: H } = window;

  field.querySelectorAll('.icon').forEach(el => el.remove());

  const margin = (1 - SPREAD) / 2;
  const XP_MIN = margin * 100;            // %
  const XP_MAX = (1 - margin) * 100;      // %
  const YP_MIN = (margin + 0.02) * 100;   // %
  const YP_MAX = (1 - margin - 0.02) * 100;

  // 균등 격자 + 지터로 군집 방지
  const cols = Math.ceil(Math.sqrt(COUNT));
  const rows = Math.ceil(COUNT / cols);

  for (let i = 0; i < COUNT; i++) {
    const img = document.createElement('img');
    img.className = 'icon';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.src = ICONS[i % ICONS.length];
    img.alt = 'floating game icon';

    const size  = Math.floor(Math.random() * (SIZE_RANGE[1] - SIZE_RANGE[0] + 1)) + SIZE_RANGE[0];
    const rot   = (Math.random() * 6 + 4) * (Math.random() < 0.5 ? -1 : 1);
    const dur   = Math.random() * (SPEED_RANGE[1] - SPEED_RANGE[0]) + SPEED_RANGE[0];
    const delay = Math.random() * -dur; 
    const opac  = (Math.random() * 0.25) + 0.75;


    const r = Math.floor(i / cols);
    const c = i % cols;
    const cellW = (XP_MAX - XP_MIN) / Math.max(cols, 1);
    const cellH = (YP_MAX - YP_MIN) / Math.max(rows, 1);
    const jitterX = Math.random() * 0.64 + 0.18; // 0.18~0.82
    const jitterY = Math.random() * 0.64 + 0.18;

    const xp = XP_MIN + c * cellW + jitterX * cellW; 
    const yp = YP_MIN + r * cellH + jitterY * cellH; 

    const dxv  = (Math.random() * (DXV_RANGE[1] - DXV_RANGE[0]) + DXV_RANGE[0]) * (Math.random() < 0.5 ? -1 : 1);
    const ampv =  Math.random() * (AMPV_RANGE[1] - AMPV_RANGE[0]) + AMPV_RANGE[0];

    img.style.setProperty('--size', `${size}px`);
    img.style.setProperty('--xp', xp.toFixed(2)); // %
    img.style.setProperty('--yp', yp.toFixed(2)); // %
    img.style.setProperty('--dxv', `${dxv}vw`);
    img.style.setProperty('--ampv', `${ampv}vh`);
    img.style.setProperty('--rot', `${rot}deg`);
    img.style.setProperty('--duration', `${dur}s`);
    img.style.setProperty('--delay', `${delay}s`);
    img.style.setProperty('--opacity', opac.toFixed(2));

    field.appendChild(img);
  }
}

// 초기 렌더
spawnIcons();

// 창 크기 변경 시 재배치(디바운스)
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(spawnIcons, 180);
});
