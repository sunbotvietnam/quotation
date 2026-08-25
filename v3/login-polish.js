// Keep the login screen simple for sales users; no technical/admin terminology.
(function(){
  loginView=function(msg=''){
    app.innerHTML=`<div class="wrap"><section class="panel login shared-login"><div class="brand"><img src="../assets/img/logo-sunbot.png" alt="Sunbot" style="width:88px;height:auto"><div><h1>SUNBOT - CÔNG CỤ BÁO GIÁ</h1><small>Dành cho nội bộ Kiro - Sunbot</small></div></div><h2>Nhập mật khẩu để tiếp tục</h2><div class="field"><label>Mật khẩu</label><input id="access-password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu"></div><button class="btn" id="login">Vào ứng dụng</button>${msg?`<p class="notice danger">${esc(msg)}</p>`:''}<p class="help">Dùng mật khẩu nội bộ được cấp để truy cập công cụ báo giá.</p></section></div>`;
    document.getElementById('login').onclick=login;
    document.getElementById('access-password').onkeydown=e=>{if(e.key==='Enter')login()};
    setTimeout(()=>document.getElementById('access-password')?.focus(),50);
  };
  if(!state.token) loginView();
})();
