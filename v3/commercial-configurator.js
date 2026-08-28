// Commercial terms + UX layer for Sunbot quotation V3.
// Owns duration in months, monthly support quantity and compact configure/review UX.
(function () {
  const TERM_KEY = "sunbot_pricebook_v3_term_months";
  const SUPPORT_KEY = "sunbot_pricebook_v3_support_months";
  const MODEL_KEY = "sunbot_pricebook_v3_commercial_model";

  state.termMonths = Number(sessionStorage.getItem(TERM_KEY) || 0) || (Number(state.years || 3) * 12);
  if (![12, 36, 60].includes(state.termMonths)) state.termMonths = 36;
  state.supportMonths = Math.max(1, Math.min(60, Number(sessionStorage.getItem(SUPPORT_KEY) || 12)));
  state.commercialModel = sessionStorage.getItem(MODEL_KEY) || "POINT";
  if (state.commercialModel !== "POINT") state.commercialModel = "POINT"; // FLEX remains locked until the rate is approved.
  state.years = state.termMonths / 12; // backward compatibility with existing modules.

  const originalRightsCode = rightsCode;
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

  const baseCurrentLines = currentLines;
  currentLines = function () {
    let lines = baseCurrentLines().filter((line) => !/^SUPPORT_/.test(String(line.code || "")));
    // The legacy base function already resolves rightsCode dynamically, so it now uses 12/36/60 months.
    if (state.commercialModel === "POINT") {
      const code = supportCode(Number(state.students) || 0);
      const p = C.prices?.[code];
      if (p && state.supportMonths > 0) {
        const group = commercialGroup(code, p);
        lines.push({
          code,
          name: p.name,
          unit: p.unit,
          price: Number(p.price || 0),
          qty: Number(state.supportMonths),
          group,
          max_discount: maxDiscount(group),
        });
      }
    }
    return lines;
  };

  function persistTerms() {
    sessionStorage.setItem(TERM_KEY, String(state.termMonths));
    sessionStorage.setItem(SUPPORT_KEY, String(state.supportMonths));
    sessionStorage.setItem(MODEL_KEY, state.commercialModel);
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
    const month = Number(state.termMonths || 36);
    text = text
      .replace(/với thời hạn quyền sử dụng\s+(?:1|3|5)\s+năm/g, `với thời hạn quyền sử dụng ${month} tháng`)
      .replace(/thời hạn quyền sử dụng\s+(?:1|3|5)\s+năm/g, `thời hạn quyền sử dụng ${month} tháng`);
    if (state.commercialModel === "POINT") {
      text = text.replace(
        /(Gói đồng hành được xác định theo[^.]*\.)/,
        `$1 Thời lượng đồng hành dự kiến trong cấu hình này là ${state.supportMonths} tháng.`,
      );
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

  function termsPanelHtml() {
    const total = totals().total;
    return `<section class="panel commercial-terms-panel no-print">
      <div class="terms-head">
        <div><span class="ux-eyebrow">BƯỚC 1 · MÔ HÌNH & THỜI HẠN</span><h3>Điều kiện thương mại</h3><p class="help">Chọn mô hình trước, sau đó mới hoàn thiện chương trình, thiết bị và đào tạo.</p></div>
        <div class="ux-total"><small>Tạm tính hiện tại</small><strong>${money(total)}</strong></div>
      </div>
      <div class="commercial-model-grid">
        <button type="button" class="commercial-model-card active" aria-pressed="true">
          <b>Theo điểm trường</b><span>Quyền sử dụng + đồng hành theo tháng</span><small>Đang áp dụng</small>
        </button>
        <button type="button" class="commercial-model-card locked" id="flex-model-info" aria-pressed="false">
          <b>Theo số trẻ · Flex</b><span>Gộp chương trình/nền tảng/QA–đồng hành</span><small>Chờ khóa đơn giá chính thức</small>
        </button>
      </div>
      <div class="term-controls">
        <div class="term-control"><label>Thời hạn quyền sử dụng</label><div class="segmented">${[12,36,60].map((m) => `<button type="button" data-term-months="${m}" class="${state.termMonths === m ? "active" : ""}">${m} tháng</button>`).join("")}</div></div>
        <div class="term-control"><label>Thời gian đồng hành</label><div class="support-month-input"><button type="button" data-support-step="-1">−</button><input id="support-months" type="number" min="1" max="60" value="${state.supportMonths}"><span>tháng</span><button type="button" data-support-step="1">+</button></div><small>Đơn giá được tính theo tháng và theo quy mô trẻ.</small></div>
      </div>
      <div class="model-rule-note"><b>Logic hiện hành:</b> mô hình theo điểm trường tính quyền sử dụng và đồng hành riêng. Mô hình Flex theo số trẻ sẽ thay thế cả hai dòng này khi đơn giá Flex được khóa; thiết bị, học cụ, đào tạo và sát hạch vẫn tính riêng.</div>
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
    button.onclick = () => {
      grid.hidden = !grid.hidden;
      button.textContent = grid.hidden ? "Xem / chỉnh thuyết minh" : "Thu gọn thuyết minh";
    };
    head?.appendChild(button);
    const hint = document.createElement("div");
    hint.className = "narrative-compact-hint";
    hint.innerHTML = `<span>✓ 6 mục thuyết minh đã được tạo</span><span>✓ Lưu cùng phiên bản báo giá</span><span>✓ Admin duyệt trước khi xuất</span>`;
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
      root.querySelectorAll("[data-term-months]").forEach((button) => {
        button.onclick = () => {
          state.termMonths = Number(button.dataset.termMonths);
          refreshBuilder();
        };
      });
      root.querySelectorAll("[data-support-step]").forEach((button) => {
        button.onclick = () => {
          state.supportMonths = Math.max(1, Math.min(60, state.supportMonths + Number(button.dataset.supportStep || 0)));
          refreshBuilder();
        };
      });
      const input = root.querySelector("#support-months");
      if (input) input.onchange = () => {
        state.supportMonths = Math.max(1, Math.min(60, Number(input.value || 12)));
        refreshBuilder();
      };
      root.querySelector("#flex-model-info")?.addEventListener("click", () => {
        alert("Mô hình Theo số trẻ · Flex đã xác định logic nhưng chưa bật để lập báo giá vì đơn giá/cap chưa được khóa. Khi bật, phí Flex sẽ thay thế cả Quyền sử dụng và Đồng hành cho cùng kỳ/phạm vi.");
      });
    }
    formatNarrativeMonths();
    compactNarrativePanel();
  };

  // Make Admin approval a scan-friendly two-column workspace on desktop.
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
    .commercial-model-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}.commercial-model-card{text-align:left;padding:13px 14px;border-radius:12px;border:1px solid rgba(0,0,0,.12);background:#fff;display:grid;gap:4px}.commercial-model-card.active{border-color:rgba(15,118,110,.5);box-shadow:0 0 0 2px rgba(15,118,110,.08)}.commercial-model-card.locked{opacity:.66;cursor:help}.commercial-model-card span,.commercial-model-card small{font-size:12px}.commercial-model-card small{opacity:.68}
    .term-controls{display:grid;grid-template-columns:1fr 1fr;gap:14px}.term-control>label{display:block;font-weight:750;margin-bottom:7px}.segmented{display:flex;border:1px solid rgba(0,0,0,.12);border-radius:10px;overflow:hidden;width:max-content;max-width:100%}.segmented button{border:0;border-right:1px solid rgba(0,0,0,.1);padding:9px 15px;background:#fff;cursor:pointer}.segmented button:last-child{border-right:0}.segmented button.active{font-weight:800;background:rgba(15,118,110,.11)}
    .support-month-input{display:flex;align-items:center;width:max-content;border:1px solid rgba(0,0,0,.12);border-radius:10px;overflow:hidden}.support-month-input button{border:0;background:#fff;padding:9px 12px;font-size:16px}.support-month-input input{width:64px;border:0;text-align:center;font:inherit;font-weight:750;padding:9px 4px}.support-month-input span{padding-right:11px;font-size:12px;opacity:.7}.term-control>small{display:block;margin-top:5px;opacity:.65}.model-rule-note{margin-top:13px;padding:10px 12px;border-radius:9px;background:rgba(0,0,0,.035);font-size:12px;line-height:1.5}
    .narrative-toggle{margin-left:auto}.narrative-compact-hint{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 2px}.narrative-compact-hint span{font-size:11.5px;padding:6px 9px;border-radius:999px;background:rgba(15,118,110,.07)}
    .approval-workspace{display:grid;grid-template-columns:minmax(330px,38%) minmax(0,62%);gap:16px;align-items:start}.approval-workspace>#approval-detail{position:sticky;top:12px;max-height:calc(100vh - 24px);overflow:auto}.approval-workspace .table-wrap{max-height:70vh;overflow:auto}
    @media(max-width:980px){.commercial-model-grid,.term-controls{grid-template-columns:1fr}.terms-head{display:block}.ux-total{text-align:left;margin-top:10px}.approval-workspace{grid-template-columns:1fr}.approval-workspace>#approval-detail{position:static;max-height:none}.segmented{width:100%}.segmented button{flex:1}}
    @media print{#commercial-terms-root,.commercial-terms-panel,.narrative-compact-hint,.narrative-toggle{display:none!important}}
  `;
  document.head.appendChild(style);
})();
