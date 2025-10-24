
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

const REQUIRE_AUTH =
  document.body?.dataset?.requireAuth === '1';
// 페이지 진입 시 로그인 여부 확인
if (REQUIRE_AUTH && !isLoggedIn()) {
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
