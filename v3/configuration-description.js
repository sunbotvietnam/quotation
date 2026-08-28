// Auto-generated configuration explanation with Sales edit support.
(function () {
  const DEFAULT_KEY = "sunbot_pricebook_v3_config_description";
  const DIRTY_KEY = "sunbot_pricebook_v3_config_description_dirty";

  state.configDescription = sessionStorage.getItem(DEFAULT_KEY) || "";
  state.configDescriptionDirty = sessionStorage.getItem(DIRTY_KEY) === "1";

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function naturalJoin(values) {
    const list = unique(values);
    if (!list.length) return "";
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} và ${list[1]}`;
    return `${list.slice(0, -1).join(", ")} và ${list[list.length - 1]}`;
  }

  function programText() {
    if (state.program === "LT") return "phân môn Lập trình tư duy cùng Sunbot";
    if (state.program === "STEAM") return "phân môn STEAM Sáng tạo cùng Sunbot";
    return "02 phân môn Lập trình tư duy cùng Sunbot và STEAM Sáng tạo cùng Sunbot";
  }

  function equipmentText() {
    const parts = [];
    Object.entries(state.items || {}).forEach(([code, qty]) => {
      const n = Number(qty || 0);
      if (!n) return;
      const item = C.prices?.[code];
      if (!item) return;
      const type = String(item.item_type || "").toUpperCase();
      if (!["HARDWARE", "MATERIAL"].includes(type)) return;
      parts.push(`${n} ${String(item.unit || "bộ").replace(/^đ\//, "")} ${item.name}`);
    });
    return naturalJoin(parts);
  }

  function extraTrainingText() {
    const labels = [];
    const map = {
      TRAIN1_EXTRA10: "đào tạo bổ sung theo block +10 giáo viên",
      TRAIN2_EXTRA10: "đào tạo bổ sung theo block +10 giáo viên",
      RETRAIN_1: "tái đào tạo 1 phân môn",
      RETRAIN_2: "tái đào tạo 2 phân môn",
      RETRAIN1_EXTRA10: "tái đào tạo bổ sung theo block +10 giáo viên",
      RETRAIN2_EXTRA10: "tái đào tạo bổ sung theo block +10 giáo viên",
    };
    Object.entries(state.items || {}).forEach(([code, qty]) => {
      if (Number(qty || 0) > 0 && map[code]) labels.push(map[code]);
    });
    return naturalJoin(labels);
  }

  function generateConfigurationDescription() {
    const students = Math.max(0, Number(state.students || 0));
    const years = Number(state.years || 0);
    const teachers = Math.max(0, Number(state.teachers || 0));
    const equipment = equipmentText();
    const extraTraining = extraTrainingText();
    const sentences = [];

    sentences.push(
      `Phương án được xây dựng cho quy mô dự kiến khoảng ${students || "…"} trẻ, triển khai ${programText()}${years ? ` với thời hạn quyền sử dụng ${years} năm` : ""}.`,
    );

    const includes = ["quyền sử dụng chương trình và nội dung số"];
    if (equipment) includes.push(equipment);
    includes.push("đào tạo khởi tạo cho đội ngũ giáo viên theo gói chuẩn");
    includes.push(`đồng hành vận hành phù hợp với quy mô ${students || "dự kiến"} trẻ`);
    if (teachers) includes.push(`sát hạch/chứng nhận dự kiến cho ${teachers} giáo viên`);
    if (extraTraining) includes.push(extraTraining);
    sentences.push(`Cấu hình dự kiến bao gồm ${naturalJoin(includes)}.`);

    sentences.push(
      "Nhà trường có thể cùng Sunbot điều chỉnh số lượng thiết bị, quy mô đào tạo và phạm vi đồng hành sau khi rà soát điều kiện triển khai thực tế; cấu hình chính thức sẽ được xác nhận trước khi ký kết.",
    );
    return sentences.join(" ");
  }

  function setGenerated(force) {
    if (!force && state.configDescriptionDirty) return;
    state.configDescription = generateConfigurationDescription();
    state.configDescriptionDirty = false;
    sessionStorage.setItem(DEFAULT_KEY, state.configDescription);
    sessionStorage.setItem(DIRTY_KEY, "0");
  }

  setGenerated(false);

  const baseApplyCombo = applyCombo;
  applyCombo = function (code) {
    baseApplyCombo(code);
    state.configDescriptionDirty = false;
    setGenerated(true);
    renderContent();
  };

  const baseRenderBuilder = renderBuilder;
  renderBuilder = function () {
    if (!state.configDescriptionDirty) setGenerated(true);
    baseRenderBuilder();
    const controls = document.querySelector(".builder-controls");
    if (!controls || document.getElementById("configuration-description")) return;
    const panel = document.createElement("section");
    panel.className = "panel config-description-panel";
    panel.style.marginTop = "14px";
    panel.innerHTML = `
      <div class="builder-head">
        <div>
          <h3>Diễn giải cấu hình cho khách hàng</h3>
          <p class="help">Hệ thống tự tạo từ cấu hình hiện tại. Có thể chỉnh câu chữ trước khi gửi duyệt; không nên thêm cam kết ngoài phạm vi đã chọn.</p>
        </div>
        <button type="button" class="btn secondary" id="regenerate-config-description">Tạo lại từ cấu hình</button>
      </div>
      <textarea id="configuration-description" rows="6" maxlength="1600" style="width:100%;resize:vertical">${esc(state.configDescription)}</textarea>
      <div class="help" id="config-description-status">Nội dung này sẽ đi cùng phiên bản báo giá gửi Admin duyệt và xuất cho khách hàng.</div>`;
    controls.insertAdjacentElement("afterend", panel);

    const textarea = document.getElementById("configuration-description");
    textarea.addEventListener("input", () => {
      state.configDescription = textarea.value.trim();
      state.configDescriptionDirty = true;
      sessionStorage.setItem(DEFAULT_KEY, state.configDescription);
      sessionStorage.setItem(DIRTY_KEY, "1");
      document.getElementById("config-description-status").textContent = "Đã chỉnh thủ công · hệ thống sẽ không tự ghi đè.";
    });
    document.getElementById("regenerate-config-description").onclick = () => {
      state.configDescriptionDirty = false;
      setGenerated(true);
      textarea.value = state.configDescription;
      document.getElementById("config-description-status").textContent = "Đã tạo lại theo cấu hình hiện tại.";
    };
  };

  // Inject the approved wording into saveSnapshot without changing other bridge calls.
  const baseBridge = bridge;
  bridge = function (mode, subaction, payload = {}, token = state.token) {
    if (mode === "quotationShared" && subaction === "saveSnapshot") {
      const copy = { ...(payload || {}) };
      const textarea = document.getElementById("configuration-description");
      const text = String(textarea?.value ?? state.configDescription ?? "").trim();
      copy.configuration_description = text || generateConfigurationDescription();
      state.configDescription = copy.configuration_description;
      sessionStorage.setItem(DEFAULT_KEY, state.configDescription);
      return baseBridge(mode, subaction, copy, token);
    }
    return baseBridge(mode, subaction, payload, token);
  };

  function quoteIdFromDocument(doc) {
    const code = doc.querySelector(".quote-meta b")?.textContent?.trim() || "";
    const match = code.match(/^BG\/SUNBOT\/(\d{4})\/(\d{4})-(\d{3})$/);
    return match ? `BG-SUNBOT-${match[1]}-${match[2]}-${match[3]}` : "";
  }

  async function injectDescription(doc) {
    if (!doc || doc.dataset.configDescriptionInjected === "1") return;
    doc.dataset.configDescriptionInjected = "1";
    let description = "";
    const quoteId = quoteIdFromDocument(doc);
    if (quoteId && state.token) {
      try {
        const bundle = await baseBridge("quotationShared", "getQuote", { quote_id: quoteId }, state.token);
        description = String(bundle?.quote?.configuration_description || "").trim();
      } catch (_) {}
    }
    if (!description) description = String(state.configDescription || "").trim();
    if (!description) return;
    const tableSection = doc.querySelector(".quote-table-section");
    if (!tableSection) return;
    const section = document.createElement("section");
    section.className = "quote-config-description";
    section.innerHTML = `<div class="quote-config-label">Cấu hình đề xuất</div><p>${esc(description)}</p>`;
    tableSection.insertAdjacentElement("beforebegin", section);
  }

  const style = document.createElement("style");
  style.textContent = `
    .config-description-panel textarea { font: inherit; line-height: 1.5; padding: 11px 12px; border: 1px solid rgba(0,0,0,.18); border-radius: 9px; }
    .quote-config-description { margin: 14px 0 16px; padding: 13px 16px; background: rgba(15,118,110,.055); border-radius: 9px; line-height: 1.55; font-size: 12.5px; }
    .quote-config-description p { margin: 4px 0 0; }
    .quote-config-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
    @media print { .quote-config-description { break-inside: avoid; } }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(() => {
    document.querySelectorAll(".quote-document").forEach(injectDescription);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.querySelectorAll(".quote-document").forEach(injectDescription);
})();
