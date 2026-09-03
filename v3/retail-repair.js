// Retail & Repair module for Sunbot Quotation V4.
// Uses the same login, Backend catalog, quote lifecycle, Admin approval and history.
(function () {
  state.retailRepair = state.retailRepair || {
    cart: {},
    custom: [],
    search: "",
    category: "ALL",
    notes: "",
    quoteId: "",
  };

  function categoryOf(code) {
    if (/^RETAIL_FC/.test(code)) return "Học cụ Flashcard";
    if (/^RETAIL_BD/.test(code)) return "Học cụ Bản đồ";
    if (code === "RETAIL_LP_OBSTACLE_KIT") return "Học cụ Lập trình tư duy";
    if (code === "RETAIL_ROBOT_RENTAL") return "Dịch vụ Robot";
    if (/^RETAIL_SC/.test(code)) return "Linh kiện Robot";
    if (/^RETAIL_ST/.test(code)) return "Vật tư STEAM";
    return "Khác";
  }

  function backendInventory() {
    return Object.entries(C.prices || {})
      .filter(([code]) => /^RETAIL_/.test(code))
      .map(([code, p]) => ({ code, name: p.name || code, unit: p.unit || "", price: Number(p.price || 0), category: categoryOf(code), item_type: p.item_type || "" }))
      .filter((x) => x.price > 0)
      .sort((a, b) => a.category.localeCompare(b.category, "vi") || a.name.localeCompare(b.name, "vi"));
  }

  function cartRows() {
    return Object.values(state.retailRepair.cart || {}).filter((x) => Number(x.qty || 0) > 0);
  }

  function total() {
    return cartRows().reduce((sum, x) => sum + Number(x.price || 0) * Number(x.qty || 0), 0);
  }

  function addKnown(code) {
    const p = C.prices?.[code];
    if (!p) return;
    const current = state.retailRepair.cart[code];
    state.retailRepair.cart[code] = current
      ? { ...current, qty: Number(current.qty || 0) + 1 }
      : { code, name: p.name || code, unit: p.unit || "", price: Number(p.price || 0), qty: 1, custom: false, category: categoryOf(code) };
    renderRetailRepair();
  }

  function setQty(code, qty) {
    const next = Math.max(0, Number(qty || 0));
    if (!state.retailRepair.cart[code]) return;
    if (!next) delete state.retailRepair.cart[code];
    else state.retailRepair.cart[code].qty = next;
    renderRetailRepair();
  }

  function removeItem(code) {
    delete state.retailRepair.cart[code];
    renderRetailRepair();
  }

  function addCustom() {
    const name = String(document.getElementById("retail-custom-name")?.value || "").trim();
    const unit = String(document.getElementById("retail-custom-unit")?.value || "Cái").trim() || "Cái";
    const price = Number(document.getElementById("retail-custom-price")?.value || 0);
    if (!name) return alert("Hãy nhập tên hạng mục tùy chỉnh.");
    if (!(price > 0)) return alert("Hãy nhập đơn giá lớn hơn 0.");
    const code = `CUSTOM_RETAIL_${Date.now()}`;
    state.retailRepair.cart[code] = { code, name, unit, price, qty: 1, custom: true, category: "Tùy chỉnh" };
    renderRetailRepair();
  }

  function linePayload(x) {
    const item = C.prices?.[x.code];
    const group = x.custom ? "CUSTOM" : commercialGroup(x.code, item || { item_type: "MATERIAL" });
    return {
      item_id: x.code,
      code: x.code,
      name: x.name,
      unit: x.unit,
      proposed_unit_price: Number(x.price || 0),
      standard_unit_price: Number(x.price || 0),
      qty: Number(x.qty || 0),
      line_total: Number(x.price || 0) * Number(x.qty || 0),
      commercial_group: group,
      is_custom: !!x.custom,
    };
  }

  async function saveRetailRepair() {
    const client = String(document.getElementById("retail-client")?.value || state.client || "").trim();
    const creator = state.role === "ADMIN"
      ? String(document.getElementById("retail-created-by")?.value || state.createdBy || "").trim()
      : String(state.createdBy || state.user?.display_name || "").trim();
    const notes = String(document.getElementById("retail-notes")?.value || "").trim();
    const lines = cartRows();
    if (!creator) return alert("Hãy chọn người lập báo giá.");
    if (!client) return alert("Hãy nhập tên khách hàng.");
    if (!lines.length) return alert("Báo giá chưa có hạng mục.");

    state.client = client;
    state.createdBy = creator;
    state.retailRepair.notes = notes;
    const btn = document.getElementById("retail-save");
    if (btn) { btn.disabled = true; btn.textContent = "Đang lưu..."; }
    try {
      const customCount = lines.filter((x) => x.custom).length;
      const r = await bridge("quotationShared", "saveSnapshot", {
        quote_id: state.retailRepair.quoteId || "",
        customer_name: client,
        customer_id: state.customerId || "",
        opportunity_id: state.opportunityId || "",
        created_by: creator,
        creator_role: state.role,
        region: regionOf(creator),
        deal_owner: creator,
        desired_status: "NEEDS_APPROVAL",
        status: "NEEDS_APPROVAL",
        combo_code: "RETAIL_REPAIR",
        quote_type: "RETAIL",
        subtotal: total(),
        final_amount: total(),
        pricebook_version: C.version,
        notes: notes || "Bán lẻ / sửa chữa Sunbot",
        exception_reason: customCount ? `Có ${customCount} hạng mục tùy chỉnh do người lập đề xuất; yêu cầu Admin rà soát tên, phạm vi và đơn giá trước khi duyệt.` : "",
        configuration_description: `Báo giá bán lẻ / sửa chữa Sunbot gồm ${lines.length} hạng mục. Linh kiện và vật tư theo danh mục Backend; hạng mục tùy chỉnh (nếu có) chỉ có hiệu lực sau khi Admin duyệt.`,
        lines: lines.map(linePayload),
      }, state.token);
      state.retailRepair.quoteId = String(r?.quote_id || state.retailRepair.quoteId || "");
      alert(`Đã lưu ${r?.quote_code || r?.quote_id || "báo giá"} và gửi Admin duyệt.`);
      state.tab = "quotes";
      renderContent();
      document.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("active", x.dataset.tab === "quotes"));
    } catch (e) {
      alert(friendlyError(e));
    } finally {
      const b = document.getElementById("retail-save");
      if (b) { b.disabled = false; b.textContent = "Lưu & gửi duyệt"; }
    }
  }

  function inventoryHtml() {
    const all = backendInventory();
    const categories = ["ALL", ...new Set(all.map((x) => x.category))];
    const query = String(state.retailRepair.search || "").toLocaleLowerCase("vi");
    const filtered = all.filter((x) => (state.retailRepair.category === "ALL" || x.category === state.retailRepair.category) && (!query || x.name.toLocaleLowerCase("vi").includes(query)));
    return `<section class="panel retail-catalog-panel">
      <div class="builder-head"><div><span class="ux-eyebrow">KHO HẠNG MỤC BACKEND</span><h3>Phụ kiện, linh kiện & vật tư</h3><p class="help">Dữ liệu đã chuyển từ app cũ sang Backend. Giá cũ được khóa ở mức hiện hành và mọi báo giá vẫn phải Admin duyệt.</p></div><span class="badge">${all.length} mục</span></div>
      <div class="retail-filter-row"><select id="retail-category">${categories.map((c) => `<option value="${esc(c)}" ${state.retailRepair.category === c ? "selected" : ""}>${c === "ALL" ? "Tất cả nhóm" : esc(c)}</option>`).join("")}</select><input id="retail-search" value="${esc(state.retailRepair.search)}" placeholder="Tìm tên hạng mục..."></div>
      <div class="retail-inventory-list">${filtered.length ? filtered.map((x) => `<div class="retail-inventory-row"><div><b>${esc(x.name)}</b><small>${esc(x.category)} · ${money(x.price)} / ${esc(x.unit)}</small></div><button type="button" class="btn secondary" data-retail-add="${esc(x.code)}">+ Thêm</button></div>`).join("") : `<p class="help">Không tìm thấy hạng mục phù hợp.</p>`}</div>
      <div class="retail-custom-box"><h4>Thêm món tùy chỉnh</h4><p class="help">Dùng khi chưa có trong danh mục. Hạng mục sẽ được đánh dấu CUSTOM và Admin phải rà soát trước khi duyệt.</p><div class="three"><div class="field"><label>Tên hạng mục</label><input id="retail-custom-name" placeholder="Ví dụ: Công sửa chữa theo hiện trạng"></div><div class="field"><label>Đơn vị</label><input id="retail-custom-unit" value="Cái"></div><div class="field"><label>Đơn giá</label><input id="retail-custom-price" type="number" min="1" placeholder="VNĐ"></div></div><button type="button" class="btn secondary" id="retail-add-custom">+ Thêm món tùy chỉnh</button></div>
    </section>`;
  }

  function cartHtml() {
    const rows = cartRows();
    return `<section class="panel retail-cart-panel"><div class="builder-head"><div><span class="ux-eyebrow">CẤU HÌNH ĐÃ CHỌN</span><h3>Giỏ báo giá Bán lẻ & Sửa chữa</h3><p class="help">Có thể tăng, giảm hoặc xóa mọi món đã thêm, kể cả món tùy chỉnh.</p></div><div class="retail-cart-total"><small>${rows.length} hạng mục</small><strong>${money(total())}</strong></div></div>
      <div class="retail-cart-list">${rows.length ? rows.map((x) => `<div class="retail-cart-row"><div class="retail-cart-main"><b>${esc(x.name)}</b><small>${x.custom ? "TÙY CHỈNH · " : ""}${money(x.price)} / ${esc(x.unit)}</small></div><div class="retail-cart-actions"><strong>${money(x.price * x.qty)}</strong><div><button type="button" data-retail-minus="${esc(x.code)}">−</button><input type="number" min="1" value="${Number(x.qty)}" data-retail-qty="${esc(x.code)}"><button type="button" data-retail-plus="${esc(x.code)}">+</button><button type="button" class="retail-remove" data-retail-remove="${esc(x.code)}">Xóa</button></div></div></div>`).join("") : `<div class="notice">Chưa có hạng mục nào. Chọn từ kho bên trái hoặc thêm món tùy chỉnh.</div>`}</div>
    </section>`;
  }

  function previewHtml() {
    const rows = cartRows();
    return `<section class="quote-preview-wrap retail-preview"><article id="quote-document" class="quote-document"><div class="quote-top-accent"></div><header class="quote-header"><div class="quote-brand-block"><img class="quote-logo" src="../assets/img/logo-sunbot.png" alt="Sunbot"><div class="quote-brand-copy"><div class="quote-company">CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM</div><div class="quote-tagline">SUNBOT · CÔNG NGHỆ GIÁO DỤC MẦM NON</div></div></div></header><section class="quote-title-block"><div class="quote-kicker">ĐỀ XUẤT THƯƠNG MẠI</div><h1>BÁO GIÁ HỌC CỤ, VẬT TƯ & SỬA CHỮA SUNBOT</h1></section><section class="quote-recipient"><div><span>Kính gửi</span><strong>${esc(state.client || "Quý Nhà trường / Quý Đơn vị")}</strong></div><div><span>Người lập</span><strong>${esc(state.createdBy || state.user?.display_name || "")}</strong></div><div><span>Trạng thái</span><strong>CHỜ DUYỆT</strong></div></section><section class="quote-table-section"><table class="quote-table"><thead><tr><th class="q-stt">STT</th><th>Hạng mục</th><th class="q-num">SL</th><th class="q-money">Đơn giá</th><th class="q-money">Thành tiền</th></tr></thead><tbody>${rows.map((x, i) => `<tr class="quote-row"><td class="q-stt">${i + 1}</td><td class="q-name"><b>${esc(x.name)}</b><small>${esc(x.unit)}${x.custom ? " · Hạng mục tùy chỉnh" : ""}</small></td><td class="q-num">${x.qty}</td><td class="q-money">${money(x.price)}</td><td class="q-money q-line-total">${money(x.price * x.qty)}</td></tr>`).join("")}</tbody></table></section><section class="quote-total-box"><div class="quote-total-label"><span>TỔNG GIÁ TRỊ ĐỀ XUẤT</span><small>Chưa gồm VAT và chi phí ngoài phạm vi nếu có</small></div><div class="quote-total-value">${money(total())}</div></section><section class="quote-intro">Đối với sửa chữa, thiết bị được tiếp nhận và kiểm tra lỗi trước khi xác nhận phạm vi thực hiện. Hạng mục tùy chỉnh chỉ có hiệu lực sau khi Admin phê duyệt.</section><div class="quote-bottom-accent"></div></article></section>`;
  }

  function bindRetailRepair() {
    document.getElementById("retail-client")?.addEventListener("input", (e) => { state.client = e.target.value; document.querySelector(".retail-preview") && renderRetailRepair(); });
    document.getElementById("retail-created-by")?.addEventListener("change", (e) => { state.createdBy = e.target.value; renderRetailRepair(); });
    document.getElementById("retail-category")?.addEventListener("change", (e) => { state.retailRepair.category = e.target.value; renderRetailRepair(); });
    document.getElementById("retail-search")?.addEventListener("change", (e) => { state.retailRepair.search = e.target.value; renderRetailRepair(); });
    document.querySelectorAll("[data-retail-add]").forEach((b) => b.onclick = () => addKnown(b.dataset.retailAdd));
    document.getElementById("retail-add-custom")?.addEventListener("click", addCustom);
    document.querySelectorAll("[data-retail-minus]").forEach((b) => b.onclick = () => setQty(b.dataset.retailMinus, Number(state.retailRepair.cart[b.dataset.retailMinus]?.qty || 0) - 1));
    document.querySelectorAll("[data-retail-plus]").forEach((b) => b.onclick = () => setQty(b.dataset.retailPlus, Number(state.retailRepair.cart[b.dataset.retailPlus]?.qty || 0) + 1));
    document.querySelectorAll("[data-retail-qty]").forEach((i) => i.onchange = () => setQty(i.dataset.retailQty, i.value));
    document.querySelectorAll("[data-retail-remove]").forEach((b) => b.onclick = () => removeItem(b.dataset.retailRemove));
    document.getElementById("retail-save")?.addEventListener("click", saveRetailRepair);
  }

  function injectStyles() {
    if (document.getElementById("retail-repair-style")) return;
    const s = document.createElement("style");
    s.id = "retail-repair-style";
    s.textContent = `
      .retail-shell{display:grid;grid-template-columns:minmax(320px,.9fr) minmax(420px,1.1fr);gap:16px;align-items:start}.retail-left{display:grid;gap:16px}.retail-filter-row{display:grid;grid-template-columns:180px 1fr;gap:8px;margin:10px 0}.retail-filter-row select,.retail-filter-row input{padding:9px;border:1px solid #cbd5e1;border-radius:9px;background:white}.retail-inventory-list{max-height:360px;overflow:auto;border-top:1px solid #e2e8f0}.retail-inventory-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:9px 0;border-bottom:1px solid #edf2f7}.retail-inventory-row b,.retail-inventory-row small{display:block}.retail-inventory-row small{color:#64748b;margin-top:2px}.retail-custom-box{margin-top:14px;padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px}.retail-custom-box h4{margin:0 0 4px}.retail-cart-total{text-align:right}.retail-cart-total small{display:block;color:#64748b}.retail-cart-total strong{font-size:18px;color:#0f766e}.retail-cart-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid #e7eeee}.retail-cart-main b,.retail-cart-main small{display:block}.retail-cart-main small{color:#64748b;margin-top:3px}.retail-cart-actions{text-align:right}.retail-cart-actions>strong{display:block;margin-bottom:6px}.retail-cart-actions>div{display:flex;gap:5px;align-items:center}.retail-cart-actions button{height:28px;min-width:28px;border:1px solid #cbd5e1;border-radius:7px;background:white;cursor:pointer}.retail-cart-actions input{width:52px;padding:5px;text-align:center;border:1px solid #cbd5e1;border-radius:7px}.retail-cart-actions .retail-remove{border:0;background:#fff1f2;color:#be123c;padding:0 9px;font-weight:700}.retail-form-panel{margin-bottom:16px}.retail-preview{margin-top:16px}
      @media(max-width:980px){.retail-shell{grid-template-columns:1fr}.retail-filter-row{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  window.renderRetailRepair = function () {
    const el = document.getElementById("content");
    if (!el) return;
    injectStyles();
    const creatorField = state.role === "ADMIN"
      ? `<div class="field"><label>Người lập báo giá</label><select id="retail-created-by">${creatorOptions()}</select></div>`
      : `<div class="field"><label>Người lập báo giá</label><input value="${esc(state.createdBy || state.user?.display_name || "")}" disabled></div>`;
    el.innerHTML = `<section class="panel retail-form-panel no-print"><div class="builder-head"><div><span class="badge">BÁN LẺ & SỬA CHỮA</span><h2>Lập báo giá phụ kiện, vật tư và sửa chữa</h2><p class="help">Dùng chung Backend, mã báo giá, quy trình Admin duyệt và lịch sử với báo giá giải pháp.</p></div></div><div class="three">${creatorField}<div class="field"><label>Khách hàng</label><input id="retail-client" value="${esc(state.client || "")}" placeholder="Tên trường / đơn vị"></div><div class="field"><label>Ghi chú chung</label><input id="retail-notes" value="${esc(state.retailRepair.notes || "")}" placeholder="Ví dụ: sửa 03 robot, giao tại trường..."></div></div></section><div class="retail-shell no-print"><div class="retail-left">${inventoryHtml()}</div><div>${cartHtml()}<div class="toolbar" style="margin-top:14px"><button class="btn" id="retail-save">Lưu & gửi duyệt</button><button class="btn secondary" type="button" id="retail-clear">Làm mới giỏ</button></div></div></div>${previewHtml()}`;
    bindRetailRepair();
    document.getElementById("retail-clear")?.addEventListener("click", () => { if (confirm("Xóa toàn bộ hạng mục đang chọn?")) { state.retailRepair.cart = {}; state.retailRepair.quoteId = ""; renderRetailRepair(); } });
  };

  const baseRender = render;
  render = function () {
    baseRender();
    if (!state.token) return;
    const nav = document.querySelector("nav.nav");
    if (!nav || nav.querySelector('[data-tab="retailRepair"]')) return;
    const builder = nav.querySelector('[data-tab="builder"]');
    const button = document.createElement("button");
    button.className = `tab ${state.tab === "retailRepair" ? "active" : ""}`;
    button.dataset.tab = "retailRepair";
    button.textContent = "Bán lẻ & Sửa chữa";
    builder?.insertAdjacentElement("afterend", button);
    button.onclick = () => {
      state.tab = "retailRepair";
      renderContent();
      document.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("active", x.dataset.tab === "retailRepair"));
    };
  };

  const baseRenderContent = renderContent;
  renderContent = function () {
    if (state.tab === "retailRepair") return renderRetailRepair();
    return baseRenderContent();
  };
})();
