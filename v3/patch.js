// Runtime patch for V3 authentication, dynamic Pricebook backend loading and premium quotation output.
// GitHub contains UI code only. Current prices are loaded from the authenticated Apps Script backend.
(function(){
  const isFile = location.protocol === 'file:';
  const MASTER_URL = 'https://docs.google.com/spreadsheets/d/14wk6li0oRK3ho1fAPkPPG1vPYlTFoMccRmn3sHpeAxc/edit';
  const BACKEND_URL = 'https://docs.google.com/spreadsheets/d/1Er11CKeojfSKWfb9zYGTXSLDWocfYX7d-Gi5Sya2EDg/edit';
  const LOGO_URL = '../assets/img/logo-sunbot.png';

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

  function pad2_(n){ return String(n).padStart(2,'0'); }
  function quoteDate_(){
    const d=new Date();
    return `${pad2_(d.getDate())}/${pad2_(d.getMonth()+1)}/${d.getFullYear()}`;
  }
  function compactDate_(){
    const d=new Date();
    return `${d.getFullYear()}${pad2_(d.getMonth()+1)}${pad2_(d.getDate())}`;
  }
  function quoteCode_(){ return `SB-${compactDate_()}-${String(Date.now()).slice(-4)}`; }
  function slug_(s){
    return String(s||'KHACH_HANG').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'').toUpperCase().slice(0,60) || 'KHACH_HANG';
  }
  function programLabel_(){
    if(state.program==='LT') return 'Lập trình tư duy cùng Sunbot';
    if(state.program==='STEAM') return 'STEAM cùng Sunbot';
    return 'Sunbot Core – 2 phân môn';
  }
  function quoteFileBase_(){ return `SUNBOT_BAO_GIA_${slug_(state.client)}_${compactDate_()}`; }
  function printQuotation_(){
    const previousTitle=document.title;
    document.title=quoteFileBase_();
    const restore=()=>{ document.title=previousTitle; window.removeEventListener('afterprint',restore); };
    window.addEventListener('afterprint',restore);
    window.print();
    setTimeout(()=>{ if(document.title!==previousTitle) document.title=previousTitle; },120000);
  }

  // Premium quotation UI: screen preview and print/PDF use the same document structure.
  renderBuilder = function(){
    const {lines,total}=totals(), el=document.getElementById('content');
    const quoteCode=quoteCode_();
    const comboName=state.combo==='CUSTOM'?'Cấu hình riêng':(C.combos[state.combo]?.name||'Cấu hình Sunbot');
    const clientName=state.client||'Quý Nhà trường / Quý Đơn vị';
    const salesName=(state.user && (state.user.ho_ten||state.user.name)) || state.email || '';
    const rows=lines.map((l,i)=>`<tr class="quote-row"><td class="q-stt">${i+1}</td><td class="q-name"><b>${esc(l.name)}</b><small>${esc(l.unit)}</small></td><td class="q-num">${Number(l.qty).toLocaleString('vi-VN')}</td><td class="q-money">${money(l.price)}</td><td class="q-money q-line-total">${money(l.qty*l.price)}</td></tr>`).join('');

    el.innerHTML=`<div class="builder-shell">
      <section class="panel builder-controls no-print">
        <div class="builder-head"><div><span class="badge">${esc(comboName)}</span><h2>Tạo cấu hình & báo giá</h2><p class="help">Bản xem trước bên phải chính là bố cục dùng khi in hoặc lưu PDF.</p></div><button class="btn secondary" id="backCombo">Đổi cấu hình</button></div>
        <div class="three"><div class="field"><label>Khách hàng</label><input id="client" value="${esc(state.client)}" placeholder="Tên trường / đơn vị"></div><div class="field"><label>Số trẻ triển khai</label><input id="students" type="number" min="1" value="${state.students}"></div><div class="field"><label>Số GV sát hạch</label><input id="teachers" type="number" min="0" value="${state.teachers}"></div></div>
        <div class="three"><div class="field"><label>Phạm vi chương trình</label><select id="program"><option value="LT" ${state.program==='LT'?'selected':''}>Lập trình tư duy</option><option value="STEAM" ${state.program==='STEAM'?'selected':''}>STEAM</option><option value="CORE" ${state.program==='CORE'?'selected':''}>Sunbot Core – 2 phân môn</option></select></div><div class="field"><label>Thời hạn quyền</label><select id="years"><option value="3" ${state.years===3?'selected':''}>3 năm</option><option value="5" ${state.years===5?'selected':''}>5 năm</option></select></div><div class="field"><label>STEAM Năm 1</label><select id="steam"><option value="0" ${!state.items.STEAM_Y1?'selected':''}>Không</option><option value="1" ${state.items.STEAM_Y1?'selected':''}>Có</option></select></div></div>
        <h3>Thiết bị & học cụ</h3><div class="three">${['ROBOT','MAP','OBSTACLE','CARDS','BOX'].map(k=>`<div class="field"><label>${esc(C.prices[k].name)}</label><input data-qty="${k}" type="number" min="0" value="${Number(state.items[k]||0)}"></div>`).join('')}</div>
        <p class="help">Android Box có thể để 0 nếu trường có thiết bị tương thích. TV/nội thất không mặc định nằm trong cấu hình.</p>
        <div class="toolbar builder-actions"><button class="btn" id="print">In / Lưu PDF</button><button class="btn secondary" id="copy">Sao chép tóm tắt</button></div>
        <div class="file-name-hint">Tên file đề xuất: <b>${esc(quoteFileBase_())}.pdf</b></div>
      </section>

      <section class="quote-preview-wrap">
        <article id="quote-document" class="quote-document">
          <div class="quote-top-accent"></div>
          <header class="quote-header">
            <div class="quote-brand-block"><img class="quote-logo" src="${LOGO_URL}" alt="Sunbot"><div class="quote-brand-copy"><div class="quote-company">CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM</div><div class="quote-tagline">SUNBOT · PRESCHOOL ROBOTICS & CREATIVE TECHNOLOGY</div></div></div>
            <div class="quote-meta"><div><span>Mã báo giá</span><b>${esc(quoteCode)}</b></div><div><span>Ngày</span><b>${quoteDate_()}</b></div></div>
          </header>

          <section class="quote-title-block"><div class="quote-kicker">ĐỀ XUẤT THƯƠNG MẠI</div><h1>BÁO GIÁ GIẢI PHÁP SUNBOT</h1><p>${esc(programLabel_())} · Quyền sử dụng ${state.years} năm</p></section>

          <section class="quote-recipient"><div><span>Kính gửi</span><strong>${esc(clientName)}</strong></div><div><span>Quy mô dự kiến</span><strong>${Number(state.students||0).toLocaleString('vi-VN')} trẻ</strong></div><div><span>Cấu hình</span><strong>${esc(comboName)}</strong></div></section>

          <section class="quote-intro">Kiro Việt Nam trân trọng gửi Quý Nhà trường/Quý Đơn vị đề xuất cấu hình triển khai Sunbot theo nhu cầu và quy mô dự kiến. Báo giá dưới đây được lập từ Pricebook hiện hành của Sunbot.</section>

          <section class="quote-table-section"><table class="quote-table"><thead><tr><th class="q-stt">STT</th><th>Hạng mục</th><th class="q-num">SL</th><th class="q-money">Đơn giá</th><th class="q-money">Thành tiền</th></tr></thead><tbody>${rows}</tbody></table></section>

          <section class="quote-total-box"><div class="quote-total-label"><span>TỔNG GIÁ TRỊ ĐỀ XUẤT</span><small>Chưa bao gồm VAT và các chi phí phát sinh ngoài phạm vi nêu trên</small></div><div class="quote-total-value">${money(total)}</div></section>

          <section class="quote-conditions"><h3>Điều kiện & lưu ý</h3><div class="quote-condition-grid"><div><b>Hiệu lực báo giá</b><span>30 ngày kể từ ngày phát hành.</span></div><div><b>Phạm vi giá</b><span>Giá theo cấu hình nêu trên; vận chuyển/đi lại và hạng mục phát sinh tính riêng nếu có.</span></div><div><b>Chương trình</b><span>${esc(programLabel_())}; quyền sử dụng theo điểm triển khai và thời hạn đã chọn.</span></div><div><b>Đảm bảo chất lượng</b><span>${esc(C.prices[supportCode(Number(state.students)||0)]?.name||'Gói đồng hành Sunbot')}.</span></div></div></section>

          <footer class="quote-footer"><div class="quote-footer-note"><b>SUNBOT</b><span>Giải pháp công nghệ giáo dục mầm non của Kiro Việt Nam</span><small>Báo giá được tạo từ hệ thống Sunbot Sales Pricebook · ${esc(salesName)}</small></div><div class="quote-sign"><span>ĐẠI DIỆN KIRO VIỆT NAM</span><div class="sign-space"></div><b>Người lập báo giá</b></div></footer>
          <div class="quote-bottom-accent"></div>
        </article>
      </section>
    </div>`;

    const rer=()=>{
      state.client=document.getElementById('client').value;
      state.students=Number(document.getElementById('students').value||0);
      state.teachers=Number(document.getElementById('teachers').value||0);
      state.program=document.getElementById('program').value;
      state.years=Number(document.getElementById('years').value);
      state.items.STEAM_Y1=Number(document.getElementById('steam').value);
      document.querySelectorAll('[data-qty]').forEach(x=>state.items[x.dataset.qty]=Number(x.value||0));
      renderContent();
    };
    ['students','teachers','program','years','steam'].forEach(id=>document.getElementById(id).onchange=rer);
    document.getElementById('client').onchange=rer;
    document.getElementById('client').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();rer();}};
    document.querySelectorAll('[data-qty]').forEach(x=>x.onchange=rer);
    document.getElementById('backCombo').onclick=()=>{state.tab='combos';renderContent()};
    document.getElementById('print').onclick=printQuotation_;
    document.getElementById('copy').onclick=async()=>{const txt=`${state.client||'Khách hàng'}\n${lines.map(l=>`${l.name}: ${l.qty} x ${money(l.price)} = ${money(l.qty*l.price)}`).join('\n')}\nTỔNG: ${money(total)}`;await navigator.clipboard.writeText(txt);alert('Đã sao chép tóm tắt báo giá.')};
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
