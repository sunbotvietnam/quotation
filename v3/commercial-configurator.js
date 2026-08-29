// Commercial terms + UX layer for Sunbot quotation V3.
(function () {
  const TERM_KEY = "sunbot_pricebook_v3_term_months";
  const SUPPORT_TERM_KEY = "sunbot_pricebook_v3_support_term_months";
  const MODEL_KEY = "sunbot_pricebook_v3_commercial_model";
  const SCALE_SESSIONS_KEY = "sunbot_pricebook_v3_scale_sessions";
  const SCALE_ACTIVE_MONTHS = 9;
  const SCALE_BASE_SESSIONS_PER_MONTH = 4;
  const BRAND_CODE = "BRAND_DECOR_FORMEX";

  state.termMonths = Number(sessionStorage.getItem(TERM_KEY) || 36);
  if (![12, 36, 60].includes(state.termMonths)) state.termMonths = 36;
  state.supportTermMonths = Number(sessionStorage.getItem(SUPPORT_TERM_KEY) || 12);
  if (![12, 36, 60].includes(state.supportTermMonths)) state.supportTermMonths = 12;
  state.commercialModel = sessionStorage.getItem(MODEL_KEY) || "POINT";
  if (!["POINT", "SCALE"].includes(state.commercialModel)) state.commercialModel = "POINT";
  state.scaleSessions = Number(sessionStorage.getItem(SCALE_SESSIONS_KEY) || 4);
  if (![4, 8].includes(state.scaleSessions)) state.scaleSessions = 4;
  state.items = state.items || {};
  state.items[BRAND_CODE] = Math.max(1, Number(state.items[BRAND_CODE] || 1));
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

  function programFactor() {
    if (state.program === "STEAM") return 0.7;
    if (state.program === "CORE") return 1.2;
    return 1;
  }

  function frequencyFactor() {
    return Number(state.scaleSessions) === 8 ? 1.5 : 1;
  }

  function minimumSchoolYearFee() {
    if (state.program === "STEAM") return 18000000;
    if (state.program === "CORE") return 30000000;
    return 24000000;
  }

  function progressivePerSessionFee(students) {
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
      subtotal += count * Number(C.prices?.[tier.code]?.price || 0);
    });
    return subtotal;
  }

  function scaleSchoolYearFee() {
    const raw = progressivePerSessionFee(state.students) * SCALE_BASE_SESSIONS_PER_MONTH * SCALE_ACTIVE_MONTHS * frequencyFactor() * programFactor();
    return Math.max(Math.round(raw), minimumSchoolYearFee());
  }

  function brandLine() {
    const p = C.prices?.[BRAND_CODE];
    if (!p) return null;
    return {
      code: BRAND_CODE,
      name: p.name,
      unit: p.unit || "bộ",
      price: Number(p.price || 0),
      qty: Math.max(1, Number(state.items?.[BRAND_CODE] || 1)),
      group: "C",
      max_discount: 0,
    };
  }

  const baseCurrentLines = currentLines;
  currentLines = function () {
    state.items[BRAND_CODE] = Math.max(1, Number(state.items[BRAND_CODE] || 1));
    let lines = baseCurrentLines().filter((line) => !/^SUPPORT_/.test(String(line.code || "")));
    if (!lines.some((line) => line.code === BRAND_CODE)) {
      const branding = brandLine();
      if (branding) lines.push(branding);
    }
    if (state.commercialModel === "SCALE") {
      lines = lines.filter((line) => !/^RIGHT_/.test(String(line.code || "")));
      const fee = scaleSchoolYearFee();
      if (fee > 0) {
        lines.push({
          code: "SELF_DELIVERY_SCALE_FEE",
          name: `Phí sử dụng chương trình, nền tảng và hỗ trợ triển khai theo quy mô · ${state.scaleSessions} buổi/tháng`,
          unit: "năm học",
          price: fee,
          qty: 1,
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
    sessionStorage.setItem(SCALE_SESSIONS_KEY, String(state.scaleSessions));
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
      text = text.replace(/với thời hạn quyền sử dụng[^.]*\./g, `theo mô hình tính phí sử dụng chương trình, nền tảng và hỗ trợ triển khai theo quy mô với tần suất ${state.scaleSessions} buổi/tháng trong năm học.`);
      text = text.replace(/Gói đồng hành được xác định theo[^.]*\.[^\n]*/g, `Phần quyền sử dụng chương trình, nền tảng và hỗ trợ triển khai được gộp trong phí theo quy mô; tần suất 8 buổi/tháng áp hệ số 1,50 thay vì nhân đôi; không thu thêm Quyền sử dụng và Đồng hành cho cùng phạm vi.`);
    } else {
      text = text
        .replace(/với thời hạn quyền sử dụng\s+(?:1|3|5)\s+năm/g, `với thời hạn quyền sử dụng ${state.termMonths} tháng`)
        .replace(/thời hạn quyền sử dụng\s+(?:1|3|5)\s+năm/g, `thời hạn quyền sử dụng ${state.termMonths} tháng`)
        .replace(/Thời lượng đồng hành dự kiến[^.]*\./g, `Thời hạn đồng hành trong cấu hình này là ${state.supportTermMonths} tháng.`);
    }
    if (!/nhận diện/i.test(text)) {
      text += `\n\nBộ nhận diện Sunbot được bố trí tối thiểu tại lớp/phòng hoặc điểm triển khai để bảo đảm tên chương trình, logo và hệ nhận diện được thể hiện thống nhất trong môi trường học tập.`;
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

  const monthSeg = (attr, value) => [12, 36, 60].map((m) => `<button type="button" ${attr}="${m}" class="${Number(value)===m?"active":""}">${m} tháng</button>`).join("");
  const sessionSeg = () => [4, 8].map((n) => `<button type="button" data-scale-sessions="${n}" class="${state.scaleSessions===n?"active":""}">${n} buổi/tháng</button>`).join("");

  function scalePreview() {
    const perSession = progressivePerSessionFee(state.students);
    const baseSessions = SCALE_BASE_SESSIONS_PER_MONTH * SCALE_ACTIVE_MONTHS;
    const raw = Math.round(perSession * baseSessions * frequencyFactor() * programFactor());
    const finalFee = scaleSchoolYearFee();
    const program = programFactor().toFixed(2).replace(".", ",");
    const frequency = frequencyFactor().toFixed(2).replace(".", ",");
    const minimumApplied = finalFee > raw ? ` · áp dụng mức tối thiểu ${money(finalFee)}` : "";
    return `${money(perSession)}/lượt chuẩn × ${baseSessions} lượt chuẩn/năm học × hệ số tần suất ${frequency} × hệ số chương trình ${program} = ${money(finalFee)}${minimumApplied}`;
  }

  function termsPanelHtml() {
    const total = totals().total;
    const point = state.commercialModel === "POINT";
    const brandQty = Math.max(1, Number(state.items?.[BRAND_CODE] || 1));
    return `<section class="panel commercial-terms-panel no-print">
      <div class="terms-head"><div><span class="ux-eyebrow">BƯỚC 1 · MÔ HÌNH & THỜI HẠN</span><h3>Điều kiện thương mại</h3><p class="help">Chọn mô hình theo cấu trúc triển khai, không chỉ theo phương án rẻ hơn.</p></div><div class="ux-total"><small>Tạm tính hiện tại</small><strong>${money(total)}</strong></div></div>
      <div class="model-policy-note"><b>Quy tắc:</b> 01 điểm triển khai mặc định theo điểm trường. Từ 02 điểm trở lên mặc định theo quy mô toàn hệ thống. Chỉ báo nhiều điểm độc lập khi mỗi điểm có tài khoản học liệu, đầu mối vận hành, phạm vi QA/audit và hỗ trợ riêng; ngoại lệ cần Admin duyệt.</div>
      <div class="commercial-model-grid">
        <button type="button" class="commercial-model-card ${point?"active":""}" data-model="POINT"><b>Theo điểm trường</b><span>Quyền sử dụng + Đồng hành theo kỳ hạn</span><small>01 đơn vị sử dụng chương trình · 01 phạm vi QA/audit</small></button>
        <button type="button" class="commercial-model-card ${!point?"active":""}" data-model="SCALE"><b>Theo quy mô trẻ & lượt học</b><span>Phí sử dụng chương trình, nền tảng và hỗ trợ triển khai</span><small>Phù hợp đa điểm / toàn hệ thống</small></button>
      </div>
      ${point ? `<div class="term-controls"><div class="term-control"><label>Thời hạn quyền sử dụng</label><div class="segmented">${monthSeg("data-term-months",state.termMonths)}</div></div><div class="term-control"><label>Thời hạn đồng hành</label><div class="segmented">${monthSeg("data-support-term",state.supportTermMonths)}</div><small>Không bán tháng lẻ; kỳ 36/60 tháng có ưu đãi cam kết dài hạn.</small></div></div><div class="model-rule-note"><b>Theo điểm trường:</b> mỗi điểm là một đơn vị sử dụng chương trình với tài khoản học liệu chính, đầu mối vận hành và phạm vi QA/audit riêng.</div>` : `<div class="term-controls"><div class="term-control"><label>Số trẻ tham gia</label><div class="scale-number"><strong>${Number(state.students||0).toLocaleString("vi-VN")}</strong><span>trẻ</span></div><small>Chỉnh số trẻ ở phần thông tin cấu hình bên dưới.</small></div><div class="term-control"><label>Tần suất triển khai</label><div class="segmented">${sessionSeg()}</div><small>4 buổi/tháng = hệ số 1,00 · 8 buổi/tháng = hệ số 1,50; không nhân đôi.</small></div></div><div class="scale-preview"><b>${scalePreview()}</b><small>Lũy tiến theo lượt chuẩn: 1–150 trẻ 4.000đ; 151–300 3.500đ; 301–500 3.000đ; 501–800 2.500đ; trên 800 2.000đ/trẻ/lượt phần tăng thêm.</small></div><div class="model-rule-note"><b>Theo quy mô trẻ & lượt học:</b> phí này thay thế Quyền sử dụng và Đồng hành cho cùng phạm vi. Thiết bị, học cụ, đào tạo, sát hạch và nhận diện vẫn tính riêng.</div>`}
      <div class="brand-config"><div><b>Nhận diện Sunbot bắt buộc</b><small>Tối thiểu 01 bộ cho lớp/phòng hoặc điểm triển khai chính thức.</small></div><div class="brand-stepper"><button type="button" data-brand-step="-1">−</button><strong>${brandQty}</strong><span>bộ</span><button type="button" data-brand-step="1">+</button></div></div>
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
  }

  const baseRenderBuilder = renderBuilder;
  renderBuilder = function () {
    state.items = state.items || {};
    state.items[BRAND_CODE] = Math.max(1, Number(state.items[BRAND_CODE] || 1));
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
      root.querySelectorAll("[data-scale-sessions]").forEach((button) => button.onclick = () => { state.scaleSessions = Number(button.dataset.scaleSessions); refreshBuilder(); });
      root.querySelectorAll("[data-brand-step]").forEach((button) => button.onclick = () => { state.items[BRAND_CODE] = Math.max(1, Math.min(20, Number(state.items[BRAND_CODE] || 1) + Number(button.dataset.brandStep || 0))); refreshBuilder(); });
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
      const workspace = document.createElement("div");
      workspace.className = "approval-workspace";
      list.insertAdjacentElement("beforebegin", workspace);
      workspace.appendChild(list);
      workspace.appendChild(detail);
    };
  }

  const style = document.createElement("style");
  style.textContent = `
    .commercial-terms-panel{margin-bottom:14px;border:1px solid rgba(15,118,110,.18);background:linear-gradient(180deg,rgba(15,118,110,.035),#fff)}
    .terms-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:14px}.terms-head h3{margin:3px 0 4px}.ux-eyebrow{font-size:10px;font-weight:850;letter-spacing:.1em;opacity:.65}.ux-total{text-align:right;white-space:nowrap}.ux-total small{display:block;opacity:.65}.ux-total strong{font-size:20px}
    .model-policy-note{margin:0 0 12px;padding:10px 12px;border-radius:9px;background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.13);font-size:12px;line-height:1.5}
    .commercial-model-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}.commercial-model-card{text-align:left;padding:13px 14px;border-radius:12px;border:1px solid rgba(0,0,0,.12);background:#fff;display:grid;gap:4px;cursor:pointer}.commercial-model-card.active{border-color:rgba(15,118,110,.5);box-shadow:0 0 0 2px rgba(15,118,110,.08);background:rgba(15,118,110,.035)}.commercial-model-card span,.commercial-model-card small{font-size:12px}.commercial-model-card small{opacity:.68}
    .term-controls{display:grid;grid-template-columns:1fr 1fr;gap:14px}.term-control>label{display:block;font-weight:750;margin-bottom:7px}.segmented{display:flex;border:1px solid rgba(0,0,0,.12);border-radius:10px;overflow:hidden;width:max-content;max-width:100%}.segmented button{border:0;border-right:1px solid rgba(0,0,0,.1);padding:9px 15px;background:#fff;cursor:pointer}.segmented button:last-child{border-right:0}.segmented button.active{font-weight:800;background:rgba(15,118,110,.11)}
    .scale-number{display:flex;gap:7px;align-items:baseline}.scale-number strong{font-size:22px}.scale-preview,.model-rule-note{margin-top:13px;padding:10px 12px;border-radius:9px;background:rgba(0,0,0,.035);font-size:12px;line-height:1.5}.scale-preview{display:grid;gap:4px;background:rgba(15,118,110,.07)}
    .brand-config{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-top:14px;padding:12px 14px;border:1px solid rgba(217,119,6,.22);background:rgba(245,158,11,.06);border-radius:11px}.brand-config small{display:block;margin-top:3px;opacity:.7}.brand-stepper{display:flex;align-items:center;gap:8px;white-space:nowrap}.brand-stepper button{width:34px;height:34px;border:1px solid rgba(0,0,0,.12);background:#fff;border-radius:8px;font-size:17px}.brand-stepper strong{font-size:18px}.brand-stepper span{font-size:12px;opacity:.7}
    .narrative-toggle{margin-left:auto}.approval-workspace{display:grid;grid-template-columns:minmax(330px,38%) minmax(0,62%);gap:16px;align-items:start}.approval-workspace>#approval-detail{position:sticky;top:12px;max-height:calc(100vh - 24px);overflow:auto}.approval-workspace .table-wrap{max-height:70vh;overflow:auto}
    @media(max-width:980px){.commercial-model-grid,.term-controls{grid-template-columns:1fr}.terms-head,.brand-config{display:block}.ux-total{text-align:left;margin-top:10px}.brand-stepper{margin-top:10px}.approval-workspace{grid-template-columns:1fr}.approval-workspace>#approval-detail{position:static;max-height:none}.segmented{width:100%}.segmented button{flex:1}}
    @media print{#commercial-terms-root,.commercial-terms-panel,.narrative-toggle{display:none!important}}
  `;
  document.head.appendChild(style);
})();