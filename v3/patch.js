// Runtime patch for V3 auth + deployment diagnostics.
// Keeps business data out of GitHub; this file only fixes login UX/runtime behavior.
(function(){
  const isFile = location.protocol === 'file:';

  // Override login to accept the same login_id concept as Sunbot Ops.
  login = async function(){
    const loginId = String(document.getElementById('email')?.value || '').trim();
    const pin = String(document.getElementById('pin')?.value || '').trim();
    if(loginId.length < 3) return loginView('Hãy nhập Email hoặc ID đăng nhập.');
    if(!/^\d{6}$/.test(pin)) return loginView('PIN phải gồm đúng 6 số.');
    try{
      // Backward compatible: current backend reads `email`; future backend may read `login_id`.
      const payload = {email: loginId.toLowerCase(), login_id: loginId, pin};
      const r = await bridge('pinLogin','',payload,'');
      state.token = r.token;
      state.email = loginId;
      state.user = r.user || {email: loginId, login_id: loginId};
      sessionStorage.setItem(SESSION_KEY,r.token);
      sessionStorage.setItem(EMAIL_KEY,loginId);
      render();
    }catch(e){
      loginView(e && e.message ? e.message : 'Không đăng nhập được. Vui lòng kiểm tra tài khoản/PIN hoặc kết nối backend.');
    }
  };

  loginView = function(msg=''){
    const runtimeWarning = isFile
      ? `<div class="notice danger"><b>Không chạy app bằng file://</b><br>Hãy dùng GitHub Pages hoặc local web server (http://localhost...). Cơ chế đăng nhập qua Google Apps Script có thể bị trình duyệt chặn khi mở file trực tiếp.</div>`
      : '';
    app.innerHTML=`<div class="wrap"><section class="panel login"><div class="brand"><div class="logo">S</div><div><h1>SUNBOT SALES PRICEBOOK</h1><small>Pricebook Master 2026 · cấu hình & báo giá</small></div></div>${runtimeWarning}<h2>Đăng nhập</h2><div class="field"><label>Email hoặc ID đăng nhập</label><input id="email" type="text" autocomplete="username" value="${esc(state.email)}" placeholder="ten@congty.vn hoặc sale01"></div><div class="field"><label>Mã PIN 6 số</label><input id="pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="6" placeholder="••••••"></div><button class="btn" id="login">Đăng nhập</button>${msg?`<p class="notice danger">${esc(msg)}</p>`:''}<p class="help">Dùng cùng tài khoản/PIN của Sunbot Ops. Tài khoản và PIN được quản lý ở backend, không lưu trong mã nguồn.</p></section></div>`;
    document.getElementById('login').onclick=login;
    document.getElementById('pin').onkeydown=e=>{if(e.key==='Enter')login()};
  };

  // If original app already rendered login before this patch loaded, render it again with the corrected UI.
  if(!state.token) loginView();
})();
