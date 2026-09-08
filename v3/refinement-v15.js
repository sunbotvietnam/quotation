// Sunbot quotation refinement V15 — Billing-style print/save workflow.
// Principle: backend stores quote snapshots; the browser renders the A4 document on demand.
// No Drive/PDF artifact is required for day-to-day output.
(function(){
  const oldQuoteListV15 = quoteList;
  const oldBindListsV15 = bindLists;

  function slugFile(text){
    return String(text||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/đ/g,'d').replace(/Đ/g,'D')
      .replace(/[\\/:*?"<>|.]+/g,' ')
      .trim().replace(/\s+/g,'_').replace(/_+/g,'_') || 'Khach_hang';
  }
  function quoteFileCode(id){ return String(codeText(id)||id||'BaoGia').replace(/[\\/]+/g,'-').replace(/\s+/g,'_'); }
  function docFilename(type,q){
    const customer=slugFile(q?.client_name||'Khach_hang');
    const code=quoteFileCode(q?.quote_id||'BaoGia');
    const prefix=type==='NARRATIVE'?'Sunbot_ThuyetMinh':type==='PROPOSAL'?'Sunbot_DeXuat':'Sunbot_BaoGia';
    return `${prefix}_${customer}_${code}`;
  }

  function ensurePrintStage(){
    let stage=document.getElementById('billing-print-stage');
    if(!stage){
      stage=document.createElement('div');
      stage.id='billing-print-stage';
      stage.className='billing-print-stage';
      document.body.appendChild(stage);
    }
    return stage;
  }

  function cleanPrintable(html){
    const wrap=document.createElement('div');wrap.innerHTML=html;
    wrap.querySelectorAll('.screen-only,.no-print,button,input,select,textarea').forEach(x=>x.remove());
    return wrap.innerHTML;
  }

  function printA4(html,filename){
    const stage=ensurePrintStage();
    stage.innerHTML=`<div class="billing-print-paper">${cleanPrintable(html)}</div>`;
    const oldTitle=document.title;
    document.title=filename;
    const restore=()=>{document.title=oldTitle;setTimeout(()=>{stage.innerHTML=''},50)};
    window.addEventListener('afterprint',restore,{once:true});
    setTimeout(()=>window.print(),80);
    // Fallback for browsers that do not fire afterprint reliably.
    setTimeout(()=>{if(document.title===filename)restore()},5000);
  }

  function narrativeText(q){return String(q?.configuration_description||'').trim();}
  function narrativeBlocks(text){
    return String(text||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map(block=>{
      const heading=/^##\s*/.test(block)||/^\d+[.)]\s+/.test(block);
      const clean=block.replace(/^##\s*/, '').replace(/\bAdmin\b/gi,'Kiro Việt Nam').replace(/\blab\b/gi,'phòng công nghệ');
      return heading?`<h3>${esc(clean)}</h3>`:`<p>${esc(clean).replace(/\n/g,'<br>')}</p>`;
    }).join('');
  }
  function commonDocHeader(q,kicker,title){
    return `<div class="quote-accent"></div><header class="quote-header"><div class="quote-brand"><img src="${LOGO}" alt="Sunbot"><div><b>CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM</b><span>SUNBOT · GIẢI PHÁP CÔNG NGHỆ GIÁO DỤC MẦM NON</span></div></div><div class="quote-code"><span>Mã tham chiếu</span><b>${esc(codeText(q?.quote_id||''))}</b></div></header><div class="quote-title"><span>${esc(kicker)}</span><h1>${esc(title)}</h1></div><div class="recipient"><span>Kính gửi</span><b>${esc(q?.client_name||'Quý Nhà trường / Quý Đơn vị')}</b></div>`;
  }
  function renderNarrativePaper(q){
    const text=narrativeText(q);
    return `<article class="quote-paper pro doc-paper">${commonDocHeader(q,'THUYẾT MINH','THUYẾT MINH GIẢI PHÁP SUNBOT')}<section class="narrative-body">${text?narrativeBlocks(text):'<p>Chưa có nội dung thuyết minh cho báo giá này.</p>'}</section><footer class="quote-footer"><div><b>SUNBOT</b><span>Giải pháp công nghệ giáo dục mầm non của Kiro Việt Nam</span></div><div class="signature"><span>ĐẠI DIỆN ĐỀ XUẤT</span><i></i><b>${esc(person(q?.created_by||q?.deal_owner))}</b></div></footer><div class="quote-accent bottom"></div></article>`;
  }
  function renderProposalPaper(q,lines){
    const text=narrativeText(q);
    const priceTable=renderQuotePaper(q,lines).match(/<table class="quote-table">[\s\S]*?<\/table>/)?.[0]||'';
    const total=Number(q?.proposed_amount||q?.final_amount||0);
    return `<article class="quote-paper pro doc-paper">${commonDocHeader(q,'ĐỀ XUẤT GIẢI PHÁP','ĐỀ XUẤT TRIỂN KHAI SUNBOT')}<section class="narrative-body">${text?narrativeBlocks(text):'<p>Phương án triển khai theo nội dung và hạng mục của báo giá kèm theo.</p>'}</section><section class="proposal-commercial"><h3>TÓM TẮT THƯƠNG MẠI</h3>${priceTable}<div class="quote-total"><span>TỔNG GIÁ TRỊ ĐỀ XUẤT</span><b>${money(total)}</b></div></section><footer class="quote-footer"><div><b>SUNBOT</b><span>Giải pháp công nghệ giáo dục mầm non của Kiro Việt Nam</span></div><div class="signature"><span>ĐẠI DIỆN ĐỀ XUẤT</span><i></i><b>${esc(person(q?.created_by||q?.deal_owner))}</b></div></footer><div class="quote-accent bottom"></div></article>`;
  }

  async function openSimpleQuote(id){
    try{
      const bundle=await withBusy('Đang mở báo giá…',()=>bridge('quotationShared','getQuoteFast',{quote_id:id}));
      const q=bundle?.quote||{},lines=bundle?.lines||[],admin=state.role==='ADMIN',hasNarrative=!!narrativeText(q);
      const adminActions=admin?`<div class="quote-modal-actions billing-output-actions"><button class="btn primary" id="billing-print-quote">In / Lưu PDF báo giá</button>${hasNarrative?`<button class="btn outline" id="billing-print-narrative">In / Lưu PDF thuyết minh</button><button class="btn soft" id="billing-print-proposal">In / Lưu PDF đề xuất</button>`:''}</div>`:`<div class="sale-approved-note">${String(q.status||'').toUpperCase()==='APPROVED'?'Báo giá đã được phát hành. Bạn có thể xem nội dung tại đây; Admin sẽ gửi file chính thức theo kênh làm việc với khách hàng.':'Báo giá đang trong quá trình xử lý.'}</div>`;
      modal(codeText(id),`${adminActions}${renderQuotePaper(q,lines)}`);
      document.getElementById('billing-print-quote')?.addEventListener('click',()=>printA4(renderQuotePaper(q,lines),docFilename('QUOTE',q)));
      document.getElementById('billing-print-narrative')?.addEventListener('click',()=>printA4(renderNarrativePaper(q),docFilename('NARRATIVE',q)));
      document.getElementById('billing-print-proposal')?.addEventListener('click',()=>printA4(renderProposalPaper(q,lines),docFilename('PROPOSAL',q)));
    }catch(er){setNotice(errText(er),'error')}
  }

  // Replace the old Drive-centric quote list with a backend-snapshot-centric workflow.
  quoteList=function(){
    const rows=state.quotes||[];
    return `<section class="card"><div class="section-head"><div><h1>${state.role==='ADMIN'?'Kho báo giá':'Báo giá của tôi'}</h1><p>${state.role==='ADMIN'?'Mở lại dữ liệu đã lưu trong backend và xuất A4 khi cần.':'Theo dõi trạng thái và xem báo giá đã được Admin xử lý.'}</p></div></div>${!rows.length?`<div class="empty">Chưa có báo giá.</div>`:`<div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Khách hàng</th><th>Giá trị</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.map(q=>`<tr><td><b>${esc(codeText(q.quote_id))}</b></td><td>${esc(q.client_name||'')}</td><td class="money">${money(q.proposed_amount||q.final_amount||0)}</td><td>${statusBadge(q.status)}</td><td><div class="inline-actions"><button class="btn outline small" data-simple-open-quote="${esc(q.quote_id)}">${state.role==='ADMIN'?'Xem / Xuất hồ sơ':'Xem báo giá'}</button></div></td></tr>`).join('')}</tbody></table></div>`}</section>`;
  };

  // Request tiles: Sale/Admin view the quote; no Drive dependency in the normal workflow.
  const oldRequestListV15=requestList;
  requestList=function(){
    let html=oldRequestListV15();
    html=html.replace(/<button class="btn soft small" data-doc-links="[^"]+">Tài liệu Drive<\/button>/g,'');
    html=html.replace(/data-open-quote=/g,'data-simple-open-quote=');
    return html;
  };

  bindLists=function(){
    oldBindListsV15();
    document.querySelectorAll('[data-simple-open-quote]').forEach(btn=>btn.onclick=()=>openSimpleQuote(btn.dataset.simpleOpenQuote));
    // Neutralize legacy Drive/regenerate buttons if any old markup survives.
    document.querySelectorAll('[data-doc-links],[data-regenerate]').forEach(btn=>btn.remove());
  };

  // Keep a globally reachable function for manual/admin troubleshooting.
  window.sunbotOpenQuoteForPrint=openSimpleQuote;
})();