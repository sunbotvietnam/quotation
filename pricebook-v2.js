const API_URL='https://script.google.com/macros/s/AKfycbw32BGSXwFVOpRCknx5hn8-k2m5ZXox26_y2mnZKVWL0JKHCv_Qtly5JiY0FS9e87kU/exec';
const SESSION_KEY='sunbot_ops_pages_session_v1';
const EMAIL_KEY='sunbot_ops_pages_email_v1';
const app=document.getElementById('app');
const pending=new Map();
let state={token:sessionStorage.getItem(SESSION_KEY)||'',email:sessionStorage.getItem(EMAIL_KEY)||'',boot:null,catalog:null,tab:'packages',preview:null};

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function money(v){return Number(v||0).toLocaleString('vi-VN')+' ₫'}
function setBusy(v){document.body.classList.toggle('busy',!!v)}
function reqId(){return 'q'+Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function pill(txt,kind=''){return `<span class="pill ${kind}">${esc(txt)}</span>`}

window.addEventListener('message',ev=>{
  if(!(ev.origin==='https://script.google.com'||ev.origin.endsWith('.googleusercontent.com')))return;
  const d=ev.data||{};if(d.type!=='sunbot-pages-response'||!d.requestId)return;
  const p=pending.get(d.requestId);if(!p)return;pending.delete(d.requestId);p.frame.remove();clearTimeout(p.timer);
  if(d.ok)p.resolve(d.result);else p.reject(new Error(d.error||'Có lỗi xảy ra.'));
});
function bridge(mode,subaction,payload={},token=state.token){
  return new Promise((resolve,reject)=>{
    const id=reqId(),frame=document.createElement('iframe');frame.name='qbridge_'+id;frame.className='bridge-frame';document.body.appendChild(frame);
    const timer=setTimeout(()=>{pending.delete(id);frame.remove();reject(new Error('Kết nối máy chủ quá thời gian.'));},25000);
    pending.set(id,{resolve,reject,frame,timer});
    const form=document.createElement('form');form.method='POST';form.action=API_URL;form.target=frame.name;form.className='bridge-form';
    const fields={action:'pagesBridge',request_id:id,mode,subaction:subaction||'',token:token||'',payload:JSON.stringify(payload||{})};
    Object.entries(fields).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=v;form.appendChild(i)});
    document.body.appendChild(form);form.submit();form.remove();
  });
}
async function call(mode,sub,payload={},token=state.token){setBusy(true);try{return await bridge(mode,sub,payload,token)}finally{setBusy(false)}}

function loginView(msg=''){
  app.innerHTML=`<div class="wrap"><section class="panel login"><div class="brand"><div class="logo">S</div><div><h1>SUNBOT BÁO GIÁ</h1><small>Dữ liệu giá được quản lý trên Google Sheet</small></div></div><h2 style="margin-top:24px">Đăng nhập</h2><p>Dùng cùng tài khoản và mã PIN đã được cấp trong SUNBOT OPS.</p><div class="field"><label>Email công việc</label><input id="email" type="email" value="${esc(state.email)}" placeholder="ten@gmail.com"></div><div class="field"><label>Mã PIN 6 số</label><input id="pin" type="password" inputmode="numeric" maxlength="6" placeholder="••••••"></div><button class="btn" id="login">Đăng nhập</button>${msg?`<p style="color:#b42318">${esc(msg)}</p>`:''}</section></div>`;
  document.getElementById('login').onclick=login;
  document.getElementById('pin').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
}
async function login(){
  const email=String(document.getElementById('email').value||'').trim().toLowerCase(),pin=String(document.getElementById('pin').value||'').trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return loginView('Email chưa hợp lệ.');
  if(!/^\d{6}$/.test(pin))return loginView('Mã PIN phải gồm 6 số.');
  try{const r=await call('pinLogin','',{email,pin},'');state.token=r.token;state.email=email;sessionStorage.setItem(SESSION_KEY,r.token);sessionStorage.setItem(EMAIL_KEY,email);await load();}catch(e){loginView(e.message)}
}
function logout(){sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(EMAIL_KEY);state={token:'',email:state.email,boot:null,catalog:null,tab:'packages',preview:null};loginView()}

async function load(){
  if(!state.token)return loginView();
  try{
    const [boot,catalog]=await Promise.all([call('quotation','bootstrap',{}),call('quotation','catalog',{})]);
    state.boot=boot;state.catalog=catalog;render();
  }catch(e){if(/phiên đăng nhập|hết hạn|không còn được cấp quyền/i.test(e.message)){sessionStorage.removeItem(SESSION_KEY);state.token='';loginView('Phiên đăng nhập đã hết hạn.');}else loginView(e.message)}
}

