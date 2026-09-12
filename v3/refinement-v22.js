// Sunbot quotation refinement V22 — contracting unit, deployment sites, modules, 4/6/8 pricing.
(function(){
  const oldNewBuilderV22=newBuilder;
  const oldBuilderFormV22=builderForm;
  const oldSyncBuilderV22=syncBuilderFromForm;
  const oldBindBuilderV22=bindBuilder;
  const oldPublishBuilderV22=publishBuilder;
  const oldDefaultNarrativeV22=defaultNarrative;

  const SCHOOL_MONTHS=9;
  const RECOVERY_FACTOR=1.30;

  function n(v,d=0){const x=Number(v);return Number.isFinite(x)?x:d}
  function p(id){const i=catalogItem(id);return n(itemPrice(i),0)}
  function clampSessions(v){v=n(v,4);return [4,6,8].includes(v)?v:4}
  function programCount(b){return n(b.program_count,1)===2?2:1}
  function siteCount(b){return Math.max(1,Math.floor(n(b.deployment_sites,1)))}
  function modulesByScale(students){students=n(students,0);if(students<=300)return 1;if(students<=800)return 2;return 0}
  function requiredModules(b){const byScale=modulesByScale(b.learner_count);return byScale?Math.max(byScale,siteCount(b)):0}
  function packageSku(asset){return String(asset)==='SUNBOT_CUNG_CAP_THIET_BI'?'NS_FORMULA_PROVIDE':'NS_FORMULA_OWN'}
  function currentPackage(asset){const sku=packageSku(asset);return state.pricing.find(x=>String(x.sku)===sku)||{sku,name:'Khung báo giá Sunbot theo công thức hiện hành',model:String(asset)==='SUNBOT_CUNG_CAP_THIET_BI'?'SUNBOT_CUNG_CAP_THIET_BI':'TRUONG_CO_THIET_BI',price_12m:0,payment_default:'Theo báo giá',note:''}}

  packageFor=function(_students,asset){return currentPackage(asset)};

  function firstProgramFee(b){
    const students=n(b.learner_count,0),freq=clampSessions(b.sessions_per_month);
    if(students<1||students>800)return null;
    const base=p(`PROGRAM_BASE_${freq}`),mid=p(`PROGRAM_MID_${freq}`),high=p(`PROGRAM_HIGH_${freq}`);
    if(!(base>0&&mid>0&&high>0))return null;
    const midChildren=Math.max(0,Math.min(students,300)-150);
    const highChildren=Math.max(0,students-300);
    return base+midChildren*mid*SCHOOL_MONTHS+highChildren*high*SCHOOL_MONTHS;
  }
  function programFee(b){
    const first=firstProgramFee(b);if(first===null)return null;
    const raw=first*(programCount(b)===2?1.70:1);
    const discount=Math.max(0,Math.min(30,n(b.discount_pct,0)))/100;
    return Math.round(raw*(1-discount));
  }
  function programFeeBeforeDiscount(b){const first=firstProgramFee(b);return first===null?null:Math.round(first*(programCount(b)===2?1.70:1))}

  function trainingLines(b){
    const teachers=Math.max(0,Math.floor(n(b.teacher_count,0))),programs=programCount(b);
    if(!teachers||teachers>50)return;
    if(String(b.teacher_status)==='NEW_TRAIN'){
      addOrSetLine(b,programs===2?'TRAIN_2':'TRAIN_1',1);
      if(teachers>20)addOrSetLine(b,programs===2?'TRAIN2_EXTRA10':'TRAIN1_EXTRA10',Math.ceil((teachers-20)/10));
    }else if(String(b.teacher_status)==='NEED_RETRAIN'){
      addOrSetLine(b,programs===2?'RETRAIN_2':'RETRAIN_1',1);
      if(teachers>20)addOrSetLine(b,programs===2?'RETRAIN2_EXTRA10':'RETRAIN1_EXTRA10',Math.ceil((teachers-20)/10));
    }
    const assessed=Math.max(0,Math.floor(n(b.assessment_teacher_count,0)));
    if(assessed)addOrSetLine(b,'CERT_1',assessed*programs);
  }

  applyTemplate=function(b){
    const pkg=currentPackage(b.asset_option);
    b.package_sku=pkg.sku;
    b.payment_terms=b.payment_terms||pkg.payment_default||'Theo báo giá';
    b.lines=[];

    const fee=programFee(b);
    if(fee!==null)addOrSetLine(b,'PROGRAM_FEE_FORMULA',1,fee);

    const sites=siteCount(b);
    if(sites>1)addOrSetLine(b,'DEPLOYMENT_SITE_QA',sites-1);

    const modules=requiredModules(b);
    if(modules){
      if(String(b.asset_option)==='TRUONG_MUA_THIET_BI'){
        addOrSetLine(b,'EQUIPMENT_MODULE_STANDARD',modules);
      }else if(String(b.asset_option)==='SUNBOT_CUNG_CAP_THIET_BI'){
        const months=[24,36].includes(n(b.recovery_months,24))?n(b.recovery_months,24):24;
        const moduleValue=p('EQUIPMENT_MODULE_STANDARD');
        const annual=Math.round(modules*moduleValue*RECOVERY_FACTOR/months*12);
        addOrSetLine(b,'EQUIPMENT_CAPITAL_RECOVERY',1,annual);
      }
    }

    trainingLines(b);
    b.configuration_description=defaultNarrative(b);
  };

  newBuilder=function(kind,req=null){
    const b=oldNewBuilderV22(kind,req);
    if(kind==='SOLUTION'){
      b.contract_scope=b.contract_scope||'ONE_CONTRACTING_UNIT';
      b.deployment_sites=Math.max(1,n(b.deployment_sites,1));
      b.sessions_per_month=clampSessions(b.sessions_per_month||4);
      b.program_count=programCount(b);
      b.teacher_count=Math.max(0,n(b.teacher_count,0));
      b.assessment_teacher_count=Math.max(0,n(b.assessment_teacher_count,0));
      b.existing_module_count=Math.max(0,n(b.existing_module_count,0));
      b.recovery_months=[24,36].includes(n(b.recovery_months,24))?n(b.recovery_months,24):24;
      applyTemplate(b);
    }
    return b;
  };

  function fieldBlock(b){
    return `<div class="field"><label>Phạm vi đơn vị ký hợp đồng</label><select name="contract_scope"><option value="ONE_CONTRACTING_UNIT" ${b.contract_scope==='ONE_CONTRACTING_UNIT'?'selected':''}>Một đơn vị ký HĐ · có thể nhiều điểm triển khai</option><option value="MULTI_SCHOOL_OPERATOR" ${b.contract_scope==='MULTI_SCHOOL_OPERATOR'?'selected':''}>Đơn vị dịch vụ vận hành nhiều trường độc lập</option></select><small>Nhiều trường độc lập không tự động được coi là các điểm của cùng một trường.</small></div>
    <div class="field"><label>Số điểm triển khai</label><input name="deployment_sites" type="number" min="1" step="1" value="${siteCount(b)}"><small>Điểm đầu tiên nằm trong phí chương trình; từ điểm thứ hai tính phí QA theo điểm/năm.</small></div>
    <div class="field"><label>Tần suất chương trình</label><select name="sessions_per_month"><option value="4" ${clampSessions(b.sessions_per_month)===4?'selected':''}>4 tiết/tháng</option><option value="6" ${clampSessions(b.sessions_per_month)===6?'selected':''}>6 tiết/tháng</option><option value="8" ${clampSessions(b.sessions_per_month)===8?'selected':''}>8 tiết/tháng</option></select></div>
    <div class="field"><label>Số chương trình/phân môn</label><select name="program_count"><option value="1" ${programCount(b)===1?'selected':''}>1 chương trình</option><option value="2" ${programCount(b)===2?'selected':''}>2 chương trình · chương trình thứ hai 70%</option></select></div>
    <div class="field"><label>Tổng giáo viên cần đào tạo</label><input name="teacher_count" type="number" min="0" step="1" value="${Math.max(0,n(b.teacher_count,0))}"><small>Tính tổng toàn đơn vị, không nhân theo số điểm. Trên 50 giáo viên: phương án riêng.</small></div>
    <div class="field"><label>Số giáo viên sát hạch</label><input name="assessment_teacher_count" type="number" min="0" step="1" value="${Math.max(0,n(b.assessment_teacher_count,0))}"><small>500.000 đồng/người/chương trình; thu trực tiếp, không đưa vào vốn thiết bị.</small></div>
    ${String(b.asset_option)==='TRUONG_CO_THIET_BI'?`<div class="field"><label>Số mô-đun thiết bị trường hiện có</label><input name="existing_module_count" type="number" min="0" step="1" value="${Math.max(0,n(b.existing_module_count,0))}"><small>Dùng để kiểm tra đủ điều kiện; không tự phát sinh dòng bán thiết bị.</small></div>`:''}
    ${String(b.asset_option)==='SUNBOT_CUNG_CAP_THIET_BI'?`<div class="field"><label>Kỳ hạn thu hồi vốn thiết bị</label><select name="recovery_months"><option value="24" ${n(b.recovery_months,24)===24?'selected':''}>24 tháng</option><option value="36" ${n(b.recovery_months,24)===36?'selected':''}>36 tháng</option></select><small>Vốn thiết bị × 1,30; phí QA, đào tạo và sát hạch không đưa vào phần vốn.</small></div>`:''}`;
  }

  builderForm=function(kind){
    let html=oldBuilderFormV22(kind);
    if(kind!=='SOLUTION')return html;
    const b=state.builder;
    const marker='<div class="field"><label>Phương án thiết bị</label>';
    if(html.includes(marker))html=html.replace(marker,fieldBlock(b)+marker);
    return html;
  };

  syncBuilderFromForm=function(){
    oldSyncBuilderV22();
    const f=document.getElementById('builder-form'),b=state.builder;if(!f||!b)return;
    const fd=new FormData(f);
    if(fd.has('contract_scope'))b.contract_scope=String(fd.get('contract_scope')||'ONE_CONTRACTING_UNIT');
    if(fd.has('deployment_sites'))b.deployment_sites=Math.max(1,n(fd.get('deployment_sites'),1));
    if(fd.has('sessions_per_month'))b.sessions_per_month=clampSessions(fd.get('sessions_per_month'));
    if(fd.has('program_count'))b.program_count=n(fd.get('program_count'),1)===2?2:1;
    if(fd.has('teacher_count'))b.teacher_count=Math.max(0,n(fd.get('teacher_count'),0));
    if(fd.has('assessment_teacher_count'))b.assessment_teacher_count=Math.max(0,n(fd.get('assessment_teacher_count'),0));
    if(fd.has('existing_module_count'))b.existing_module_count=Math.max(0,n(fd.get('existing_module_count'),0));
    if(fd.has('recovery_months'))b.recovery_months=n(fd.get('recovery_months'),24)===36?36:24;
  };

  bindBuilder=function(kind){
    oldBindBuilderV22(kind);
    if(kind!=='SOLUTION')return;
    const f=document.getElementById('builder-form');if(!f)return;
    ['contract_scope','deployment_sites','sessions_per_month','program_count','teacher_count','assessment_teacher_count','existing_module_count','recovery_months','discount_pct'].forEach(name=>{
      const el=f.elements[name];if(!el)return;
      el.onchange=()=>{syncBuilderFromForm();applyTemplate(state.builder);render()};
    });
  };

  function policyWarnings(b){
    const notes=[],students=n(b.learner_count,0),teachers=n(b.teacher_count,0),mods=requiredModules(b),sites=siteCount(b);
    if(students>800)notes.push('<div class="notice warn"><b>Trên 800 trẻ</b><br>Không áp dụng công thức tự động. Cần cấu hình và phê duyệt riêng.</div>');
    if(teachers>50)notes.push('<div class="notice warn"><b>Trên 50 giáo viên</b><br>Đào tạo chuyển sang phương án riêng; app không tự tính block vượt ngưỡng.</div>');
    if(String(b.contract_scope)==='MULTI_SCHOOL_OPERATOR')notes.push('<div class="notice warn"><b>Nhiều trường độc lập</b><br>Không được coi là các điểm của cùng một trường. Cần báo giá riêng từng trường hoặc hợp đồng vận hành nhiều trường có CEO phê duyệt.</div>');
    if(String(b.asset_option)==='TRUONG_CO_THIET_BI'&&mods&&n(b.existing_module_count,0)<mods)notes.push(`<div class="notice warn"><b>Thiếu mô-đun thiết bị</b><br>Cần tối thiểu ${mods} mô-đun cho ${sites} điểm triển khai; hiện khai báo ${Math.floor(n(b.existing_module_count,0))}. Cần bổ sung hoặc xác minh lại trước khi phát hành.</div>`);
    return notes.join('');
  }

  packageCard=function(b){
    const fee=programFee(b),before=programFeeBeforeDiscount(b),sites=siteCount(b),mods=requiredModules(b),freq=clampSessions(b.sessions_per_month),extra=Math.max(0,sites-1)*p('DEPLOYMENT_SITE_QA');
    if(fee===null)return `<div class="notice error">Quy mô này cần CEO cấu hình riêng.</div>${policyWarnings(b)}`;
    const asset=String(b.asset_option);
    let assetText=`Yêu cầu tối thiểu <b>${mods} mô-đun</b>.`;
    if(asset==='TRUONG_MUA_THIET_BI')assetText+=` Giá trị cấu hình chuẩn ${money(mods*p('EQUIPMENT_MODULE_STANDARD'))}.`;
    if(asset==='SUNBOT_CUNG_CAP_THIET_BI'){
      const months=n(b.recovery_months,24)===36?36:24;
      const capital=mods*p('EQUIPMENT_MODULE_STANDARD'),total=Math.round(capital*RECOVERY_FACTOR),annual=Math.round(total/months*12);
      assetText+=` Vốn Sunbot ${money(capital)}; tổng thu hồi theo hệ số 1,30 là ${money(total)} trong ${months} tháng, tương đương ${money(annual)}/12 tháng.`;
    }
    const discount=n(b.discount_pct,0)>0?`<br><small>Phí chương trình trước giảm giá: ${money(before)} · sau giảm ${n(b.discount_pct,0)}%: ${money(fee)}</small>`:'';
    return `<div class="template-card"><div><span class="eyebrow">CẤU HÌNH THEO ĐƠN VỊ KÝ HỢP ĐỒNG</span><h3>${n(b.learner_count,0).toLocaleString('vi-VN')} trẻ · ${freq} tiết/tháng · ${programCount(b)} chương trình · ${sites} điểm</h3><p>Một phí chương trình cho toàn đơn vị ký hợp đồng. ${sites>1?`Phí QA ${sites-1} điểm bổ sung: ${money(extra)}/năm.`:'Điểm triển khai đầu tiên đã nằm trong phí chương trình.'}<br>${assetText}</p></div><div class="template-price">${money(fee)}<small>/năm học</small>${discount}</div></div>${policyWarnings(b)}`;
  };

  defaultNarrative=function(b){
    if(!b||b.kind!=='SOLUTION')return oldDefaultNarrativeV22(b);
    const sites=siteCount(b),mods=requiredModules(b),freq=clampSessions(b.sessions_per_month);
    return `## 1. Phạm vi triển khai\nSunbot được cấu hình cho ${Number(b.learner_count||0).toLocaleString('vi-VN')} trẻ, ${freq} tiết/tháng, ${programCount(b)} chương trình tại ${sites} điểm triển khai thuộc một đơn vị ký hợp đồng. Phí chương trình được tính trên tổng số trẻ cam kết của toàn đơn vị, không nhân lại theo số điểm.\n\n## 2. Thiết bị và điểm triển khai\nSố mô-đun tối thiểu là ${mods||'cấu hình riêng'}, xác định theo nguyên tắc lấy giá trị lớn hơn giữa nhu cầu theo quy mô trẻ và số điểm triển khai. Mỗi điểm có tối thiểu một mô-đun. Từ điểm thứ hai áp dụng phí bảo đảm chất lượng điểm triển khai theo năm.\n\n## 3. Đào tạo và sát hạch\nĐào tạo tính theo tổng số giáo viên của toàn đơn vị, không nhân theo số điểm. Sát hạch tính theo số giáo viên thực tế và số chương trình.\n\n## 4. Bảo đảm chất lượng\nToàn đơn vị có một đầu mối quản lý chương trình; mỗi điểm có người phụ trách tại chỗ. Sunbot làm việc thường xuyên qua đầu mối chung và thực hiện kiểm tra điều kiện, chất lượng theo phạm vi đã chốt cho từng điểm.`;
  };

  payloadFromBuilder=function(b){
    const meta=`[[SITES=${siteCount(b)}]][[SESSIONS=${clampSessions(b.sessions_per_month)}]][[PROGRAMS=${programCount(b)}]][[CONTRACT_SCOPE=${b.contract_scope||'ONE_CONTRACTING_UNIT'}]][[MODULES=${requiredModules(b)}]][[TEACHERS=${Math.max(0,n(b.teacher_count,0))}]][[ASSESS=${Math.max(0,n(b.assessment_teacher_count,0))}]][[RECOVERY_MONTHS=${n(b.recovery_months,24)}]]`;
    return{quote_kind:b.kind,request_id:b.request_id,customer_name:b.customer_name,client_type:b.client_type,learner_count:Number(b.learner_count||0),asset_option:b.asset_option,package_sku:b.kind==='SOLUTION'?b.package_sku:'',discount_pct:0,payment_terms:b.payment_terms,validity:b.validity,vat_note:b.vat_note,notes:`${b.notes||''}${meta}`,ceo_approval_note:b.ceo_approval_note,configuration_description:b.kind==='SOLUTION'?b.configuration_description:'',lines:b.lines.filter(x=>Number(x.qty||0)>0).map(x=>({item_id:x.item_id,qty:Number(x.qty),proposed_unit_price:Number(x.proposed_unit_price||0)}))};
  };

  quoteTotalPreview=function(b){return (b.lines||[]).reduce((s,l)=>s+Number(l.qty||0)*Number(l.proposed_unit_price||itemPrice(catalogItem(l.item_id))||0),0)};

  openPreview=function(b){
    const lines=(b.lines||[]).map(l=>{const i=catalogItem(l.item_id);return{name:i?.name||l.item_id,qty:Number(l.qty||0),unit:i?.unit||'',price:Number(l.proposed_unit_price||itemPrice(i)||0)}});
    const html=renderQuotePaper({quote_id:'BẢN XEM TRƯỚC',client_name:b.customer_name,created_by:state.user?.display_name,proposed_amount:quoteTotalPreview(b),status:'PREVIEW',notes:`[[PAYMENT=${b.payment_terms}]][[VAT=${b.vat_note}]][[VALIDITY=${b.validity}]]`,combo_code:b.kind==='RETAIL_REPAIR'?'RETAIL_REPAIR':'COMMERCIAL_2026'},lines);
    modal('Xem trước báo giá',html);
  };

  publishBuilder=async function(kind){
    syncBuilderFromForm();const b=state.builder;
    if(kind==='SOLUTION'){
      if(n(b.learner_count,0)>800)return setNotice('Trên 800 trẻ cần cấu hình riêng trước khi phát hành.','error');
      if(n(b.teacher_count,0)>50)return setNotice('Trên 50 giáo viên cần phương án đào tạo riêng trước khi phát hành.','error');
      if(String(b.contract_scope)==='MULTI_SCHOOL_OPERATOR'&&!String(b.ceo_approval_note||'').trim())return setNotice('Đơn vị vận hành nhiều trường độc lập cần ghi phê duyệt ngoại lệ CEO hoặc tách báo giá theo từng trường.','error');
      const mods=requiredModules(b);
      if(String(b.asset_option)==='TRUONG_CO_THIET_BI'&&mods&&n(b.existing_module_count,0)<mods)return setNotice(`Thiết bị hiện có chưa đủ tối thiểu ${mods} mô-đun. Hãy xác minh hoặc cấu hình bổ sung trước khi phát hành.`,'error');
    }
    return oldPublishBuilderV22(kind);
  };
})();
