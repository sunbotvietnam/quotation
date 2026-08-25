// Shared-password access + CRM-ready quotation snapshot layer for V3.
(function(){
  const SHARED_KEY='sunbot_pricebook_v3_shared_session';
  const CREATOR_KEY='sunbot_pricebook_v3_created_by';
  const MASTER_URL='https://docs.google.com/spreadsheets/d/14wk6li0oRK3ho1fAPkPPG1vPYlTFoMccRmn3sHpeAxc/edit';
  const BACKEND_URL='https://docs.google.com/spreadsheets/d/1Er11CKeojfSKWfb9zYGTXSLDWocfYX7d-Gi5Sya2EDg/edit';

  const params=new URLSearchParams(location.search);
  state.customerId=params.get('customer_id')||state.customerId||'';
  state.opportunityId=params.get('opportunity_id')||state.opportunityId||'';
  state.createdBy=sessionStorage.getItem(CREATOR_KEY)||state.createdBy||'';
  const incomingName=params.get('customer_name')||params.get('school_name')||'';
  if(incomingName && !state.client) state.client=incomingName;

  function applyBackendCatalog(catalog){
    const rows=catalog&&Array.isArray(catalog.items)?catalog.items:[];
    if(!rows.length) throw new Error('Backend chưa trả về danh mục giá hiện hành.');
    rows.forEach(x=>{
      const code=String(x.price_id||'').trim();
      if(!code)return;
      const price=Number(x.payment_price||x.price_before_tax||0);
      if(!Number.isFinite(price))return;
      C.prices[code]={name:String(x.name||code),unit:String(x.unit||''),price,item_type:String(x.item_type||''),scope:String(x.scope||''),approved:!!x.approved,standalone:String(x.standalone||'')};
    });
    C.version='2026.08.25-backend-live';
    C.masterUrl=MASTER_URL;
    C.backendUrl=BACKEND_URL;
    C.backendLoadedAt=new Date().toISOString();
  }

  async function loadSharedBackend(token){
    const boot=await bridge('quotationShared','bootstrap',{},token);
    const catalog=await bridge('quotationShared','catalog',{},token);
    applyBackendCatalog(catalog);
    return {boot,catalog};
  }

  login=async function(){
    const password=String(document.getElementById('access-password')?.value||'');
    if(!password)return loginView('Hãy nhập mật khẩu truy cập.');
    try{
      const r=await bridge('quotationAccess','',{password},'');
      if(!r||!r.token)throw new Error('Máy chủ không trả về phiên truy cập hợp lệ.');
      const live=await loadSharedBackend(r.token);
      state.token=r.token;
      state.email='Nội bộ Sunbot';
      state.user=(live.boot&&live.boot.user)||{ho_ten:'Nội bộ Sunbot'};
      sessionStorage.setItem(SHARED_KEY,r.token);
      render();
    }catch(e){
      state.token='';
      sessionStorage.removeItem(SHARED_KEY);
      loginView(e&&e.message?e.message:'Không truy cập được ứng dụng.');
    }
  };

  logout=function(){
    sessionStorage.removeItem(SHARED_KEY);
    state.token='';
    loginView();
  };

  loginView=function(msg=''){
    app.innerHTML=`<div class="wrap"><section class="panel login shared-login"><div class="brand"><img src="../assets/img/logo-sunbot.png" alt="Sunbot" style="width:88px;height:auto"><div><h1>SUNBOT SALES PRICEBOOK</h1><small>Công cụ cấu hình & báo giá nội bộ</small></div></div><h2>Truy cập hệ thống</h2><div class="field"><label>Mật khẩu nội bộ</label><input id="access-password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu"></div><button class="btn" id="login">Vào ứng dụng</button>${msg?`<p class="notice danger">${esc(msg)}</p>`:''}<p class="help">Không cần tài khoản cá nhân. Dữ liệu giá được tải trực tiếp từ Google Sheet backend; thông tin khách hàng chỉ được lưu khi chủ động lưu báo giá.</p></section></div>`;
    document.getElementById('login').onclick=login;
    document.getElementById('access-password').onkeydown=e=>{if(e.key==='Enter')login()};
    setTimeout(()=>document.getElementById('access-password')?.focus(),50);
  };

  const premiumRenderBuilder=renderBuilder;
  renderBuilder=function(){
    premiumRenderBuilder();
    const controls=document.querySelector('.builder-controls');
    if(!controls)return;

    const firstGrid=controls.querySelector('.three');
    if(firstGrid){
      const creator=document.createElement('div');
      creator.className='field';
      creator.innerHTML=`<label>Người lập báo giá</label><input id="createdBy" value="${esc(state.createdBy||'')}" placeholder="VD: Thu, Dung, Nhung">`;
      firstGrid.appendChild(creator);
      const input=creator.querySelector('input');
      input.oninput=e=>{state.createdBy=e.target.value;sessionStorage.setItem(CREATOR_KEY,state.createdBy);const footer=document.querySelector('.quote-footer-note small');if(footer)footer.textContent='Báo giá được tạo từ hệ thống Sunbot Sales Pricebook · '+(state.createdBy||'Nội bộ Sunbot');};
    }

    if(state.customerId||state.opportunityId){
      const note=document.createElement('div');
      note.className='notice ok integration-context';
      note.style.marginTop='10px';
      note.innerHTML=`<b>Ngữ cảnh Sunbot Ops đã nhận</b>${state.customerId?` · Customer: ${esc(state.customerId)}`:''}${state.opportunityId?` · Opportunity: ${esc(state.opportunityId)}`:''}`;
      controls.appendChild(note);
    }

    const actions=controls.querySelector('.builder-actions');
    if(actions){
      const save=document.createElement('button');
      save.className='btn secondary';
      save.id='saveQuoteSnapshot';
      save.textContent='Lưu báo giá';
      actions.insertBefore(save,actions.firstChild);
      save.onclick=saveSnapshot;
    }

    const footer=document.querySelector('.quote-footer-note small');
    if(footer)footer.textContent='Báo giá được tạo từ hệ thống Sunbot Sales Pricebook · '+(state.createdBy||'Nội bộ Sunbot');
  };

  async function saveSnapshot(){
    const {lines,total}=totals();
    if(!state.client||!String(state.client).trim())return alert('Hãy nhập tên khách hàng trước khi lưu báo giá.');
    const btn=document.getElementById('saveQuoteSnapshot');
    if(btn){btn.disabled=true;btn.textContent='Đang lưu...';}
    try{
      const result=await bridge('quotationShared','saveSnapshot',{
        customer_name:String(state.client).trim(),
        customer_id:state.customerId||'',
        opportunity_id:state.opportunityId||'',
        created_by:state.createdBy||'',
        combo_code:state.combo||'CUSTOM',
        subtotal:total,
        final_amount:total,
        pricebook_version:C.version||'',
        lines:lines.map(l=>({item_id:l.code,name:l.name,unit:l.unit,unit_price:l.price,qty:l.qty,line_total:l.price*l.qty}))
      },state.token);
      state.lastQuote=result;
      const hint=controlsNotice(result);
      alert(`Đã lưu báo giá ${result.quote_code||result.quote_id}.`);
      if(hint)hint.scrollIntoView({behavior:'smooth',block:'nearest'});
    }catch(e){alert(e&&e.message?e.message:'Không lưu được báo giá.');}
    finally{if(btn){btn.disabled=false;btn.textContent='Lưu báo giá';}}
  }

  function controlsNotice(result){
    const controls=document.querySelector('.builder-controls');
    if(!controls)return null;
    let box=document.getElementById('savedQuoteNotice');
    if(!box){box=document.createElement('div');box.id='savedQuoteNotice';box.className='notice ok';box.style.marginTop='10px';controls.appendChild(box);}
    box.innerHTML=`Đã lưu <b>${esc(result.quote_code||result.quote_id)}</b> · ${esc(result.customer_name||state.client)} · ${money(result.final_amount||0)}`;
    return box;
  }

  async function restoreShared(){
    const token=sessionStorage.getItem(SHARED_KEY)||'';
    if(!token){state.token='';return loginView();}
    try{
      const live=await loadSharedBackend(token);
      state.token=token;
      state.email='Nội bộ Sunbot';
      state.user=(live.boot&&live.boot.user)||{ho_ten:'Nội bộ Sunbot'};
      render();
    }catch(e){
      sessionStorage.removeItem(SHARED_KEY);
      state.token='';
      loginView('Phiên truy cập đã hết hạn. Vui lòng nhập lại mật khẩu.');
    }
  }

  restoreShared();
})();
