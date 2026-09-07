// Visible wait feedback + fast read routing for quotation screens.
(function(){
  if(typeof bridge!=='function')return;
  const original=bridge;
  let seq=0, active=new Map(), timer=null, host=null;

  function ensureHost(){
    if(host)return host;
    host=document.createElement('div');
    host.id='sunbot-wait-feedback';
    host.innerHTML='<div class="swf-card"><div class="swf-spinner"></div><div><b id="swf-title">Đang xử lý…</b><span id="swf-time">0 giây</span><small id="swf-note">Vui lòng chờ, hệ thống đã nhận thao tác của bạn.</small></div></div>';
    document.body.appendChild(host);
    const css=document.createElement('style');
    css.textContent=`#sunbot-wait-feedback{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:120000;display:none;max-width:calc(100vw - 28px)}#sunbot-wait-feedback.show{display:block}.swf-card{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid #dbe5e1;border-radius:14px;padding:12px 16px;box-shadow:0 14px 45px rgba(15,23,42,.18);min-width:290px}.swf-card>div:last-child{display:grid;gap:2px}.swf-card b{font-size:14px;color:#173f38}.swf-card span{font-size:12px;font-weight:800;color:#c45a13}.swf-card small{font-size:11px;color:#687974}.swf-spinner{width:24px;height:24px;border:3px solid #dce8e4;border-top-color:#0f766e;border-radius:50%;animation:swfspin .75s linear infinite;flex:0 0 auto}@keyframes swfspin{to{transform:rotate(360deg)}}`;
    document.head.appendChild(css);
    return host;
  }

  function label(domain,action){
    if(domain==='quotationAccess')return 'Đang đăng nhập';
    const map={
      listQuotes:'Đang tải danh sách báo giá',
      listQuotesLite:'Đang tải danh sách báo giá',
      getQuote:'Đang mở báo giá',
      getQuoteFast:'Đang mở báo giá',
      saveSnapshot:'Đang lưu và gửi duyệt',
      approveQuote:'Đang duyệt báo giá',
      adminReviseQuote:'Đang lưu thay đổi',
      requestChanges:'Đang gửi yêu cầu chỉnh sửa',
      rejectQuote:'Đang gửi yêu cầu chỉnh sửa',
      exportQuote:'Đang chuẩn bị bản in'
    };
    return map[action]||'';
  }

  function refresh(){
    const el=ensureHost();
    if(!active.size){el.classList.remove('show');if(timer){clearInterval(timer);timer=null;}return;}
    const entry=[...active.values()].sort((a,b)=>b.started-a.started)[0];
    const sec=Math.max(0,Math.floor((Date.now()-entry.started)/1000));
    el.querySelector('#swf-title').textContent=entry.title||'Đang xử lý';
    el.querySelector('#swf-time').textContent=sec+' giây';
    el.classList.add('show');
    if(!timer)timer=setInterval(refresh,500);
  }

  bridge=function(domain,action,payload,token){
    let routedAction=action;
    // Read-only screens use the compact index / fast single-quote reader.
    if(domain==='quotationShared' && action==='listQuotes')routedAction='listQuotesLite';
    if(domain==='quotationShared' && action==='getQuote')routedAction='getQuoteFast';

    const title=label(domain,routedAction);
    const foreground=!!title && routedAction!=='getQuoteLinks';
    const id=++seq;
    if(foreground){active.set(id,{title,started:Date.now()});refresh();}
    let p;
    try{p=original(domain,routedAction,payload,token);}catch(err){if(foreground){active.delete(id);refresh();}throw err;}
    return Promise.resolve(p).finally(()=>{if(foreground){active.delete(id);refresh();}});
  };

  window.SUNBOT_WAIT_FEEDBACK={show:function(title){const id=++seq;active.set(id,{title:title||'Đang xử lý',started:Date.now()});refresh();return ()=>{active.delete(id);refresh();};}};
})();