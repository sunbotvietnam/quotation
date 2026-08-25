// Runtime patch for V3 authentication and dynamic Pricebook backend loading.
// GitHub contains UI code only. Current prices are loaded from the authenticated Apps Script backend.
(function(){
  const isFile = location.protocol === 'file:';
  const MASTER_URL = 'https://docs.google.com/spreadsheets/d/14wk6li0oRK3ho1fAPkPPG1vPYlTFoMccRmn3sHpeAxc/edit';
  const BACKEND_URL = 'https://docs.google.com/spreadsheets/d/1Er11CKeojfSKWfb9zYGTXSLDWocfYX7d-Gi5Sya2EDg/edit';

  function applyBackendCatalog_(catalog){
    const rows = catalog && Array.isArray(catalog.items) ? catalog.items : [];
    if(!rows.length) throw new Error('Backend chưa trả về danh mục giá hiện hành.');
    rows.forEach(function(x){
      const code = String(x.price_id || '').trim();
      if(!code) return;
      const price = Number(x.payment_price || x.price_before_tax || 0);
      if(!Number.isFinite(price)) return;
      C.prices[code] = {
        name: String(x.name || code),
        unit: String(x.unit || ''),
        price: price,
        item_type: String(x.item_type || ''),
        scope: String(x.scope || ''),
        approved: !!x.approved,
        standalone: String(x.standalone || '')
      };
    });
    C.version = '2026.08.25-backend-live';
    C.masterUrl = MASTER_URL;
    C.backendUrl = BACKEND_URL;
    C.backendLoadedAt = new Date().toISOString();
  }

  async function loadPricebookBackend_(token){
    const boot = await bridge('quotation','bootstrap',{},token);
    const catalog = await bridge('quotation','catalog',{},token);
    applyBackendCatalog_(catalog);
    return {boot,catalog};
  }

  login = async function(){
    const loginId = String(document.getElementById('email')?.value || '').trim();
    const pin = String(document.getElementById('pin')?.value || '').trim();
    if(loginId.length < 3) return loginView('Hãy nhập Email hoặc ID đăng nhập.');
    if(!/^\d{6}$/.test(pin)) return loginView('PIN phải gồm đúng 6 số.');
    try{
      const payload = {email: loginId.toLowerCase(), login_id: loginId, identifier: loginId, pin};
      const r = await bridge('pinLogin','',payload,'');
      if(!r || !r.token) throw new Error('Máy chủ không trả về phiên đăng nhập hợp lệ.');
      const live = await loadPricebookBackend_(r.token);
      state.token = r.token;
      state.email = loginId;
      state.user = (live.boot && live.boot.user) || r.user || {email: loginId, login_id: loginId};
      sessionStorage.setItem(SESSION_KEY,r.token);
      sessionStorage.setItem(EMAIL_KEY,loginId);
      render();
    }catch(e){
      state.token='';
      sessionStorage.removeItem(SESSION_KEY);
      const raw = e && e.message ? e.message : 'Không đăng nhập được.';
      const msg = raw.includes('quá thời gian')
        ? 'Không nhận được phản hồi từ máy chủ Sunbot. Backend vừa được cập nhật; hãy tải lại trang và thử lại. Nếu vẫn lỗi, không dùng file://.'
        : raw;
      loginView(msg);
    }
  };

  loginView = function(msg=''){
    const runtimeWarning = isFile
      ? `<div class="notice danger"><b>Không chạy app bằng file://</b><br>Hãy dùng GitHub Pages hoặc local web server (http://localhost...). Đăng nhập qua Google Apps Script không được hỗ trợ ở chế độ mở file trực tiếp.</div>`
      : '';
    app.innerHTML=`<div class="wrap"><section class="panel login"><div class="brand"><div class="logo">S</div><div><h1>SUNBOT SALES PRICEBOOK</h1><small>Pricebook Master 2026 · dữ liệu giá từ backend Google Sheet</small></div></div>${runtimeWarning}<h2>Đăng nhập</h2><div class="field"><label>Email hoặc ID đăng nhập</label><input id="email" type="text" autocomplete="username" value="${esc(state.email)}" placeholder="ten@congty.vn hoặc sale01"></div><div class="field"><label>Mã PIN 6 số</label><input id="pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="6" placeholder="••••••"></div><button class="btn" id="login">Đăng nhập</button>${msg?`<p class="notice danger">${esc(msg)}</p>`:''}<p class="help">Dùng cùng tài khoản/PIN của Sunbot Ops. Sau khi xác thực, app tải bảng giá hiện hành từ Google Sheet backend; giá không lấy từ mã nguồn GitHub.</p></section></div>`;
    document.getElementById('login').onclick=login;
    document.getElementById('pin').onkeydown=e=>{if(e.key==='Enter')login()};
  };

  // Existing sessions must also refresh the live backend before showing prices.
  async function restoreLiveSession_(){
    if(!state.token){ loginView(); return; }
    try{
      const live = await loadPricebookBackend_(state.token);
      state.user = (live.boot && live.boot.user) || state.user;
      render();
    }catch(e){
      state.token='';
      sessionStorage.removeItem(SESSION_KEY);
      loginView('Phiên cũ không còn hợp lệ hoặc chưa tải được bảng giá backend. Vui lòng đăng nhập lại.');
    }
  }

  restoreLiveSession_();
})();
