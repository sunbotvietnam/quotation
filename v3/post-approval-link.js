// Post approval handoff — show the approved Drive PDF immediately after Admin approves.
(function(){
  if (typeof bridge !== 'function') return;
  const baseBridge = bridge;

  function showApprovedLink(url, quoteId){
    if(!url) return;
    document.getElementById('approved-quote-handoff')?.remove();
    const box=document.createElement('div');
    box.id='approved-quote-handoff';
    box.style.cssText='position:fixed;right:16px;bottom:16px;z-index:99999;max-width:420px;background:#fff;border:1px solid #dbe4e8;border-radius:14px;box-shadow:0 18px 50px rgba(15,23,42,.18);padding:16px;font-family:inherit';
    box.innerHTML=`<div style="font-weight:800;color:#0f766e;margin-bottom:5px">Báo giá đã được duyệt</div>
      <div style="font-size:13px;color:#475569;margin-bottom:12px">Bản PDF chính thức đã được lưu trên Google Drive${quoteId?` · ${String(quoteId)}`:''}.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><a href="${String(url).replace(/"/g,'&quot;')}" target="_blank" rel="noopener" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:9px 12px;border-radius:9px;font-weight:700">Mở báo giá đã duyệt</a><button type="button" style="border:1px solid #cbd5e1;background:#fff;padding:9px 12px;border-radius:9px;cursor:pointer">Đóng</button></div>`;
    box.querySelector('button').onclick=()=>box.remove();
    document.body.appendChild(box);
  }

  bridge = async function(scope, action, payload, token){
    const result = await baseBridge(scope, action, payload, token);
    if(scope==='quotationShared' && (action==='approveQuote' || action==='adminReviseQuote')){
      const approved = String(result?.status||'').toUpperCase()==='APPROVED' || payload?.approve_after===true;
      if(approved && result?.approved_pdf_url){
        try { window.SUNBOT_QUOTE_ARTIFACTS?.load?.(true); } catch(e) {}
        showApprovedLink(result.approved_pdf_url, result.quote_id || payload?.quote_id || '');
      }
    }
    return result;
  };
})();
