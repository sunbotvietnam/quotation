// Sunbot quotation refinement V17 — editable document title, recommendation grouping, cleaner A4 documents.
(function(){
  const oldBuilderFormV17=builderForm;
  const oldNewBuilderV17=newBuilder;
  const oldSyncV17=syncBuilderFromForm;
  const oldPayloadV17=payloadFromBuilder;
  const oldBindBuilderV17=bindBuilder;
  const oldBindListsV17=bindLists;

  function meta17(q,key,fallback=''){
    const m=String(q?.notes||'').match(new RegExp('\\[\\['+key+'=([^\\]]*)\\]\\]'));
    return m?String(m[1]||'').trim():fallback;
  }
  function cleanMarkerText(v){return String(v||'').replace(/[\[\]\n\r]/g,' ').replace(/\s+/g,' ').trim()}
  function removeMetaMarkers(s){return String(s||'').replace(/\s*\[\[(DOC_TITLE|RECOMMENDED_IDS|COMMERCIAL_DISCOUNT_PCT)=[^\]]*\]\]/g,'').trim()}
  function lineId(l){return String(l?.item_id||l?.price_id||'')}

  newBuilder=function(kind,req=null){
    const b=oldNewBuilderV17(kind,req);
    b.quote_title=b.quote_title||'';
    (b.lines||[]).forEach(l=>{if(!l.display_role)l.display_role='CORE'});
    return b;
  };

  function titleEditor(b){
    return `<section class="doc-title-editor"><div class="field wide"><label>Tiêu đề tài liệu</label><input name="quote_title" value="${esc(b.quote_title||'')}" placeholder="Để trống để hệ thống tự đặt theo nội dung"><small>Admin có thể sửa theo từng trường hợp, ví dụ: “BÁO GIÁ TÁI ĐÀO TẠO & CHUẨN HÓA GIÁO VIÊN SUNBOT”. Tiêu đề này chỉ ảnh hưởng tài liệu gửi khách.</small></div></section>`;
  }

  builderForm=function(kind){
    let html=oldBuilderFormV17(kind),b=state.builder;
    html=html.replace('<div class="catalog-box">',titleEditor(b)+'<div class="catalog-box">');
    if(kind==='SOLUTION'){
      html=html.replace('<h3 class="subheading">Các dòng báo giá</h3>','<h3 class="subheading">Các dòng báo giá</h3><div class="recommendation-help"><b>Cách trình bày:</b> giữ các hạng mục bắt buộc/đã chốt ở “Phạm vi chính”; những phần nên cân nhắc thêm đặt ở “Hạng mục khuyến nghị”.</div>');
    }
    return html;
  };

  syncBuilderFromForm=function(){
    oldSyncV17();
    const f=document.getElementById('builder-form'),b=state.builder;
    if(!f||!b)return;
    const fd=new FormData(f);
    if(fd.has('quote_title'))b.quote_title=String(fd.get('quote_title')||'');
  };

  lineTable=function(b){
    if(!b.lines.length)return `<div class="empty compact">Chưa có hạng mục.</div>`;
    const solution=b.kind==='SOLUTION';
    return `<div class="table-wrap"><table class="table sortable-table"><thead><tr><th></th><th>Hạng mục</th>${solution?'<th>Hiển thị</th>':'<th>Nhóm</th>'}<th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th></th></tr></thead><tbody>${b.lines.map((l,idx)=>{
      const i=catalogItem(l.item_id),p=Number(l.proposed_unit_price||itemPrice(i)),name=l.custom_name||i?.name||l.item_id,unit=l.custom_unit||i?.unit||'',custom=String(l.item_id||'').startsWith('CUSTOM_RR_');
      const role=l.display_role||'CORE';
      return `<tr draggable="true" data-line-row="${idx}"><td class="drag-cell"><span class="drag-handle" title="Kéo để sắp xếp">⋮⋮</span><div class="move-buttons"><button type="button" data-move-up="${idx}">↑</button><button type="button" data-move-down="${idx}">↓</button></div></td><td><b>${esc(name)}</b>${custom&&l.custom_description?`<small>${esc(l.custom_description)}</small>`:''}<small>${esc(unit)}</small></td>${solution?`<td><select class="line-role-select" data-line-role="${idx}"><option value="CORE" ${role==='CORE'?'selected':''}>Phạm vi chính</option><option value="RECOMMENDED" ${role==='RECOMMENDED'?'selected':''}>Hạng mục khuyến nghị</option></select></td>`:`<td>${custom?'Hạng mục tùy chỉnh':esc(classifyItem(i))}</td>`}<td><input class="cell-input" type="number" min="0" step="1" data-line-qty="${idx}" value="${Number(l.qty||0)}"></td><td><input class="cell-input money-input" type="number" min="0" step="1000" data-line-price="${idx}" value="${p}"></td><td class="money">${money(p*Number(l.qty||0))}</td><td><button type="button" class="icon-btn" data-remove-line="${idx}">×</button></td></tr>`
    }).join('')}</tbody></table></div><div class="reorder-hint">Kéo biểu tượng ⋮⋮ để đổi thứ tự. Trên điện thoại có thể dùng nút ↑ ↓.</div>`;
  };

  bindBuilder=function(kind){
    oldBindBuilderV17(kind);
    document.querySelectorAll('[data-line-role]').forEach(sel=>sel.onchange=()=>{
      syncBuilderFromForm();
      const i=Number(sel.dataset.lineRole);
      if(state.builder?.lines?.[i])state.builder.lines[i].display_role=sel.value;
    });
  };

  payloadFromBuilder=function(b){
    const p=oldPayloadV17(b);
    const recommended=(b.lines||[]).filter(x=>x.display_role==='RECOMMENDED').map(lineId).filter(Boolean);
    let notes=removeMetaMarkers(p.notes||'');
    const markers=[];
    if(cleanMarkerText(b.quote_title))markers.push(`[[DOC_TITLE=${cleanMarkerText(b.quote_title)}]]`);
    if(recommended.length)markers.push(`[[RECOMMENDED_IDS=${recommended.map(cleanMarkerText).join(',')}]]`);
    if(b.kind==='SOLUTION'&&Number(b.discount_pct||0)>0)markers.push(`[[COMMERCIAL_DISCOUNT_PCT=${Number(b.discount_pct||0)}]]`);
    p.notes=[notes,markers.join(' ')].filter(Boolean).join('\n');
    return p;
  };

  function autoTitle(q,lines){
    const custom=meta17(q,'DOC_TITLE','');
    if(custom)return custom;
    const retail=String(q?.combo_code||'').toUpperCase()==='RETAIL_REPAIR';
    if(!retail)return 'BÁO GIÁ GIẢI PHÁP SUNBOT';
    const subtype=meta17(q,'RETAIL_SUBTYPE','');
    const names=(lines||[]).map(l=>String(l.item_name_snapshot||l.item_id||'').toLowerCase()).join(' | ');
    if(subtype==='REPAIR')return 'DỰ TOÁN CHI PHÍ SỬA CHỮA & THAY THẾ ROBOT SUNBOT';
    if(/tái đào tạo/.test(names)&&!/(robot|thiết bị|học cụ|linh kiện)/.test(names))return 'BÁO GIÁ TÁI ĐÀO TẠO & CHUẨN HÓA GIÁO VIÊN SUNBOT';
    if(/đào tạo/.test(names)&&/sát hạch|chứng nhận/.test(names))return 'BÁO GIÁ ĐÀO TẠO, SÁT HẠCH & CHỨNG NHẬN SUNBOT';
    if(/đào tạo|sát hạch|chứng nhận|mentoring|hướng dẫn/.test(names)&&!/(robot|thiết bị|học cụ|linh kiện)/.test(names))return 'BÁO GIÁ DỊCH VỤ CHUYÊN MÔN SUNBOT';
    if(subtype==='RETAIL')return 'BÁO GIÁ THIẾT BỊ / HỌC CỤ SUNBOT';
    return 'BÁO GIÁ HẠNG MỤC SUNBOT';
  }

  function recommendedSet(q){return new Set(meta17(q,'RECOMMENDED_IDS','').split(',').map(x=>x.trim()).filter(Boolean))}
  function quoteRows17(q,lines){
    const rec=recommendedSet(q),core=[],recommended=[];
    (lines||[]).forEach(l=>(rec.has(lineId(l))?recommended:core).push(l));
    const row=(l,i)=>{const price=Number(l.proposed_unit_price??l.unit_price_snapshot??0),qty=Number(l.qty||0),sum=Number(l.line_total||price*qty);return `<tr><td>${i}</td><td><b>${esc(l.item_name_snapshot||l.item_id||'')}</b><small>${esc(l.unit_snapshot||'')}</small></td><td class="c">${qty}</td><td class="r">${money(price)}</td><td class="r">${money(sum)}</td></tr>`};
    let n=1,out=core.map(l=>row(l,n++)).join('');
    if(recommended.length){out+=`<tr class="recommendation-divider"><td colspan="5"><span>HẠNG MỤC KHUYẾN NGHỊ</span><small>Có thể lựa chọn thêm theo nhu cầu thực tế của Nhà trường</small></td></tr>`;out+=recommended.map(l=>row(l,n++)).join('')}
    return out;
  }

  function renderQuote17(q,lines){
    let html=renderQuotePaper(q,lines);
    html=html.replace(/<div class="quote-title"><span>([\s\S]*?)<\/span><h1>[\s\S]*?<\/h1><\/div>/,`<div class="quote-title"><span>$1</span><h1>${esc(autoTitle(q,lines))}</h1></div>`);
    html=html.replace(/<tbody>[\s\S]*?<\/tbody>/,`<tbody>${quoteRows17(q,lines)}</tbody>`);
    const pct=Number(meta17(q,'COMMERCIAL_DISCOUNT_PCT','0')||0);
    if(pct>0){
      const badge=`<div class="commercial-discount"><span>ƯU ĐÃI THƯƠNG MẠI</span><b>${pct.toLocaleString('vi-VN')}%</b><small>Áp dụng cho gói chương trình chính; tổng giá trị sau ưu đãi đã được phản ánh trong báo giá.</small></div>`;
      html=html.replace('<div class="quote-total">',badge+'<div class="quote-total">');
    }
    return html;
  }

  function commonHeader17(q,kicker,title){return `<div class="quote-accent"></div><header class="quote-header"><div class="quote-brand"><img src="${LOGO}" alt="Sunbot"><div><b>CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM</b><span>SUNBOT · GIẢI PHÁP CÔNG NGHỆ GIÁO DỤC MẦM NON</span></div></div><div class="quote-code"><span>Mã tham chiếu</span><b>${esc(codeText(q?.quote_id||''))}</b></div></header><div class="quote-title"><span>${esc(kicker)}</span><h1>${esc(title)}</h1></div><div class="recipient"><span>Kính gửi</span><b>${esc(q?.client_name||'Quý Nhà trường / Quý Đơn vị')}</b></div>`}
  function narrativeSections17(text){
    const chunks=String(text||'').split(/\n(?=##\s+)/).map(x=>x.trim()).filter(Boolean);
    return chunks.map((chunk,idx)=>{
      const m=chunk.match(/^##\s*([^\n]+)\n?([\s\S]*)$/);
      if(!m)return `<section class="narrative-section"><p>${esc(chunk).replace(/\n/g,'<br>')}</p></section>`;
      const title=m[1].trim(),body=m[2].trim();
      const paras=body.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
      return `<section class="narrative-section"><h3>${esc(title)}</h3>${paras}</section>`;
    }).join('');
  }
  function footer17(q){return `<footer class="quote-footer doc-footer"><div><b>SUNBOT</b><span>Giải pháp công nghệ giáo dục mầm non của Kiro Việt Nam</span></div><div class="signature"><span>ĐẠI DIỆN ĐỀ XUẤT</span><i></i><b>${esc(person(q?.created_by||q?.deal_owner))}</b></div></footer><div class="quote-accent bottom"></div>`}
  function narrativeDoc17(q){const text=String(q?.configuration_description||'').trim();return `<article class="quote-paper pro doc-paper v17-doc">${commonHeader17(q,'THUYẾT MINH','THUYẾT MINH PHƯƠNG ÁN TRIỂN KHAI SUNBOT')}<main class="narrative-body">${text?narrativeSections17(text):'<section class="narrative-section"><p>Chưa có nội dung thuyết minh cho báo giá này.</p></section>'}</main>${footer17(q)}</article>`}
  function proposalDoc17(q,lines){
    const text=String(q?.configuration_description||'').trim();
    const quote=renderQuote17(q,lines),table=quote.match(/<table class="quote-table">[\s\S]*?<\/table>/)?.[0]||'',total=Number(q?.proposed_amount||q?.final_amount||0),pct=Number(meta17(q,'COMMERCIAL_DISCOUNT_PCT','0')||0);
    const discount=pct>0?`<div class="commercial-discount"><span>ƯU ĐÃI THƯƠNG MẠI</span><b>${pct.toLocaleString('vi-VN')}%</b><small>Áp dụng cho gói chương trình chính.</small></div>`:'';
    return `<article class="quote-paper pro doc-paper v17-doc">${commonHeader17(q,'ĐỀ XUẤT','ĐỀ XUẤT PHƯƠNG ÁN TRIỂN KHAI SUNBOT')}<main class="narrative-body proposal-narrative">${text?narrativeSections17(text):''}</main><section class="proposal-commercial"><h3>TÓM TẮT THƯƠNG MẠI</h3>${table}${discount}<div class="quote-total"><span>TỔNG GIÁ TRỊ ĐỀ XUẤT</span><b>${money(total)}</b></div></section>${footer17(q)}</article>`;
  }

  function slug17(text){return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[\\/:*?"<>|.]+/g,' ').trim().replace(/\s+/g,'_')||'Khach_hang'}
  function print17(html,name){
    let stage=document.getElementById('billing-print-stage');if(!stage){stage=document.createElement('div');stage.id='billing-print-stage';stage.className='billing-print-stage';document.body.appendChild(stage)}
    stage.innerHTML=`<div class="billing-print-paper">${html}</div>`;const old=document.title;document.title=name;const done=()=>{document.title=old;setTimeout(()=>stage.innerHTML='',50)};window.addEventListener('afterprint',done,{once:true});setTimeout(()=>window.print(),100);setTimeout(()=>{if(document.title===name)done()},6000)
  }
  function fileName17(type,q){const p=type==='NARRATIVE'?'Sunbot_ThuyetMinh':type==='PROPOSAL'?'Sunbot_DeXuat':'Sunbot_BaoGia';return `${p}_${slug17(q?.client_name)}_${String(codeText(q?.quote_id)||'').replace(/[\\/]+/g,'-')}`}
  async function openQuote17(id){
    try{
      const bundle=await withBusy('Đang mở báo giá…',()=>bridge('quotationShared','getQuoteFast',{quote_id:id}));const q=bundle?.quote||{},lines=bundle?.lines||[],admin=state.role==='ADMIN',hasNarrative=!!String(q.configuration_description||'').trim();
      const actions=admin?`<div class="quote-modal-actions billing-output-actions"><button class="btn primary" id="v17-print-q">In / Lưu PDF báo giá</button>${hasNarrative?`<button class="btn outline" id="v17-print-n">In / Lưu PDF thuyết minh</button><button class="btn soft" id="v17-print-p">In / Lưu PDF đề xuất</button>`:''}</div>`:`<div class="sale-approved-note">${String(q.status||'').toUpperCase()==='APPROVED'?'Báo giá đã được phát hành. Bạn có thể xem nội dung tại đây; Admin sẽ chuyển file chính thức qua kênh làm việc nội bộ.':'Báo giá đang trong quá trình xử lý.'}</div>`;
      modal(codeText(id),actions+renderQuote17(q,lines));
      document.getElementById('v17-print-q')?.addEventListener('click',()=>print17(renderQuote17(q,lines),fileName17('QUOTE',q)));
      document.getElementById('v17-print-n')?.addEventListener('click',()=>print17(narrativeDoc17(q),fileName17('NARRATIVE',q)));
      document.getElementById('v17-print-p')?.addEventListener('click',()=>print17(proposalDoc17(q,lines),fileName17('PROPOSAL',q)));
    }catch(er){setNotice(errText(er),'error')}
  }

  quoteList=function(){const rows=state.quotes||[];return `<section class="card"><div class="section-head"><div><h1>${state.role==='ADMIN'?'Kho báo giá':'Báo giá của tôi'}</h1><p>${state.role==='ADMIN'?'Mở lại báo giá đã lưu và xuất đúng tài liệu A4 khi cần.':'Theo dõi trạng thái và xem báo giá đã được Admin xử lý.'}</p></div></div>${!rows.length?'<div class="empty">Chưa có báo giá.</div>':`<div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Khách hàng</th><th>Giá trị</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.map(q=>`<tr><td><b>${esc(codeText(q.quote_id))}</b></td><td>${esc(q.client_name||'')}</td><td class="money">${money(q.proposed_amount||q.final_amount||0)}</td><td>${statusBadge(q.status)}</td><td><button class="btn outline small" data-v17-open="${esc(q.quote_id)}">${state.role==='ADMIN'?'Xem / Xuất hồ sơ':'Xem báo giá'}</button></td></tr>`).join('')}</tbody></table></div>`}</section>`}
  bindLists=function(){oldBindListsV17();document.querySelectorAll('[data-v17-open],[data-simple-open-quote]').forEach(btn=>btn.onclick=()=>openQuote17(btn.dataset.v17Open||btn.dataset.simpleOpenQuote))}
})();