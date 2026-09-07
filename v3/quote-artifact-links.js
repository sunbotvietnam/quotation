// Drive artifact helper. Viewing a quote must never wait for PDF generation.
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

  async function ensure(id){
    try{
      const m=await load(false), row=m.get(String(id||''));
      if(row&&bestUrl(row))return row;
      const links=await bridge('quotationShared','getQuoteLinks',{quote_id:id},state.token);
      if(links){map.set(String(id),links);loadedAt=Date.now();return links;}
    }catch(err){console.warn('Không tạo được bản PDF nền',err);}
    return null;
  }

  function url(id){return bestUrl(map.get(String(id||''))||{});}

  document.addEventListener('click',ev=>{
    const tab=ev.target?.closest?.('[data-tab="quotes"]');
    if(tab)setTimeout(()=>load(true).catch(()=>{}),0);
  },true);

  const obs=new MutationObserver(()=>{
    if(state?.token&&document.querySelector('[data-tab="quotes"]')&&!map.size)setTimeout(()=>load(false).catch(()=>{}),80);
  });
  obs.observe(document.documentElement,{subtree:true,childList:true});

  window.SUNBOT_QUOTE_ARTIFACTS={load,ensure,url,bestUrl,version:'2026.09.07-background-v2'};
})();