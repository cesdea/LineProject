// 모든 [data-link] 요소 클릭 → 해당 href로 이동
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-link]');
  if(btn){
    e.preventDefault();
    const url = btn.dataset.link;
    if(url) location.href = url;
  }
});
