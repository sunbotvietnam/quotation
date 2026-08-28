const API_URL =
  "https://script.google.com/macros/s/AKfycbw32BGSXwFVOpRCknx5hn8-k2m5ZXox26_y2mnZKVWL0JKHCv_Qtly5JiY0FS9e87kU/exec";
const SESSION_KEY = "sunbot_pricebook_v3_shared_session";
const CREATOR_KEY = "sunbot_pricebook_v3_created_by";
const C = window.SUNBOT_CATALOG;
const app = document.getElementById("app");
const pending = new Map();
const REGIONAL_MANAGERS = [
  { name: "Nhung", region: "Hà Nội" },
  { name: "Thu", region: "Đông Bắc" },
  { name: "Dung", region: "Bắc Trung Bộ" },
];
let state = {
  token: sessionStorage.getItem(SESSION_KEY) || "",
  loginId: "",
  user: null,
  role: "REGIONAL_MANAGER",
  tab: "combos",
  combo: "STANDARD",
  students: 150,
  teachers: 2,
  program: "CORE",
  years: 3,
  items: {},
  client: "",
  createdBy: sessionStorage.getItem(CREATOR_KEY) || "",
  customerId: "",
  opportunityId: "",
  lastQuote: null,
  quoteId: "",
  legacy: { robot: 0, tools: 0, teacher: 0, gap: 0, digital: 0 },
  operator: { students: 250, sessions: 4, tuition: 160000, territory: "pilot" },
};
const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " ₫";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function reqId() {
  return (
    "v3" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}
window.addEventListener("message", (ev) => {
  if (
    !(
      ev.origin === "https://script.google.com" ||
      ev.origin.endsWith(".googleusercontent.com")
    )
  )
    return;
  const d = ev.data || {};
  if (d.type !== "sunbot-pages-response" || !d.requestId) return;
  const p = pending.get(d.requestId);
  if (!p) return;
  pending.delete(d.requestId);
  p.frame.remove();
  clearTimeout(p.timer);
  d.ok ? p.resolve(d.result) : p.reject(new Error(d.error || "Có lỗi xảy ra."));
});
function bridge(mode, subaction, payload = {}, token = state.token) {
  return new Promise((resolve, reject) => {
    const id = reqId(),
      frame = document.createElement("iframe");
    frame.name = "v3bridge_" + id;
    frame.style.display = "none";
    document.body.appendChild(frame);
    const timer = setTimeout(() => {
      pending.delete(id);
      frame.remove();
      reject(new Error("Kết nối máy chủ quá thời gian."));
    }, 22000);
    pending.set(id, { resolve, reject, frame, timer });
    const form = document.createElement("form");
    form.method = "POST";
    form.action = API_URL;
    form.target = frame.name;
    form.style.display = "none";
    const fields = {
      action: "pagesBridge",
      request_id: id,
      mode,
      subaction: subaction || "",
      token: token || "",
      payload: JSON.stringify(payload || {}),
    };
    Object.entries(fields).forEach(([k, v]) => {
      const i = document.createElement("input");
      i.type = "hidden";
      i.name = k;
      i.value = v;
      form.appendChild(i);
    });
    document.body.appendChild(form);
    form.submit();
    form.remove();
  });
}
function friendlyError(e) {
  const s = String(e?.message || e || "").trim();
  if (/hết hạn/i.test(s))
    return "Phiên làm việc đã hết hạn. Vui lòng nhập lại mật khẩu.";
  if (/quá thời gian|backend|server|token|api/i.test(s))
    return "Chưa kết nối được hệ thống. Vui lòng tải lại trang và thử lại.";
  return s || "Không thực hiện được.";
}
function commercialGroup(code, item) {
  if (code === "OPERATOR_FEE") return "A";
  if (/^CAMP_/.test(code) || /^EVENT_/.test(code)) return "MIXED_GROWTH";
  const t = String(item?.item_type || "").toUpperCase();
  if (t === "PROGRAM") return "A";
  if (t === "TRAINING" || t === "SERVICE") return "B";
  if (t === "HARDWARE" || t === "MATERIAL") return "C";
  return "B";
}
function maxDiscount(group) {
  return group === "A" || group === "B" ? 3 : 0;
}
function supportCode(n) {
  if (n <= 150) return "SUPPORT_A";
  if (n <= 300) return "SUPPORT_B";
  if (n <= 500) return "SUPPORT_C";
  return "SUPPORT_D";
}
function rightsCode(program, years) {
  if (program === "LT") return years === 5 ? "RIGHT_LT_5Y" : "RIGHT_LT_3Y";
  if (program === "STEAM")
    return years === 5 ? "RIGHT_STEAM_5Y" : "RIGHT_STEAM_3Y";
  return years === 5 ? "RIGHT_CORE_5Y" : "RIGHT_CORE_3Y";
}
function trainCode(program) {
  return program === "CORE" ? "TRAIN_2" : "TRAIN_1";
}
function certCode(program) {
  return program === "CORE" ? "CERT_2" : "CERT_1";
}
function programLabel() {
  if (state.program === "LT") return "Lập trình tư duy cùng Sunbot";
  if (state.program === "STEAM") return "STEAM Sáng tạo cùng Sunbot";
  return "Sunbot Core – 2 phân môn";
}
function applyBackendCatalog(catalog) {
  const rows = catalog && Array.isArray(catalog.items) ? catalog.items : [];
  if (!rows.length) throw new Error("Chưa tải được danh mục giá hiện hành.");
  rows.forEach((x) => {
    const code = String(x.price_id || x.item_id || "").trim();
    if (!code) return;
    const price = Number(
      x.payment_price ?? x.recommended_price ?? x.price_before_tax ?? 0,
    );
    if (!Number.isFinite(price) || price <= 0) return;
    C.prices[code] = {
      ...(C.prices[code] || {}),
      name: String(x.name || C.prices[code]?.name || code),
      unit: String(x.unit || C.prices[code]?.unit || ""),
      price,
      item_type: String(x.item_type || C.prices[code]?.item_type || ""),
      scope: String(x.scope || ""),
    };
  });
  C.version = String(catalog.backend_version || "backend-live");
}
async function loadBackend(token) {
  const [boot, catalog] = await Promise.all([
    bridge("quotationShared", "bootstrap", {}, token),
    bridge("quotationShared", "catalog", {}, token),
  ]);
  applyBackendCatalog(catalog);
  state.role = String(
    boot?.role || boot?.user?.role || "REGIONAL_MANAGER",
  ).toUpperCase();
  state.loginId = String(boot?.login_id || boot?.user?.login_id || "");
  state.user = {
    login_id: state.loginId,
    display_name: String(
      boot?.display_name || boot?.user?.display_name || state.loginId,
    ),
    role: state.role,
    region: String(boot?.region || boot?.user?.region || ""),
  };
  if (state.role !== "ADMIN") {
    state.createdBy = state.user.display_name;
    sessionStorage.setItem(CREATOR_KEY, state.createdBy);
  }
  return boot;
}
function loginView(msg = "") {
  app.innerHTML = `<div class="wrap"><section class="panel login shared-login"><div class="brand"><img src="../assets/img/logo-sunbot.png" alt="Sunbot" style="width:88px;height:auto"><div><h1>SUNBOT - CÔNG CỤ BÁO GIÁ</h1><small>Dành cho nội bộ Kiro - Sunbot</small></div></div><h2>Đăng nhập</h2><div class="field"><label>ID</label><input id="login-id" autocomplete="username" value="${esc(state.loginId || "")}" placeholder="Nhập ID"></div><div class="field"><label>Mật khẩu</label><input id="access-password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu"></div><button class="btn" id="login">Vào ứng dụng</button>${msg ? `<p class="notice danger">${esc(msg)}</p>` : ""}<p class="help">ID và mật khẩu được kiểm tra tại Backend.</p></section></div>`;
  document.getElementById("login").onclick = login;
  document.getElementById("access-password").onkeydown = (e) => {
    if (e.key === "Enter") login();
  };
  setTimeout(() => document.getElementById("access-password")?.focus(), 50);
}
async function login() {
  const loginId = String(
    document.getElementById("login-id")?.value || "",
  ).trim();
  const password = String(
    document.getElementById("access-password")?.value || "",
  );
  if (!loginId) return loginView("Hãy nhập ID.");
  if (!password) return loginView("Hãy nhập mật khẩu.");
  try {
    const r = await bridge(
      "quotationAccess",
      "",
      { login_id: loginId, password },
      "",
    );
    if (!r?.token) throw new Error("Phiên truy cập không hợp lệ.");
    state.token = r.token;
    state.loginId = String(r.login_id || loginId);
    await loadBackend(r.token);
    sessionStorage.setItem(SESSION_KEY, r.token);
    render();
  } catch (e) {
    state.token = "";
    sessionStorage.removeItem(SESSION_KEY);
    loginView(friendlyError(e));
  }
}
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  state.token = "";
  loginView();
}
async function restore() {
  if (!state.token) return loginView();
  try {
    await loadBackend(state.token);
    render();
  } catch (e) {
    state.token = "";
    sessionStorage.removeItem(SESSION_KEY);
    loginView("Phiên làm việc đã hết hạn. Vui lòng nhập lại mật khẩu.");
  }
}
function currentLines() {
  const lines = [];
  const add = (code, qty) => {
    if (!qty) return;
    const p = C.prices[code];
    if (!p) return;
    const group = commercialGroup(code, p);
    lines.push({
      code,
      name: p.name,
      unit: p.unit,
      price: Number(p.price || 0),
      qty: Number(qty),
      group,
      max_discount: maxDiscount(group),
    });
  };
  add(rightsCode(state.program, state.years), 1);
  Object.entries(state.items).forEach(([k, q]) => add(k, q));
  add(trainCode(state.program), 1);
  add(supportCode(Number(state.students) || 0), 1);
  add(certCode(state.program), Number(state.teachers) || 0);
  return lines;
}
function totals() {
  const lines = currentLines();
  return { lines, total: lines.reduce((s, l) => s + l.price * l.qty, 0) };
}
function comboBasePrice(code) {
  const c = C.combos[code],
    old = {
      program: state.program,
      years: state.years,
      items: { ...state.items },
      teachers: state.teachers,
      students: state.students,
    };
  state.program = c.program;
  state.years = c.years;
  state.items = { ...c.items };
  state.teachers = 0;
  state.students = 150;
  const t = totals().total;
  Object.assign(state, old);
  return t;
}
function applyCombo(code) {
  const c = C.combos[code];
  state.combo = code;
  state.program = c.program;
  state.years = c.years;
  state.items = { ...c.items };
  state.students = 150;
  state.teachers = 2;
  state.lastQuote = null;
  state.quoteId = "";
  state.tab = "builder";
  renderContent();
}
function regionOf(name) {
  if (
    state.user &&
    String(name).toLowerCase() === String(state.user.display_name).toLowerCase()
  )
    return state.user.region || "";
  return REGIONAL_MANAGERS.find((x) => x.name === name)?.region || "";
}
function creatorOptions() {
  return (
    `<option value="">-- Chọn Trưởng vùng --</option>` +
    REGIONAL_MANAGERS.map(
      (x) =>
        `<option value="${x.name}" ${state.createdBy === x.name ? "selected" : ""}>${x.name} – ${x.region}</option>`,
    ).join("")
  );
}
function render() {
  if (!state.token) return loginView();
  const admin = state.role === "ADMIN";
  app.innerHTML = `<div class="wrap"><header class="top"><div class="brand"><img src="../assets/img/logo-sunbot.png" alt="Sunbot" style="width:72px;height:auto"><div><h1>SUNBOT - CÔNG CỤ BÁO GIÁ</h1><small>${admin ? "ADMIN" : "TRƯỞNG VÙNG"} · ${esc(state.user?.display_name || state.loginId)} · dữ liệu giá từ Backend ${esc(C.version)}</small></div></div><div class="toolbar no-print"><a class="btn secondary" target="_blank" href="${C.manualUrl}">Cẩm nang Sales</a>${admin ? `<a class="btn secondary" target="_blank" href="${C.backendUrl}">Backend</a>` : ""}<button class="btn secondary" id="logout">Đăng xuất</button></div></header><nav class="nav no-print"><button class="tab ${state.tab === "combos" ? "active" : ""}" data-tab="combos">Cấu hình mẫu</button><button class="tab ${state.tab === "builder" ? "active" : ""}" data-tab="builder">Tạo báo giá</button>${admin ? `<button class="tab ${state.tab === "approvals" ? "active" : ""}" data-tab="approvals">Duyệt báo giá</button>` : ""}<button class="tab ${state.tab === "legacy" ? "active" : ""}" data-tab="legacy">Trường kế thừa</button><button class="tab ${state.tab === "operator" ? "active" : ""}" data-tab="operator">Operator</button><button class="tab ${state.tab === "catalog" ? "active" : ""}" data-tab="catalog">Danh mục giá</button></nav><main id="content"></main><footer class="footer">Sunbot · Trưởng vùng lập báo giá · Admin duyệt trước khi gửi khách hàng.</footer></div>`;
  document.getElementById("logout").onclick = logout;
  document.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        state.tab = b.dataset.tab;
        renderContent();
      }),
  );
  renderContent();
}
function renderContent() {
  if (state.tab === "builder") return renderBuilder();
  if (state.tab === "approvals") return renderApprovals();
  if (state.tab === "legacy") return renderLegacy();
  if (state.tab === "operator") return renderOperator();
  if (state.tab === "catalog") return renderCatalog();
  return renderCombos();
}
function renderCombos() {
  const el = document.getElementById("content");
  el.innerHTML = `<div class="notice ok" style="margin-bottom:14px"><b>Quy trình:</b> Trưởng vùng chọn cấu hình → hoàn thiện báo giá → Lưu & gửi duyệt → Admin duyệt → mới xuất bản khách hàng.</div><div class="grid">${Object.entries(
    C.combos,
  )
    .map(
      ([code, c]) =>
        `<article class="panel combo ${c.recommended ? "recommended" : ""}"><div class="meta"><span class="badge">${esc(c.tag)}</span></div><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><div class="price">${money(comboBasePrice(code))}</div><p class="help">Giá mẫu chưa gồm sát hạch theo số giáo viên thực tế.</p><button class="btn" data-combo="${code}">Chọn cấu hình</button></article>`,
    )
    .join(
      "",
    )}<article class="panel combo"><span class="badge">Linh hoạt</span><h3>Tự cấu hình</h3><p>Dùng khi trường đã có thiết bị hoặc có nhu cầu triển khai đặc thù.</p><div class="price">Theo cấu hình</div><button class="btn secondary" id="custom">Tạo cấu hình riêng</button></article></div>`;
  document
    .querySelectorAll("[data-combo]")
    .forEach((b) => (b.onclick = () => applyCombo(b.dataset.combo)));
  document.getElementById("custom").onclick = () => {
    state.combo = "CUSTOM";
    state.program = "CORE";
    state.years = 3;
    state.items = {
      ROBOT: 4,
      MAP: 3,
      OBSTACLE: 2,
      CARDS: 1,
      BOX: 1,
      STEAM_Y1: 1,
    };
    state.lastQuote = null;
    state.quoteId = "";
    state.tab = "builder";
    renderContent();
  };
}
function displayDate() {
  return new Date().toLocaleDateString("vi-VN");
}
function quoteCode() {
  return (
    state.lastQuote?.quote_code ||
    state.lastQuote?.quote_id ||
    "BẢN NHÁP – CHỜ DUYỆT"
  );
}
function invalidate() {
  if (state.lastQuote?.quote_id) state.quoteId = state.lastQuote.quote_id;
  state.lastQuote = null;
}
function renderBuilder() {
  const { lines, total } = totals(),
    el = document.getElementById("content"),
    admin = state.role === "ADMIN";
  const rows = lines
    .map(
      (l, i) =>
        `<tr class="quote-row"><td class="q-stt">${i + 1}</td><td class="q-name"><b>${esc(l.name)}</b><small>${esc(l.unit)}</small></td><td class="q-num">${l.qty}</td><td class="q-money">${money(l.price)}</td><td class="q-money q-line-total">${money(l.price * l.qty)}</td></tr>`,
    )
    .join("");
  el.innerHTML = `<div class="builder-shell"><section class="panel builder-controls no-print"><div class="builder-head"><div><span class="badge">${state.combo === "CUSTOM" ? "CẤU HÌNH RIÊNG" : esc(C.combos[state.combo]?.name || "SUNBOT")}</span><h2>Tạo báo giá</h2><p class="help">Chỉ Trưởng vùng lập báo giá. Cán bộ vận hành chuyển lead và thông tin trường.</p></div><button class="btn secondary" id="backCombo">Đổi cấu hình</button></div><div class="three"><div class="field"><label>Trưởng vùng / người lập</label><select id="createdBy">${creatorOptions()}</select></div><div class="field"><label>Khu vực</label><input value="${esc(regionOf(state.createdBy))}" disabled></div><div class="field"><label>Khách hàng</label><input id="client" value="${esc(state.client)}" placeholder="Tên trường / đơn vị"></div></div><div class="three"><div class="field"><label>Số trẻ triển khai</label><input id="students" type="number" min="1" value="${state.students}"></div><div class="field"><label>Số giáo viên sát hạch</label><input id="teachers" type="number" min="0" value="${state.teachers}"></div><div class="field"><label>Thời hạn quyền</label><select id="years"><option value="3" ${state.years === 3 ? "selected" : ""}>3 năm</option><option value="5" ${state.years === 5 ? "selected" : ""}>5 năm</option></select></div></div><div class="field"><label>Phạm vi chương trình</label><select id="program"><option value="LT" ${state.program === "LT" ? "selected" : ""}>Lập trình tư duy</option><option value="STEAM" ${state.program === "STEAM" ? "selected" : ""}>STEAM Sáng tạo</option><option value="CORE" ${state.program === "CORE" ? "selected" : ""}>Sunbot Core – 2 phân môn</option></select></div><h3>Thiết bị & học cụ</h3><div class="three">${["ROBOT", "MAP", "OBSTACLE", "CARDS", "BOX", "STEAM_Y1"].map((k) => `<div class="field"><label>${esc(C.prices[k]?.name || k)}</label><input data-qty="${k}" type="number" min="0" value="${Number(state.items[k] || 0)}"></div>`).join("")}</div><div class="notice" style="margin-top:14px"><b>Trạng thái:</b> ${state.lastQuote?.status === "APPROVED" ? "Đã được Admin duyệt" : state.lastQuote ? "Đã lưu – Chờ Admin duyệt" : "Bản nháp"}. Báo giá chỉ được xuất sau khi backend xác nhận đã duyệt.</div>${admin ? `<div class="notice ok" style="margin-top:10px"><b>Góc nhìn Admin:</b> Backend đang giữ giá sàn, nhóm A/B/C, quy tắc chiết khấu và economics. Không hiển thị các dữ liệu này cho Trưởng vùng.</div>` : ""}<div class="toolbar builder-actions"><button class="btn" id="saveQuote">Lưu & gửi duyệt</button><button class="btn secondary" id="copy">Sao chép tóm tắt nội bộ</button><button class="btn secondary" id="print" ${state.lastQuote?.status === "APPROVED" ? "" : "disabled"}>Xuất PDF khách hàng</button></div></section><section class="quote-preview-wrap"><article id="quote-document" class="quote-document"><div class="quote-top-accent"></div><header class="quote-header"><div class="quote-brand-block"><img class="quote-logo" src="../assets/img/logo-sunbot.png" alt="Sunbot"><div class="quote-brand-copy"><div class="quote-company">CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM</div><div class="quote-tagline">SUNBOT · CÔNG NGHỆ GIÁO DỤC MẦM NON</div></div></div><div class="quote-meta"><div><span>Mã</span><b>${esc(quoteCode())}</b></div><div><span>Ngày</span><b>${displayDate()}</b></div></div></header><section class="quote-title-block"><div class="quote-kicker">ĐỀ XUẤT THƯƠNG MẠI</div><h1>BÁO GIÁ GIẢI PHÁP SUNBOT</h1><p>${esc(programLabel())} · Quyền sử dụng ${state.years} năm</p></section><section class="quote-recipient"><div><span>Kính gửi</span><strong>${esc(state.client || "Quý Nhà trường / Quý Đơn vị")}</strong></div><div><span>Quy mô</span><strong>${Number(state.students).toLocaleString("vi-VN")} trẻ</strong></div><div><span>Trạng thái</span><strong>${state.lastQuote?.status === "APPROVED" ? "ĐÃ DUYỆT" : "CHỜ DUYỆT"}</strong></div></section><section class="quote-intro">Kiro Việt Nam trân trọng gửi đề xuất cấu hình triển khai Sunbot theo nhu cầu và quy mô dự kiến. Bản này chỉ có hiệu lực gửi khách hàng sau khi được Admin phê duyệt.</section><section class="quote-table-section"><table class="quote-table"><thead><tr><th class="q-stt">STT</th><th>Hạng mục</th><th class="q-num">SL</th><th class="q-money">Đơn giá</th><th class="q-money">Thành tiền</th></tr></thead><tbody>${rows}</tbody></table></section><section class="quote-total-box"><div class="quote-total-label"><span>TỔNG GIÁ TRỊ ĐỀ XUẤT</span><small>Chưa gồm VAT và chi phí ngoài phạm vi nếu có</small></div><div class="quote-total-value">${money(total)}</div></section><footer class="quote-footer"><div class="quote-footer-note"><b>SUNBOT</b><span>Giải pháp công nghệ giáo dục mầm non của Kiro Việt Nam</span><small>Người lập: ${esc(state.createdBy || "Chưa chọn")} · ${esc(regionOf(state.createdBy))}</small></div><div class="quote-sign"><span>TRẠNG THÁI</span><div class="sign-space"></div><b>${state.lastQuote?.status === "APPROVED" ? "ĐÃ DUYỆT" : "CHỜ ADMIN DUYỆT"}</b></div></footer><div class="quote-bottom-accent"></div></article></section></div>`;
  const sync = () => {
    state.createdBy = document.getElementById("createdBy").value;
    sessionStorage.setItem(CREATOR_KEY, state.createdBy);
    state.client = document.getElementById("client").value;
    state.students = Number(document.getElementById("students").value || 0);
    state.teachers = Number(document.getElementById("teachers").value || 0);
    state.program = document.getElementById("program").value;
    state.years = Number(document.getElementById("years").value);
    document
      .querySelectorAll("[data-qty]")
      .forEach((x) => (state.items[x.dataset.qty] = Number(x.value || 0)));
    invalidate();
    renderContent();
  };
  ["createdBy", "students", "teachers", "program", "years"].forEach(
    (id) => (document.getElementById(id).onchange = sync),
  );
  document.querySelectorAll("[data-qty]").forEach((x) => (x.onchange = sync));
  document.getElementById("client").oninput = (e) => {
    state.client = e.target.value;
    invalidate();
  };
  document.getElementById("backCombo").onclick = () => {
    state.tab = "combos";
    renderContent();
  };
  document.getElementById("saveQuote").onclick = saveQuote;
  document.getElementById("copy").onclick = () => copySummary(lines, total);
  document.getElementById("print").onclick = exportCurrentQuote;
}
async function saveQuote() {
  if (!state.createdBy) return alert("Hãy chọn Trưởng vùng lập báo giá.");
  if (!state.client.trim()) return alert("Hãy nhập tên khách hàng.");
  const { lines, total } = totals();
  const btn = document.getElementById("saveQuote");
  btn.disabled = true;
  btn.textContent = "Đang lưu...";
  try {
    const r = await bridge(
      "quotationShared",
      "saveSnapshot",
      {
        quote_id: state.quoteId || "",
        customer_name: state.client.trim(),
        customer_id: state.customerId || "",
        opportunity_id: state.opportunityId || "",
        created_by: state.createdBy,
        creator_role: state.role,
        region: regionOf(state.createdBy),
        deal_owner: state.createdBy,
        desired_status: "NEEDS_APPROVAL",
        status: "NEEDS_APPROVAL",
        combo_code: state.combo || "CUSTOM",
        subtotal: total,
        final_amount: total,
        pricebook_version: C.version,
        lines: lines.map((l) => ({
          item_id: l.code,
          name: l.name,
          unit: l.unit,
          proposed_unit_price: l.price,
          qty: l.qty,
          line_total: l.price * l.qty,
          commercial_group: l.group,
          max_user_discount_pct: l.max_discount,
        })),
      },
      state.token,
    );
    state.quoteId = r.quote_id;
    state.lastQuote = {
      ...r,
      status: String(r?.status || "NEEDS_APPROVAL").toUpperCase(),
    };
    renderContent();
    alert(
      `Đã lưu ${r?.quote_code || r?.quote_id || "báo giá"} và chuyển trạng thái Chờ Admin duyệt.`,
    );
  } catch (e) {
    alert(friendlyError(e));
  } finally {
    const b = document.getElementById("saveQuote");
    if (b) {
      b.disabled = false;
      b.textContent = "Lưu & gửi duyệt";
    }
  }
}
async function exportCurrentQuote() {
  if (!state.lastQuote?.quote_id) return;
  try {
    await bridge(
      "quotationShared",
      "exportQuote",
      { quote_id: state.lastQuote.quote_id },
      state.token,
    );
    window.print();
  } catch (e) {
    alert(friendlyError(e));
  }
}
async function copySummary(lines, total) {
  const txt = `${state.client || "Khách hàng"}\nNgười lập: ${state.createdBy || "-"} (${regionOf(state.createdBy) || "-"})\n${lines.map((l) => `${l.name}: ${l.qty} x ${money(l.price)} = ${money(l.qty * l.price)}`).join("\n")}\nTỔNG: ${money(total)}\nTRẠNG THÁI: CHỜ ADMIN DUYỆT`;
  try {
    await navigator.clipboard.writeText(txt);
    alert("Đã sao chép tóm tắt nội bộ.");
  } catch {
    alert(txt);
  }
}
function renderLegacy() {
  const L = state.legacy,
    score =
      Number(L.robot) +
      Number(L.tools) +
      Number(L.teacher) +
      Number(L.gap) +
      Number(L.digital),
    group = score <= 2 ? "A" : score <= 5 ? "B" : "C",
    p = C.prices["LEGACY_" + group];
  document.getElementById("content").innerHTML =
    `<div class="two"><section class="panel"><h2>Trường Sunbot kế thừa</h2><p class="help">Đánh giá nhanh mức tái kích hoạt. Trưởng vùng dùng kết quả này làm đầu vào cho báo giá; vẫn cần Admin duyệt.</p>${[
      ["robot", "Thiết bị/robot cần bổ sung"],
      ["tools", "Học cụ thiếu"],
      ["teacher", "Giáo viên cần đào tạo lại"],
      ["gap", "Thời gian gián đoạn"],
      ["digital", "Hệ thống số cần cập nhật"],
    ]
      .map(
        ([k, t]) =>
          `<div class="field"><label>${t}: ${L[k]}</label><input data-legacy="${k}" type="range" min="0" max="2" value="${L[k]}"></div>`,
      )
      .join(
        "",
      )}</section><section class="panel"><h2>Kết quả</h2><div class="score">Nhóm ${group}</div><p>${esc(p?.name || "")}</p><div class="operator-result">${money(p?.price || 0)}</div><p class="help">Không bán lại quyền lịch sử; các thiết bị/đào tạo phát sinh tính riêng.</p></section></div>`;
  document.querySelectorAll("[data-legacy]").forEach(
    (x) =>
      (x.oninput = () => {
        state.legacy[x.dataset.legacy] = Number(x.value);
        renderLegacy();
      }),
  );
}
function renderOperator() {
  const o = state.operator,
    raw = 4000 * o.students * o.sessions,
    core = o.students * o.tuition * o.sessions,
    fee = Math.min(raw, core * 0.12);
  document.getElementById("content").innerHTML =
    `<div class="two"><section class="panel"><h2>Máy tính phí Operator</h2><div class="field"><label>Số trẻ</label><input id="opStudents" type="number" value="${o.students}"></div><div class="field"><label>Số tiết</label><input id="opSessions" type="number" value="${o.sessions}"></div><div class="field"><label>Học phí Core / trẻ / tiết</label><input id="opTuition" type="number" value="${o.tuition}"></div></section><section class="panel"><h2>Phí hệ thống dự kiến</h2><div class="operator-result">${money(fee)}</div><p class="help">Công thức chuẩn 4.000đ/trẻ/tiết, trần 12% doanh thu Core; hợp đồng thực tế vẫn theo Backend và Admin duyệt.</p></section></div>`;
  ["opStudents", "opSessions", "opTuition"].forEach(
    (id) =>
      (document.getElementById(id).onchange = () => {
        o.students = Number(document.getElementById("opStudents").value || 0);
        o.sessions = Number(document.getElementById("opSessions").value || 0);
        o.tuition = Number(document.getElementById("opTuition").value || 0);
        renderOperator();
      }),
  );
}
async function renderApprovals() {
  const el = document.getElementById("content");
  if (state.role !== "ADMIN") {
    state.tab = "combos";
    return renderCombos();
  }
  el.innerHTML =
    '<section class="panel"><h2>Duyệt báo giá</h2><p class="help">Đang tải danh sách từ Backend...</p></section>';
  try {
    const quotes = await bridge(
      "quotationShared",
      "listQuotes",
      {},
      state.token,
    );
    el.innerHTML = `<section class="panel"><div class="builder-head"><div><h2>Duyệt báo giá</h2><p class="help">Chỉ Admin có quyền duyệt hoặc từ chối. Quyết định được ghi vào nhật ký Backend.</p></div><button class="btn secondary" id="refreshApprovals">Tải lại</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Khách hàng</th><th>Người lập</th><th>Giá trị</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${quotes
      .map(
        (quote) =>
          `<tr><td><b>${esc(quote.quote_code || quote.quote_id)}</b><br><small>Phiên bản ${Number(quote.version || 1)}</small></td><td>${esc(quote.client_name)}</td><td>${esc(quote.created_by)}<br><small>${esc(quote.region)}</small></td><td class="money">${money(quote.final_amount)}</td><td><span class="badge">${esc(quote.status)}</span></td><td>${quote.status === "NEEDS_APPROVAL" ? `<div class="toolbar"><button class="btn" data-approve="${esc(quote.quote_id)}">Duyệt</button><button class="btn secondary" data-reject="${esc(quote.quote_id)}">Từ chối</button></div>` : "—"}</td></tr>`,
      )
      .join("")}</tbody></table></div></section>`;
    document.getElementById("refreshApprovals").onclick = renderApprovals;
    document.querySelectorAll("[data-approve]").forEach((button) => {
      button.onclick = async () => {
        const reason =
          prompt("Lý do duyệt ngoại lệ (để trống nếu báo giá chuẩn):", "") ??
          null;
        if (reason === null) return;
        try {
          await bridge(
            "quotationShared",
            "approveQuote",
            { quote_id: button.dataset.approve, reason },
            state.token,
          );
          alert("Đã duyệt báo giá.");
          renderApprovals();
        } catch (error) {
          alert(friendlyError(error));
        }
      };
    });
    document.querySelectorAll("[data-reject]").forEach((button) => {
      button.onclick = async () => {
        const reason = prompt("Nhập lý do từ chối:", "");
        if (!reason?.trim()) return;
        try {
          await bridge(
            "quotationShared",
            "rejectQuote",
            { quote_id: button.dataset.reject, reason: reason.trim() },
            state.token,
          );
          alert("Đã từ chối báo giá.");
          renderApprovals();
        } catch (error) {
          alert(friendlyError(error));
        }
      };
    });
  } catch (error) {
    el.innerHTML = `<section class="panel"><h2>Duyệt báo giá</h2><p class="notice danger">${esc(friendlyError(error))}</p><button class="btn secondary" id="retryApprovals">Thử lại</button></section>`;
    document.getElementById("retryApprovals").onclick = renderApprovals;
  }
}
function renderCatalog() {
  const rows = Object.entries(C.prices)
    .map(
      ([code, p]) =>
        `<tr><td><b>${esc(p.name)}</b><br><small>${esc(code)}</small></td><td>${esc(p.unit)}</td><td class="money">${money(p.price)}</td><td>${esc(commercialGroup(code, p))}</td></tr>`,
    )
    .join("");
  document.getElementById("content").innerHTML =
    `<section class="panel"><h2>Danh mục giá khuyến nghị</h2><p class="help">Giá được ưu tiên tải từ Backend sau đăng nhập. Không hiển thị giá sàn cho Trưởng vùng.</p><div class="table-wrap"><table class="table"><thead><tr><th>Hạng mục</th><th>Đơn vị</th><th>Giá khuyến nghị</th><th>Nhóm</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
const params = new URLSearchParams(location.search);
state.customerId = params.get("customer_id") || "";
state.opportunityId = params.get("opportunity_id") || "";
state.client = params.get("customer_name") || params.get("school_name") || "";
restore();
