// Legacy School Quote Builder V2 — 2026-09-07.
// Separate commercial journey for existing Sunbot schools: preserve owned assets/rights,
// identify gaps, then quote only the restart, extension and missing lab components.
(function(){
  const n=v=>Number(v||0);
  const localName=(name)=>String(name||'').replace(/Flashcard\s*Level\s*(\d+)/gi,'Bộ thẻ học liệu – Cấp độ $1').replace(/Bản đồ giấy\s*Level\s*(\d+)/gi,'Bản đồ học liệu – Cấp độ $1').replace(/Level\s*(\d+)/gi,'Cấp độ $1');
  const price=id=>n(C.prices?.[id]?.price);
  const item=id=>C.prices?.[id]||null;
  const label=id=>localName(item(id)?.name||id);
  const ensureState=()=>{
    if(state.legacyV2)return state.legacyV2;
    state.legacyV2={
      client:state.client||'',
      score:{robot:0,tools:0,teacher:0,gap:0,digital:0},
      packageOverride:'',
      ownedLevels:[1,2,3],
      buyLevels:[],
      contentPrice:0,
      qty:{ROBOT:0,MAP:0,OBSTACLE:0,CARDS:0,BOX:0,STEAM_Y1:0,RETRAIN_1:0,RETRAIN_2:0,CERT_1:0,CERT_2:0},
      retail:{},
      notes:'',
      lastQuote:null
    };
    return state.legacyV2;
  };
  function suggestedGroup(s){const total=Object.values(s.score).reduce((a,b)=>a+n(b),0);return {score:total,group:total<=2?'A':total<=5?'B':'C'};}
  function packageId(s){return 'LEGACY_'+(s.packageOverride||suggestedGroup(s).group);}
  function vietnamesePackage(id){return id==='LEGACY_A'?'Gói tái khởi động cơ bản':id==='LEGACY_B'?'Gói khôi phục và chuẩn hóa':'Gói tái triển khai toàn diện';}
  function packageExplain(id){
    if(id==='LEGACY_A')return 'Kiểm tra hiện trạng, tái kích hoạt hệ thống/chương trình đang còn quyền sử dụng và hỗ trợ khởi động lại.';
    if(id==='LEGACY_B')return 'Bao gồm tái khởi động, rà soát thiết bị – học cụ, chuẩn hóa cách triển khai và hỗ trợ giai đoạn đầu.';
    return 'Tái triển khai gần như toàn diện nhưng bảo toàn quyền và tài sản lịch sử của nhà trường; chỉ mua bổ sung phần còn thiếu.';
  }
  function selectableCatalog(){
    const ids=['ROBOT','MAP','OBSTACLE','CARDS','BOX','STEAM_Y1','RETRAIN_1','RETRAIN_2','CERT_1','CERT_2'];
    return ids.filter(x=>item(x)&&price(x)>0);
  }
  function retailLevelItems(){
    return Object.keys(C.prices||{}).filter(id=>/^RETAIL_(FC|BD)[1-9]$/.test(id)&&price(id)>0).sort((a,b)=>a.localeCompare(b));
  }
  function buildLines(s){
    const lines=[];
    const pId=packageId(s), p=item(pId);
    if(p&&price(pId)>0)lines.push({item_id:pId,qty:1,proposed_unit_price:price(pId)});
    selectableCatalog().forEach(id=>{const q=n(s.qty[id]);if(q>0)lines.push({item_id:id,qty:q,proposed_unit_price:price(id)});});
    retailLevelItems().forEach(id=>{const q=n(s.retail[id]);if(q>0)lines.push({item_id:id,qty:q,proposed_unit_price:price(id)});});
    if(s.buyLevels.length){
      const name='Nội dung chương trình bổ sung – '+s.buyLevels.map(x=>'Cấp độ '+x).join(', ');
      lines.push({item_id:'LEGACY_CONTENT_'+s.buyLevels.join('_'),name,unit:'gói nội dung',qty:1,proposed_unit_price:n(s.contentPrice),legacy_custom:true});
    }
    return lines;
  }
  function total(lines){return lines.reduce((sum,l)=>sum+n(l.qty)*n(l.proposed_unit_price),0);}
  function narrative(s){
    const owned=s.ownedLevels.length?s.ownedLevels.map(x=>'Cấp độ '+x).join(', '):'chưa xác nhận';
    const buy=s.buyLevels.length?s.buyLevels.map(x=>'Cấp độ '+x).join(', '):'không có';
    const pid=packageId(s);
    return [
      '## 1. Nguyên tắc tái khởi động',
      'Phương án này dành cho nhà trường đã từng triển khai Sunbot. Kiro Việt Nam bảo toàn các quyền, thiết bị và học liệu nhà trường đã sở hữu theo hồ sơ/hợp đồng còn hiệu lực; báo giá chỉ tính phần tái khởi động, phần còn thiếu và phần mở rộng mới.',
      '## 2. Phần chương trình đã sở hữu',
      'Nhà trường xác nhận đã sở hữu: '+owned+'. Các nội dung này không được tính lại trong báo giá.',
      '## 3. Nội dung chương trình bổ sung',
      'Nội dung dự kiến mua bổ sung: '+buy+'.'+(s.buyLevels.length&&n(s.contentPrice)<=0?' Đơn giá của phần nội dung bổ sung đang chờ Admin xác nhận trước khi duyệt.':''),
      '## 4. Mức tái khởi động',
      vietnamesePackage(pid)+'. '+packageExplain(pid),
      '## 5. Thiết bị, học cụ và đào tạo bổ sung',
      'Các hạng mục bên dưới được chọn theo phần còn thiếu thực tế để nhà trường có thể khôi phục hoặc xây dựng lại phòng/lab hoàn chỉnh. Số lượng có thể điều chỉnh sau kiểm kê thực tế trước khi ký.',
      '## 6. Xác nhận trước khi triển khai',
      'Hai bên đối chiếu tài sản, phạm vi chương trình và số lượng cần bổ sung trước khi ký hợp đồng/đơn đặt hàng. Những gì nhà trường đã sở hữu hợp lệ không bị tính lại.'
    ].join('\n\n');
  }
  function lineRow(l,i){
    const pending=String(l.item_id).indexOf('LEGACY_CONTENT_')===0&&n(l.proposed_unit_price)<=0;
    const name=l.name||label(l.item_id);
    return `<tr><td>${i+1}</td><td><b>${esc(localName(name))}</b><small>${esc(item(l.item_id)?.unit||l.unit||'')}</small></td><td>${n(l.qty)}</td><td class="money">${pending?'<span class="badge">Admin xác nhận giá</span>':money(l.proposed_unit_price)}</td><td class="money">${pending?'—':money(n(l.qty)*n(l.proposed_unit_price))}</td></tr>`;
  }
  function renderLegacyV2(){
    const s=ensureState(), sg=suggestedGroup(s), pid=packageId(s), lines=buildLines(s), sum=total(lines);
    const levelBoxes=Array.from({length:9},(_,i)=>i+1).map(l=>`<label class="legacy-level"><input type="checkbox" data-owned-level="${l}" ${s.ownedLevels.includes(l)?'checked':''}> Cấp độ ${l}</label>`).join('');
    const buyBoxes=Array.from({length:9},(_,i)=>i+1).map(l=>`<label class="legacy-level ${s.ownedLevels.includes(l)?'owned':''}"><input type="checkbox" data-buy-level="${l}" ${s.buyLevels.includes(l)?'checked':''} ${s.ownedLevels.includes(l)?'disabled':''}> Cấp độ ${l}${s.ownedLevels.includes(l)?' · đã sở hữu':''}</label>`).join('');
    const coreItems=selectableCatalog().map(id=>`<div class="field"><label>${esc(label(id))}<small>${money(price(id))} / ${esc(item(id)?.unit||'')}</small></label><input type="number" min="0" data-legacy-qty="${id}" value="${n(s.qty[id])}"></div>`).join('');
    const levelItems=retailLevelItems().map(id=>`<div class="field compact"><label>${esc(label(id))}<small>${money(price(id))}</small></label><input type="number" min="0" data-retail-qty="${id}" value="${n(s.retail[id])}"></div>`).join('');
    const scoreFields=[['robot','Thiết bị/robot cần bổ sung'],['tools','Học cụ thiếu'],['teacher','Giáo viên cần đào tạo lại'],['gap','Thời gian gián đoạn'],['digital','Hệ thống số cần cập nhật']].map(([k,t])=>`<div class="field"><label>${t}<small>0 = tốt/không thiếu · 2 = thiếu nhiều</small></label><input data-legacy-score="${k}" type="range" min="0" max="2" value="${n(s.score[k])}"><b>${n(s.score[k])}</b></div>`).join('');
    document.getElementById('content').innerHTML=`
      <div class="legacy-v2-shell">
        <section class="panel legacy-intro"><div><span class="badge">KHÁCH HÀNG CŨ</span><h2>Báo giá tái khởi động Sunbot</h2><p class="help">Không bán lại những gì nhà trường đã sở hữu. Chỉ chọn phần cần khôi phục, mua bổ sung hoặc mở rộng để đưa chương trình vào vận hành lại.</p></div><div class="field"><label>Tên trường / đơn vị</label><input id="legacy-client" value="${esc(s.client)}" placeholder="Nhập tên trường"></div></section>
        <div class="two legacy-columns">
          <section class="panel"><h3>1. Đánh giá nhanh hiện trạng</h3>${scoreFields}<div class="legacy-recommend"><span>Gợi ý hệ thống</span><b>${esc(vietnamesePackage('LEGACY_'+sg.group))}</b><small>Điểm đánh giá: ${sg.score}</small></div><div class="field"><label>Mức tái khởi động áp dụng</label><select id="legacy-package"><option value="" ${!s.packageOverride?'selected':''}>Theo gợi ý hệ thống</option><option value="A" ${s.packageOverride==='A'?'selected':''}>Gói tái khởi động cơ bản</option><option value="B" ${s.packageOverride==='B'?'selected':''}>Gói khôi phục và chuẩn hóa</option><option value="C" ${s.packageOverride==='C'?'selected':''}>Gói tái triển khai toàn diện</option></select></div><p class="help">${esc(packageExplain(pid))}</p></section>
          <section class="panel"><h3>2. Chương trình đã sở hữu</h3><p class="help">Đánh dấu nội dung mà trường đã mua trước đây. Hệ thống sẽ khóa các cấp độ này khỏi phần mua bổ sung.</p><div class="legacy-level-grid">${levelBoxes}</div><h3 style="margin-top:18px">Nội dung cần mua thêm</h3><div class="legacy-level-grid">${buyBoxes}</div><div class="field" style="margin-top:12px"><label>Đơn giá gói nội dung bổ sung<small>Nếu chưa có giá chính thức, để 0; Admin sẽ nhập giá trước khi duyệt.</small></label><input id="legacy-content-price" type="number" min="0" value="${n(s.contentPrice)}"></div></section>
        </div>
        <section class="panel"><div class="builder-head"><div><h3>3. Xây lại cấu hình phòng/lab</h3><p class="help">Chỉ nhập số lượng cần mua bổ sung. Có thể chọn đủ robot, bản đồ, học cụ, thiết bị số, STEAM, tái đào tạo và chứng nhận.</p></div></div><div class="three legacy-catalog-grid">${coreItems}</div><details class="legacy-more"><summary>Học liệu theo từng cấp độ</summary><div class="three legacy-catalog-grid">${levelItems}</div></details></section>
        <section class="panel"><h3>4. Ghi chú nội bộ</h3><textarea id="legacy-notes" rows="3" placeholder="Ví dụ: kiểm kê thực tế trước khi ký; robot cũ cần kiểm tra kỹ thuật...">${esc(s.notes)}</textarea></section>
        <section class="panel legacy-summary"><div class="builder-head"><div><span class="badge">BẢN DỰ KIẾN</span><h2>${esc(s.client||'Chưa nhập tên trường')}</h2><p>${esc(vietnamesePackage(pid))}</p></div><div><small>Tổng tạm tính</small><div class="price">${money(sum)}</div></div></div><div class="table-wrap"><table class="table"><thead><tr><th>STT</th><th>Hạng mục</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${lines.map(lineRow).join('')}</tbody></table></div>${s.buyLevels.length&&n(s.contentPrice)<=0?'<div class="notice" style="margin-top:12px"><b>Chưa hoàn tất giá:</b> phần nội dung chương trình bổ sung đang chờ Admin xác nhận. Báo giá có thể gửi duyệt nhưng Admin chưa thể duyệt chính thức.</div>':''}<div class="toolbar" style="margin-top:14px"><button class="btn" id="legacy-save">Lưu & gửi duyệt</button>${s.lastQuote?.preview_pdf_url?`<a class="btn secondary" target="_blank" href="${esc(s.lastQuote.preview_pdf_url)}">Mở bản gửi duyệt</a>`:''}</div></section>
      </div>`;

    document.getElementById('legacy-client').oninput=e=>{s.client=e.target.value;state.client=s.client;};
    document.querySelectorAll('[data-legacy-score]').forEach(x=>x.oninput=()=>{s.score[x.dataset.legacyScore]=n(x.value);renderLegacyV2();});
    document.getElementById('legacy-package').onchange=e=>{s.packageOverride=e.target.value;renderLegacyV2();};
    document.querySelectorAll('[data-owned-level]').forEach(x=>x.onchange=()=>{const l=n(x.dataset.ownedLevel);s.ownedLevels=x.checked?[...new Set([...s.ownedLevels,l])]:s.ownedLevels.filter(v=>v!==l);s.buyLevels=s.buyLevels.filter(v=>!s.ownedLevels.includes(v));renderLegacyV2();});
    document.querySelectorAll('[data-buy-level]').forEach(x=>x.onchange=()=>{const l=n(x.dataset.buyLevel);s.buyLevels=x.checked?[...new Set([...s.buyLevels,l])].sort((a,b)=>a-b):s.buyLevels.filter(v=>v!==l);renderLegacyV2();});
    document.getElementById('legacy-content-price').onchange=e=>{s.contentPrice=n(e.target.value);renderLegacyV2();};
    document.querySelectorAll('[data-legacy-qty]').forEach(x=>x.onchange=()=>{s.qty[x.dataset.legacyQty]=n(x.value);renderLegacyV2();});
    document.querySelectorAll('[data-retail-qty]').forEach(x=>x.onchange=()=>{s.retail[x.dataset.retailQty]=n(x.value);renderLegacyV2();});
    document.getElementById('legacy-notes').oninput=e=>s.notes=e.target.value;
    document.getElementById('legacy-save').onclick=()=>saveLegacy(s);
  }
  async function saveLegacy(s){
    if(!String(s.client||'').trim())return alert('Hãy nhập tên trường / đơn vị.');
    const lines=buildLines(s);if(!lines.length)return alert('Báo giá chưa có hạng mục.');
    const btn=document.getElementById('legacy-save');btn.disabled=true;btn.textContent='Đang tạo bản gửi duyệt...';
    try{
      const r=await bridge('quotationShared','saveSnapshot',{
        quote_id:s.lastQuote?.quote_id||'',customer_name:String(s.client).trim(),client_type:'TRUONG_KE_THUA',combo_code:'LEGACY_REBUILD',quote_type:'LEGACY',
        lines,configuration_description:narrative(s),notes:String(s.notes||'').trim(),deployment_sites:1,learner_count:0,commercial_model:'LEGACY',recommended_model:'LEGACY',policy_match:true,
        customer_id:state.customerId||'',opportunity_id:state.opportunityId||''
      },state.token);
      s.lastQuote={...r,status:'NEEDS_APPROVAL'};
      if(r.artifact_warning)alert('Đã lưu báo giá nhưng bản xem nhanh chưa tạo được: '+r.artifact_warning); else alert('Đã lưu và gửi duyệt. Bản xem nhanh đã được lưu riêng để mở lại nhanh.');
      renderLegacyV2();
    }catch(err){alert(typeof friendlyError==='function'?friendlyError(err):(err?.message||err));}
    finally{const b=document.getElementById('legacy-save');if(b){b.disabled=false;b.textContent='Lưu & gửi duyệt';}}
  }
  renderLegacy=renderLegacyV2;
  const css=document.createElement('style');css.textContent=`
    .legacy-v2-shell{display:grid;gap:14px}.legacy-intro{display:grid;grid-template-columns:1.5fr 1fr;gap:18px;align-items:end}.legacy-level-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.legacy-level{display:flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:9px;padding:8px 9px;background:#fff;font-size:12px}.legacy-level.owned{opacity:.55;background:#f3f5f4}.legacy-recommend{display:grid;gap:3px;padding:10px 12px;border-radius:10px;background:#f0fdfa;border:1px solid #99f6e4;margin:10px 0}.legacy-recommend span,.legacy-recommend small{font-size:10px;color:var(--muted)}.legacy-catalog-grid .field label{display:grid;gap:2px}.legacy-catalog-grid .field label small{font-weight:500;color:var(--muted)}.legacy-more{margin-top:14px}.legacy-more summary{cursor:pointer;font-weight:800;color:#0f766e}.legacy-more[open] summary{margin-bottom:12px}.legacy-summary .table td small{display:block;color:var(--muted);font-size:10px}.legacy-summary .table th:first-child,.legacy-summary .table td:first-child{width:44px}@media(max-width:760px){.legacy-intro{grid-template-columns:1fr}.legacy-level-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;document.head.appendChild(css);
  window.SUNBOT_LEGACY_BUILDER_V2={version:'2026.09.07-v2',render:renderLegacyV2};
})();
