window.apiGet = async function (url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API 요청 실패: " + res.status);
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
};

// 간단 XSS 방지용 이스케이프
window.esc = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
