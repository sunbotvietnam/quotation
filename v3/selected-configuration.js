// Editable selected-configuration summary for Sales quotation builder.
// Loaded after pricing/configuration modules so it reflects the final currentLines().
(function () {
  const EXTRA_MAP = {
    TRAIN1_EXTRA10: "initialBlocks",
    TRAIN2_EXTRA10: "initialBlocks",
    RETRAIN_1: "retrain1",
    RETRAIN1_EXTRA10: "retrain1Blocks",
    RETRAIN_2: "retrain2",
    RETRAIN2_EXTRA10: "retrain2Blocks",
  };
  const LOCKED_ITEM_CODES = new Set(["BRAND_DECOR_FORMEX"]);

  function editableKind(line) {
    const code = String(line?.code || "");
    if (!code) return "";
    if (/^CERT_/.test(code)) return "teachers";
    if (EXTRA_MAP[code]) return "trainingExtra";
    if (Object.prototype.hasOwnProperty.call(state.items || {}, code) && !LOCKED_ITEM_CODES.has(code)) return "item";
    return "";
  }

  function updateLine(code, nextQty) {
    const qty = Math.max(0, Number(nextQty || 0));
    const kind = editableKind({ code });
    if (kind === "item") state.items[code] = qty;
    if (kind === "teachers") state.teachers = qty;
    if (kind === "trainingExtra") {
      state.trainingExtras = state.trainingExtras || {};
      const key = EXTRA_MAP[code];
      const max = key === "retrain1" || key === "retrain2" ? 1 : 3;
      state.trainingExtras[key] = Math.min(max, qty);
    }
    invalidate();
    renderContent();
  }

  function panelHtml(lines, total) {
    const rows = lines.map((line) => {
      const kind = editableKind(line);
      const code = esc(line.code || "");
      const controls = kind
        ? `<div class="selected-config-qty">
            <button type="button" class="selected-config-step" data-config-minus="${code}" aria-label="Giảm số lượng">−</button>
            <input type="number" min="0" value="${Number(line.qty || 0)}" data-config-qty="${code}">
            <button type="button" class="selected-config-step" data-config-plus="${code}" aria-label="Tăng số lượng">+</button>
            <button type="button" class="selected-config-remove" data-config-remove="${code}">Xóa</button>
          </div>`
        : `<span class="selected-config-lock">Tự động theo cấu hình</span>`;
      return `<div class="selected-config-row">
        <div class="selected-config-main"><b>${esc(line.name || line.code || "")}</b><small>${esc(line.unit || "")} · ${money(line.price)} / đơn vị</small></div>
        <div class="selected-config-value"><strong>${money(Number(line.price || 0) * Number(line.qty || 0))}</strong>${controls}</div>
      </div>`;
    }).join("");
    return `<section id="selected-configuration-block" class="selected-config-block">
      <div class="selected-config-head"><div><span class="ux-eyebrow">BƯỚC CUỐI · KIỂM TRA TRƯỚC KHI GỬI DUYỆT</span><h3>Cấu hình đã chọn</h3><p class="help">Có thể sửa hoặc xóa các hạng mục tự chọn. Hạng mục hệ thống sinh tự động phải thay đổi từ điều kiện cấu hình gốc.</p></div><div class="selected-config-total"><small>${lines.length} hạng mục</small><strong>${money(total)}</strong></div></div>
      <div class="selected-config-list">${rows}</div>
    </section>`;
  }

  function bindPanel() {
    document.querySelectorAll("[data-config-minus]").forEach((btn) => {
      btn.onclick = () => {
        const code = btn.dataset.configMinus;
        const line = currentLines().find((x) => String(x.code) === code);
        updateLine(code, Number(line?.qty || 0) - 1);
      };
    });
    document.querySelectorAll("[data-config-plus]").forEach((btn) => {
      btn.onclick = () => {
        const code = btn.dataset.configPlus;
        const line = currentLines().find((x) => String(x.code) === code);
        updateLine(code, Number(line?.qty || 0) + 1);
      };
    });
    document.querySelectorAll("[data-config-qty]").forEach((input) => {
      input.onchange = () => updateLine(input.dataset.configQty, input.value);
    });
    document.querySelectorAll("[data-config-remove]").forEach((btn) => {
      btn.onclick = () => updateLine(btn.dataset.configRemove, 0);
    });
  }

  function injectStyles() {
    if (document.getElementById("selected-config-style")) return;
    const style = document.createElement("style");
    style.id = "selected-config-style";
    style.textContent = `
      .selected-config-block{margin-top:18px;border:1px solid #d7e3e1;border-radius:14px;background:#fbfdfd;padding:16px}
      .selected-config-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:10px}
      .selected-config-head h3{margin:2px 0 4px}.selected-config-total{text-align:right;white-space:nowrap}.selected-config-total small{display:block;color:#64748b}.selected-config-total strong{font-size:18px;color:#0f766e}
      .selected-config-list{border-top:1px solid #e2e8f0}.selected-config-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;padding:10px 0;border-bottom:1px solid #e7eeee;align-items:center}
      .selected-config-main b{display:block;font-size:13px}.selected-config-main small{display:block;color:#64748b;margin-top:3px}.selected-config-value{text-align:right}.selected-config-value>strong{display:block;font-size:13px;margin-bottom:5px}
      .selected-config-qty{display:flex;align-items:center;justify-content:flex-end;gap:5px}.selected-config-qty input{width:54px;padding:5px;text-align:center;border:1px solid #cbd5e1;border-radius:7px;background:white}
      .selected-config-step{width:28px;height:28px;border:1px solid #cbd5e1;border-radius:7px;background:white;cursor:pointer;font-weight:700}.selected-config-remove{height:28px;border:0;border-radius:7px;background:#fff1f2;color:#be123c;padding:0 9px;cursor:pointer;font-weight:700}
      .selected-config-lock{display:inline-block;font-size:11px;color:#64748b;background:#f1f5f9;border-radius:999px;padding:5px 9px}
      @media(max-width:720px){.selected-config-head,.selected-config-row{display:block}.selected-config-total,.selected-config-value{text-align:left;margin-top:8px}.selected-config-qty{justify-content:flex-start}}
    `;
    document.head.appendChild(style);
  }

  const baseRenderBuilder = renderBuilder;
  renderBuilder = function () {
    baseRenderBuilder();
    injectStyles();
    const controls = document.querySelector(".builder-controls");
    if (!controls || document.getElementById("selected-configuration-block")) return;
    const { lines, total } = totals();
    const actions = controls.querySelector(".builder-actions");
    if (actions) actions.insertAdjacentHTML("beforebegin", panelHtml(lines, total));
    else controls.insertAdjacentHTML("beforeend", panelHtml(lines, total));
    bindPanel();
  };
})();