function render(){
  const b=state.boot||{},c=state.catalog||{},u=b.user||{},r=b.rights||{};
  const approved=c.approved_count||0,pendingCount=c.pending_count||0;
  app.innerHTML=`<div class="wrap"><header class="top"><div class="brand"><div class="logo">S</div><div><h1>SUNBOT BÁO GIÁ · V2</h1><small>${esc(u.ho_ten||u.email||'')} · ${esc(r.role||'')}</small></div></div><div class="header-actions"><a class="btn secondary" href="./">Bản cũ</a><button class="btn secondary" id="logout">Đăng xuất</button></div></header>
  <section class="hero"><div class="panel"><h2>Một nguồn giá duy nhất</h2><p>Ứng dụng này không lưu giá trong mã nguồn. Dữ liệu được đọc từ Bảng giá tổng thể Sunbot trên Google Sheet và lọc theo quyền của người dùng.</p></div><div class="statusbox"><small>Trạng thái dữ liệu hiện tại</small><strong>${approved} gói đã duyệt</strong><div>${pendingCount?pill(pendingCount+' gói đang chờ rà soát'):pill('Không có gói chờ','ok')}</div></div></section>
  ${approved===0&&r.role==='Sales'?`<div class="notice">Hiện chưa có gói nào được CEO đánh dấu <b>DUYỆT DÙNG</b>. Sale chưa được phép lập báo giá từ dữ liệu V2.</div>`:''}
  ${pendingCount&&r.role!=='Sales'?`<div class="notice">Bạn đang thấy cả các mức giá <b>chưa được duyệt dùng</b> để phục vụ rà soát. Chúng được đánh dấu rõ trên từng thẻ.</div>`:''}
  <nav class="tabs"><button class="tab ${state.tab==='packages'?'active':''}" data-tab="packages">Gói giá</button><button class="tab ${state.tab==='items'?'active':''}" data-tab="items">Hạng mục giá</button>${r.canCreateQuote?`<button class="tab ${state.tab==='quote'?'active':''}" data-tab="quote">Lập báo giá</button><button class="tab ${state.tab==='history'?'active':''}" data-tab="history">Lịch sử</button>`:''}</nav><main id="content"></main><div class="footer">Nguồn dữ liệu: Google Sheet · V2 · Chỉ dữ liệu đã duyệt mới được phép dùng cho sale.</div></div>`;
  document.getElementById('logout').onclick=logout;document.querySelectorAll('[data-tab]').forEach(x=>x.onclick=()=>{state.tab=x.dataset.tab;renderContent()});renderContent();
}
function renderContent(){if(state.tab==='items')return renderItems();if(state.tab==='quote')return renderQuote();if(state.tab==='history')return renderHistory();renderPackages()}
function renderPackages(){
  const rows=(state.catalog&&state.catalog.packages)||[],el=document.getElementById('content');
  if(!rows.length){el.innerHTML='<div class="panel empty">Chưa có gói giá nào được phép hiển thị cho tài khoản này.</div>';return}
  el.innerHTML=`<div class="grid">${rows.map(p=>`<article class="card"><div class="meta">${p.approved?pill('ĐÃ DUYỆT','ok'):pill('CHỜ XÁC NHẬN')}${pill(p.price_status||'')}</div><h3>${esc(p.name)}</h3><p>${esc(p.duration)} · ${esc(p.audience)}</p><div class="price">${money(p.price_before_tax||p.payment_price)}</div><p>${esc(p.scope)}</p><p><b>Nguồn:</b> ${esc(p.source_id)} · ${esc(p.confidence)}</p>${state.boot.rights.canCreateQuote?`<button class="btn ${p.approved?'':'secondary'}" data-pick="${esc(p.package_id)}">${p.approved?'Lập báo giá':'Xem thử cấu hình'}</button>`:''}</article>`).join('')}</div>`;
  document.querySelectorAll('[data-pick]').forEach(x=>x.onclick=()=>{state.tab='quote';state.selectedPackage=x.dataset.pick;render();});
}
function renderItems(){
  const rows=(state.catalog&&state.catalog.items)||[],el=document.getElementById('content');
  if(!rows.length){el.innerHTML='<div class="panel empty">Chưa có hạng mục giá được phép hiển thị.</div>';return}
  el.innerHTML=`<div class="panel table-wrap"><table class="table"><thead><tr><th>Hạng mục</th><th>Đơn vị</th><th>Giá</th><th>Trạng thái</th><th>Nguồn</th></tr></thead><tbody>${rows.map(p=>`<tr><td><b>${esc(p.name)}</b><br><small>${esc(p.item_type)}</small></td><td>${esc(p.unit)}</td><td class="money">${money(p.price_before_tax||p.payment_price)}</td><td>${p.approved?pill('Đã duyệt','ok'):pill(p.price_status||'Chờ rà soát')}</td><td>${esc(p.source_id)}<br><small>${esc(p.confidence)}</small></td></tr>`).join('')}</tbody></table></div>`;
}
function renderQuote(){
  if(!state.boot.rights.canCreateQuote){state.tab='packages';return renderPackages()}
  const packages=(state.catalog&&state.catalog.packages)||[],selected=state.selectedPackage||packages[0]?.package_id||'',el=document.getElementById('content');
  if(!selected){el.innerHTML='<div class="panel empty">Chưa có gói giá để lập báo giá.</div>';return}
  el.innerHTML=`<div class="two"><section class="panel"><h3>Lập báo giá</h3><div class="field"><label>Khách hàng</label><input id="client" placeholder="Tên trường / đơn vị"></div><div class="field"><label>Loại khách hàng</label><select id="clientType"><option>Trường công</option><option>Trường tư</option><option>Hệ thống trường</option><option>Đối tác</option><option>Nhà thầu</option></select></div><div class="field"><label>Gói giá</label><select id="pkg">${packages.map(p=>`<option value="${esc(p.package_id)}" ${p.package_id===selected?'selected':''}>${esc(p.name)}${p.approved?'':' · CHỜ DUYỆT'}</option>`).join('')}</select></div><div class="field"><label>Chiết khấu (%)</label><input id="discount" type="number" min="0" max="100" step="0.1" value="0"></div><div class="field"><label>Ghi chú</label><textarea id="notes" rows="3"></textarea></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="preview">Tính báo giá</button><button class="btn secondary" id="save" disabled>Lưu dự thảo</button></div></section><section class="panel"><h3>Kết quả</h3><div id="result" class="empty">Chọn cấu hình và bấm “Tính báo giá”.</div></section></div>`;
  document.getElementById('pkg').onchange=e=>state.selectedPackage=e.target.value;document.getElementById('preview').onclick=previewQuote;document.getElementById('save').onclick=saveQuote;
}
async function previewQuote(){
  const rate=Number(document.getElementById('discount').value||0)/100;
  try{const p=await call('quotation','preview',{package_id:document.getElementById('pkg').value,discount_rate:rate});state.preview=p;document.getElementById('result').innerHTML=`<div class="quote-summary"><div class="row"><span>Gói</span><b>${esc(p.name)}</b></div><div class="row"><span>Tạm tính</span><b>${money(p.subtotal)}</b></div><div class="row"><span>Chiết khấu</span><b>${(p.discount_rate*100).toLocaleString('vi-VN')}% · ${money(p.discount_amount)}</b></div><div class="row total"><span>Giá sau chiết khấu</span><span>${money(p.final_amount)}</span></div><div style="margin-top:10px">${p.approved_price?pill('Giá đã duyệt','ok'):pill('Giá chưa duyệt dùng')}${p.approval_required?' '+pill('Cần phê duyệt'):''}</div><p style="font-size:12px;color:#667085">Thuế/VAT: ${esc(p.tax_note||'Theo cấu phần và hóa đơn hợp lệ')} · Nguồn ${esc(p.source_id)}</p></div>`;document.getElementById('save').disabled=false;}catch(e){document.getElementById('result').innerHTML=`<div class="notice">${esc(e.message)}</div>`;document.getElementById('save').disabled=true;}
}
async function saveQuote(){
  if(!state.preview)return;
  const client=String(document.getElementById('client').value||'').trim();if(!client)return alert('Hãy nhập tên khách hàng.');
  try{const r=await call('quotation','save',{client_name:client,client_type:document.getElementById('clientType').value,package_id:document.getElementById('pkg').value,discount_rate:Number(document.getElementById('discount').value||0)/100,notes:document.getElementById('notes').value||'',config:{frontend:'quotation-v2'}});alert('Đã lưu '+r.quote_id+' · '+r.status);state.tab='history';renderContent();}catch(e){alert(e.message)}
}
async function renderHistory(){
  const el=document.getElementById('content');el.innerHTML='<div class="panel empty">Đang tải lịch sử…</div>';
  try{const rows=await call('quotation','history',{});if(!rows.length){el.innerHTML='<div class="panel empty">Chưa có báo giá V2.</div>';return}el.innerHTML=`<div class="panel table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Ngày</th><th>Khách hàng</th><th>Gói</th><th>Thành tiền</th><th>Trạng thái</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r['Mã báo giá'])}</b><br><small>v${esc(r['Phiên bản'])}</small></td><td>${esc(r['Ngày tạo'])}</td><td>${esc(r['Tên khách hàng'])}</td><td>${esc(r['Mã gói chính'])}</td><td class="money">${money(String(r['Thành tiền']||'').replace(/[^0-9]/g,''))}</td><td>${pill(r['Trạng thái']||'')}</td></tr>`).join('')}</tbody></table></div>`;}catch(e){el.innerHTML=`<div class="notice">${esc(e.message)}</div>`}
}

load();
