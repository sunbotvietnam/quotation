// Materials / spare-parts quotation mode. Catalog is loaded only from Google Sheet backend.
(function(){
  const LOGO_URL='../assets/img/logo-sunbot.png';
  const retail={loaded:false,loading:false,items:[],category:'Tất cả',query:'',cart:[],saved:null};

  const baseRender=render;
  render=function(){
    baseRender();
    injectRetailTab();
  };

  const baseRenderContent=renderContent;
  renderContent=function(){
    if(state.tab==='retail') return renderRetail();
    return baseRenderContent();
  };

  function injectRetailTab(){
    const nav=document.querySelector('.nav');
    if(!nav||document.getElementById('retailTab'))return;
    const btn=document.createElement('button');
    btn.id='retailTab';
    btn.className='tab retail-tab '+(state.tab==='retail'?'active':'');
    btn.textContent='Vật liệu & sửa chữa lẻ';
    btn.onclick=()=>{state.tab='retail';renderContent();document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');};
    nav.appendChild(btn);
  }

  async function loadMaterials(){
    if(retail.loaded||retail.loading)return;
    retail.loading=true;
    try{
      const r=await bridge('quotationMaterials','',{},state.token);
      retail.items=(r&&Array.isArray(r.items)?r.items:[]).filter(x=>x.quote_selectable!==false);
      retail.loaded=true;
    }catch(e){
      retail.error=e&&e.message?e.message:'Không tải được danh mục vật liệu.';
    }finally{
      retail.loading=false;
      if(state.tab==='retail')renderRetail();
    }
  }

  function categories(){return ['Tất cả',...new Set(retail.items.map(x=>x.category).filter(Boolean))];}
  function filtered(){
    const q=retail.query.trim().toLowerCase();
    return retail.items.filter(x=>(retail.category==='Tất cả'||x.category===retail.category)&&(!q||x.name.toLowerCase().includes(q)||x.category.toLowerCase().includes(q)));
  }
  function cartTotal(){return retail.cart.reduce((s,x)=>s+(Number(x.price)||0)*(Number(x.qty)||0),0);}
  function addItem(item){
    const found=retail.cart.find(x=>x.item_id===item.item_id);
    if(found)found.qty+=1;
    else retail.cart.push({item_id:item.item_id,name:item.name,category:item.category,unit:item.unit,price:Number(item.recommended_price||item.list_price||0),qty:1,note:''});
    retail.saved=null;renderRetail();
  }
  function removeItem(id){retail.cart=retail.cart.filter(x=>x.item_id!==id);retail.saved=null;renderRetail();}
  function updateQty(id,v){const x=retail.cart.find(y=>y.item_id===id);if(x)x.qty=Math.max(1,Number(v)||1);retail.saved=null;renderRetail();}
  function updateNote(id,v){const x=retail.cart.find(y=>y.item_id===id);if(x)x.note=v;}
  function addCustom(){
    const name=String(document.getElementById('retailCustomName')?.value||'').trim();
    const unit=String(document.getElementById('retailCustomUnit')?.value||'Cái').trim()||'Cái';
    const price=Number(document.getElementById('retailCustomPrice')?.value||0);
    if(!name||!price||price<0)return alert('Hãy nhập tên hạng mục và đơn giá hợp lệ.');
    retail.cart.push({item_id:'CUSTOM-'+Date.now(),name,category:'Tùy chỉnh',unit,price,qty:1,note:'Hạng mục tùy chỉnh'});
    retail.saved=null;renderRetail();
  }
  function pad2(n){return String(n).padStart(2,'0');}
  function compactDate(){const d=new Date();return `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}`;}
  function displayDate(){const d=new Date();return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;}
  function slug(s){return String(s||'KHACH_HANG').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'').toUpperCase().slice(0,60)||'KHACH_HANG';}
  function fileBase(){return `SUNBOT_BAO_GIA_VAT_LIEU_SUA_CHUA_${slug(state.client)}_${compactDate()}`;}
  function quoteCode(){return retail.saved?.quote_code||'BẢN NHÁP';}

  function printRetail(){
    if(!retail.cart.length)return alert('Chưa có hạng mục trong báo giá.');
    const old=document.title;document.title=fileBase();
    const restore=()=>{document.title=old;window.removeEventListener('afterprint',restore);};
    window.addEventListener('afterprint',restore);window.print();setTimeout(()=>{if(document.title!==old)document.title=old;},120000);
  }

  async function saveRetail(){
    if(!String(state.client||'').trim())return alert('Hãy nhập tên khách hàng trước khi lưu.');
    if(!retail.cart.length)return alert('Chưa có hạng mục trong báo giá.');
    const btn=document.getElementById('saveRetail');if(btn){btn.disabled=true;btn.textContent='Đang lưu...';}
    try{
      const total=cartTotal();
      const r=await bridge('quotationShared','saveSnapshot',{
        customer_name:String(state.client).trim(),customer_id:state.customerId||'',opportunity_id:state.opportunityId||'',created_by:state.createdBy||'',combo_code:'RETAIL_MATERIAL_REPAIR',subtotal:total,final_amount:total,pricebook_version:C.version||'',notes:'Báo giá vật liệu, học cụ lẻ và linh kiện sửa chữa',
        lines:retail.cart.map(x=>({item_id:x.item_id,name:x.name,unit:x.unit,unit_price:x.price,qty:x.qty,line_total:x.price*x.qty}))
      },state.token);
      retail.saved=r;renderRetail();alert(`Đã lưu báo giá ${r.quote_code||r.quote_id}.`);
    }catch(e){alert(e&&e.message?e.message:'Không lưu được báo giá.');}
    finally{const b=document.getElementById('saveRetail');if(b){b.disabled=false;b.textContent='Lưu báo giá';}}
  }

  function renderRetail(){
    const el=document.getElementById('content');if(!el)return;
    if(!retail.loaded){
      el.innerHTML=`<section class="panel"><h2>Vật liệu & sửa chữa lẻ</h2><p class="help">Đang tải danh mục từ Google Sheet backend...</p>${retail.error?`<div class="notice danger">${esc(retail.error)}</div>`:''}</section>`;
      loadMaterials();return;
    }
    const list=filtered(), total=cartTotal(), client=state.client||'Quý Nhà trường / Quý Đơn vị';
    const rows=retail.cart.map((x,i)=>`<tr class="quote-row"><td class="q-stt">${i+1}</td><td class="q-name"><b>${esc(x.name)}</b><small><span class="retail-category-chip">${esc(x.category)}</span>${esc(x.unit)}</small></td><td class="q-num">${Number(x.qty).toLocaleString('vi-VN')}</td><td class="q-money">${money(x.price)}</td><td class="q-money q-line-total">${money(x.price*x.qty)}</td></tr>`).join('');
    el.innerHTML=`<div class="retail-shell">
      <section class="panel retail-controls no-print">
        <div class="retail-head"><div><span class="badge">BÁO GIÁ LẺ</span><h2>Vật liệu & sửa chữa</h2><p class="help">Học cụ lẻ, vật tư STEAM, linh kiện Robot và dịch vụ liên quan. Giá lấy trực tiếp từ backend.</p></div><button class="btn secondary" id="goBuilder">Báo giá giải pháp</button></div>
        <div class="field"><label>Khách hàng</label><input id="retailClient" value="${esc(state.client||'')}" placeholder="Tên trường / đơn vị"></div>
        <div class="field"><label>Người lập báo giá</label><input id="retailCreatedBy" value="${esc(state.createdBy||'')}" placeholder="VD: Thu, Dung, Nhung"></div>
        <div class="retail-toolbar"><div class="field"><label>Tìm hạng mục</label><input id="retailSearch" value="${esc(retail.query)}" placeholder="Tìm vật tư, linh kiện..."></div><div class="field"><label>Nhóm</label><select id="retailCategory">${categories().map(c=>`<option ${c===retail.category?'selected':''}>${esc(c)}</option>`).join('')}</select></div></div>
        <div class="retail-catalog">${list.map(x=>`<div class="retail-item"><div><h4>${esc(x.name)}</h4><small>${esc(x.category)} · ${esc(x.unit)}${x.note?` · ${esc(x.note.replace('Nguồn: quotation GitHub cũ;','').replace('Nguồn: quotation GitHub cũ',''))}`:''}</small></div><div><div class="retail-item-price">${money(x.recommended_price||x.list_price)}</div><button class="retail-add" data-add="${esc(x.item_id)}">+ Thêm</button></div></div>`).join('')||'<div class="retail-empty">Không có hạng mục phù hợp.</div>'}</div>
        <div class="retail-custom"><b>Hạng mục tùy chỉnh</b><p class="help">Dùng khi kỹ thuật đã kiểm tra và cần bổ sung một hạng mục chưa có trong danh mục backend.</p><div class="retail-custom-grid"><div class="field"><label>Tên hạng mục</label><input id="retailCustomName"></div><div class="field"><label>ĐVT</label><input id="retailCustomUnit" value="Cái"></div><div class="field"><label>Đơn giá</label><input id="retailCustomPrice" type="number" min="0"></div><button class="btn secondary" id="addCustom">Thêm</button></div></div>
        <div class="retail-cart"><h3>Hạng mục đã chọn</h3>${retail.cart.length?retail.cart.map(x=>`<div class="retail-cart-row"><div><b>${esc(x.name)}</b><small>${money(x.price)} / ${esc(x.unit)}</small></div><input data-rqty="${esc(x.item_id)}" type="number" min="1" value="${x.qty}"><input data-rnote="${esc(x.item_id)}" value="${esc(x.note||'')}" placeholder="Ghi chú"><button class="retail-remove" data-rm="${esc(x.item_id)}">×</button></div>`).join(''):'<div class="retail-empty">Chưa chọn hạng mục.</div>'}<div class="retail-cart-total"><span>Tổng</span><span>${money(total)}</span></div></div>
        <div class="toolbar builder-actions"><button class="btn secondary" id="saveRetail">Lưu báo giá</button><button class="btn" id="printRetail">In / Lưu PDF</button></div>
        <div class="file-name-hint">Tên file đề xuất: <b>${esc(fileBase())}.pdf</b>${retail.saved?`<br>Đã lưu: <b>${esc(retail.saved.quote_code||retail.saved.quote_id)}</b>`:''}</div>
      </section>

      <section class="quote-preview-wrap">
        <article id="quote-document" class="quote-document">
          <div class="quote-top-accent"></div>
          <header class="quote-header"><div class="quote-brand-block"><img class="quote-logo" src="${LOGO_URL}" alt="Sunbot"><div class="quote-brand-copy"><div class="quote-company">CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM</div><div class="quote-tagline">SUNBOT · PRESCHOOL ROBOTICS & CREATIVE TECHNOLOGY</div></div></div><div class="quote-meta"><div><span>Mã báo giá</span><b>${esc(quoteCode())}</b></div><div><span>Ngày</span><b>${displayDate()}</b></div></div></header>
          <section class="quote-title-block"><div class="quote-kicker">ĐỀ XUẤT THƯƠNG MẠI</div><h1>BÁO GIÁ VẬT LIỆU & SỬA CHỮA SUNBOT</h1><p>Học cụ lẻ · Vật tư STEAM · Linh kiện Robot</p></section>
          <section class="quote-recipient"><div><span>Kính gửi</span><strong>${esc(client)}</strong></div><div><span>Số hạng mục</span><strong>${retail.cart.length}</strong></div><div><span>Loại báo giá</span><strong>Vật liệu / sửa chữa lẻ</strong></div></section>
          <section class="quote-intro">Kiro Việt Nam trân trọng gửi Quý Nhà trường/Quý Đơn vị báo giá các hạng mục học cụ, vật tư và linh kiện Sunbot theo nhu cầu thực tế. Danh mục dưới đây được lấy từ Pricebook backend hiện hành.</section>
          <section class="quote-table-section"><table class="quote-table"><thead><tr><th class="q-stt">STT</th><th>Hạng mục</th><th class="q-num">SL</th><th class="q-money">Đơn giá</th><th class="q-money">Thành tiền</th></tr></thead><tbody>${rows||'<tr><td colspan="5" style="padding:28px;text-align:center;color:#84928f">Chưa có hạng mục.</td></tr>'}</tbody></table></section>
          <section class="quote-total-box"><div class="quote-total-label"><span>TỔNG GIÁ TRỊ ĐỀ XUẤT</span><small>Chưa bao gồm VAT và vận chuyển nếu có</small></div><div class="quote-total-value">${money(total)}</div></section>
          <section class="quote-conditions"><h3>Điều kiện & lưu ý</h3><div class="quote-condition-grid"><div><b>Hiệu lực báo giá</b><span>30 ngày kể từ ngày phát hành.</span></div><div><b>Chính sách sửa chữa</b><span>Thiết bị cần sửa chữa được kỹ thuật viên tiếp nhận, kiểm tra lỗi và dự kiến trả lại trong 07–10 ngày làm việc.</span></div><div><b>Thanh toán</b><span>Thanh toán 100% giá trị đơn hàng trước khi giao hàng hoặc theo thỏa thuận hợp đồng.</span></div><div><b>Phạm vi</b><span>Danh mục cũ không tách riêng phí công sửa chữa; phần sửa chữa trong báo giá này chủ yếu thể hiện linh kiện thay thế và hạng mục được chọn.</span></div></div></section>
          <footer class="quote-footer"><div class="quote-footer-note"><b>SUNBOT</b><span>Giải pháp công nghệ giáo dục mầm non của Kiro Việt Nam</span><small>Báo giá được tạo từ Sunbot Sales Pricebook · ${esc(state.createdBy||'Nội bộ Sunbot')}</small></div><div class="quote-sign"><span>ĐẠI DIỆN KIRO VIỆT NAM</span><div class="sign-space"></div><b>Người lập báo giá</b></div></footer>
          <div class="quote-bottom-accent"></div>
        </article>
      </section>
    </div>`;

    document.getElementById('goBuilder').onclick=()=>{state.tab='builder';render();};
    document.getElementById('retailClient').oninput=e=>{state.client=e.target.value;};
    document.getElementById('retailClient').onchange=()=>renderRetail();
    document.getElementById('retailCreatedBy').oninput=e=>{state.createdBy=e.target.value;sessionStorage.setItem('sunbot_pricebook_v3_created_by',state.createdBy);};
    document.getElementById('retailCreatedBy').onchange=()=>renderRetail();
    document.getElementById('retailSearch').oninput=e=>{retail.query=e.target.value;renderRetail();};
    document.getElementById('retailCategory').onchange=e=>{retail.category=e.target.value;renderRetail();};
    document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const x=retail.items.find(i=>i.item_id===b.dataset.add);if(x)addItem(x);});
    document.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>removeItem(b.dataset.rm));
    document.querySelectorAll('[data-rqty]').forEach(i=>i.onchange=()=>updateQty(i.dataset.rqty,i.value));
    document.querySelectorAll('[data-rnote]').forEach(i=>i.oninput=()=>updateNote(i.dataset.rnote,i.value));
    document.getElementById('addCustom').onclick=addCustom;
    document.getElementById('saveRetail').onclick=saveRetail;
    document.getElementById('printRetail').onclick=printRetail;
    injectRetailTab();
  }
})();
