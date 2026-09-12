// Sunbot Quotation V26 — parity with Deal Calculator 12/09/2026.
// Solution quotes obey the same commercial structure; retail/repair remains untouched.
(function(){
  const MONTHS={9:9,10:8,11:7,12:6,1:5,2:4,3:3,4:2,5:1};
  const MODULE={ROBOT:4,MAP:2,OBSTACLE:2,CARDS:1,BOX:1,BRAND_DECOR_FORMEX:1};
  const EQUIPMENT_IDS=Object.keys(MODULE);
  const oldBuilderForm=builderForm,oldSync=syncBuilderFromForm,oldBind=bindBuilder,oldPayload=payloadFromBuilder,oldPublish=publishBuilder;
  function num(v,d=0){const x=Number(v);return Number.isFinite(x)?x:d}
  function price(id){const i=catalogItem(id);return num(itemPrice(i),0)}
  function months(b){return MONTHS[num(b?.start_month,9)]||num(b?.months_remaining,9)||9}
  function programs(b){return num(b?.program_count,1)===2?2:1}
  function sessions(b){const x=num(b?.sessions_per_month,4);return [4,6,8].includes(x)?x:4}
  function sites(b){return Math.max(1,Math.floor(num(b?.deployment_sites,1)))}
  function requiredModules(b){const c=num(b?.learner_count,0);if(c<1||c>800)return 0;return Math.max(c<=300?1:2,sites(b))}
  function trainingFee(t,p){t=Math.max(0,Math.round(num(t)));if(!t)return 0;if(t>50)return null;const blocks=Math.ceil(Math.max(t-20,0)/10);return p===2?19000000+blocks*7000000:11000000+blocks*4000000}
  function firstProgramFee(b){const c=num(b?.learner_count),m=months(b),s=sessions(b);if(c<1||c>800)return null;const base=price('PROGRAM_BASE_'+s),mid=price('PROGRAM_MID_'+s),high=price('PROGRAM_HIGH_'+s);if(!(base>0&&mid>0&&high>0))return null;return Math.round(base*m/9+Math.max(0,Math.min(c,300)-150)*mid*m+Math.max(0,c-300)*high*m)}
  function programFee(b){const first=firstProgramFee(b);if(first===null)return null;const before=first*(programs(b)===2?1.70:1),discount=Math.max(0,Math.min(30,num(b?.discount_pct)))/100;return {before:Math.round(before),after:Math.round(before*(1-discount))}}
  function baselineQty(b){const mods=requiredModules(b),o={};EQUIPMENT_IDS.forEach(id=>o[id]=mods*MODULE[id]);return o}
  function ensureEquipment(b){const base=baselineQty(b);b.equipment_qty=b.equipment_qty||{};EQUIPMENT_IDS.forEach(id=>{if(b.equipment_qty[id]===undefined)b.equipment_qty[id]=base[id]||0});return b.equipment_qty}
  function equipmentCapital(b){const q=ensureEquipment(b);return EQUIPMENT_IDS.reduce((sum,id)=>sum+Math.max(0,num(q[id]))*price(id),0)}
  function underBaseline(b){const base=baselineQty(b),q=ensureEquipment(b);return EQUIPMENT_IDS.filter(id=>num(q[id])<num(base[id]))}
  function calc(b){
    const c=num(b?.learner_count),m=months(b),p=programs(b),s=sessions(b),pt=sites(b),mods=requiredModules(b),pf=programFee(b),train=trainingFee(b?.teacher_count,p),assess=Math.max(0,Math.floor(num(b?.assessment_teacher_count)))*500000*p;
    let blocked='';if(String(b?.contract_scope)==='MULTI_SCHOOL_OPERATOR')blocked='Nhiều trường độc lập cần báo giá riêng hoặc hợp đồng nhiều trường do CEO duyệt.';else if(c>800)blocked='Quy mô trên 800 trẻ cần phương án riêng do CEO duyệt.';else if(train===null)blocked='Trên 50 giáo viên cần phương án đào tạo riêng.';else if(!mods)blocked='Chưa đủ dữ liệu quy mô để xác định cấu hình.';
    const site=Math.max(pt-1,0)*5000000*m/9,capital=equipmentCapital(b),term=num(b?.recovery_months,24)===36?36:24,recoveryMonthly=capital*1.3/term,recoveryCurrent=recoveryMonthly*m;
    return {c,m,p,s,pt,mods,pf,train,assess,site,capital,term,recoveryMonthly,recoveryCurrent,blocked,base:baselineQty(b),under:underBaseline(b)};
  }
  window.SunbotQuotationPolicyV26=calc;

  applyTemplate=function(b){
    if(!b||b.kind!=='SOLUTION')return;
    const x=calc(b);b.months_remaining=x.m;b.package_sku=String(b.asset_option)==='SUNBOT_CUNG_CAP_THIET_BI'?'NS_FORMULA_PROVIDE':'NS_FORMULA_OWN';b.lines=[];
    if(x.pf)addOrSetLine(b,'PROGRAM_FEE_FORMULA',1,x.pf.after);
    if(x.pt>1)addOrSetLine(b,'DEPLOYMENT_SITE_QA',(x.pt-1)*x.m/9);
    if(String(b.teacher_status)==='NEW_TRAIN'&&x.train){const t=Math.max(0,Math.floor(num(b.teacher_count)));addOrSetLine(b,x.p===2?'TRAIN_2':'TRAIN_1',1);if(t>20)addOrSetLine(b,x.p===2?'TRAIN2_EXTRA10':'TRAIN1_EXTRA10',Math.ceil((t-20)/10))}
    if(String(b.teacher_status)==='NEED_RETRAIN'&&x.train){const t=Math.max(0,Math.floor(num(b.teacher_count)));addOrSetLine(b,x.p===2?'RETRAIN_2':'RETRAIN_1',1);if(t>20)addOrSetLine(b,x.p===2?'RETRAIN2_EXTRA10':'RETRAIN1_EXTRA10',Math.ceil((t-20)/10))}
    const assessed=Math.max(0,Math.floor(num(b.assessment_teacher_count)));if(assessed)addOrSetLine(b,'CERT_1',assessed*x.p);
    if(String(b.asset_option)==='TRUONG_MUA_THIET_BI')EQUIPMENT_IDS.forEach(id=>{const q=Math.max(0,num(ensureEquipment(b)[id]));if(q)addOrSetLine(b,id,q)});
    if(String(b.asset_option)==='SUNBOT_CUNG_CAP_THIET_BI'&&x.capital>0)addOrSetLine(b,'EQUIPMENT_CAPITAL_RECOVERY',1,Math.round(x.recoveryCurrent));
    const spec=EQUIPMENT_IDS.map(id=>`${catalogItem(id)?.name||id}: ${Math.max(0,num(ensureEquipment(b)[id]))}`).join('; ');
    const baseText=`Cấu hình thiết bị: ${spec}. Vốn thiết bị thực tế: ${money(x.capital)}.`;
    if(!String(b.configuration_description||'').includes('Cấu hình thiết bị:'))b.configuration_description=(b.configuration_description?b.configuration_description+'\n\n':'')+baseText;
  };

  packageCard=function(b){if(!b||b.kind!=='SOLUTION')return '';const x=calc(b);if(x.blocked)return `<div class="notice error"><b>Không tự động phát hành:</b> ${esc(x.blocked)}</div>`;const under=x.under.length?`<div class="notice warn"><b>Cấu hình thấp hơn chuẩn ở ${x.under.length} hạng mục.</b> Chỉ được phát hành khi có lý do xác minh thiết bị hiện có/tương thích hoặc ngoại lệ được duyệt.</div>`:'';return `<div class="template-card"><div><span class="eyebrow">CÙNG LOGIC MÁY TÍNH PHƯƠNG ÁN</span><h3>${x.c.toLocaleString('vi-VN')} trẻ · ${x.s} tiết/tháng · ${x.p} chương trình · ${x.pt} điểm · ${x.m} tháng còn lại</h3><p>Phí chương trình: <b>${money(x.pf.after)}</b> · Phí đồng hành điểm bổ sung: <b>${money(x.site)}</b> · Chuẩn tối thiểu: <b>${x.mods} mô-đun</b>.<br>Giá trị cấu hình thiết bị thực tế theo các lượng bên dưới: <b>${money(x.capital)}</b>.${String(b.asset_option)==='SUNBOT_CUNG_CAP_THIET_BI'?` Thu hồi vốn năm học này: <b>${money(x.recoveryCurrent)}</b>; sau tháng 5 tiếp tục theo kỳ hạn ${x.term} tháng.`:''}</p></div><div class="template-price"><span>Phí chương trình</span><b>${money(x.pf.after)}</b></div></div>${under}`};

  function equipmentEditor(b){if(!b||b.kind!=='SOLUTION')return '';const x=calc(b),q=ensureEquipment(b);return `<section class="catalog-box equipment-policy"><div class="catalog-head"><div><h3>Cấu hình thiết bị theo chuẩn máy tính phương án</h3><p>Chuẩn ${x.mods} mô-đun. Admin được tăng/giảm số lượng theo hiện trạng, nhưng giảm dưới chuẩn phải ghi lý do.</p></div></div><div class="grid two">${EQUIPMENT_IDS.map(id=>`<div class="field"><label>${esc(catalogItem(id)?.name||id)} <small>· chuẩn ${x.base[id]||0}</small></label><input type="number" min="0" step="1" name="eq_${id}" value="${Math.max(0,num(q[id]))}"></div>`).join('')}</div><div class="field wide"><label>Lý do điều chỉnh cấu hình dưới chuẩn (nếu có)</label><textarea name="equipment_adjustment_reason" placeholder="Ví dụ: trường đã có Android Box tương thích; kiểm kê xác nhận còn đủ 2 robot...">${esc(b.equipment_adjustment_reason||'')}</textarea></div></section>`}
  builderForm=function(kind){let html=oldBuilderForm(kind);if(kind!=='SOLUTION')return html;const marker='<div class="catalog-box">';if(html.includes(marker))html=html.replace(marker,equipmentEditor(state.builder)+marker);return html};
  syncBuilderFromForm=function(){oldSync();const f=document.getElementById('builder-form'),b=state.builder;if(!f||!b||b.kind!=='SOLUTION')return;const fd=new FormData(f);b.equipment_qty=b.equipment_qty||{};EQUIPMENT_IDS.forEach(id=>{if(fd.has('eq_'+id))b.equipment_qty[id]=Math.max(0,num(fd.get('eq_'+id)))});if(fd.has('equipment_adjustment_reason'))b.equipment_adjustment_reason=String(fd.get('equipment_adjustment_reason')||'')};
  bindBuilder=function(kind){oldBind(kind);if(kind!=='SOLUTION')return;const f=document.getElementById('builder-form');if(!f)return;EQUIPMENT_IDS.forEach(id=>{const el=f.elements['eq_'+id];if(el)el.onchange=()=>{syncBuilderFromForm();applyTemplate(state.builder);render()}})};
  payloadFromBuilder=function(b){const p=oldPayload(b);if(!b||b.kind!=='SOLUTION')return p;const x=calc(b);p.deployment_sites=x.pt;p.program_count=x.p;p.sessions_per_month=x.s;p.start_month=num(b.start_month,9);p.months_remaining=x.m;p.training_teacher_count=Math.max(0,num(b.teacher_count));p.assessment_teacher_count=Math.max(0,num(b.assessment_teacher_count));p.recovery_months=x.term;p.equipment_capital_basis=Math.round(x.capital);p.equipment_configuration=JSON.stringify(ensureEquipment(b));p.equipment_adjustment_reason=String(b.equipment_adjustment_reason||'');return p};
  publishBuilder=async function(kind){if(kind!=='SOLUTION')return oldPublish(kind);syncBuilderFromForm();const b=state.builder,x=calc(b);if(x.blocked)return setNotice(x.blocked,'error');if(x.under.length&&!String(b.equipment_adjustment_reason||'').trim())return setNotice('Cấu hình thiết bị đang thấp hơn chuẩn máy tính phương án. Hãy ghi lý do kiểm kê/thiết bị tương thích hoặc phê duyệt ngoại lệ trước khi phát hành.','error');applyTemplate(b);return oldPublish(kind)};
})();
