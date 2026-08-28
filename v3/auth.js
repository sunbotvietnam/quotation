// Authentication UI for Sunbot Sales Pricebook V3.
// IMPORTANT: no real passwords or password hashes belong in this public frontend.
(function(){
  const LOGIN_KEY='sunbot_pricebook_v3_login_id';
  state.loginId=sessionStorage.getItem(LOGIN_KEY)||'';

  const baseCreatorOptions=creatorOptions;
  creatorOptions=function(){
    if(state.role==='ADMIN') return baseCreatorOptions();
    const id=String(state.loginId||'').trim();
    const manager=REGIONAL_MANAGERS.find(x=>x.name.toLowerCase()===id.toLowerCase());
    if(!manager) return '<option value="">-- Tài khoản chưa gắn Trưởng vùng --</option>';
    state.createdBy=manager.name;
    sessionStorage.setItem(CREATOR_KEY,manager.name);
    return `<option value="${esc(manager.name)}" selected>${esc(manager.name)} – ${esc(manager.region)}</option>`;
  };

  loginView=function(msg=''){
    app.innerHTML=`<div class="wrap"><section class="panel login shared-login">
      <div class="brand"><img src="../assets/img/logo-sunbot.png" alt="Sunbot" style="width:88px;height:auto"><div><h1>SUNBOT - CÔNG CỤ BÁO GIÁ</h1><small>Dành cho nội bộ Kiro - Sunbot</small></div></div>
      <h2>Đăng nhập</h2>
      <div class="field"><label>ID</label><input id="login-id" type="text" autocomplete="username" value="${esc(state.loginId||'')}" placeholder="Nhập ID"></div>
      <div class="field"><label>Mật khẩu</label><input id="access-password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu"></div>
      <button class="btn" id="login">Vào ứng dụng</button>
      ${msg?`<p class="notice danger">${esc(msg)}</p>`:''}
      <p class="help">Dùng ID và mật khẩu nội bộ được cấp. Mật khẩu được kiểm tra ở máy chủ và không được lưu trong mã nguồn frontend.</p>
    </section></div>`;
    document.getElementById('login').onclick=login;
    document.getElementById('access-password').onkeydown=e=>{if(e.key==='Enter')login()};
    document.getElementById('login-id').onkeydown=e=>{if(e.key==='Enter')document.getElementById('access-password')?.focus()};
    setTimeout(()=>document.getElementById(state.loginId?'access-password':'login-id')?.focus(),50);
  };

  login=async function(){
    const loginId=String(document.getElementById('login-id')?.value||'').trim();
    const password=String(document.getElementById('access-password')?.value||'');
    if(!loginId)return loginView('Hãy nhập ID.');
    if(!password)return loginView('Hãy nhập mật khẩu.');
    try{
      const r=await bridge('quotationAccess','',{login_id:loginId,identifier:loginId,password},'');
      if(!r?.token)throw new Error('ID hoặc mật khẩu không đúng.');
      state.token=r.token;
      state.loginId=loginId;
      sessionStorage.setItem(LOGIN_KEY,loginId);
      sessionStorage.setItem(SESSION_KEY,r.token);
      await loadBackend(r.token);
      if(state.role!=='ADMIN'){
        const manager=REGIONAL_MANAGERS.find(x=>x.name.toLowerCase()===loginId.toLowerCase());
        state.createdBy=manager?.name||'';
        if(state.createdBy)sessionStorage.setItem(CREATOR_KEY,state.createdBy);
      }
      render();
    }catch(e){
      state.token='';
      sessionStorage.removeItem(SESSION_KEY);
      state.loginId=loginId;
      sessionStorage.setItem(LOGIN_KEY,loginId);
      loginView(friendlyError(e));
    }
  };

  const baseLogout=logout;
  logout=function(){
    baseLogout();
    sessionStorage.removeItem(LOGIN_KEY);
    state.loginId='';
  };

  if(!state.token)loginView();
})();
