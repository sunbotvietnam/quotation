// Sunbot quotation refinement V23 — certification is independent from training headcount.
(function(){
  const oldApplyTemplateV23=applyTemplate;
  applyTemplate=function(b){
    oldApplyTemplateV23(b);
    if(!b||b.kind!=='SOLUTION')return;
    const assessed=Math.max(0,Math.floor(Number(b.assessment_teacher_count||0)));
    const programs=Number(b.program_count||1)===2?2:1;
    if(!assessed)return;
    const qty=assessed*programs;
    const line=(b.lines||[]).find(x=>String(x.item_id||'')==='CERT_1');
    if(line)line.qty=qty;
    else addOrSetLine(b,'CERT_1',qty);
  };
})();
