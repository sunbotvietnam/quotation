// Quote Artifact Links — 2026-09-07.
// Historical quote rows stay lightweight. "Xem" opens the already-materialized Drive PDF
// instead of rebuilding the A4 document from QUOTES + QUOTE_LINES.
(function(){
  let map=new Map(), loading=null, loadedAt=0;
  const ttl=60000;
  async function load(force){
    if(!force && map.size && Date.now()-loadedAt<ttl)return map;
    if(loading)return loading;
    loading=bridge('quotationShared','listQuotesLite',{},state.token).then(rows=>{
      map=new Map((Array.isArray(rows)?rows:[]).map(r=>[String(r.quote_id||''),r]));
      loadedAt=Date.now();
      return map;
    }).finally(()=>loading=null);
    return loading;
  }
  function bestUrl(row){
    const status=String(row?.status||'').toUpperCase();
    return status==='APPROVED' ? String(row?.approved_pdf_url||row?.preview_pdf_url||'') : String(row?.preview_pdf_url||'');
  }
  function openUrl(url){
    if(!url)return false;
    window.open(url,'_blank','noopener');
    return true;
  }
  async function openQuote(id){
    try{
      const m=await load(false), row=m.get(String(id||''));
      if(row&&openUrl(bestUrl(row)))return true;
      const links=await bridge('quotationShared','getQuoteLinks',{quote_id:id},state.token);
      if(links){map.set(String(id),links);loadedAt=Date.now();if(openUrl(bestUrl(links)))return true;}
    }catch(err){console.warn('quote artifact open fallback',err);}
    return false;
  }
  // Capture before document-level legacy viewers. This is the single read path for saved versions.
  window.addEventListener('click',function(ev){
    const btn=ev.target?.closest?.('[data-v4-open]');
    if(!btn)return;
    const id=String(btn.dataset.v4Open||'').trim();
    if(!id)return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    openQuote(id).then(ok=>{
      if(!ok){
        const viewer=window.SUNBOT_EMPLOYEE_PUBLISHED_VIEW;
        if(viewer&&typeof viewer.open==='function')viewer.open(id);
        else alert('Bản lưu nhanh của báo giá này chưa sẵn sàng. Hãy tải lại danh sách hoặc mở lại sau ít phút.');
      }
    });
  },true);

  document.addEventListener('click',ev=>{
    const tab=ev.target?.closest?.('[data-tab="quotes"]');
    if(tab)setTimeout(()=>load(true).catch(()=>{}),0);
  },true);

  // Prefetch lightly after login/render, never blocks the main UI.
  const obs=new MutationObserver(()=>{
    if(state?.token&&document.querySelector('[data-tab="quotes"]')&&!map.size)setTimeout(()=>load(false).catch(()=>{}),40);
  });
  obs.observe(document.documentElement,{subtree:true,childList:true});
  window.SUNBOT_QUOTE_ARTIFACTS={load,open:openQuote,version:'2026.09.07-v1'};
})();
