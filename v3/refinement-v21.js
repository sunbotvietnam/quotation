// Sunbot quotation refinement V21 — controlled outputs + supplied-asset guardrails.
(function(){
  const OUTPUT_ROOT='https://drive.google.com/drive/folders/1qT4qEGHWON2enzeZE6zvgHkciI7dP0XU';
  const ASSET_IDS=new Set(['ROBOT','MAP','OBSTACLE','CARDS','BOX']);
  const oldTopbarV21=topbar;
  const oldApplyTemplateV21=applyTemplate;
  const oldPackageCardV21=packageCard;
  const oldLineTableV21=lineTable;
  const oldBindListsV21=bindLists;

  function labsFor(n){n=Number(n||0);return n<=300?1:2}
  function isExisting(b){return String(b?.existing_sunbot||'NO')==='YES'}
  function isSupplied(b){return String(b?.asset_option||'')==='SUNBOT_CUNG_CAP_THIET_BI'}

  topbar=function(){
    let html=oldTopbarV21();
    if(state.role==='ADMIN'&&!html.includes('output-root-v21')){
      html=html.replace('<button class="resource-btn" id="resource-center">Tài liệu</button>',`<a class="resource-btn output-root-v21" href="${OUTPUT_ROOT}" target="_blank" rel="noopener">Kho hồ sơ</a><button class="resource-btn" id="resource-center">Tài liệu</button>`);
    }
    return html;
  };

  applyTemplate=function(b){
    oldApplyTemplateV21(b);
    const n=Number(b.learner_count||0),existing=isExisting(b),supplied=isSupplied(b);
    // Với mô hình Sunbot cung cấp thiết bị, thiết bị lõi là tài sản Sunbot bố trí để vận hành,
    // không tự tách thành dòng bán cho trường. STEAM vẫn là hạng mục bán riêng khi được chọn.
    if(supplied){
      b.lines=(b.lines||[]).filter(l=>!ASSET_IDS.has(String(l.item_id||''))&&String(l.item_id||'')!=='BRAND_DECOR_FORMEX');
    }
    // Trường mua và sở hữu thiết bị: cấu hình mẫu phải theo đúng band hiện hành.
    if(String(b.asset_option||'')==='TRUONG_MUA_THIET_BI'){
      const a=bandAssets(n);
      Object.entries(a).forEach(([id,q])=>addOrSetLine(b,id,q));
      if(!existing)addOrSetLine(b,'BRAND_DECOR_FORMEX',labsFor(n));
      else b.lines=(b.lines||[]).filter(l=>String(l.item_id||'')!=='BRAND_DECOR_FORMEX');
    }
    // Trường kế thừa: nhận diện chỉ là tùy chọn, không tự đưa vào báo giá.
    if(existing)b.lines=(b.lines||[]).filter(l=>String(l.item_id||'')!=='BRAND_DECOR_FORMEX');
  };

  packageCard=function(b){
    let html=oldPackageCardV21(b);
    if(isSupplied(b)){
      const a=bandAssets(Number(b.learner_count||0)),labs=labsFor(b.learner_count),existing=isExisting(b);
      const note=`<div class="notice soft v21-supplied-note"><b>Thiết bị trong gói không phải dòng bán riêng</b><br>Sunbot bố trí tham chiếu ${a.ROBOT} robot · ${a.MAP} bản đồ · ${a.OBSTACLE} bộ vật cản · ${a.CARDS} bộ thẻ · ${a.BOX} Android Box cho ${labs} điểm/phòng lab. ${existing?'Bộ nhận diện rà soát theo hiện trạng trường kế thừa.':`Triển khai mới tham chiếu ${labs} bộ nhận diện Sunbot.`} Bộ STEAM chỉ tính tiền khi Nhà trường chủ động mua riêng.</div>`;
      html=html.replace('</div><div class="template-price">',note+'</div><div class="template-price">');
    }
    return html;
  };

  lineTable=function(b){
    let html=oldLineTableV21(b);
    if(isSupplied(b)){
      const sold=(b.lines||[]).filter(l=>ASSET_IDS.has(String(l.item_id||''))||String(l.item_id||'')==='BRAND_DECOR_FORMEX');
      if(sold.length){
        html+=`<div class="notice warn"><b>Kiểm tra trước khi phát hành</b><br>Phương án đang chọn là “Sunbot cung cấp thiết bị”, nhưng báo giá đang có ${sold.length} dòng thiết bị/nhận diện tính tiền riêng. Chỉ giữ các dòng này nếu Nhà trường chủ động mua bổ sung và sở hữu riêng; nếu đây là cấu hình vận hành do Sunbot bố trí thì phải xóa khỏi bảng giá.</div>`;
      }
    }
    return html;
  };

  function docCard(label,url,kind){
    if(!url)return'';
    return `<a class="doc-card" href="${url}" target="_blank" rel="noopener"><b>${label}</b><span>${kind}</span><strong>Mở →</strong></a>`;
  }

  bindLists=function(){
    oldBindListsV21();
    document.querySelectorAll('[data-doc-links]').forEach(btn=>{
      btn.onclick=async()=>{
        const id=btn.dataset.docLinks;
        try{
          const r=await withBusy('Đang chuẩn bị bộ hồ sơ trên Drive…',()=>bridge('quotationShared','getCommercialDocumentLinks',{quote_id:id}));
          const folder=r?.output_folder_url||'';
          const cards=[
            folder?`<a class="doc-card output-folder-card" href="${folder}" target="_blank" rel="noopener"><b>THƯ MỤC HỒ SƠ ${esc(id)}</b><span>Nơi kiểm soát toàn bộ báo giá, thuyết minh, đề xuất của đúng phiên bản này</span><strong>Mở thư mục →</strong></a>`:'',
            docCard('Báo giá · Google Doc',r?.quote_doc_url,'Bản nguồn có thể xem/chỉnh theo quyền'),
            docCard('Báo giá · PDF',r?.quote_pdf_url,'Bản gửi khách / in'),
            docCard('Thuyết minh · Google Doc',r?.narrative_doc_url,'Chỉ có với triển khai/mở rộng'),
            docCard('Thuyết minh · PDF',r?.narrative_pdf_url,'Bản gửi khách / in'),
            docCard('Đề xuất · Google Doc',r?.proposal_doc_url,'Tài liệu giải pháp + thương mại'),
            docCard('Đề xuất · PDF',r?.proposal_pdf_url,'Bản gửi khách / in')
          ].filter(Boolean).join('');
          modal('Bộ hồ sơ đầu ra',`<div class="notice soft"><b>Nguồn kiểm soát:</b> Backend giữ snapshot; thư mục Drive giữ các tài liệu đã materialize cho đúng mã báo giá và phiên bản.</div><div class="doc-grid">${cards||'<div class="empty">Chưa có tài liệu đầu ra.</div>'}</div>`);
        }catch(e){setNotice(errText(e),'error')}
      };
    });
  };
})();