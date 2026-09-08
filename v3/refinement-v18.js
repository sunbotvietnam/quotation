// Sunbot quotation refinement V18 — quick access to active professional-service items.
(function(){
  const oldBuilderFormV18=builderForm;
  builderForm=function(kind){
    let html=oldBuilderFormV18(kind);
    if(kind!=='RETAIL_REPAIR')return html;
    const ids=['TRAIN_1','RETRAIN_1','CERT_1','CERT_2'];
    const items=ids.map(id=>catalogItem(id)).filter(Boolean);
    if(!items.length)return html;
    const cards=items.map(i=>`<button type="button" class="quick-service-card" data-add-item="${esc(i.item_id||i.price_id)}"><span><b>${esc(i.name)}</b><small>${esc(i.unit||'')} · ${esc(i.description||'')}</small></span><strong>${money(itemPrice(i))}</strong></button>`).join('');
    const box=`<section class="quick-services"><div class="quick-services-head"><div><span>HẠNG MỤC CHUYÊN MÔN THƯỜNG DÙNG</span><h3>Đào tạo · tái đào tạo · sát hạch</h3></div><small>Chọn nhanh hoặc tiếp tục tìm trong toàn bộ danh mục phía dưới.</small></div><div class="quick-service-grid">${cards}</div></section>`;
    return html.replace('<div class="catalog-box">',box+'<div class="catalog-box">');
  };
})();