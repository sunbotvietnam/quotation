// Sunbot quotation refinement V18 — shared-class training + full active catalog for Admin.
(function(){
  const oldBuilderFormV18=builderForm;
  const oldBindBuilderV18=bindBuilder;
  const oldLineTableV18=lineTable;

  function activeStandalone(item){
    const id=String(item?.item_id||item?.price_id||'').toUpperCase();
    const status=String(item?.status||'').toUpperCase();
    if(!id||status!=='ACTIVE'||item?.quote_selectable===false)return false;
    if(/^(RIGHT_|LEGACY_|SUPPORT_)/.test(id))return false;
    if(id==='SELF_DELIVERY_SCALE_FEE')return false;
    if(/^RETAIL_(FC|BD)[1-9]$/.test(id))return false;
    return true;
  }

  function fullCatalogMarkup(){
    const rows=(state.catalog||[]).filter(activeStandalone).sort((a,b)=>{
      const ca=String(a.category||''),cb=String(b.category||'');
      return ca.localeCompare(cb,'vi')||Number(a.sort_order||999)-Number(b.sort_order||999)||String(a.name||'').localeCompare(String(b.name||''),'vi');
    });
    const groups={};rows.forEach(i=>{const k=String(i.category||'Khác');(groups[k]||(groups[k]=[])).push(i)});
    return `<details class="full-catalog-v18"><summary>Danh mục giá đầy đủ <span>${rows.length} hạng mục hiện hành</span></summary><p>Hiển thị cả các hạng mục không nằm trong cấu hình khuyến nghị. Nếu Backend đã có giá thì Admin chọn trực tiếp, không cần gõ lại.</p>${Object.entries(groups).map(([cat,items])=>`<section class="catalog-group-v18"><h4>${esc(cat)}</h4><div class="catalog-grid-v18">${items.map(i=>`<button type="button" class="catalog-card-v18" data-v18-add="${esc(i.item_id||i.price_id)}"><span><b>${esc(i.name||i.item_id)}</b><small>${esc(i.unit||'')}</small></span><strong>${money(itemPrice(i))}</strong></button>`).join('')}</div></section>`).join('')}</details>`;
  }

  function sharedTrainingMarkup(){
    const ids=['TRAIN_1_SHARED','RETRAIN_1_SHARED','TRAIN_2_SHARED','RETRAIN_2_SHARED','CERT_1','CERT_2'];
    const items=ids.map(id=>catalogItem(id)).filter(Boolean);
    if(!items.length)return '';
    return `<section class="shared-training-v18"><div class="shared-head-v18"><div><span>LỰA CHỌN CHO ÍT GIÁO VIÊN</span><h3>Lớp ghép & sát hạch theo người</h3><p>Lớp ghép theo lịch Sunbot công bố hằng tháng. Khi tổng tiền gần hoặc vượt lớp riêng, app sẽ nhắc Admin cân nhắc phương án kinh tế hơn.</p></div></div><div class="shared-grid-v18">${items.map(i=>`<button type="button" data-v18-add="${esc(i.item_id)}"><span><b>${esc(i.name)}</b><small>${esc(i.description||'')}</small></span><strong>${money(itemPrice(i))}/${esc(i.unit||'')}</strong></button>`).join('')}</div></section>`;
  }

  builderForm=function(kind){
    let html=oldBuilderFormV18(kind);
    if(kind==='RETAIL_REPAIR')html=html.replace('<div class="catalog-box">',sharedTrainingMarkup()+fullCatalogMarkup()+'<div class="catalog-box">');
    return html;
  };

  function addCatalogLine(id){
    const i=catalogItem(id);if(!i)return;
    const existing=(state.builder?.lines||[]).find(x=>String(x.item_id)===String(id));
    if(existing)existing.qty=Number(existing.qty||0)+1;
    else state.builder.lines.push({item_id:id,qty:1,proposed_unit_price:Number(itemPrice(i)||0),display_role:'CORE'});
    render();
  }

  bindBuilder=function(kind){
    oldBindBuilderV18(kind);
    document.querySelectorAll('[data-v18-add]').forEach(btn=>btn.onclick=()=>addCatalogLine(btn.dataset.v18Add));
  };

  function trainingAdvice(b){
    const rules={
      TRAIN_1_SHARED:{threshold:10,privateId:'TRAIN_1',label:'đào tạo mới 1 phân môn'},
      TRAIN_2_SHARED:{threshold:10,privateId:'TRAIN_2',label:'đào tạo mới 2 phân môn'},
      RETRAIN_1_SHARED:{threshold:7,privateId:'RETRAIN_1',label:'tái đào tạo 1 phân môn'},
      RETRAIN_2_SHARED:{threshold:7,privateId:'RETRAIN_2',label:'tái đào tạo 2 phân môn'}
    };
    const notes=[];
    (b.lines||[]).forEach(l=>{
      const r=rules[String(l.item_id||'')];if(!r)return;
      const q=Number(l.qty||0);if(q<r.threshold)return;
      const shared=Number(l.proposed_unit_price||itemPrice(catalogItem(l.item_id))||0)*q;
      const pi=catalogItem(r.privateId),pv=Number(itemPrice(pi)||0);
      if(pv>0&&shared>=pv)notes.push(`<div class="economy-tip-v18"><b>Nên cân nhắc lớp riêng</b><span>${esc(r.label)}: ${q} người theo lớp ghép = ${money(shared)}, trong khi lớp riêng hiện là ${money(pv)}. Lớp riêng kinh tế hơn hoặc tương đương và chủ động lịch hơn.</span></div>`);
    });
    return notes.join('');
  }

  lineTable=function(b){return oldLineTableV18(b)+trainingAdvice(b)};
})();
