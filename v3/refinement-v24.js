// Sunbot quotation refinement V24 — discount governance: standard discount applies only to program fee.
(function(){
  const oldBuilderFormV24=builderForm;
  const oldLineTableV24=lineTable;
  const oldPublishBuilderV24=publishBuilder;
  const oldApplyTemplateV24=applyTemplate;

  const PROTECTED_IDS=new Set([
    'DEPLOYMENT_SITE_QA',
    'EQUIPMENT_MODULE_STANDARD',
    'EQUIPMENT_CAPITAL_RECOVERY',
    'TRAIN_1','TRAIN_2','TRAIN1_EXTRA10','TRAIN2_EXTRA10',
    'RETRAIN_1','RETRAIN_2','RETRAIN1_EXTRA10','RETRAIN2_EXTRA10',
    'CERT_1','CERT_2'
  ]);

  function siteCountV24(b){return Math.max(1,Math.floor(Number(b?.deployment_sites||1)))}
  function modulesByScaleV24(students){students=Number(students||0);if(students<=300)return 1;if(students<=800)return 2;return 0}
  function requiredModulesV24(b){const base=modulesByScaleV24(b?.learner_count);return base?Math.max(base,siteCountV24(b)):0}

  function standardPriceForLine(line){
    const id=String(line?.item_id||'');
    const item=catalogItem(id);
    return Number(itemPrice(item)||0);
  }

  function expectedRecoveryPrice(b){
    const modules=requiredModulesV24(b);
    const months=Number(b?.recovery_months||24)===36?36:24;
    const moduleItem=catalogItem('EQUIPMENT_MODULE_STANDARD');
    const moduleValue=Number(itemPrice(moduleItem)||0);
    return Math.round(modules*moduleValue*1.30/months*12);
  }

  function protectedPriceChanged(b,line){
    const id=String(line?.item_id||'');
    if(!PROTECTED_IDS.has(id))return false;
    const current=Number(line?.proposed_unit_price||0);
    const expected=id==='EQUIPMENT_CAPITAL_RECOVERY'?expectedRecoveryPrice(b):standardPriceForLine(line);
    return Math.abs(current-expected)>0.5;
  }

  function protectedExceptions(b){return (b?.lines||[]).filter(l=>protectedPriceChanged(b,l))}

  builderForm=function(kind){
    let html=oldBuilderFormV24(kind);
    if(kind!=='SOLUTION')return html;
    html=html.replace('Giảm giá gói chính (%)','Giảm phí chương trình (%)');
    html=html.replace('Admin tự xử lý đến 7%; trên 7% cần ghi phê duyệt ngoại lệ CEO.','Chỉ áp dụng lên phí chương trình. QA điểm, thiết bị, thu hồi vốn, đào tạo và sát hạch giữ nguyên giá chuẩn; mọi ngoại lệ cần CEO phê duyệt.');
    return html;
  };

  lineTable=function(b){
    const html=oldLineTableV24(b);
    if(!b||b.kind!=='SOLUTION')return html;
    const exceptions=protectedExceptions(b);
    const note=`<div class="policy-note"><b>Quy tắc chiết khấu:</b> Ô giảm giá phía trên chỉ tác động lên <b>phí chương trình</b>. Các dòng QA điểm, mô-đun thiết bị, thu hồi vốn, đào tạo và sát hạch là giá chuẩn. Nếu sửa trực tiếp đơn giá các dòng này, bắt buộc ghi phê duyệt ngoại lệ CEO trước khi phát hành.${exceptions.length?`<br><b>Đang có ${exceptions.length} dòng ngoại lệ giá cần phê duyệt CEO.</b>`:''}</div>`;
    return html+note;
  };

  applyTemplate=function(b){
    oldApplyTemplateV24(b);
    // Program fee is the only line intentionally affected by discount_pct.
    // Every template recalculation restores protected lines to standard price.
    (b.lines||[]).forEach(l=>{
      const id=String(l.item_id||'');
      if(!PROTECTED_IDS.has(id))return;
      if(id==='EQUIPMENT_CAPITAL_RECOVERY'){
        l.proposed_unit_price=expectedRecoveryPrice(b);
      }else{
        const standard=standardPriceForLine(l);
        if(standard>0)l.proposed_unit_price=standard;
      }
    });
  };

  publishBuilder=async function(kind){
    if(kind==='SOLUTION'){
      syncBuilderFromForm();
      const b=state.builder;
      const exceptions=protectedExceptions(b);
      if(exceptions.length&&!String(b.ceo_approval_note||'').trim()){
        const labels=exceptions.map(l=>catalogItem(l.item_id)?.name||l.item_id).join(', ');
        return setNotice(`Có thay đổi giá ngoài phí chương trình (${labels}). Hãy nhập phê duyệt ngoại lệ CEO trước khi phát hành.`,'error');
      }
      if(Number(b.discount_pct||0)>7&&!String(b.ceo_approval_note||'').trim()){
        return setNotice('Giảm phí chương trình trên 7% cần ghi phê duyệt ngoại lệ CEO trước khi phát hành.','error');
      }
    }
    return oldPublishBuilderV24(kind);
  };
})();
