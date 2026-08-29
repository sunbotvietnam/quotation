// Scale-pricing integrity layer.
// Ensures 4 vs 8 sessions always differ, including when the annual minimum applies.
(function () {
  const BASE_SESSIONS_YEAR = 36;

  function factorFor(sessions) {
    return Number(sessions) === 8 ? 1.5 : 1;
  }
  function programFactor() {
    if (state.program === "STEAM") return 0.7;
    if (state.program === "CORE") return 1.2;
    return 1;
  }
  function baseMinimum() {
    if (state.program === "STEAM") return 18000000;
    if (state.program === "CORE") return 30000000;
    return 24000000;
  }
  function progressiveBase(students) {
    const n = Math.max(0, Number(students || 0));
    const tiers = [
      ["SELF_FEE_1P_T1", 1, 150],
      ["SELF_FEE_1P_T2", 151, 300],
      ["SELF_FEE_1P_T3", 301, 500],
      ["SELF_FEE_1P_T4", 501, 800],
      ["SELF_FEE_1P_T5", 801, Infinity],
    ];
    return tiers.reduce((sum, [code, from, to]) => {
      if (n < from) return sum;
      const count = Math.max(0, Math.min(n, to) - from + 1);
      return sum + count * Number(C.prices?.[code]?.price || 0);
    }, 0);
  }
  function feeFor(sessions) {
    const factor = factorFor(sessions);
    const raw = progressiveBase(state.students) * BASE_SESSIONS_YEAR * factor * programFactor();
    const minimum = baseMinimum() * factor;
    return Math.max(Math.round(raw), Math.round(minimum));
  }
  function selectedFee() { return feeFor(state.scaleSessions); }

  window.sunbotScalePricing = {
    feeFor,
    factorFor,
    selectedFee,
    baseMinimum,
    progressiveBase,
  };

  const baseCurrentLines = currentLines;
  currentLines = function () {
    const lines = baseCurrentLines();
    if (state.commercialModel !== "SCALE") return lines;
    const fee = selectedFee();
    return lines.map((line) => String(line.code || "") === "SELF_DELIVERY_SCALE_FEE"
      ? { ...line, price: fee, qty: 1, name: `Phí sử dụng chương trình, nền tảng và hỗ trợ triển khai theo quy mô · ${Math.max(1, Number(state.siteCount || 1))} điểm · ${Number(state.scaleSessions || 4)} buổi/tháng` }
      : line);
  };

  function patchScalePanel() {
    const root = document.getElementById("commercial-terms-root");
    if (!root || state.commercialModel !== "SCALE") return;
    const f4 = feeFor(4), f8 = feeFor(8), selected = selectedFee();
    const selectedFactor = factorFor(state.scaleSessions);
    const raw = Math.round(progressiveBase(state.students) * BASE_SESSIONS_YEAR * selectedFactor * programFactor());
    const minimum = Math.round(baseMinimum() * selectedFactor);

    const oldPreview = root.querySelector(".scale-preview b");
    if (oldPreview) {
      oldPreview.textContent = `${money(progressiveBase(state.students))}/lượt chuẩn × 36 lượt chuẩn/năm × hệ số tần suất ${selectedFactor.toFixed(2).replace(".", ",")} × hệ số chương trình ${programFactor().toFixed(2).replace(".", ",")} = ${money(selected)}${selected > raw ? ` · áp dụng mức tối thiểu theo tần suất ${money(minimum)}` : ""}`;
    }

    const grid = root.querySelector(".comparison-grid");
    if (grid) {
      const scaleCell = grid.querySelector(":scope > div:nth-child(2)");
      const diffCell = grid.querySelector(":scope > div:nth-child(3)");
      const pointText = grid.querySelector(":scope > div:nth-child(1) strong")?.textContent || "0";
      const point = Number(pointText.replace(/[^0-9]/g, "")) || 0;
      if (scaleCell) {
        const s = scaleCell.querySelector("strong");
        if (s) s.textContent = money(selected);
      }
      if (diffCell) {
        const diff = Math.abs(point - selected);
        const s = diffCell.querySelector("strong");
        const span = diffCell.querySelector("span");
        if (s) s.textContent = money(diff);
        if (span) span.textContent = point === selected ? "Hai phương án ngang nhau" : point < selected ? "Theo điểm trường rẻ hơn" : "Theo quy mô rẻ hơn";
      }
    }

    if (!root.querySelector(".frequency-price-audit")) {
      const host = root.querySelector(".scale-preview") || root.querySelector(".term-controls");
      if (host) {
        const audit = document.createElement("div");
        audit.className = "frequency-price-audit";
        audit.innerHTML = `
          <div class="frequency-audit-head"><b>Kiểm tra tần suất & phí năm học</b><small>8 buổi/tháng dùng hệ số 1,50; mức tối thiểu cũng tăng theo cùng hệ số nên không còn trường hợp 4 và 8 buổi bằng giá nhau.</small></div>
          <div class="frequency-audit-grid">
            <div class="${Number(state.scaleSessions) === 4 ? "active" : ""}"><span>4 buổi/tháng</span><strong>${money(f4)}</strong><small>Hệ số 1,00 · tối thiểu ${money(baseMinimum())}</small></div>
            <div class="${Number(state.scaleSessions) === 8 ? "active" : ""}"><span>8 buổi/tháng</span><strong>${money(f8)}</strong><small>Hệ số 1,50 · tối thiểu ${money(Math.round(baseMinimum() * 1.5))}</small></div>
          </div>`;
        host.insertAdjacentElement("afterend", audit);
      }
    }
  }

  const baseRenderBuilder = renderBuilder;
  renderBuilder = function () {
    baseRenderBuilder();
    patchScalePanel();
  };

  // Last-mile payload guard: keep the displayed line and the approval payload identical.
  const baseBridge = bridge;
  bridge = function (mode, subaction, payload = {}, token = state.token) {
    if (mode === "quotationShared" && subaction === "saveSnapshot" && String(payload.commercial_model || state.commercialModel) === "SCALE") {
      const sessions = Number(payload.scale_sessions_per_month || state.scaleSessions || 4);
      const fee = feeFor(sessions);
      const next = {
        ...payload,
        scale_program: String(payload.scale_program || state.program || "CORE"),
        frequency_factor: factorFor(sessions),
        scale_comparison_amount: fee,
        scale_4_amount: feeFor(4),
        scale_8_amount: feeFor(8),
        lines: (payload.lines || []).map((line) => String(line.item_id || line.code || "") === "SELF_DELIVERY_SCALE_FEE"
          ? { ...line, proposed_unit_price: fee, unit_price: fee, price: fee, qty: 1, line_total: fee }
          : line),
      };
      return baseBridge(mode, subaction, next, token);
    }
    return baseBridge(mode, subaction, payload, token);
  };

  const style = document.createElement("style");
  style.textContent = `
    .frequency-price-audit{margin:12px 0 0;padding:12px;border:1px solid rgba(15,118,110,.18);border-radius:10px;background:#fff}
    .frequency-audit-head{display:grid;gap:3px;margin-bottom:9px}.frequency-audit-head small{font-size:11px;color:#667c78;line-height:1.45}
    .frequency-audit-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.frequency-audit-grid>div{display:grid;gap:3px;padding:10px;border-radius:9px;background:#f6f8f8;border:1px solid transparent}.frequency-audit-grid>div.active{background:rgba(15,118,110,.07);border-color:rgba(15,118,110,.28)}.frequency-audit-grid span{font-size:11px;font-weight:750}.frequency-audit-grid strong{font-size:18px}.frequency-audit-grid small{font-size:10px;color:#667c78}
    @media(max-width:720px){.frequency-audit-grid{grid-template-columns:1fr}}
    @media print{.frequency-price-audit{display:none!important}}
  `;
  document.head.appendChild(style);
})();