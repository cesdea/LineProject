# GameTeller Scaffold (HTML/CSS/API-연결 틀만)
- 이 스캐폴드는 **UI 레이아웃 + 주석으로 된 연결 포인트**만 제공하고, 실제 API/렌더링 코드는 사용자가 넣습니다.

## 파일 구조
.
├─ index.html        # 메인(풀페이지 히어로만)
├─ guest.html        # 게스트: 상단 TOP3 / 하단 장르별 TOP1(6개)
├─ member.html       # 회원: 상단 TOP3 / 하단 유튜브 3개
└─ assets
   ├─ css
   │  └─ main.css    # 공통 스타일(색상/폰트 톤 유지)
   └─ js
      ├─ index.wire.js   # 메인: 로그인 모달/가드 구현 위치
      ├─ guest.wire.js   # 게스트: RAWG 호출/카드 렌더 위치
      ├─ member.wire.js  # 회원: 로그인 가드/RAWG/YT 호출 위치
      └─ nav.js          # 뒤로가기/드롭다운 토글(선택)

## 어디에 어떤 코드를 넣나
- 로그인: `index.wire.js`  → CTA 가드 + 모달 로그인 처리
- 게스트 TOP3/장르별: `guest.wire.js`  → `rawgTop100`, `rawgByGenres`, `renderCards`
- 회원 TOP3/유튜브: `member.wire.js`   → `isLoggedIn`, `rawgTop100`, `ytTrailerId`, `renderCards`

## 권장 스크립트 로딩 순서
1) config.js (키/엔드포인트)
2) util.js   (헬퍼/렌더)
3) *.wire.js (각 페이지 로직)
4) nav.js    (공통 UI)

필요하면 util.js에서 `renderCards`, RAWG 래퍼, YT 검색 함수를 정의하세요.
