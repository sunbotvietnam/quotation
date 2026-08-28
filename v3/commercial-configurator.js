// Commercial terms + UX layer for Sunbot quotation V3.
(function () {
  const TERM_KEY = "sunbot_pricebook_v3_term_months";
  const SUPPORT_TERM_KEY = "sunbot_pricebook_v3_support_term_months";
  const MODEL_KEY = "sunbot_pricebook_v3_commercial_model";
  const ACTIVE_MONTHS_KEY = "sunbot_pricebook_v3_active_months";

  state.termMonths = Number(sessionStorage.getItem(TERM_KEY) || 36);
  if (![12, 36, 60].includes(state.termMonths)) state.termMonths = 36;
  state.supportTermMonths = Number(sessionStorage.getItem(SUPPORT_TERM_KEY) || 12);
  if (![12, 36, 60].includes(state.supportTermMonths)) state.supportTermMonths = 12;
  state.commercialModel = sessionStorage.getItem(MODEL_KEY) || "POINT";
  if (!["POINT", "SCALE"].includes(state.commercialModel)) state.commercialModel = "POINT";
  state.activeMonths = Math.max(1, Math.min(12, Number(sessionStorage.getItem(ACTIVE_MONTHS_KEY) || 9)));
  state.years = state.termMonths / 12;

  rightsCode = function (program) {
    const months = Number(state.termMonths || 36);
    if (months === 12) {
      if (program === "LT") return "RIGHT_LT_12M";
      if (program === "STEAM") return "RIGHT_STEAM_12M";
      return "RIGHT_CORE_12M";
    }
    if (months === 60) {
      if (program === "LT") return "RIGHT_LT_5Y";
      if (program === "STEAM") return "RIGHT_STEAM_5Y";
      return "RIGHT_CORE_5Y";
    }
    if (program === "LT") return "RIGHT_LT_3Y";
    if (program === "STEAM") return "RIGHT_STEAM_3Y";
    return "RIGHT_CORE_3Y";
  };

  function supportTermCode(students, months) {
    const band = students <= 150 ? "A" : students <= 300 ? "B" : students <= 500 ? "C" : "D";
    return `SUPPORT_${band}_${months}M`;
  }

  function progressiveMonthlyScaleFee(students) {
    const n = Math.max(0, Number(students || 0));
    const tiers = [
      { code: "SELF_FEE_1P_T1", from: 1, to: 150 },
      { code: "SELF_FEE_1P_T2", from: 151, to: 300 },
      { code: "SELF_FEE_1P_T3", from: 301, to: 500 },
      { code: "SELF_FEE_1P_T4", from: 501, to: 800 },
      { code: "SELF_FEE_1P_T5", from: 801, to: Infinity },
    ];
    let subtotal = 0;
    tiers.forEach((tier) => {
      if (n < tier.from) return;
      const count = Math.max(0, Math.min(n, tier.to) - tier.from + 1);
      const rate = Number(C.prices?.[tier.code]?.price || 0);
      subtotal += count * rate;
    });
    const factor = state.program === "CORE" ? 1.25 : 1;
    return Math.round(subtotal * factor);
  }

  const baseCurrentLines = currentLines;
  currentLines = function () {
    let lines = baseCurrentLines().filter((line) => !/^SUPPORT_/.test(String(line.code || "")));
    if (state.commercialModel === "SCALE") {
      lines = lines.filter((line) => !/^RIGHT_/.test(String(line.code || "")));
      const monthly = progressiveMonthlyScaleFee(state.students);
      if (monthly > 0) {
        lines.push({
          code: "SELF_DELIVERY_SCALE_FEE",
          name: "Phí chương trình & phối hợp triển khai theo quy mô",
          unit: "tháng",
          price: monthly,
          qty: Number(state.activeMonths),
          group: "A",
          max_discount: 0,
        });
      }
      return lines;
    }
    const code = supportTermCode(Number(state.students) || 0, state.supportTermMonths);
    const p = C.prices?.[code];
    if (p) {
      const group = commercialGroup(code, p);
      lines.push({ code, name: p.name, unit: p.unit, price: Number(p.price || 0), qty: 1, group, max_discount: maxDiscount(group) });
    }
    return lines;
  };

  function persistTerms() {
    sessionStorage.setItem(TERM_KEY, String(state.termMonths));
    sessionStorage.setItem(SUPPORT_TERM_KEY, String(state.supportTermMonths));
    sessionStorage.setItem(MODEL_KEY, state.commercialModel);
    sessionStorage.setItem(ACTIVE_MONTHS_KEY, String(state.activeMonths));
    state.years = state.termMonths / 12;
  }
  function refreshBuilder() {
    persistTerms();
    state.lastQuote = null;
    state.quoteId = "";
    renderContent();
  }

  function formatNarrativeMonths() {
    if (state.configDescriptionDirty) return;
    let text = String(state.configDescription || "");
    if (state.commercialModel === "SCALE") {
      text = text.replace(/với thời hạn quyền sử dụng[^.]*\./g, `theo mô hình phí chương trình & phối hợp triển khai theo quy mô trong ${state.activeMonths} tháng hoạt động.`);
      text = text.replace(/Gói đồng hành được xác định theo[^.]*\.[^\n]*/g, `Phần chương trình, nền tảng và đồng hành vận hành được gộp trong phí theo quy mô; không thu thêm Quyền sử dụng và Đồng hành cho cùng phạm vi.`);
    } else {
      text = text
        .replace(/với thời hạn quyền sử dụng\s+(?:1|3|5)\s+năm/g, `với thời hạn quyền sử dụng ${state.termMonths} tháng`)
        .replace(/thời hạn quyền sử dụng\s+(?:1|3|5)\s+năm/g, `thời hạn quyền sử dụng ${state.termMonths} tháng`)
        .replace(/Thời lượng đồng hành dự kiến[^.]*\./g, `Thời hạn đồng hành trong cấu hình này là ${state.supportTermMonths} tháng.`);
    }
    state.configDescription = text;
    sessionStorage.setItem("sunbot_pricebook_v3_config_description", text);
    const textarea = document.getElementById("configuration-description");
    if (textarea && textarea.value !== text) textarea.value = text;
  }

  function hideLegacyDurationField() {
    document.querySelectorAll(".builder-controls .field").forEach((field) => {
      const label = field.querySelector("label")?.textContent?.trim().toLowerCase() || "";
      if (label.includes("thời hạn") || label === "số năm") field.style.display = "none";
    });
  }

  const seg = (attr, value) => [12,36,60].map((m) => `<button type="button" ${attr}="${m}" class="${Number(value)===m?"active":""}">${m} tháng</button>`).join("");
  function scalePreview() {
    const monthly = progressiveMonthlyScaleFee(state.students);
    const factorText = state.program === "CORE" ? " · Core ×1,25" : " · 1 phân môn ×1,00";
    return `${money(monthly)}/tháng${factorText} · ${state.activeMonths} tháng = ${money(monthly * state.activeMonths)}`;
  }
  function termsPanelHtml() {
    const total = totals().total;
    const point = state.commercialModel === "POINT";
    return `<section class="panel commercial-terms-panel no-print">
      <div class="terms-head"><div><span class="ux-eyebrow">BƯỚC 1 · MÔ HÌNH & THỜI HẠN</span><h3>Điều kiện thương mại</h3><p class="help">Chọn mô hình trước. Hệ thống tự loại các dòng không được thu đồng thời.</p></div><div class="ux-total"><small>Tạm tính hiện tại</small><strong>${money(total)}</strong></div></div>
      <div class="commercial-model-grid">
        <button type="button" class="commercial-model-card ${point?"active":""}" data-model="POINT"><b>Theo điểm trường</b><span>Quyền sử dụng + Đồng hành theo kỳ hạn</span><small>12 / 36 / 60 tháng</small></button>
        <button type="button" class="commercial-model-card ${!point?"active":""}" data-model="SCALE"><b>Theo quy mô trẻ</b><span>Phí chương trình & phối hợp triển khai</span><small>Tính lũy tiến theo trẻ hoạt động</small></button>
      </div>
      ${point ? `<div class="term-controls"><div class="term-control"><label>Thời hạn quyền sử dụng</label><div class="segmented">${seg("data-term-months",state.termMonths)}</div></div><div class="term-control"><label>Thời hạn đồng hành</label><div class="segmented">${seg("data-support-term",state.supportTermMonths)}</div><small>Không bán tháng lẻ; kỳ 36/60 tháng có ưu đãi cam kết dài hạn.</small></div></div><div class="model-rule-note"><b>Theo điểm trường:</b> Quyền sử dụng và Đồng hành là hai cấu phần riêng; thiết bị, học cụ, đào tạo và sát hạch tính riêng.</div>` : `<div class="term-controls"><div class="term-control"><label>Số trẻ hoạt động bình quân</label><div class="scale-number"><strong>${Number(state.students||0).toLocaleString("vi-VN")}</strong><span>trẻ</span></div><small>Chỉnh số trẻ ở phần thông tin cấu hình bên dưới.</small></div><div class="term-control"><label>Số tháng hoạt động trong kỳ</label><div class="support-month-input"><button type="button" data-active-step="-1">−</button><input id="active-months" type="number" min="1" max="12" value="${state.activeMonths}"><span>tháng</span><button type="button" data-active-step="1">+</button></div><small>Thường 9 tháng cho năm học; tính trên trẻ hoạt động thực tế.</small></div></div><div class="scale-preview"><b>${scalePreview()}</b><small>Lũy tiến: 1–150: 10.000đ; 151–300: 8.000đ; 301–500: 6.000đ; 501–800: 4.000đ; trên 800: 3.000đ/trẻ/tháng phần tăng thêm.</small></div><div class="model-rule-note"><b>Theo quy mô trẻ:</b> phí này thay thế cả Quyền sử dụng và Đồng hành cho cùng phạm vi. Thiết bị, học cụ, đào tạo và sát hạch vẫn tính riêng. Tần suất 4 hay 8 buổi/tháng không làm phí tăng tuyến tính.</div>`}
    </section>`;
  }

  function compactNarrativePanel() {
    const panel = document.querySelector(".config-description-panel");
    if (!panel || panel.dataset.uxCompact === "1") return;
    panel.dataset.uxCompact = "1";
    const grid = panel.querySelector(".config-editor-grid");
    if (!grid) return;
    grid.hidden = true;
    const head = panel.querySelector(".config-editor-head") || panel.firstElementChild;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn secondary narrative-toggle";
    button.textContent = "Xem / chỉnh thuyết minh";
    button.onclick = () => { grid.hidden = !grid.hidden; button.textContent = grid.hidden ? "Xem / chỉnh thuyết minh" : "Thu gọn thuyết minh"; };
    head?.appendChild(button);
    const hint = document.createElement("div");
    hint.className = "narrative-compact-hint";
    hint.innerHTML = `<span>✓ Thuyết minh đã tạo</span><span>✓ Lưu cùng báo giá</span><span>✓ Admin duyệt trước khi xuất</span>`;
    head?.insertAdjacentElement("afterend", hint);
  }

  const baseRenderBuilder = renderBuilder;
  renderBuilder = function () {
    baseRenderBuilder();
    hideLegacyDurationField();
    const controls = document.querySelector(".builder-controls");
    if (controls && !document.getElementById("commercial-terms-root")) {
      const root = document.createElement("div");
      root.id = "commercial-terms-root";
      root.innerHTML = termsPanelHtml();
      controls.insertAdjacentElement("beforebegin", root);
      root.querySelectorAll("[data-model]").forEach((button) => button.onclick = () => { state.commercialModel = button.dataset.model; refreshBuilder(); });
      root.querySelectorAll("[data-term-months]").forEach((button) => button.onclick = () => { state.termMonths = Number(button.dataset.termMonths); refreshBuilder(); });
      root.querySelectorAll("[data-support-term]").forEach((button) => button.onclick = () => { state.supportTermMonths = Number(button.dataset.supportTerm); refreshBuilder(); });
      root.querySelectorAll("[data-active-step]").forEach((button) => button.onclick = () => { state.activeMonths = Math.max(1, Math.min(12, state.activeMonths + Number(button.dataset.activeStep||0))); refreshBuilder(); });
      const input = root.querySelector("#active-months");
      if (input) input.onchange = () => { state.activeMonths = Math.max(1, Math.min(12, Number(input.value||9))); refreshBuilder(); };
    }
    formatNarrativeMonths();
    compactNarrativePanel();
  };

  if (typeof renderApprovals === "function") {
    const baseRenderApprovals = renderApprovals;
    renderApprovals = async function () {
      await baseRenderApprovals();
      const content = document.getElementById("content");
      const list = content?.querySelector(":scope > section.panel");
      const detail = document.getElementById("approval-detail");
      if (!content || !list || !detail || content.querySelector(".approval-workspace")) return;
      const workspace = document.createElement("div"); workspace.className = "approval-workspace";
      list.insertAdjacentElement("beforebegin", workspace); workspace.appendChild(list); workspace.appendChild(detail);
    };
  }

  const style = document.createElement("style");
  style.textContent = `
    .commercial-terms-panel{margin-bottom:14px;border:1px solid rgba(15,118,110,.18);background:linear-gradient(180deg,rgba(15,118,110,.035),#fff)}
    .terms-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:14px}.terms-head h3{margin:3px 0 4px}.ux-eyebrow{font-size:10px;font-weight:850;letter-spacing:.1em;opacity:.65}.ux-total{text-align:right;white-space:nowrap}.ux-total small{display:block;opacity:.65}.ux-total strong{font-size:20px}
    .commercial-model-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}.commercial-model-card{text-align:left;padding:13px 14px;border-radius:12px;border:1px solid rgba(0,0,0,.12);background:#fff;display:grid;gap:4px;cursor:pointer}.commercial-model-card.active{border-color:rgba(15,118,110,.5);box-shadow:0 0 0 2px rgba(15,118,110,.08);background:rgba(15,118,110,.035)}.commercial-model-card span,.commercial-model-card small{font-size:12px}.commercial-model-card small{opacity:.68}
    .term-controls{display:grid;grid-template-columns:1fr 1fr;gap:14px}.term-control>label{display:block;font-weight:750;margin-bottom:7px}.segmented{display:flex;border:1px solid rgba(0,0,0,.12);border-radius:10px;overflow:hidden;width:max-content;max-width:100%}.segmented button{border:0;border-right:1px solid rgba(0,0,0,.1);padding:9px 15px;background:#fff;cursor:pointer}.segmented button:last-child{border-right:0}.segmented button.active{font-weight:800;background:rgba(15,118,110,.11)}
    .support-month-input{display:flex;align-items:center;width:max-content;border:1px solid rgba(0,0,0,.12);border-radius:10px;overflow:hidden}.support-month-input button{border:0;background:#fff;padding:9px 12px;font-size:16px}.support-month-input input{width:64px;border:0;text-align:center;font:inherit;font-weight:750;padding:9px 4px}.support-month-input span{padding-right:11px;font-size:12px;opacity:.7}.term-control>small{display:block;margin-top:5px;opacity:.65}.scale-number{display:flex;gap:7px;align-items:baseline}.scale-number strong{font-size:22px}.scale-preview,.model-rule-note{margin-top:13px;padding:10px 12px;border-radius:9px;background:rgba(0,0,0,.035);font-size:12px;line-height:1.5}.scale-preview{display:grid;gap:4px;background:rgba(15,118,110,.07)}
    .narrative-toggle{margin-left:auto}.narrative-compact-hint{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 2px}.narrative-compact-hint span{font-size:11.5px;padding:6px 9px;border-radius:999px;background:rgba(15,118,110,.07)}
    .approval-workspace{display:grid;grid-template-columns:minmax(330px,38%) minmax(0,62%);gap:16px;align-items:start}.approval-workspace>#approval-detail{position:sticky;top:12px;max-height:calc(100vh - 24px);overflow:auto}.approval-workspace .table-wrap{max-height:70vh;overflow:auto}
    @media(max-width:980px){.commercial-model-grid,.term-controls{grid-template-columns:1fr}.terms-head{display:block}.ux-total{text-align:left;margin-top:10px}.approval-workspace{grid-template-columns:1fr}.approval-workspace>#approval-detail{position:static;max-height:none}.segmented{width:100%}.segmented button{flex:1}}
    @media print{#commercial-terms-root,.commercial-terms-panel,.narrative-compact-hint,.narrative-toggle{display:none!important}}
  `;
  document.head.appendChild(style);
})();
