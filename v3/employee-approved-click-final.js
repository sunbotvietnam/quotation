// Final approved-quote click router — 2026-09-07.
// Approved rows must always open the published viewer, for both Admin and employee views.
(function(){
  function normalize(text){
    return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  }
  function isApprovedRow(btn){
    const row=btn&&btn.closest?btn.closest('tr'):null;
    if(!row) return false;
    const text=normalize(row.textContent||'');
    return text.includes('DA DUYET')||text.includes('APPROVED');
  }
  function openApproved(btn,ev){
    if(!btn||!isApprovedRow(btn)) return false;
    const quoteId=String(btn.dataset.v4Open||'').trim();
    if(!quoteId) return false;
    if(ev){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();}
    const viewer=window.SUNBOT_EMPLOYEE_PUBLISHED_VIEW;
    if(viewer&&typeof viewer.open==='function'){
      viewer.open(quoteId);
      return true;
    }
    alert('Chưa tải được trình xem báo giá đã duyệt. Vui lòng tải lại trang một lần rồi thử lại.');
    return true;
  }

  // Earliest possible interception.
  window.addEventListener('pointerdown',function(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('[data-v4-open]'):null;
    if(!btn||!isApprovedRow(btn)) return;
    ev.preventDefault();
  },true);

  window.addEventListener('click',function(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('[data-v4-open]'):null;
    openApproved(btn,ev);
  },true);

  // Deterministically replace the legacy onclick assigned by approval-workflow-v4.js.
  function wire(){
    document.querySelectorAll('[data-v4-open]').forEach(function(btn){
      if(!isApprovedRow(btn)||btn.dataset.approvedViewerWired==='1') return;
      btn.dataset.approvedViewerWired='1';
      btn.type='button';
      btn.onclick=function(ev){openApproved(btn,ev);};
    });
  }
  const observer=new MutationObserver(wire);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  wire();
})();
