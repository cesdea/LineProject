// 뒤로가기 & 드롭다운 토글
document.addEventListener('click', (e)=>{
  const back = e.target.closest('[data-back]');
  if(back){ if(history.length>1) history.back(); else location.href='index.html'; }

  const t = e.target.closest('[data-dropdown-toggle]');
  if(t){
    const host = t.closest('.dropdown');
    host.classList.toggle('open');
  }else{
    document.querySelectorAll('.dropdown.open').forEach(el=>{
      if(!el.contains(e.target)) el.classList.remove('open');
    });
  }
});
