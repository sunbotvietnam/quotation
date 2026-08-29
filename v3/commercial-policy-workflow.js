// Persist and enforce the point-vs-scale commercial policy without coupling it to the pricing UI.
(function () {
  const EXCEPTION_KEY = "sunbot_pricebook_v3_model_exception_reason";

  state.modelExceptionReason = sessionStorage.getItem(EXCEPTION_KEY) || "";

  function recommendedModel() {
    return Number(state.siteCount || 1) >= 2 ? "SCALE" : "POINT";
  }

  function rights12Code(program) {
    if (program === "LT") return "RIGHT_LT_12M";
    if (program === "STEAM") return "RIGHT_STEAM_12M";
    return "RIGHT_CORE_12M";
  }

  function support12Code(students) {
    const band = students <= 150 ? "A" : students <= 300 ? "B" : students <= 500 ? "C" : "D";
    return `SUPPORT_${band}_12M`;
  }

  function programFactor() {
    if (state.program === "STEAM") return 0.7;
    if (state.program === "CORE") return 1.2;
    return 1;
  }

  function minimumSchoolYearFee() {
    if (state.program === "STEAM") return 18000000;
    if (state.program === "CORE") return 30000000;
    return 24000000;
  }

  function frequencyFactor() {
    return Number(state.scaleSessions) === 8 ? 1.5 : 1;
  }

  function progressivePerSessionFee(students) {
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

  function scaleComparisonFee() {
    const raw = progressivePerSessionFee(state.students) * 36 * frequencyFactor() * programFactor();
    return Math.max(Math.round(raw), minimumSchoolYearFee());
  }

  function pointComparisonFee() {
    const sites = Math.max(1, Number(state.siteCount || 1));
    const avgStudents = Math.max(1, Math.ceil(Number(state.students || 0) / sites));
    const rights = Number(C.prices?.[rights12Code(state.program)]?.price || 0);
    const support = Number(C.prices?.[support12Code(avgStudents)]?.price || 0);
    return (rights + support) * sites;
  }

  function policyContext() {
    const recommended = recommendedModel();
    const selected = String(state.commercialModel || "POINT");
    const pointAmount = pointComparisonFee();
    const scaleAmount = scaleComparisonFee();
    return {
      deployment_sites: Math.max(1, Number(state.siteCount || 1)),
      learner_count: Math.max(0, Number(state.students || 0)),
      commercial_model: selected,
      recommended_model: recommended,
      policy_match: selected === recommended,
      scale_sessions_per_month: Number(state.scaleSessions || 4),
      frequency_factor: frequencyFactor(),
      point_comparison_amount: pointAmount,
      scale_comparison_amount: scaleAmount,
      comparison_difference: Math.abs(pointAmount - scaleAmount),
      cheaper_model: pointAmount === scaleAmount ? "EQUAL" : pointAmount < scaleAmount ? "POINT" : "SCALE",
      model_exception_reason: String(state.modelExceptionReason || "").trim(),
    };
  }

  window.sunbotCommercialPolicyContext = policyContext;

  function persistReason(value) {
    state.modelExceptionReason = String(value || "");
    sessionStorage.setItem(EXCEPTION_KEY, state.modelExceptionReason);
  }

  const baseRenderBuilder = renderBuilder;
  renderBuilder = function () {
    baseRenderBuilder();
    const root = document.getElementById("commercial-terms-root");
    if (!root || root.querySelector(".model-exception-panel")) return;
    const ctx = policyContext();
    const target = root.querySelector(".model-comparison") || root.querySelector(".commercial-terms-panel");
    if (!target) return;
    const panel = document.createElement("div");
    panel.className = `model-exception-panel ${ctx.policy_match ? "matched" : "warning"}`;
    panel.innerHTML = ctx.policy_match
      ? `<b>Đúng quy chế</b><span>Mô hình đang chọn phù hợp với ${ctx.deployment_sites} điểm triển khai. Căn cứ này sẽ được gửi cùng hồ sơ duyệt.</span>`
      : `<div><b>Ngoại lệ so với quy chế</b><span>Mô hình đang chọn khác khuyến nghị. Phải ghi lý do để Admin có căn cứ duyệt.</span></div><textarea id="model-exception-reason" rows="2" placeholder="Ví dụ: các điểm vận hành độc lập, có tài khoản học liệu và QA riêng...">${esc(state.modelExceptionReason || "")}</textarea>`;
    target.insertAdjacentElement("afterend", panel);
    const input = panel.querySelector("#model-exception-reason");
    if (input) input.oninput = () => persistReason(input.value);
  };

  // Save policy evidence with every approval request. Current backend safely ignores unknown
  // fields; exception_reason/notes are already persisted and audited by the live backend.
  const baseBridge = bridge;
  bridge = function (mode, subaction, payload = {}, token = state.token) {
    if (mode === "quotationShared" && subaction === "saveSnapshot") {
      const ctx = policyContext();
      if (!ctx.policy_match && !ctx.model_exception_reason) {
        return Promise.reject(new Error("Mô hình đang chọn là ngoại lệ. Hãy nhập lý do lựa chọn trước khi gửi Admin duyệt."));
      }
      const next = {
        ...payload,
        deployment_sites: ctx.deployment_sites,
        learner_count: ctx.learner_count,
        commercial_model: ctx.commercial_model,
        recommended_model: ctx.recommended_model,
        policy_match: ctx.policy_match,
        scale_sessions_per_month: ctx.scale_sessions_per_month,
        frequency_factor: ctx.frequency_factor,
        point_comparison_amount: ctx.point_comparison_amount,
        scale_comparison_amount: ctx.scale_comparison_amount,
        comparison_difference: ctx.comparison_difference,
        cheaper_model: ctx.cheaper_model,
        model_exception_reason: ctx.model_exception_reason,
      };
      if (!ctx.policy_match) {
        next.exception_reason = ctx.model_exception_reason;
        next.notes = ctx.model_exception_reason;
      }
      return baseBridge(mode, subaction, next, token);
    }
    return baseBridge(mode, subaction, payload, token);
  };

  const baseCopySummary = copySummary;
  copySummary = async function (lines, total) {
    const ctx = policyContext();
    const modelLabel = ctx.commercial_model === "SCALE" ? "Theo quy mô" : "Theo điểm trường";
    const recommendedLabel = ctx.recommended_model === "SCALE" ? "Theo quy mô" : "Theo điểm trường";
    const policyText = `\nSố điểm: ${ctx.deployment_sites}\nMô hình đang chọn: ${modelLabel}\nKhuyến nghị quy chế: ${recommendedLabel}\nSo sánh 12 tháng: điểm ${money(ctx.point_comparison_amount)} · quy mô ${money(ctx.scale_comparison_amount)}${ctx.policy_match ? "" : `\nLý do ngoại lệ: ${ctx.model_exception_reason || "CHƯA NHẬP"}`}`;
    try {
      const originalWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
      let captured = "";
      navigator.clipboard.writeText = async (text) => { captured = text; };
      await baseCopySummary(lines, total);
      navigator.clipboard.writeText = originalWrite;
      await originalWrite(captured + policyText);
      alert("Đã sao chép tóm tắt nội bộ kèm căn cứ chọn mô hình.");
    } catch {
      const fallback = `${state.client || "Khách hàng"}${policyText}\nTỔNG: ${money(total)}`;
      try { await navigator.clipboard.writeText(fallback); alert("Đã sao chép tóm tắt nội bộ."); }
      catch { alert(fallback); }
    }
  };

  const style = document.createElement("style");
  style.textContent = `
    .model-exception-panel{margin:0 0 14px;padding:11px 12px;border-radius:10px;font-size:12px;line-height:1.45;display:grid;gap:8px}
    .model-exception-panel.matched{background:rgba(15,118,110,.06);border:1px solid rgba(15,118,110,.16)}
    .model-exception-panel.warning{background:rgba(217,119,6,.07);border:1px solid rgba(217,119,6,.22)}
    .model-exception-panel span{display:block;margin-top:2px;opacity:.76}
    .model-exception-panel textarea{width:100%;box-sizing:border-box;resize:vertical;border:1px solid rgba(0,0,0,.16);border-radius:8px;padding:8px 10px;font:inherit;background:#fff}
  `;
  document.head.appendChild(style);
})();