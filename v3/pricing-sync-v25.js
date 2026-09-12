// Sunbot quotation pricing sync V25 — 2026-09-12
// Đồng bộ: tháng bắt đầu, phí chương trình/điểm triển khai theo số tháng còn lại, thu hồi vốn theo số tháng thực tế trong năm học.
(function(){
  const oldApplyTemplateV25=applyTemplate;
  const oldPackageCardV25=packageCard;
  function n(v,d=0){const x=Number(v);return Number.isFinite(x)?x:d}
  function months(b){const explicit=n(b?.months_remaining,0);if(explicit>=1&&explicit<=9)return explicit;return ({9:9,10:8,11:7,12:6,1:5,2:4,3:3,4:2,5:1})[n(b?.start_month,9)]||9}
  function price(id){const i=catalogItem(id);return n(itemPrice(i),0)}
  function programs(b){return n(b?.program_count,1)===2?2:1}
  function sessions(b){const s=n(b?.sessions_per_month,4);return [4,6,8].includes(s)?s:4}
  function firstProgramFeeCurrent(b){
    const children=n(b?.learner_count,0),m=months(b),freq=sessions(b);if(children<1||children>800)return null;
    const base=price(`PROGRAM_BASE_${freq}`),mid=price(`PROGRAM_MID_${freq}`),high=price(`PROGRAM_HIGH_${freq}`);if(!(base>0&&mid>0&&high>0))return null;
    const middle=Math.max(0,Math.min(children,300)-150),upper=Math.max(0,children-300);
    return Math.round(base*m/9 + middle*mid*m + upper*high*m);
  }
  function programFeeCurrent(b){const first=firstProgramFeeCurrent(b);if(first===null)return null;const before=first*(programs(b)===2?1.70:1);const discount=Math.max(0,Math.min(30,n(b?.discount_pct,0)))/100;return Math.round(before*(1-discount))}
  function findLine(b,id){return (b?.lines||[]).find(l=>String(l.item_id||'')===id)}
  applyTemplate=function(b){
    oldApplyTemplateV25(b);
    if(!b||b.kind!=='SOLUTION')return;
    b.months_remaining=months(b);
    const line=findLine(b,'PROGRAM_FEE_FORMULA'),fee=programFeeCurrent(b);if(line&&fee!==null)line.proposed_unit_price=fee;
    // V24 đã áp dụng đúng proration cho phí điểm triển khai và thu hồi vốn; đào tạo/sát hạch giữ nguyên.
  };
  packageCard=function(b){
    let html=oldPackageCardV25(b);if(!b||b.kind!=='SOLUTION')return html;
    const m=months(b),start=n(b.start_month,9);const note=`<div class="policy-note current-year-note"><b>Năm học hiện tại:</b> bắt đầu tháng ${start}, còn ${m} tháng chính khóa. Phí chương trình và phí đồng hành điểm triển khai được tính theo ${m}/9 tháng; đào tạo/sát hạch không prorate; thu hồi vốn thiết bị trong năm học tính ${m} tháng và phần dư tiếp tục sau tháng 5.</div>`;
    return html+note;
  };
})();
