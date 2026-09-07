// Employee published quote viewer — 2026-09-07.
// Final UX layer: approved quote opens in an immediate full-screen viewer instead of rendering below a long list.
(function(){
  const role=()=>String(state?.role||'').toUpperCase();
  const num=v=>Number(v||0);
  const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>typeof money==='function'?money(num(v)):new Intl.NumberFormat('vi-VN').format(num(v))+' đ';
  const status=v=>({APPROVED:'ĐÃ DUYỆT',CHANGES_REQUESTED:'CẦN CHỈNH SỬA',REJECTED:'CẦN CHỈNH SỬA',NEEDS_APPROVAL:'CHỜ DUYỆT'}[String(v||'').toUpperCase()]||String(v||''));
  const code=id=>{const m=String(id||'').match(/^BG-SUNBOT-(\d{4})-(\d{4})-(\d{3})$/);return m?`BG/SUNBOT/${m[1]}/${m[2]}-${m[3]}`:String(id||'');};

  function ensureViewer(){
    let root=document.getElementById('employee-published-viewer');
    if(root) return root;
    root=document.createElement('div');
    root.id='employee-published-viewer';
    root.className='epv-overlay';
    root.innerHTML='<div class="epv-shell"><div class="epv-head"><div><b>BẢN BÁO GIÁ</b><span id="epv-sub"></span></div><button class="btn secondary" id="epv-close">Đóng</button></div><div id="epv-body" class="epv-body"></div></div>';
    document.body.appendChild(root);
    root.querySelector('#epv-close').onclick=()=>{root.classList.remove('show');document.body.classList.remove('epv-lock');};
    root.addEventListener('click',ev=>{if(ev.target===root){root.classList.remove('show');document.body.classList.remove('epv-lock');}});
    return root;
  }

  function narrative(text){
    return String(text||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map(block=>/^##\s+/.test(block)?`<h3>${e(block.replace(/^##\s+/,''))}</h3>`:`<p>${e(block).replace(/\n/g,'<br>')}</p>`).join('');
  }

  function renderBundle(bundle){
    const q=bundle?.quote||{}, lines=Array.isArray(bundle?.lines)?bundle.lines:[];
    const retail=String(q.combo_code||'').toUpperCase()==='RETAIL_REPAIR'||String(q.quote_type||'').toUpperCase()==='RETAIL';
    const rows=lines.map((l,i)=>{const price=num(l.proposed_unit_price??l.unit_price_snapshot),qty=num(l.qty),total=num(l.line_total||price*qty);return `<tr><td>${i+1}</td><td><b>${e(l.item_name_snapshot||l.name||l.item_id||'')}</b><small>${e(l.unit_snapshot||l.unit||'')}</small></td><td class="r">${qty}</td><td class="r">${fmt(price)}</td><td class="r"><b>${fmt(total)}</b></td></tr>`;}).join('');
    return `<div class="epv-toolbar no-print"><span class="epv-ok">✓ ${e(status(q.status))}</span><button class="btn" id="epv-print">In / Lưu PDF</button></div>
      ${!retail&&String(q.configuration_description||'').trim()?`<section class="epv-narrative"><div class="epv-kicker">ĐỀ XUẤT GIẢI PHÁP</div><h1>Thuyết minh cấu hình Sunbot</h1><p class="epv-client">${e(q.client_name||'')} · ${e(code(q.quote_id))}</p>${narrative(q.configuration_description)}</section>`:''}
      <section class="epv-quote"><div class="epv-top"></div><div class="epv-brand"><img src="../assets/img/logo-sunbot.png" alt="Sunbot"><div><b>CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM</b><small>SUNBOT · CÔNG NGHỆ GIÁO DỤC MẦM NON</small></div><div class="epv-meta"><small>Mã báo giá</small><b>${e(code(q.quote_id))}</b><small>Phiên bản ${num(q.version)||1}</small></div></div><div class="epv-title"><small>${retail?'BÁO GIÁ THIẾT BỊ / PHỤ KIỆN / SỬA CHỮA':'ĐỀ XUẤT THƯƠNG MẠI'}</small><h1>${retail?'BÁO GIÁ SUNBOT':'BÁO GIÁ GIẢI PHÁP SUNBOT'}</h1></div><div class="epv-recipient"><span>Kính gửi</span><b>${e(q.client_name||'Quý Nhà trường / Quý Đơn vị')}</b><span>Người lập</span><b>${e(q.created_by||'')}</b></div><div class="epv-table"><table><thead><tr><th>STT</th><th>Hạng mục</th><th class="r">SL</th><th class="r">Đơn giá</th><th class="r">Thành tiền</th></tr></thead><tbody>${rows}</tbody></table></div><div class="epv-total"><span>TỔNG GIÁ TRỊ ĐỀ XUẤT<small>Chưa gồm VAT và chi phí ngoài phạm vi nếu có</small></span><b>${fmt(q.proposed_amount||q.final_amount||0)}</b></div>${retail?`<div class="epv-service-note">Thiết bị được kiểm tra thực tế trước khi xác nhận phạm vi sửa chữa; phát sinh ngoài báo giá chỉ thực hiện sau khi khách hàng xác nhận.</div>`:''}<div class="epv-approved">${e(status(q.status))}${q.approved_by?` · ${e(q.approved_by)}`:''}</div><div class="epv-bottom"></div></section>`;
  }

  async function openQuote(quoteId){
    const root=ensureViewer(), body=root.querySelector('#epv-body'), sub=root.querySelector('#epv-sub');
    sub.textContent=code(quoteId);
    body.innerHTML='<div class="epv-loading"><div class="epv-spinner"></div><b>Đang mở bản đã duyệt…</b><small>Nếu bản đã được lưu trên máy, nội dung sẽ hiện gần như ngay lập tức.</small></div>';
    root.classList.add('show');document.body.classList.add('epv-lock');
    try{
      const bundle=await bridge('quotationShared','getQuote',{quote_id:quoteId},state.token);
      body.innerHTML=renderBundle(bundle);
      body.scrollTop=0;
      body.querySelector('#epv-print')?.addEventListener('click',async()=>{
        try{await bridge('quotationShared','exportQuote',{quote_id:quoteId},state.token);}catch(_){}
        window.print();
      });
    }catch(err){
      body.innerHTML=`<section class="panel"><h2>Không mở được báo giá</h2><p class="notice danger">${e(typeof friendlyError==='function'?friendlyError(err):(err?.message||err))}</p><button class="btn" id="epv-retry">Thử lại</button></section>`;
      body.querySelector('#epv-retry')?.addEventListener('click',()=>openQuote(quoteId));
    }
  }

  // Capture before legacy onclick. This removes the old UX where detail appeared far below the table.
  document.addEventListener('click',ev=>{
    if(role()==='ADMIN') return;
    const btn=ev.target.closest?.('[data-v4-open]');
    if(!btn) return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    openQuote(String(btn.dataset.v4Open||''));
  },true);

  const css=document.createElement('style');
  css.textContent=`body.epv-lock{overflow:hidden}.epv-overlay{position:fixed;inset:0;background:rgba(15,23,42,.58);z-index:99999;display:none;padding:18px}.epv-overlay.show{display:block}.epv-shell{max-width:1050px;height:calc(100vh - 36px);margin:auto;background:#f5f7f7;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.28);overflow:hidden;display:flex;flex-direction:column}.epv-head{height:58px;flex:0 0 58px;padding:9px 16px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #dde5e2}.epv-head div{display:flex;gap:10px;align-items:center}.epv-head b{color:#0f766e}.epv-head span{font-size:12px;color:#60706c}.epv-body{overflow:auto;padding:18px}.epv-loading{min-height:50vh;display:grid;place-items:center;align-content:center;gap:8px;color:#42534f}.epv-loading small{color:#778782}.epv-spinner{width:30px;height:30px;border:3px solid #d9e5e1;border-top-color:#0f766e;border-radius:50%;animation:epvspin .7s linear infinite}@keyframes epvspin{to{transform:rotate(360deg)}}.epv-toolbar{max-width:860px;margin:0 auto 10px;display:flex;justify-content:space-between;align-items:center}.epv-ok{font-weight:800;color:#15803d}.epv-narrative,.epv-quote{max-width:860px;margin:0 auto 18px;background:#fff;padding:42px 46px;box-shadow:0 3px 18px rgba(15,23,42,.06)}.epv-narrative h1,.epv-title h1{margin:5px 0 16px;color:#17365d}.epv-narrative h3{margin-top:22px;color:#17365d}.epv-narrative p{line-height:1.65}.epv-kicker,.epv-title small{font-weight:800;color:#ea580c;letter-spacing:.08em}.epv-client{color:#687873}.epv-top,.epv-bottom{height:5px;background:#ea580c;margin:-42px -46px 30px}.epv-bottom{margin:30px -46px -42px}.epv-brand{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center}.epv-brand img{width:62px;max-height:62px;object-fit:contain}.epv-brand b{display:block;color:#17365d;font-size:12px}.epv-brand small{display:block;color:#70807b;margin-top:4px}.epv-meta{text-align:right;display:grid;gap:2px}.epv-title{margin:38px 0 26px;text-align:center}.epv-recipient{display:grid;grid-template-columns:90px 1fr 90px 1fr;gap:6px 10px;padding:15px;background:#f7f9f8;border-radius:8px;margin-bottom:18px}.epv-recipient span{color:#71817c}.epv-table{overflow:auto}.epv-table table{width:100%;border-collapse:collapse}.epv-table th,.epv-table td{padding:10px;border-bottom:1px solid #e2e8e6;text-align:left;vertical-align:top}.epv-table th{background:#17365d;color:#fff;font-size:12px}.epv-table small{display:block;color:#73827e;margin-top:3px}.epv-table .r{text-align:right}.epv-total{display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px;padding:18px;border-radius:10px;background:#fff4eb;border:1px solid #fed7aa}.epv-total span{font-weight:800;color:#9a3412}.epv-total span small{display:block;font-weight:400;color:#8a6a59;margin-top:4px}.epv-total>b{font-size:22px;color:#c2410c}.epv-service-note{margin-top:14px;padding:12px;background:#f8faf9;border-left:3px solid #0f766e;font-size:12px;line-height:1.5}.epv-approved{text-align:right;margin-top:18px;font-weight:800;color:#15803d}@media(max-width:700px){.epv-overlay{padding:0}.epv-shell{height:100vh;border-radius:0}.epv-body{padding:8px}.epv-narrative,.epv-quote{padding:24px 18px}.epv-top{margin:-24px -18px 22px}.epv-bottom{margin:22px -18px -24px}.epv-brand{grid-template-columns:auto 1fr}.epv-meta{grid-column:1/-1;text-align:left}.epv-recipient{grid-template-columns:80px 1fr}.epv-total{align-items:flex-start;gap:10px;flex-direction:column}.epv-toolbar{padding:4px 6px}}@media print{.epv-head,.epv-toolbar{display:none!important}.epv-overlay{position:static;display:block!important;padding:0;background:#fff}.epv-shell{height:auto;max-width:none;box-shadow:none}.epv-body{overflow:visible;padding:0}.epv-narrative,.epv-quote{box-shadow:none;max-width:none;page-break-after:always}.epv-quote{page-break-after:auto}body>*:not(#employee-published-viewer){display:none!important}}`;
  document.head.appendChild(css);
  window.SUNBOT_EMPLOYEE_PUBLISHED_VIEW={open:openQuote,version:'2026.09.07-v1'};
})();
