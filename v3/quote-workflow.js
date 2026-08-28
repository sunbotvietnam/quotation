// Quotation lifecycle UI: review before approval, personal quote history, approved export.
(function () {
  const PERSON_NAMES = {
    Nhung: "Hoàng Nhung",
    Thu: "Minh Thu",
    Dung: "Lê Dung",
    "Hoàng Nhung": "Hoàng Nhung",
    "Minh Thu": "Minh Thu",
    "Lê Dung": "Lê Dung",
  };

  const displayPerson = (value) => PERSON_NAMES[String(value || "").trim()] || String(value || "").trim();
  const statusLabel = (status) => ({
    NEEDS_APPROVAL: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Bị từ chối",
    DRAFT: "Bản nháp",
  }[String(status || "").toUpperCase()] || String(status || ""));

  function displayQuoteCode(id) {
    const m = String(id || "").match(/^BG-SUNBOT-(\d{4})-(\d{4})-(\d{3})$/);
    return m ? `BG/SUNBOT/${m[1]}/${m[2]}-${m[3]}` : String(id || "");
  }

  const baseRender = render;
  render = function () {
    baseRender();
    if (!state.token) return;
    const nav = document.querySelector("nav.nav");
    if (!nav || nav.querySelector('[data-tab="quotes"]')) return;
    const approvals = nav.querySelector('[data-tab="approvals"]');
    const button = document.createElement("button");
    button.className = `tab ${state.tab === "quotes" ? "active" : ""}`;
    button.dataset.tab = "quotes";
    button.textContent = state.role === "ADMIN" ? "Tất cả báo giá" : "Báo giá của tôi";
    if (approvals) approvals.insertAdjacentElement("afterend", button);
    else nav.querySelector('[data-tab="builder"]')?.insertAdjacentElement("afterend", button);
    button.onclick = () => {
      state.tab = "quotes";
      renderContent();
      document.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("active", x.dataset.tab === "quotes"));
    };
  };

  const baseRenderContent = renderContent;
  renderContent = function () {
    if (state.tab === "quotes") return renderQuoteLibrary();
    return baseRenderContent();
  };

  const baseRenderBuilder = renderBuilder;
  renderBuilder = function () {
    baseRenderBuilder();
    const labels = Array.from(document.querySelectorAll(".builder-controls .field label"));
    labels.forEach((label) => {
      const text = label.textContent.trim();
      if (text === "Khu vực") label.closest(".field")?.remove();
      if (text === "Trưởng vùng / người lập") label.textContent = "Người lập báo giá";
    });
    const footer = document.querySelector(".quote-footer-note small");
    if (footer) footer.textContent = `Người lập: ${state.createdBy || "Chưa chọn"}`;
  };

  copySummary = async function (lines, total) {
    const txt = `${state.client || "Khách hàng"}\nNgười lập: ${state.createdBy || "-"}\n${lines
      .map((l) => `${l.name}: ${l.qty} x ${money(l.price)} = ${money(l.qty * l.price)}`)
      .join("\n")}\nTỔNG: ${money(total)}\nTRẠNG THÁI: CHỜ ADMIN DUYỆT`;
    try {
      await navigator.clipboard.writeText(txt);
      alert("Đã sao chép tóm tắt nội bộ.");
    } catch {
      alert(txt);
    }
  };

  function customerQuoteHtml(bundle) {
    const q = bundle.quote || {};
    const lines = bundle.lines || [];
    const rows = lines.map((line, i) => {
      const price = Number(line.proposed_unit_price ?? line.unit_price_snapshot ?? 0);
      const qty = Number(line.qty || 0);
      return `<tr class="quote-row"><td class="q-stt">${i + 1}</td><td class="q-name"><b>${esc(line.item_name_snapshot || line.item_id || "")}</b><small>${esc(line.unit_snapshot || "")}</small></td><td class="q-num">${qty}</td><td class="q-money">${money(price)}</td><td class="q-money q-line-total">${money(Number(line.line_total || price * qty))}</td></tr>`;
    }).join("");
    const total = Number(q.proposed_amount ?? q.final_amount ?? 0);
    return `<article id="quote-document" class="quote-document"><div class="quote-top-accent"></div><header class="quote-header"><div class="quote-brand-block"><img class="quote-logo" src="../assets/img/logo-sunbot.png" alt="Sunbot"><div class="quote-brand-copy"><div class="quote-company">CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM</div><div class="quote-tagline">SUNBOT · CÔNG NGHỆ GIÁO DỤC MẦM NON</div></div></div><div class="quote-meta"><div><span>Mã</span><b>${esc(displayQuoteCode(q.quote_id))}</b></div><div><span>Trạng thái</span><b>${esc(statusLabel(q.status))}</b></div></div></header><section class="quote-title-block"><div class="quote-kicker">ĐỀ XUẤT THƯƠNG MẠI</div><h1>BÁO GIÁ GIẢI PHÁP SUNBOT</h1></section><section class="quote-recipient"><div><span>Kính gửi</span><strong>${esc(q.client_name || "Quý Nhà trường / Quý Đơn vị")}</strong></div><div><span>Người lập</span><strong>${esc(displayPerson(q.created_by))}</strong></div></section><section class="quote-table-section"><table class="quote-table"><thead><tr><th class="q-stt">STT</th><th>Hạng mục</th><th class="q-num">SL</th><th class="q-money">Đơn giá</th><th class="q-money">Thành tiền</th></tr></thead><tbody>${rows}</tbody></table></section><section class="quote-total-box"><div class="quote-total-label"><span>TỔNG GIÁ TRỊ ĐỀ XUẤT</span><small>Chưa gồm VAT và chi phí ngoài phạm vi nếu có</small></div><div class="quote-total-value">${money(total)}</div></section><footer class="quote-footer"><div class="quote-footer-note"><b>SUNBOT</b><span>Giải pháp công nghệ giáo dục mầm non của Kiro Việt Nam</span><small>Người lập: ${esc(displayPerson(q.created_by))}</small></div><div class="quote-sign"><span>TRẠNG THÁI</span><div class="sign-space"></div><b>${esc(statusLabel(q.status).toUpperCase())}</b></div></footer><div class="quote-bottom-accent"></div></article>`;
  }

  function adminReviewHtml(bundle) {
    if (state.role !== "ADMIN") return "";
    const q = bundle.quote || {};
    const lines = bundle.lines || [];
    const rows = lines.map((line) => `<tr><td>${esc(line.item_name_snapshot || line.item_id || "")}</td><td>${esc(line.commercial_group || "")}</td><td class="money">${money(line.standard_unit_price || 0)}</td><td class="money">${money(line.proposed_unit_price ?? line.unit_price_snapshot ?? 0)}</td><td class="money">${money(line.floor_price_snapshot || 0)}</td><td>${Number(line.discount_rate || 0) ? (Number(line.discount_rate || 0) * 100).toFixed(1) + "%" : "0%"}</td></tr>`).join("");
    return `<section class="panel no-print" style="margin-top:16px"><h3>Thông tin nội bộ để duyệt</h3><div class="three"><div><small>Giá chuẩn</small><div class="price">${money(q.standard_amount || q.subtotal || 0)}</div></div><div><small>Giá đề xuất</small><div class="price">${money(q.proposed_amount || q.final_amount || 0)}</div></div><div><small>Mức giảm tổng</small><div class="price">${(Number(q.discount_rate || 0) * 100).toFixed(1)}%</div></div></div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Hạng mục</th><th>Nhóm</th><th>Giá chuẩn</th><th>Giá đề xuất</th><th>Giá sàn</th><th>Giảm</th></tr></thead><tbody>${rows}</tbody></table></div>${q.exception_reason ? `<p class="notice"><b>Lý do/ghi chú ngoại lệ:</b> ${esc(q.exception_reason)}</p>` : ""}</section>`;
  }

  async function loadQuoteDetail(quoteId, mode) {
    const host = document.getElementById(mode === "approval" ? "approval-detail" : "quote-library-detail");
    if (!host) return;
    host.innerHTML = '<section class="panel"><p class="help">Đang tải báo giá...</p></section>';
    try {
      const bundle = await bridge("quotationShared", "getQuote", { quote_id: quoteId }, state.token);
      const q = bundle.quote || {};
      const controls = mode === "approval" && state.role === "ADMIN" && q.status === "NEEDS_APPROVAL"
        ? `<div class="toolbar no-print" style="margin:14px 0"><button class="btn" id="detailApprove">Duyệt báo giá</button><button class="btn secondary" id="detailReject">Từ chối</button></div>`
        : q.status === "APPROVED"
          ? `<div class="toolbar no-print" style="margin:14px 0"><button class="btn" id="detailExport">Xuất PDF khách hàng</button></div>`
          : "";
      const rejected = q.status === "REJECTED" && q.rejection_reason ? `<p class="notice danger no-print"><b>Lý do từ chối:</b> ${esc(q.rejection_reason)}</p>` : "";
      host.innerHTML = `${controls}${rejected}<div class="quote-preview-wrap">${customerQuoteHtml(bundle)}</div>${adminReviewHtml(bundle)}`;
      document.getElementById("detailApprove")?.addEventListener("click", async () => {
        const reason = prompt("Ghi chú duyệt (có thể để trống với báo giá chuẩn):", "");
        if (reason === null) return;
        try {
          await bridge("quotationShared", "approveQuote", { quote_id: quoteId, reason }, state.token);
          alert("Đã duyệt báo giá. Người lập có thể mở lại trong 'Báo giá của tôi' và xuất bản chính thức.");
          renderApprovals();
        } catch (e) { alert(friendlyError(e)); }
      });
      document.getElementById("detailReject")?.addEventListener("click", async () => {
        const reason = prompt("Nhập lý do từ chối:", "");
        if (!reason?.trim()) return;
        try {
          await bridge("quotationShared", "rejectQuote", { quote_id: quoteId, reason: reason.trim() }, state.token);
          alert("Đã từ chối báo giá. Người lập sẽ nhìn thấy trạng thái và lý do trong 'Báo giá của tôi'.");
          renderApprovals();
        } catch (e) { alert(friendlyError(e)); }
      });
      document.getElementById("detailExport")?.addEventListener("click", async () => {
        try {
          await bridge("quotationShared", "exportQuote", { quote_id: quoteId }, state.token);
          window.print();
        } catch (e) { alert(friendlyError(e)); }
      });
    } catch (e) {
      host.innerHTML = `<section class="panel"><p class="notice danger">${esc(friendlyError(e))}</p></section>`;
    }
  }

  renderApprovals = async function () {
    const el = document.getElementById("content");
    if (state.role !== "ADMIN") {
      state.tab = "quotes";
      return renderQuoteLibrary();
    }
    el.innerHTML = '<section class="panel"><h2>Duyệt báo giá</h2><p class="help">Đang tải danh sách chờ duyệt...</p></section>';
    try {
      const quotes = await bridge("quotationShared", "listQuotes", {}, state.token);
      const pending = quotes.filter((q) => String(q.status).toUpperCase() === "NEEDS_APPROVAL");
      el.innerHTML = `<section class="panel"><div class="builder-head"><div><h2>Báo giá chờ duyệt</h2><p class="help">Mở và đọc đầy đủ nội dung báo giá trước khi quyết định.</p></div><button class="btn secondary" id="refreshApprovals">Tải lại</button></div>${pending.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Khách hàng</th><th>Người lập</th><th>Giá trị</th><th>Thao tác</th></tr></thead><tbody>${pending.map((q) => `<tr><td><b>${esc(q.quote_code || displayQuoteCode(q.quote_id))}</b></td><td>${esc(q.client_name || "")}</td><td>${esc(displayPerson(q.created_by))}</td><td class="money">${money(q.final_amount)}</td><td><button class="btn" data-review="${esc(q.quote_id)}">Xem báo giá</button></td></tr>`).join("")}</tbody></table></div>` : '<p class="notice ok">Hiện không có báo giá nào chờ duyệt.</p>'}</section><div id="approval-detail"></div>`;
      document.getElementById("refreshApprovals").onclick = renderApprovals;
      document.querySelectorAll("[data-review]").forEach((b) => b.onclick = () => loadQuoteDetail(b.dataset.review, "approval"));
    } catch (e) {
      el.innerHTML = `<section class="panel"><h2>Duyệt báo giá</h2><p class="notice danger">${esc(friendlyError(e))}</p></section>`;
    }
  };

  async function renderQuoteLibrary() {
    const el = document.getElementById("content");
    el.innerHTML = `<section class="panel"><h2>${state.role === "ADMIN" ? "Tất cả báo giá" : "Báo giá của tôi"}</h2><p class="help">Đang tải...</p></section>`;
    try {
      const quotes = await bridge("quotationShared", "listQuotes", {}, state.token);
      el.innerHTML = `<section class="panel"><div class="builder-head"><div><h2>${state.role === "ADMIN" ? "Tất cả báo giá" : "Báo giá của tôi"}</h2><p class="help">Theo dõi báo giá đã gửi duyệt, đã duyệt hoặc bị từ chối. Báo giá đã duyệt có thể mở lại và xuất PDF chính thức.</p></div><button class="btn secondary" id="refreshQuotes">Tải lại</button></div>${quotes.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Khách hàng</th>${state.role === "ADMIN" ? "<th>Người lập</th>" : ""}<th>Giá trị</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${quotes.map((q) => `<tr><td><b>${esc(q.quote_code || displayQuoteCode(q.quote_id))}</b><br><small>Phiên bản ${Number(q.version || 1)}</small></td><td>${esc(q.client_name || "")}</td>${state.role === "ADMIN" ? `<td>${esc(displayPerson(q.created_by))}</td>` : ""}<td class="money">${money(q.final_amount)}</td><td><span class="badge">${esc(statusLabel(q.status))}</span></td><td><div class="toolbar"><button class="btn secondary" data-open-quote="${esc(q.quote_id)}">Xem</button>${String(q.status).toUpperCase() === "APPROVED" ? `<button class="btn" data-export-quote="${esc(q.quote_id)}">Xuất PDF</button>` : ""}</div></td></tr>`).join("")}</tbody></table></div>` : '<p class="notice">Chưa có báo giá nào.</p>'}</section><div id="quote-library-detail"></div>`;
      document.getElementById("refreshQuotes").onclick = renderQuoteLibrary;
      document.querySelectorAll("[data-open-quote]").forEach((b) => b.onclick = () => loadQuoteDetail(b.dataset.openQuote, "library"));
      document.querySelectorAll("[data-export-quote]").forEach((b) => b.onclick = () => loadQuoteDetail(b.dataset.exportQuote, "library"));
    } catch (e) {
      el.innerHTML = `<section class="panel"><h2>${state.role === "ADMIN" ? "Tất cả báo giá" : "Báo giá của tôi"}</h2><p class="notice danger">${esc(friendlyError(e))}</p></section>`;
    }
  }
})();
