// Universal quote viewer: old and new quotes open immediately from transactional data.
// Drive PDF creation is background-only and never blocks viewing.
(function(){
  const num=v=>Number(v||0);
  const e=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>typeof money==='function'?money(num(v)):new Intl.NumberFormat('vi-VN').format(num(v))+' đ';
  const person=v=>({Nhung:'Hoàng Nhung',Thu:'Minh Thu',Dung:'Lê Dung',thaovu:'Vũ Phương Thảo',admin:'Kiro Việt Nam',Admin:'Kiro Việt Nam'}[String(v||'').trim()]||String(v||'').trim()||'Kiro Việt Nam');
  const code=id=>{const m=String(id||'').match(/^BG-SUNBOT-(\d{4})-(\d{4})-(\d{3})$/);return m?`BG/SUNBOT/${m[1]}/${m[2]}-${m[3]}`:String(id||'');};
  const statusLabel=v=>({APPROVED:'Đã duyệt',NEEDS_APPROVAL:'Chờ duyệt',CHANGES_REQUESTED:'Cần chỉnh sửa',REJECTED:'Cần chỉnh sửa'}[String(v||'').toUpperCase()]||'Báo giá');

  function mode(q){
    const combo=String(q?.combo_code||'').toUpperCase(), qt=String(q?.quote_type||'').toUpperCase();
    if(combo==='RETAIL_REPAIR'||qt==='RETAIL')return 'RETAIL';
    if(combo==='LEGACY_REBUILD'||combo.indexOf('LEGACY_')===0||qt==='LEGACY')return 'LEGACY';
    return 'SOLUTION';
  }
  function narrative(text){return String(text||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map(b=>/^##\s+/.test(b)?`<h3>${e(b.replace(/^##\s+/,''))}</h3>`:`<p>${e(b).replace(/\n/g,'<br>')}</p>`).join('');}

  function ensure(){
    let root=document.getElementById('quote-view-final');
    if(root)return root;
    root=document.createElement('div');root.id='quote-view-final';root.className='qvf-overlay';
    root.innerHTML='<div class="qvf-shell"><div class="qvf-head no-print"><div><b id="qvf-title">Báo giá</b><span id="qvf-sub"></span></div><div class="qvf-head-actions"><a class="btn secondary" id="qvf-pdf" target="_blank" style="display:none">Mở PDF</a><button class="btn secondary" id="qvf-close">Đóng</button></div></div><div id="qvf-body" class="qvf-body"></div></div>';
    document.body.appendChild(root);
    root.querySelector('#qvf-close').onclick=()=>close();
    root.addEventListener('click',ev=>{if(ev.target===root)close();});
    const css=document.createElement('style');css.textContent=`body.qvf-lock{overflow:hidden}.qvf-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:110000;display:none;padding:16px}.qvf-overlay.show{display:block}.qvf-shell{max-width:1120px;height:calc(100vh - 32px);margin:auto;background:#eef2f1;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.26)}.qvf-head{height:58px;flex:0 0 58px;padding:9px 16px;background:#fff;border-bottom:1px solid #dce6e2;display:flex;align-items:center;justify-content:space-between}.qvf-head>div:first-child{display:flex;gap:10px;align-items:center}.qvf-head b{color:#0f766e}.qvf-head span{font-size:12px;color:#667872}.qvf-head-actions{display:flex;gap:8px}.qvf-body{overflow:auto;padding:18px}.qvf-loading{min-height:52vh;display:grid;place-items:center;align-content:center;gap:8px;color:#40534d}.qvf-loading .ring{width:30px;height:30px;border:3px solid #d9e6e2;border-top-color:#0f766e;border-radius:50%;animation:qvfspin .75s linear infinite}@keyframes qvfspin{to{transform:rotate(360deg)}}.qvf-toolbar{width:min(210mm,100%);margin:0 auto 10px;display:flex;justify-content:space-between;align-items:center}.qvf-status{font-weight:800;color:#0f766e}.qvf-preview{overflow:visible;padding-bottom:24px}@media(max-width:700px){.qvf-overlay{padding:0}.qvf-shell{height:100vh;border-radius:0}.qvf-body{padding:8px}.qvf-head{padding:8px}.qvf-head-actions .btn{padding:8px 10px}}@media print{.qvf-head,.qvf-toolbar{display:none!important}body>*:not(#quote-view-final){display:none!important}#quote-view-final{display:block!important;position:static!important;padding:0!important;background:#fff!important}#quote-view-final .qvf-shell{display:block!important;height:auto!important;max-width:none!important;margin:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important;overflow:visible!important}#quote-view-final .qvf-body{display:block!important;overflow:visible!important;padding:0!important}}`;
    document.head.appendChild(css);return root;
  }
  function close(){const r=document.getElementById('quote-view-final');if(r)r.classList.remove('show');document.body.classList.remove('qvf-lock');}

  function render(bundle){
    const q=bundle?.quote||{}, lines=Array.isArray(bundle?.lines)?bundle.lines:[], m=mode(q), retail=m==='RETAIL', legacy=m==='LEGACY';
    const rows=lines.map((l,i)=>{const price=num(l.proposed_unit_price??l.unit_price_snapshot),qty=num(l.qty),sum=num(l.line_total||price*qty);return `<tr class="quote-row"><td class="q-stt">${i+1}</td><td class="q-name"><b>${e(l.item_name_snapshot||l.name||l.item_id||'')}</b><small>${e(l.unit_snapshot||l.unit||'')}</small></td><td class="q-num">${qty}</td><td class="q-money">${fmt(price)}</td><td class="q-money q-line-total">${fmt(sum)}</td></tr>`;}).join('');
    const intro=!retail&&String(q.configuration_description||'').trim()?`<section class="customer-proposal-narrative"><div class="proposal-page-title"><div class="proposal-eyebrow">${legacy?'PHƯƠNG ÁN TÁI KHỞI ĐỘNG':'ĐỀ XUẤT GIẢI PHÁP'}</div><h1>${legacy?'Tái khởi động và nâng cấp Sunbot':'Thuyết minh cấu hình Sunbot'}</h1><p>${e(q.client_name||'Quý Nhà trường / Quý Đơn vị')} · ${e(code(q.quote_id))}</p></div><div class="customer-config-prose">${narrative(q.configuration_description)}</div></section>`:'';
    const title=retail?'BÁO GIÁ THIẾT BỊ / DỊCH VỤ SUNBOT':legacy?'BÁO GIÁ TÁI KHỞI ĐỘNG VÀ NÂNG CẤP SUNBOT':'BÁO GIÁ GIẢI PHÁP SUNBOT';
    return `<div class="qvf-toolbar no-print"><span class="qvf-status">${e(statusLabel(q.status))}</span><button class="btn" id="qvf-print">In / Lưu PDF</button></div><div class="quote-preview-wrap qvf-preview"><article id="quote-document" class="quote-document customer-proposal-page">${intro}<section class="customer-proposal-price"><div class="quote-top-accent"></div><header class="quote-header"><div class="quote-brand-block"><img class="quote-logo" src="../assets/img/logo-sunbot.png" alt="Sunbot"><div class="quote-brand-copy"><div class="quote-company">CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM</div><div class="quote-tagline">SUNBOT · CÔNG NGHỆ GIÁO DỤC MẦM NON</div></div></div><div class="quote-meta"><div><span>Mã</span><b>${e(code(q.quote_id))}</b></div><div><span>Phiên bản</span><b>${num(q.version)||1}</b></div></div></header><section class="quote-title-block"><div class="quote-kicker">${retail?'THIẾT BỊ · PHỤ KIỆN · SỬA CHỮA':legacy?'TÁI KHỞI ĐỘNG · NÂNG CẤP':'ĐỀ XUẤT THƯƠNG MẠI'}</div><h1>${title}</h1></section><section class="quote-recipient"><div><span>Kính gửi</span><strong>${e(q.client_name||'Quý Nhà trường / Quý Đơn vị')}</strong></div><div><span>Đại diện báo giá</span><strong>${e(person(q.created_by||q.deal_owner))}</strong></div></section><section class="quote-table-section"><table class="quote-table"><thead><tr><th class="q-stt">STT</th><th>Hạng mục</th><th class="q-num">SL</th><th class="q-money">Đơn giá</th><th class="q-money">Thành tiền</th></tr></thead><tbody>${rows}</tbody></table></section><section class="quote-total-box"><div class="quote-total-label"><span>TỔNG GIÁ TRỊ ĐỀ XUẤT</span><small>Chưa gồm VAT và chi phí ngoài phạm vi nếu có</small></div><div class="quote-total-value">${fmt(q.proposed_amount||q.final_amount||0)}</div></section><footer class="quote-footer"><div class="quote-footer-note"><b>SUNBOT</b><span>Giải pháp công nghệ giáo dục mầm non của Kiro Việt Nam</span></div><div class="quote-sign"><span>ĐẠI DIỆN BÁO GIÁ</span><div class="sign-space"></div><b>${e(person(q.created_by||q.deal_owner))}</b></div></footer><div class="quote-bottom-accent"></div></section></article></div>`;
  }

  async function open(id){
    const root=ensure(),body=root.querySelector('#qvf-body'),sub=root.querySelector('#qvf-sub'),title=root.querySelector('#qvf-title'),pdf=root.querySelector('#qvf-pdf');
    title.textContent='Báo giá';sub.textContent=code(id);pdf.style.display='none';pdf.removeAttribute('href');
    body.innerHTML='<div class="qvf-loading"><div class="ring"></div><b>Đang mở báo giá…</b><small>Hệ thống đã nhận thao tác của bạn.</small></div>';
    root.classList.add('show');document.body.classList.add('qvf-lock');
    try{
      const bundle=await bridge('quotationShared','getQuoteFast',{quote_id:id},state.token);
      title.textContent=statusLabel(bundle?.quote?.status||'');
      body.innerHTML=render(bundle);body.scrollTop=0;
      body.querySelector('#qvf-print')?.addEventListener('click',()=>{document.body.classList.add('qvf-printing');requestAnimationFrame(()=>requestAnimationFrame(()=>{window.print();setTimeout(()=>document.body.classList.remove('qvf-printing'),300);}));});
      // PDF is prepared quietly after the quote is already visible.
      const helper=window.SUNBOT_QUOTE_ARTIFACTS;
      if(helper){helper.ensure(id).then(row=>{const u=helper.bestUrl(row||{});if(u){pdf.href=u;pdf.style.display='inline-flex';pdf.textContent='Mở PDF';}}).catch(()=>{});}
    }catch(err){body.innerHTML=`<section class="panel"><h2>Không mở được báo giá</h2><p class="notice danger">${e(typeof friendlyError==='function'?friendlyError(err):(err?.message||err))}</p><button class="btn" id="qvf-retry">Thử lại</button></section>`;body.querySelector('#qvf-retry')?.addEventListener('click',()=>open(id));}
  }

  // Final click path for quote-library "Xem". Works for historical and current quotes.
  window.addEventListener('click',ev=>{const btn=ev.target?.closest?.('[data-v4-open]');if(!btn)return;const id=String(btn.dataset.v4Open||'').trim();if(!id)return;ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();open(id);},true);
  window.SUNBOT_QUOTE_VIEW={open,version:'2026.09.07-universal-v1'};
})();