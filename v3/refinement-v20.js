// Sunbot quotation refinement V20 — multi-lab configuration for large schools.
(function(){
  const oldBandAssetsV20=bandAssets;
  const oldApplyTemplateV20=applyTemplate;
  const oldPackageCardV20=packageCard;

  function labCount(n){
    n=Number(n||0);
    if(n<=300)return 1;
    if(n<=800)return 2;
    return 2;
  }

  bandAssets=function(n){
    n=Number(n||0);
    if(n<=150)return{ROBOT:4,MAP:3,OBSTACLE:2,CARDS:1,BOX:1};
    if(n<=300)return{ROBOT:6,MAP:4,OBSTACLE:3,CARDS:1,BOX:1};
    if(n<=500)return{ROBOT:8,MAP:6,OBSTACLE:4,CARDS:2,BOX:2};
    return{ROBOT:10,MAP:8,OBSTACLE:5,CARDS:2,BOX:2};
  };

  applyTemplate=function(b){
    oldApplyTemplateV20(b);
    const n=Number(b.learner_count||0);
    const existing=String(b.existing_sunbot||'NO')==='YES';
    if(!existing){
      const q=labCount(n);
      const line=(b.lines||[]).find(x=>String(x.item_id)==='BRAND_DECOR_FORMEX');
      if(line)line.qty=q;
      else addOrSetLine(b,'BRAND_DECOR_FORMEX',q);
    }
  };

  packageCard=function(b){
    let html=oldPackageCardV20(b);
    const n=Number(b.learner_count||0);
    const labs=labCount(n);
    const existing=String(b.existing_sunbot||'NO')==='YES';
    if(n>=301&&n<=800){
      const note=`<div class="notice soft" style="margin-top:12px"><b>Khuyến nghị tổ chức ${labs} điểm/phòng lab</b><br>Quy mô ${n.toLocaleString('vi-VN')} trẻ không nên dồn vào một phòng duy nhất. Cấu hình tham chiếu được phân bổ cho ${labs} điểm/phòng: ${bandAssets(n).ROBOT} robot, ${bandAssets(n).BOX} Android Box${existing?'; bộ nhận diện rà soát theo hiện trạng.':`, ${labs} bộ nhận diện Sunbot.`}</div>`;
      html=html.replace('</div><div class="template-price">',note+'</div><div class="template-price">');
    }
    return html;
  };
})();
