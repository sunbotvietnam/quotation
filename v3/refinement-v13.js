// Sunbot quotation refinement V13 — keeps the stable V12 core and refines workflow/UI.
(function(){
  const SALE_GUIDE='https://docs.google.com/document/d/1qb7AeFuS6QQKyqUNRiE-0O8sRIGTqtcE0zZYVLmNpu4/edit';
  const ADMIN_GUIDE='https://docs.google.com/document/d/1hsdxofZDFUZ3ELmdMXxlEV_gDtHCEtBZn_nd0Dgd2KU/edit';
  const PRICEBOOK='https://docs.google.com/spreadsheets/d/1Er11CKeojfSKWfb9zYGTXSLDWocfYX7d-Gi5Sya2EDg/edit';
  const SALES_HUB='https://docs.google.com/document/d/1h_1V_ntX94vxsqmdlaI8fvad4JDR3wW6q0jA-H7IBL0/edit';
  const oldNewBuilder=newBuilder;

  function retailRequest(r){return String(r?.asset_option||'').toUpperCase()==='RETAIL_REPAIR'}
  function bandLabel(n){if(n<=150)return 'đến 150 trẻ';if(n<=300)return '151–300 trẻ';if(n<=500)return '301–500 trẻ';if(n<=800)return '501–800 trẻ';return 'trên 800 trẻ'}
  function pkgName(p){if(!p)return'';const model=String(p.model||'');const prefix=model==='SUNBOT_CUNG_CAP_THIET_BI'?'Gói phối hợp triển khai Sunbot':'Gói chương trình & đồng hành Sunbot';return `${prefix} · 12 tháng · Quy mô ${bandLabel(Number(p.max_students||0)<=150?150:Number(p.max_students||0))}`}
  function driveId(url){const s=String(url||'');const m=s.match(/\/d\/([A-Za-z0-9_-]+)/)||s.match(/[?&]id=([A-Za-z0-9_-]+)/);return m?m[1]:''}
  function downloadUrl(url){const id=driveId(url);return id?`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`:url}

  newBuilder=function(kind,req=null){const b=oldNewBuilder(kind,req);b.existing_sunbot=req?.existing_sunbot||b.existing_sunbot||'NO';return b};

  applyTemplate=function(b){
    const pkg=packageFor(Number(b.learner_count||0),b.asset_option);b.package_sku=pkg?.sku||'';b.payment_terms=pkg?.payment_default||b.payment_terms||'';b.lines=[];
    const assets=bandAssets(Number(b.learner_count||0));
    if(b.asset_option==='TRUONG_MUA_THIET_BI')Object.entries(assets).forEach(([id,q])=>addOrSetLine(b,id,q));
    if(b.teacher_status==='NEW_TRAIN')addOrSetLine(b,'TRAIN_1',1);
    if(b.teacher_status==='NEED_RETRAIN')addOrSetLine(b,'RETRAIN_1',1);
    // Nhận diện là hạng mục bắt buộc với triển khai mới; trường kế thừa được chọn tùy nhu cầu.
    if(String(b.existing_sunbot||'NO')!=='YES')addOrSetLine(b,'BRAND_DECOR_FORMEX',1);
    b.configuration_description=defaultNarrative(b);
  };

  packageCard=function(b){
    const p=packageFor(Number(b.learner_count||0),b.asset_option);if(!p)return `<div class="notice error">Quy mô hoặc phương án này cần CEO cấu hình riêng.</div>`;
    const a=bandAssets(Number(b.learner_count||0));
    const existing=String(b.existing_sunbot||'NO')==='YES';
    let assetText='Khai thác thiết bị hiện có của nhà trường; Admin rà soát số lượng thực tế trước khi chốt.';
    if(b.asset_option==='TRUONG_MUA_THIET_BI')assetText=`Tham khảo: ${a.ROBOT} robot · ${a.MAP} bản đồ · ${a.OBSTACLE} bộ vật cản · ${a.CARDS} bộ thẻ · ${a.BOX} hộp.`;
    if(b.asset_option==='SUNBOT_CUNG_CAP_THIET_BI')assetText=`Sunbot cung cấp để vận hành: tham khảo ${a.ROBOT} robot · ${a.MAP} bản đồ · ${a.OBSTACLE} bộ vật cản · ${a.CARDS} bộ thẻ · ${a.BOX} hộp; các thiết bị này không tách thành dòng bán cho trường.`;
    const brand=existing?'Bộ nhận diện: tùy chọn theo hiện trạng trường kế thừa.':'Bộ nhận diện Sunbot: bắt buộc trong cấu hình triển khai mới và đã được gợi ý vào các dòng báo giá.';
    const steam=b.asset_option==='SUNBOT_CUNG_CAP_THIET_BI'?'Bộ học cụ STEAM không nằm trong phí phối hợp; chỉ thêm khi trường mua riêng.':'Bộ học cụ STEAM là hạng mục mua riêng khi trường có nhu cầu.';
    return `<div class="template-card v13-template"><div><span class="eyebrow">CẤU HÌNH MẪU THEO QUY MÔ</span><h3>${esc(pkgName(p)||p.name)}</h3><p><b>Quy mô:</b> ${esc(bandLabel(Number(b.learner_count||0)))} · <b>Thời hạn:</b> 12 tháng</p><p>${esc(assetText)}</p><p>${esc(brand)}</p><p>${esc(steam)}</p></div><div class="template-price">${money(p.price_12m)}</div></div>`;
  };

  topbar=function(){return `<header class="topbar screen-only"><div class="topbar-inner"><div class="brand"><img src="${LOGO}" alt="Sunbot"><div><strong>SUNBOT</strong><small>Hệ thống báo giá & tài liệu thương mại</small></div></div><div class="spacer"></div><button class="resource-btn" id="resource-center">Tài liệu</button><div class="user-chip"><strong>${esc(state.user?.display_name||'')}</strong><br>${esc(state.user?.region||state.role)}</div><button class="logout" id="logout">Đăng xuất</button></div></header>`};

  const oldBindCommon=bindCommon;
  bindCommon=function(){oldBindCommon();document.getElementById('resource-center')?.addEventListener('click',()=>{
    const admin=state.role==='ADMIN';
    const cards=admin?[
      ['Cẩm nang Admin thương mại','Quy tắc cấu hình, giá, duyệt và phát hành',ADMIN_GUIDE],
      ['Backend giá & danh mục','Nguồn dữ liệu giá và catalog quản trị',PRICEBOOK],
      ['Cẩm nang Sale','Xem đúng nội dung Sale đang sử dụng',SALE_GUIDE],
      ['Sales Hub','Cổng công cụ và tài liệu vận hành',SALES_HUB]
    ]:[
      ['Cẩm nang Sale','Cách khảo sát, gửi yêu cầu và làm việc với báo giá',SALE_GUIDE],
      ['Sales Hub','Cổng công cụ và tài liệu dành cho Sale',SALES_HUB]
    ];
    modal('Trung tâm tài liệu',`<div class="doc-grid">${cards.map(([t,d,u])=>`<a class="doc-card" href="${u}" target="_blank" rel="noopener"><b>${esc(t)}</b><span>${esc(d)}</span><strong>Mở tài liệu →</strong></a>`).join('')}</div>`);
  })};

  requestForm=function(){
    const mode=state.request_mode||'SOLUTION';
    const tabs=`<div class="request-mode"><button type="button" class="${mode==='SOLUTION'?'active':''}" data-request-mode="SOLUTION">Triển khai / mở rộng</button><button type="button" class="${mode==='RETAIL_REPAIR'?'active':''}" data-request-mode="RETAIL_REPAIR">Bán lẻ / sửa chữa</button></div>`;
    if(mode==='RETAIL_REPAIR')return `<section class="card"><div class="section-head"><div><h1>Yêu cầu bán lẻ / sửa chữa</h1><p>Dành cho trường/khách hàng đã và đang triển khai. Không cần nhập quy mô trẻ hay thông tin triển khai chương trình.</p></div></div>${tabs}<form id="retail-request-form"><div class="grid two"><div class="field"><label>Tên trường / khách hàng *</label><input name="school_name" required></div><div class="field"><label>Người liên hệ</label><input name="decision_maker"></div><div class="field"><label>Loại nhu cầu</label><select name="retail_type"><option>Sửa chữa robot/thiết bị</option><option>Mua phụ kiện/linh kiện</option><option>Mua bổ sung robot/học cụ</option><option>Khác</option></select></div><div class="field"><label>Mức độ ưu tiên</label><select name="priority"><option>Bình thường</option><option>Cần sớm</option><option>Gấp - ảnh hưởng lớp học</option></select></div></div><div class="field wide"><label>Hạng mục / tình trạng / số lượng cần báo giá *</label><textarea name="need" required placeholder="Ví dụ: 02 robot không sạc; cần 01 pin; mua thêm 02 bản đồ…"></textarea></div><div class="field wide"><label>Ghi chú thêm</label><textarea name="notes"></textarea></div><div class="actions"><button class="btn primary" type="submit">Gửi Admin xử lý</button></div></form></section>`;
    return `<section class="card"><div class="section-head"><div><h1>Gửi yêu cầu báo giá triển khai</h1><p>Sale tập trung hiểu đúng nhu cầu; Admin chịu trách nhiệm cấu hình, giá và phát hành báo giá.</p></div></div>${tabs}<form id="request-form"><div class="grid two"><div class="field"><label>Tên trường / khách hàng *</label><input name="school_name" required></div><div class="field"><label>Loại trường</label><select name="school_type"><option>Tư thục</option><option>Công lập</option><option>Chuỗi/hệ thống</option><option>Khác</option></select></div><div class="field"><label>Số trẻ dự kiến triển khai *</label><input name="learner_count" type="number" min="1" required></div><div class="field"><label>Trường đã từng triển khai Sunbot?</label><select name="existing_sunbot"><option value="NO">Chưa</option><option value="YES">Đã từng triển khai</option><option value="UNKNOWN">Chưa xác minh</option></select></div><div class="field"><label>Phương án thiết bị</label><select name="asset_option"><option value="TRUONG_CO_THIET_BI">Trường đã có / tự đầu tư thiết bị</option><option value="TRUONG_MUA_THIET_BI">Trường muốn mua và sở hữu thiết bị</option><option value="SUNBOT_CUNG_CAP_THIET_BI">Sunbot cung cấp thiết bị, trường không đầu tư ban đầu</option><option value="CHUA_XAC_DINH">Chưa xác định</option></select></div><div class="field"><label>Tình trạng giáo viên</label><select name="teacher_status"><option value="TRAINED">Đã được đào tạo</option><option value="NEED_RETRAIN">Cần tái đào tạo</option><option value="NEW_TRAIN">Cần đào tạo mới</option><option value="UNKNOWN">Chưa xác minh</option></select></div><div class="field"><label>Thời điểm dự kiến bắt đầu</label><input name="expected_start" type="date"></div><div class="field"><label>Người quyết định/ảnh hưởng chính</label><input name="decision_maker"></div><div class="field"><label>Ngân sách/khung chi trả nếu biết</label><input name="budget_note"></div><div class="field"><label>Đề xuất của Sale</label><input name="sales_proposal" placeholder="Ví dụ: dùng thiết bị hiện có; cần tái đào tạo 2 giáo viên"></div></div><div class="field wide"><label>Ghi chú bối cảnh, nhu cầu, điều kiện đặc biệt</label><textarea name="notes"></textarea></div><div class="actions"><button class="btn primary" type="submit">Gửi Admin lập báo giá</button></div></form></section>`;
  };

  const oldBindRequestForm=bindRequestForm;
  bindRequestForm=function(){
    document.querySelectorAll('[data-request-mode]').forEach(btn=>btn.onclick=()=>{state.request_mode=btn.dataset.requestMode;render()});
    oldBindRequestForm();
    const f=document.getElementById('retail-request-form');if(!f)return;
    f.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f).entries());const payload={school_name:d.school_name,school_type:'Khách hàng hiện hữu',learner_count:1,existing_sunbot:'YES',asset_option:'RETAIL_REPAIR',teacher_status:'NOT_APPLICABLE',decision_maker:d.decision_maker||'',budget_note:'',expected_start:'',sales_proposal:`${d.retail_type}: ${d.need}`,notes:`Ưu tiên: ${d.priority}. ${d.notes||''}`};try{const r=await withBusy('Đang gửi yêu cầu bán lẻ / sửa chữa…',()=>bridge('quotationShared','submitQuoteRequest',payload));await refreshData(false);state.tab='requests';setNotice(`Đã gửi yêu cầu ${r.request_id}. Admin sẽ xử lý theo luồng bán lẻ / sửa chữa.`)}catch(er){setNotice(errText(er),'error')}};
  };

  requestList=function(){const rows=state.requests;return `<section class="card"><div class="section-head"><div><h1>${state.role==='ADMIN'?'Yêu cầu báo giá từ Sale':'Yêu cầu của tôi'}</h1><p>${rows.length} yêu cầu gần nhất</p></div></div>${!rows.length?`<div class="empty">Chưa có yêu cầu.</div>`:`<div class="tile-grid">${rows.map(r=>{const retail=retailRequest(r);return `<article class="request-tile ${retail?'retail-request':''}"><div class="request-head"><div><strong>${esc(r.school_name)}</strong><span>${esc(r.request_id)}</span></div>${statusBadge(r.status)}</div><div class="request-meta">${retail?`<span>Bán lẻ / sửa chữa</span>`:`<span>${Number(r.learner_count||0).toLocaleString('vi-VN')} trẻ</span><span>${esc(r.school_type||'')}</span><span>${esc(assetLabel(r.asset_option))}</span>${r.expected_start?`<span>Dự kiến ${dateText(r.expected_start)}</span>`:''}`}</div>${r.sales_proposal?`<p><b>${retail?'Nhu cầu':'Sale đề xuất'}:</b> ${esc(r.sales_proposal)}</p>`:''}<div class="actions">${state.role==='ADMIN'&&String(r.status)!=='QUOTED'?`<button class="btn primary small" data-build="${esc(r.request_id)}">${retail?'Lập báo giá bán lẻ / sửa chữa':'Lập báo giá'}</button>`:''}${r.quote_id?`<button class="btn outline small" data-open-quote="${esc(r.quote_id)}">Xem báo giá</button><button class="btn soft small" data-doc-links="${esc(r.quote_id)}">PDF & tài liệu</button>`:''}</div></article>`}).join('')}</div>`}</section>`};

  bindLists=function(){document.querySelectorAll('[data-build]').forEach(btn=>btn.onclick=()=>{const r=state.requests.find(x=>String(x.request_id)===String(btn.dataset.build));state.selectedRequest=r;state.builder=newBuilder(retailRequest(r)?'RETAIL_REPAIR':'SOLUTION',r);state.tab=retailRequest(r)?'retail':'quote-admin';render()});document.querySelectorAll('[data-open-quote]').forEach(btn=>btn.onclick=()=>openQuote(btn.dataset.openQuote));document.querySelectorAll('[data-doc-links]').forEach(btn=>btn.onclick=()=>openDocumentLinks(btn.dataset.docLinks));document.querySelectorAll('[data-regenerate]').forEach(btn=>btn.onclick=async()=>{try{await withBusy('Đang tạo lại bộ tài liệu Drive…',()=>bridge('quotationShared','regenerateCommercialDocuments',{quote_id:btn.dataset.regenerate}));setNotice('Đã tạo lại bộ tài liệu Drive.')}catch(er){setNotice(errText(er),'error')}})};

  function docButtons(links){
    const pdfs=[links.quote_pdf_url&&['Báo giá PDF','File chính thức để gửi khách',links.quote_pdf_url],links.narrative_pdf_url&&['Thuyết minh PDF','Thuyết minh giải pháp',links.narrative_pdf_url],links.proposal_pdf_url&&['Đề xuất giải pháp PDF','Thuyết minh + tóm tắt thương mại',links.proposal_pdf_url]].filter(Boolean);
    const docs=[links.quote_doc_url&&['Báo giá trên Drive',links.quote_doc_url],links.narrative_doc_url&&['Thuyết minh trên Drive',links.narrative_doc_url],links.proposal_doc_url&&['Đề xuất trên Drive',links.proposal_doc_url]].filter(Boolean);
    return `<div class="download-zone">${pdfs.map(([t,d,u])=>`<div class="download-card"><div><b>${esc(t)}</b><span>${esc(d)}</span></div><div><a class="btn primary small" href="${esc(downloadUrl(u))}" target="_blank" rel="noopener">Tải PDF</a><a class="btn outline small" href="${esc(u)}" target="_blank" rel="noopener">Xem trên Drive</a></div></div>`).join('')}${docs.length?`<details><summary>Bản nguồn Google Drive</summary><div class="doc-source-links">${docs.map(([t,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} →</a>`).join('')}</div></details>`:''}</div>`;
  }

  openDocumentLinks=async function(id){try{const links=await withBusy('Đang lấy PDF & tài liệu Google Drive…',()=>bridge('quotationShared','getCommercialDocumentLinks',{quote_id:id}));const has=links&&(links.quote_pdf_url||links.quote_doc_url||links.narrative_pdf_url||links.proposal_pdf_url);modal('PDF & tài liệu phát hành',has?docButtons(links):`<div class="empty">Chưa có tài liệu phát hành. ${state.role==='ADMIN'?'Nếu báo giá đã duyệt, hãy dùng nút “Tạo lại tài liệu” trong Kho báo giá.':'Vui lòng chờ Admin phát hành báo giá.'}</div>`)}catch(er){setNotice(errText(er),'error')}};

  openQuote=async function(id){try{const [bundle,links]=await withBusy('Đang mở báo giá…',()=>Promise.all([bridge('quotationShared','getQuoteFast',{quote_id:id}),bridge('quotationShared','getCommercialDocumentLinks',{quote_id:id}).catch(()=>({}))]));const q=bundle?.quote||{};const primary=links?.quote_pdf_url?`<a class="btn primary" href="${esc(downloadUrl(links.quote_pdf_url))}" target="_blank" rel="noopener">Tải PDF chính thức</a>`:'';modal(codeText(id),`<div class="quote-modal-actions">${primary}<button class="btn outline" data-doc-links="${esc(id)}">PDF & tài liệu Drive</button></div>${renderQuotePaper(q,bundle?.lines||[])}`);document.querySelector('.modal [data-doc-links]')?.addEventListener('click',()=>openDocumentLinks(id))}catch(er){setNotice(errText(er),'error')}};

  // Render again so the refinements are immediately applied to the current signed-in view.
  if(state?.token){try{render()}catch(e){console.warn('V13 render deferred',e)}}
})();