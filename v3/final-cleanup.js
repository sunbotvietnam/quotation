// Final sales-facing cleanup: save-before-print, official quote code, simple wording, and dirty-state handling.
(function(){
  let retailDirty=false;
  let applying=false;
  const DRAFT='BẢN NHÁP';

  const baseBridge=bridge;
  bridge=async function(mode,subaction,payload,token){
    const result=await baseBridge(mode,subaction,payload,token);
    if(mode==='quotationShared' && subaction==='saveSnapshot' && payload && payload.combo_code==='RETAIL_MATERIAL_REPAIR'){
      retailDirty=false;
      setTimeout(applyCleanups,0);
    }
    return result;
  };

  function setText(el,text){ if(el && el.textContent!==text) el.textContent=text; }
  function solutionSaved(){ return !!(state && state.lastQuote && (state.lastQuote.quote_code||state.lastQuote.quote_id)); }
  function solutionCode(){ return solutionSaved() ? (state.lastQuote.quote_code||state.lastQuote.quote_id) : DRAFT; }

  function markSolutionDirty(){
    if(state && state.lastQuote) state.lastQuote=null;
    setTimeout(applyCleanups,0);
  }

  document.addEventListener('input',function(e){
    if(e.target && e.target.closest && e.target.closest('.builder-controls')) markSolutionDirty();
    if(e.target && e.target.closest && e.target.closest('.retail-controls')){
      if(e.target.matches('#retailClient,#retailCreatedBy,[data-rqty],[data-rnote]')) retailDirty=true;
    }
  },true);
  document.addEventListener('change',function(e){
    if(e.target && e.target.closest && e.target.closest('.builder-controls')) markSolutionDirty();
    if(e.target && e.target.closest && e.target.closest('.retail-controls')){
      if(e.target.matches('#retailClient,#retailCreatedBy,[data-rqty],[data-rnote]')) retailDirty=true;
    }
  },true);
  document.addEventListener('click',function(e){
    const t=e.target;
    if(!t || !t.closest) return;
    if(t.closest('.retail-add') || t.closest('.retail-remove') || t.closest('#addCustom')) retailDirty=true;
    if(t.closest('[data-combo]') || t.closest('#custom') || t.closest('#backCombo')) markSolutionDirty();
  },true);

  function cleanupCommon(){
    document.querySelectorAll('.quote-company').forEach(el=>{
      setText(el,'CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM');
    });

    const topBrand=document.querySelector('.top .brand');
    if(topBrand){
      setText(topBrand.querySelector('h1'),'SUNBOT - CÔNG CỤ BÁO GIÁ');
      setText(topBrand.querySelector('small'),'Báo giá giải pháp · vật liệu · sửa chữa');
    }

    document.querySelectorAll('.top a').forEach(a=>{
      if(/Pricebook Master/i.test(a.textContent||'')) setText(a,'Bảng giá chi tiết');
    });

    const footer=document.querySelector('body > #app .footer');
    if(footer) setText(footer,'Sunbot · Giá hiển thị là giá khuyến nghị, chưa gồm VAT và chi phí phát sinh nếu không ghi khác.');
  }

  function cleanupSolution(){
    const content=document.getElementById('content');
    if(!content || !content.querySelector('.builder-shell')) return;

    const metaCode=content.querySelector('.quote-meta > div:first-child b');
    setText(metaCode,solutionCode());

    const printBtn=document.getElementById('print');
    if(printBtn){
      printBtn.disabled=!solutionSaved();
      printBtn.title=solutionSaved()?'In hoặc lưu báo giá thành PDF':'Hãy lưu báo giá trước khi in';
    }

    const builderHelp=content.querySelector('.builder-head .help');
    setText(builderHelp,'Hoàn thiện cấu hình, kiểm tra bản xem trước rồi lưu báo giá để cấp mã chính thức trước khi in.');

    const intro=content.querySelector('.quote-intro');
    if(intro) setText(intro,'Kiro Việt Nam trân trọng gửi Quý Nhà trường/Quý Đơn vị đề xuất cấu hình triển khai Sunbot theo nhu cầu và quy mô dự kiến. Báo giá áp dụng theo chính sách giá Sunbot hiện hành.');

    const footerSmall=content.querySelector('.quote-footer-note small');
    if(footerSmall) setText(footerSmall,state.createdBy?`Người lập báo giá: ${state.createdBy}`:'Kiro Việt Nam');

    const hint=content.querySelector('.file-name-hint');
    if(hint){
      const base=hint.innerHTML.split('<br>')[0];
      const suffix=solutionSaved()
        ? `<br><span class="save-status ok-inline">Đã lưu: <b>${esc(solutionCode())}</b></span>`
        : '<br><span class="save-status">Lưu báo giá để cấp mã chính thức và mở chức năng in.</span>';
      const next=base+suffix;
      if(hint.innerHTML!==next) hint.innerHTML=next;
    }

    const saveBtn=document.getElementById('saveQuoteSnapshot');
    if(saveBtn && solutionSaved()) saveBtn.textContent='Lưu phiên bản mới';
  }

  function cleanupRetail(){
    const content=document.getElementById('content');
    if(!content || !content.querySelector('.retail-shell')) return;

    const headHelp=content.querySelector('.retail-head .help');
    setText(headHelp,'Chọn học cụ, vật tư, linh kiện hoặc dịch vụ cần báo giá. Giá áp dụng theo bảng giá Sunbot hiện hành.');

    const customHelp=content.querySelector('.retail-custom .help');
    setText(customHelp,'Hạng mục ngoài danh mục chuẩn cần xác nhận đơn giá trước khi gửi khách hàng.');

    const intro=content.querySelector('.quote-intro');
    if(intro) setText(intro,'Kiro Việt Nam trân trọng gửi Quý Nhà trường/Quý Đơn vị báo giá các hạng mục học cụ, vật tư, linh kiện và dịch vụ Sunbot theo nhu cầu thực tế.');

    const conditionSpans=content.querySelectorAll('.quote-condition-grid > div span');
    if(conditionSpans[3]) setText(conditionSpans[3],'Chi phí sửa chữa được xác định theo linh kiện thay thế và công việc thực tế sau kiểm tra thiết bị.');

    const footerSmall=content.querySelector('.quote-footer-note small');
    if(footerSmall) setText(footerSmall,state.createdBy?`Người lập báo giá: ${state.createdBy}`:'Kiro Việt Nam');

    const metaCode=content.querySelector('.quote-meta > div:first-child b');
    const code=String(metaCode?.textContent||'').trim();
    const saved=!!code && code!==DRAFT && !retailDirty;
    if(retailDirty) setText(metaCode,DRAFT);

    const printBtn=document.getElementById('printRetail');
    if(printBtn){
      printBtn.disabled=!saved;
      printBtn.title=saved?'In hoặc lưu báo giá thành PDF':'Hãy lưu báo giá trước khi in';
    }

    const hint=content.querySelector('.file-name-hint');
    if(hint && !saved && !hint.textContent.includes('Lưu báo giá để cấp mã chính thức')){
      hint.insertAdjacentHTML('beforeend','<br><span class="save-status">Lưu báo giá để cấp mã chính thức và mở chức năng in.</span>');
    }
  }

  function removeTechnicalCopy(){
    const replacements=[
      ['Giá lấy trực tiếp từ backend.','Giá áp dụng theo bảng giá Sunbot hiện hành.'],
      ['Danh mục dưới đây được lấy từ Pricebook backend hiện hành.','Danh mục dưới đây áp dụng theo bảng giá Sunbot tại thời điểm lập báo giá.'],
      ['Báo giá dưới đây được lập từ Pricebook hiện hành của Sunbot.','Báo giá áp dụng theo chính sách giá Sunbot hiện hành.'],
      ['Google Sheet backend','bảng giá Sunbot'],
      ['Pricebook backend','bảng giá Sunbot'],
      ['Pricebook Master','bảng giá Sunbot'],
      ['Master 2026','bảng giá 2026']
    ];
    document.querySelectorAll('p,small,span,div').forEach(el=>{
      if(el.children.length) return;
      let text=el.textContent||'';
      let next=text;
      replacements.forEach(([a,b])=>{next=next.split(a).join(b);});
      if(next!==text) el.textContent=next;
    });
  }

  function applyCleanups(){
    if(applying) return;
    applying=true;
    try{
      cleanupCommon();
      cleanupSolution();
      cleanupRetail();
      removeTechnicalCopy();
    }finally{applying=false;}
  }

  const observer=new MutationObserver(()=>applyCleanups());
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:false});
  setTimeout(applyCleanups,0);
})();
