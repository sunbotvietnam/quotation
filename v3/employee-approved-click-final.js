// Final approved-quote click router — 2026-09-07.
// Capture at window level so employee APPROVED rows always open the published viewer
// before older document-level handlers can swallow the click or render below the list.
(function(){
  function role(){ return String(window.state?.role || state?.role || '').toUpperCase(); }
  function isApprovedRow(btn){
    const row = btn && btn.closest && btn.closest('tr');
    if (!row) return false;
    const text = String(row.textContent || '').toUpperCase();
    return text.includes('ĐÃ DUYỆT') || text.includes('APPROVED');
  }
  window.addEventListener('click', function(ev){
    if (role() === 'ADMIN') return;
    const btn = ev.target && ev.target.closest ? ev.target.closest('[data-v4-open]') : null;
    if (!btn || !isApprovedRow(btn)) return;
    const quoteId = String(btn.dataset.v4Open || '').trim();
    if (!quoteId) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    const viewer = window.SUNBOT_EMPLOYEE_PUBLISHED_VIEW;
    if (viewer && typeof viewer.open === 'function') {
      viewer.open(quoteId);
      return;
    }
    // Visible fallback instead of a silent click.
    alert('Chưa tải được trình xem báo giá đã duyệt. Vui lòng tải lại trang một lần rồi thử lại.');
  }, true);
})();
