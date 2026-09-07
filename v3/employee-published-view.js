// Employee published quote viewer — 2026-09-07.
// Approved employee quotes open in a full-screen viewer, but the document itself
// reuses the exact quote-document markup/classes already used by the finalized
// Sunbot quotation + explanation design. This keeps preview and print/PDF aligned.
(function(){
  const role=()=>String(state?.role||'').toUpperCase();
  const num=v=>Number(v||0);
  const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>typeof money==='function'?money(num(v)):new Intl.NumberFormat('vi-VN').format(num(v))+' đ';
  const status=v=>({APPROVED:'Đã duyệt',CHANGES_REQUESTED:'Cần chỉnh sửa',REJECTED:'Cần chỉnh sửa',NEEDS_APPROVAL:'Chờ duyệt'}[String(v||'').toUpperCase()]||String(v||''));
  const code=id=>{const m=String(id||'').match(/^BG-SUNBOT-(\d{4})-(\d{4})-(\d{3})$/);return m?`BG/SUNBOT/${m[1]}/${m[2]}-${m[3]}`:String(id||'');};

  function ensureViewer(){
    let root=document.getElementById('employee-published-viewer');
    if(root) return root;
    root=document.createElement('div');
    root.id='employee-published-viewer';
    root.className='epv-overlay';
    root.innerHTML='<div class="epv-shell"><div class="epv-head no-print"><div><b>BẢN ĐÃ DUYỆT</b><span id="epv-sub"></span></div><button class="btn secondary" id="epv-close">Đóng</button></div><div id="epv-body" class="epv-body"></div></div>';
    document.body.appendChild(root);
    root.querySelector('#epv-close').onclick=()=>{root.classList.remove('show');document.body.classList.remove('epv-lock');};
    root.addEventListener('click',ev=>{if(ev.target===root){root.classList.remove('show');document.body.classList.remove('epv-lock');}});
    return root;
  }

  function narrative(text){
    return String(text||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map(block=>/^##\s+/.test(block)?`<h3>${e(block.replace(/^##\s+/,''))}</h3>`:`<p>${e(block).replace(/\n/g,'<br>')}</p>`).join('');
  }

  function person(v){
    const map={Nhung:'Hoàng Nhung',Thu:'Minh Thu',Dung:'Lê Dung',thaovu:'Vũ Phương Thảo'};
    const key=String(v||'').trim();
    return map[key]||key;
  }

  function renderBundle(bundle){
    const q=bundle?.quote||{}, lines=Array.isArray(bundle?.lines)?bundle.lines:[];
    const retail=String(q.combo_code||'').toUpperCase()==='RETAIL_REPAIR'||String(q.quote_type||'').toUpperCase()==='RETAIL';
    const rows=lines.map((l,i)=>{
      const price=num(l.proposed_unit_price??l.unit_price_snapshot),qty=num(l.qty),total=num(l.line_total||price*qty);
      return `<tr class="quote-row"><td class="q-stt">${i+1}</td><td class="q-name"><b>${e(l.item_name_snapshot||l.name||l.item_id||'')}</b><small>${e(l.unit_snapshot||l.unit||'')}</small></td><td class="q-num">${qty}</td><td class="q-money">${fmt(price)}</td><td class="q-money q-line-total">${fmt(total)}</td></tr>`;
    }).join('');

    const narrativeSection=!retail&&String(q.configuration_description||'').trim()?`
      <section class="customer-proposal-narrative">
        <div class="proposal-page-title">
          <div class="proposal-eyebrow">ĐỀ XUẤT GIẢI PHÁP</div>
          <h1>Thuyết minh cấu hình Sunbot</h1>
          <p>${e(q.client_name||'Quý Nhà trường / Quý Đơn vị')} · ${e(code(q.quote_id))}</p>
        </div>
        <div class="customer-config-prose">${narrative(q.configuration_description)}</div>
      </section>`:'';

    const retailNote=retail?`<section class="quote-commercial-notes retail-service-conditions"><h3>Lưu ý dịch vụ</h3><ol><li>Thiết bị được kiểm tra thực tế trước khi xác nhận phạm vi sửa chữa.</li><li>Các phát sinh ngoài báo giá chỉ được thực hiện sau khi khách hàng xác nhận.</li></ol></section>`:'';

    return `<div class="epv-toolbar no-print"><span class="epv-ok">✓ ${e(String(status(q.status)).toUpperCase())}</span><button class="btn" id="epv-print">In / Lưu PDF</button></div>
      <div class="quote-preview-wrap epv-preview-wrap">
        <article id="quote-document" class="quote-document customer-proposal-page">
          ${narrativeSection}
          <section class="customer-proposal-price">
            <div class="quote-top-accent"></div>
            <header class="quote-header">
              <div class="quote-brand-block">
                <img class="quote-logo" src="../assets/img/logo-sunbot.png" alt="Sunbot">
                <div class="quote-brand-copy">
                  <div class="quote-company">CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM</div>
                  <div class="quote-tagline">SUNBOT · CÔNG NGHỆ GIÁO DỤC MẦM NON</div>
                </div>
              </div>
              <div class="quote-meta">
                <div><span>Mã</span><b>${e(code(q.quote_id))}</b></div>
                <div><span>Trạng thái</span><b>${e(status(q.status))}</b></div>
              </div>
            </header>
            <section class="quote-title-block">
              <div class="quote-kicker">${retail?'THIẾT BỊ · PHỤ KIỆN · SỬA CHỮA':'ĐỀ XUẤT THƯƠNG MẠI'}</div>
              <h1>${retail?'BÁO GIÁ SUNBOT':'BÁO GIÁ GIẢI PHÁP SUNBOT'}</h1>
            </section>
            <section class="quote-recipient">
              <div><span>Kính gửi</span><strong>${e(q.client_name||'Quý Nhà trường / Quý Đơn vị')}</strong></div>
              <div><span>Người lập</span><strong>${e(person(q.created_by))}</strong></div>
              <div><span>Phiên bản</span><strong>${num(q.version)||1}</strong></div>
            </section>
            <section class="quote-table-section">
              <table class="quote-table"><thead><tr><th class="q-stt">STT</th><th>Hạng mục</th><th class="q-num">SL</th><th class="q-money">Đơn giá</th><th class="q-money">Thành tiền</th></tr></thead><tbody>${rows}</tbody></table>
            </section>
            <section class="quote-total-box">
              <div class="quote-total-label"><span>TỔNG GIÁ TRỊ ĐỀ XUẤT</span><small>Chưa gồm VAT và chi phí ngoài phạm vi nếu có</small></div>
              <div class="quote-total-value">${fmt(q.proposed_amount||q.final_amount||0)}</div>
            </section>
            ${retailNote}
            <footer class="quote-footer">
              <div class="quote-footer-note"><b>SUNBOT</b><span>Giải pháp công nghệ giáo dục mầm non của Kiro Việt Nam</span><small>Người lập: ${e(person(q.created_by))}</small></div>
              <div class="quote-sign"><span>TRẠNG THÁI</span><div class="sign-space"></div><b>${e(String(status(q.status)).toUpperCase())}${q.approved_by?` · ${e(q.approved_by)}`:''}</b></div>
            </footer>
            <div class="quote-bottom-accent"></div>
          </section>
        </article>
      </div>`;
  }

  function printPublishedQuote(quoteId){
    // The finalized A4 stylesheet prints #quote-document only. The viewer now uses
    // that exact id/markup, so print preview and PDF use the same approved design.
    try{bridge('quotationShared','exportQuote',{quote_id:quoteId},state.token).catch(()=>{});}catch(_){}
    document.body.classList.add('epv-printing');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      window.print();
      setTimeout(()=>document.body.classList.remove('epv-printing'),300);
    }));
  }

  async function openQuote(quoteId){
    const root=ensureViewer(), body=root.querySelector('#epv-body'), sub=root.querySelector('#epv-sub');
    sub.textContent=code(quoteId);
    body.innerHTML='<div class="epv-loading"><div class="epv-spinner"></div><b>Đang mở bản đã duyệt…</b><small>Bản đã publish sẽ được ưu tiên đọc từ snapshot.</small></div>';
    root.classList.add('show');document.body.classList.add('epv-lock');
    try{
      const bundle=await bridge('quotationShared','getQuote',{quote_id:quoteId},state.token);
      body.innerHTML=renderBundle(bundle);
      body.scrollTop=0;
      body.querySelector('#epv-print')?.addEventListener('click',()=>printPublishedQuote(quoteId));
    }catch(err){
      body.innerHTML=`<section class="panel"><h2>Không mở được báo giá</h2><p class="notice danger">${e(typeof friendlyError==='function'?friendlyError(err):(err?.message||err))}</p><button class="btn" id="epv-retry">Thử lại</button></section>`;
      body.querySelector('#epv-retry')?.addEventListener('click',()=>openQuote(quoteId));
    }
  }

  document.addEventListener('click',ev=>{
    if(role()==='ADMIN') return;
    const btn=ev.target.closest?.('[data-v4-open]');
    if(!btn) return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    openQuote(String(btn.dataset.v4Open||''));
  },true);

  const css=document.createElement('style');
  css.textContent=`
    body.epv-lock{overflow:hidden}
    .epv-overlay{position:fixed;inset:0;background:rgba(15,23,42,.58);z-index:99999;display:none;padding:18px}
    .epv-overlay.show{display:block}
    .epv-shell{max-width:1120px;height:calc(100vh - 36px);margin:auto;background:#eef2f1;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.28);overflow:hidden;display:flex;flex-direction:column}
    .epv-head{height:58px;flex:0 0 58px;padding:9px 16px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #dde5e2}
    .epv-head div{display:flex;gap:10px;align-items:center}.epv-head b{color:#0f766e}.epv-head span{font-size:12px;color:#60706c}
    .epv-body{overflow:auto;padding:18px}
    .epv-loading{min-height:50vh;display:grid;place-items:center;align-content:center;gap:8px;color:#42534f}.epv-loading small{color:#778782}
    .epv-spinner{width:30px;height:30px;border:3px solid #d9e5e1;border-top-color:#0f766e;border-radius:50%;animation:epvspin .7s linear infinite}@keyframes epvspin{to{transform:rotate(360deg)}}
    .epv-toolbar{width:min(210mm,100%);margin:0 auto 10px;display:flex;justify-content:space-between;align-items:center}
    .epv-ok{font-weight:800;color:#15803d}
    .epv-preview-wrap{padding-bottom:24px;overflow:visible}
    .retail-service-conditions{margin-top:5mm}
    @media(max-width:700px){.epv-overlay{padding:0}.epv-shell{height:100vh;border-radius:0}.epv-body{padding:8px}.epv-toolbar{padding:4px 6px}.epv-preview-wrap{overflow:auto}}
    @media print{
      .epv-head,.epv-toolbar{display:none!important}
      #employee-published-viewer{display:block!important;position:static!important;inset:auto!important;padding:0!important;background:#fff!important}
      #employee-published-viewer .epv-shell{display:block!important;height:auto!important;max-width:none!important;margin:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important;overflow:visible!important}
      #employee-published-viewer .epv-body{display:block!important;overflow:visible!important;padding:0!important}
      #employee-published-viewer .epv-preview-wrap{display:block!important;margin:0!important;padding:0!important;overflow:visible!important}
      body>*:not(#employee-published-viewer){display:none!important}
    }
  `;
  document.head.appendChild(css);
  window.SUNBOT_EMPLOYEE_PUBLISHED_VIEW={open:openQuote,version:'2026.09.07-v2-print-design'};
})();
