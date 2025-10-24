// index.wire.js
// '나만의 게임 찾기' 클릭 → 로그인 가드 로직

// 버튼과 모달 요소 가져오기
const btn = document.getElementById('ctaMember');
const modal = document.getElementById('loginModal');
const btnLogin = document.getElementById('doLogin');
const btnClose = document.getElementById('closeLogin');
const inputEmail = document.getElementById('loginEmail');
const inputPw = document.getElementById('loginPw');

const DEMO_ACCOUNTS = [
  { email: 'demo@game.com', password: '1234' },
  { email: 'test@test.com', password: '1234' },
];

// 로그인 상태 확인용 (임시: localStorage 사용)
function isLoggedIn() {
  return localStorage.getItem('gt_isLoggedIn') === '1';
}

// 로그인 상태 저장
function setLoggedIn(v, email = '') {
  localStorage.setItem('gt_isLoggedIn', v ? '1' : '0');
  if (v) {
    localStorage.setItem('gt_userEmail', email);
  } else {
    localStorage.removeItem('gt_userEmail');
  }
}

// 모달 열기
function openModal() {
  modal.hidden = false;
  document.body.classList.add('modal-open');
  inputEmail.focus();
}

// 모달 닫기
function closeModal() {
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

// CTA 버튼 클릭 시 로그인 여부 확인
btn.addEventListener('click', (e) => {
  const logged = isLoggedIn();
  if (!logged) {
    // 로그인 안 되어 있으면 기본 이동 막고 모달 띄우기
    e.preventDefault();
    openModal();
  }
  // 로그인 되어 있으면 그냥 member.html 이동
});

// 로그인 버튼 클릭 시 처리
btnLogin.addEventListener('click', () => {
  const email = inputEmail.value.trim();
  const pw = inputPw.value.trim();

  if (!email) {
    alert('이메일을 입력하세요.');
    inputEmail.focus();
    return;
  }  
  // 이메일 형식 확인
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    alert('올바른 이메일 형식이 아닙니다.');
    inputEmail.focus();
    return;
  }
  if (!pw) {
    alert('비밀번호를 입력하세요.');
    inputPw.focus();
    return;
  }
    // 비밀번호 길이: 정확히 4자리
  if (pw.length < 4) {
    alert('비밀번호는 올바르지 않는 비밀번호 입니다');
    inputPw.focus();
    return;
  }


// 데모 계정 검증
const match = DEMO_ACCOUNTS.find(acc => acc.email === email && acc.password === pw);
  if (!match) {
    alert('아이디 또는 비밀번호가 올바르지 않습니다.\n(예: demo@game.com / 1234)');
    return;
  }

  // 로그인 성공 시
  setLoggedIn(true, email);
  alert(`환영합니다, ${email.split('@')[0]}님!`);
  closeModal();

  // member.html로 이동
  location.href = './member.html';
});

// 닫기 버튼 클릭 시 모달 닫기
btnClose.addEventListener('click', closeModal);

// ESC 키로 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) {
    closeModal();
  }
});
