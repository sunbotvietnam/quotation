// Sunbot quotation pricing sync V25 — 2026-09-12
// Đồng bộ: tháng bắt đầu, phí chương trình/điểm triển khai theo số tháng còn lại, thu hồi vốn theo số tháng thực tế trong năm học.
(function(){
  const oldApplyTemplateV25=applyTemplate;
  function n(v,d=0){const x=Number(v);return Number.isFinite(x)?x:d}
  function months(b){const explicit=n(b?.months_remaining,0);if(explicit>=1&&explicit<=9)return explicit;return ({9:9,10:8,11:7,12:6,1:5,2:4,3:3,4:2,5:1})[n(b?.start_month,9)]||9}
  function price(id){const i=catalogItem(id);return n(itemPrice(i),0)}
  function programs(b){return n(b?.program_count,1)===2?2:1}
  function sessions(b){const s=n(b?.sessions_per_month,4);return [4,6,8].includes(s)?s:4}
  function sites(b){return Math.max(1,Math.floor(n(b?.deployment_sites,1)))}
  function modules(b){const children=n(b?.learner_count,0),base=children<=300?1:children<=800?2:0;return base?Math.max(base,sites(b)):0}
  function firstProgramFeeCurrent(b){
    const children=n(b?.learner_count,0),m=months(b),freq=sessions(b);if(children<1||children>800)return null;
    const base=price(`PROGRAM_BASE_${freq}`),mid=price(`PROGRAM_MID_${freq}`),high=price(`PROGRAM_HIGH_${freq}`);if(!(base>0&&mid>0&&high>0))return null;
    const middle=Math.max(0,Math.min(children,300)-150),upper=Math.max(0,children-300);
    return Math.round(base*m/9 + middle*mid*m + upper*high*m);
  }
  function programBeforeDiscount(b){const first=firstProgramFeeCurrent(b);return first===null?null:Math.round(first*(programs(b)===2?1.70:1))}
  function programFeeCurrent(b){const before=programBeforeDiscount(b);if(before===null)return null;const discount=Math.max(0,Math.min(30,n(b?.discount_pct,0)))/100;return Math.round(before*(1-discount))}
  function findLine(b,id){return (b?.lines||[]).find(l=>String(l.item_id||'')===id)}
  applyTemplate=function(b){
    oldApplyTemplateV25(b);
    if(!b||b.kind!=='SOLUTION')return;
    const m=months(b);b.months_remaining=m;
    const programLine=findLine(b,'PROGRAM_FEE_FORMULA'),fee=programFeeCurrent(b);if(programLine&&fee!==null){programLine.qty=1;programLine.proposed_unit_price=fee;}
    // Giữ đơn giá chuẩn, prorate bằng lượng kỳ để backend không hiểu nhầm thành chiết khấu.
    const siteLine=findLine(b,'DEPLOYMENT_SITE_QA');if(siteLine)siteLine.qty=Math.max(0,sites(b)-1)*m/9;
    const recoveryLine=findLine(b,'EQUIPMENT_CAPITAL_RECOVERY');if(recoveryLine)recoveryLine.qty=m/12;
  };
  packageCard=function(b){
    if(!b||b.kind!=='SOLUTION')return '';
    const children=n(b.learner_count,0),m=months(b),start=n(b.start_month,9),freq=sessions(b),ps=programs(b),siteN=sites(b),mod=modules(b),fee=programFeeCurrent(b),before=programBeforeDiscount(b);
    if(fee===null||!mod)return `<div class="notice error">Quy mô này cần Admin/CEO cấu hình riêng.</div>`;
    const extraSite=Math.round(Math.max(0,siteN-1)*price('DEPLOYMENT_SITE_QA')*m/9),asset=String(b.asset_option||''),moduleValue=price('EQUIPMENT_MODULE_STANDARD');
    let assetText=`Cần tối thiểu <b>${mod} mô-đun</b>.`;
    if(asset==='TRUONG_MUA_THIET_BI')assetText+=` Giá trị cấu hình thiết bị chuẩn: <b>${money(mod*moduleValue)}</b>.`;
    if(asset==='SUNBOT_CUNG_CAP_THIET_BI'){const term=n(b.recovery_months,24)===36?36:24,capital=mod*moduleValue,total=Math.round(capital*1.30),current=Math.round(total/term*m);assetText+=` Vốn thiết bị Sunbot: <b>${money(capital)}</b>; thu hồi theo hệ số 1,30 trong ${term} tháng; phần trong năm học này (${m} tháng): <b>${money(current)}</b>. Phần còn lại tiếp tục sau tháng 5.`;}
    const discount=n(b.discount_pct,0)>0?`<small>Phí chương trình trước giảm: ${money(before)} · sau giảm ${n(b.discount_pct,0)}%: ${money(fee)}</small>`:'';
    return `<div class="template-card"><div><span class="eyebrow">PHƯƠNG ÁN NĂM HỌC HIỆN TẠI</span><h3>${children.toLocaleString('vi-VN')} trẻ · ${freq} tiết/tháng · ${ps} chương trình · ${siteN} điểm · bắt đầu tháng ${start}</h3><p>Phí chương trình theo ${m}/9 tháng: <b>${money(fee)}</b>. ${siteN>1?`Phí đồng hành ${siteN-1} điểm bổ sung trong năm học này: <b>${money(extraSite)}</b>.`:'Điểm triển khai đầu tiên nằm trong phạm vi chương trình.'}<br>${assetText}</p>${discount}</div><div class="template-price"><span>${m} tháng còn lại</span><b>${money(fee)}</b></div></div>`;
  };
  // Chạy trước listener của builder để mọi lần đổi tháng đều cập nhật dòng tiền trước khi UI render lại.
  document.addEventListener('change',function(e){const el=e.target;if(!el||el.name!=='start_month'||!document.getElementById('builder-form')||!state.builder)return;syncBuilderFromForm();state.builder.months_remaining=({9:9,10:8,11:7,12:6,1:5,2:4,3:3,4:2,5:1})[Number(el.value||9)]||9;applyTemplate(state.builder);},true);
})();
