// Official training add-ons for Sunbot Pricebook V3.
// Prices are loaded from Backend; this module only exposes approved SKUs in the builder.
(function () {
  state.trainingExtras = state.trainingExtras || {
    initialBlocks: 0,
    retrain1: 0,
    retrain1Blocks: 0,
    retrain2: 0,
    retrain2Blocks: 0,
  };

  const baseCurrentLines = currentLines;
  currentLines = function () {
    const lines = baseCurrentLines();
    const add = (code, qty) => {
      const q = Number(qty || 0);
      if (!q) return;
      const p = C.prices[code];
      if (!p) return;
      const group = commercialGroup(code, p);
      lines.push({
        code,
        name: p.name,
        unit: p.unit,
        price: Number(p.price || 0),
        qty: q,
        group,
        max_discount: maxDiscount(group),
      });
    };

    const initialCode = state.program === "CORE" ? "TRAIN2_EXTRA10" : "TRAIN1_EXTRA10";
    add(initialCode, Math.min(3, Number(state.trainingExtras.initialBlocks || 0)));
    add("RETRAIN_1", Math.min(1, Number(state.trainingExtras.retrain1 || 0)));
    add("RETRAIN1_EXTRA10", Math.min(3, Number(state.trainingExtras.retrain1Blocks || 0)));
    add("RETRAIN_2", Math.min(1, Number(state.trainingExtras.retrain2 || 0)));
    add("RETRAIN2_EXTRA10", Math.min(3, Number(state.trainingExtras.retrain2Blocks || 0)));
    return lines;
  };

  const baseRenderBuilder = renderBuilder;
  renderBuilder = function () {
    baseRenderBuilder();
    const controls = document.querySelector(".builder-controls");
    if (!controls || document.getElementById("training-addons-block")) return;

    const initialCode = state.program === "CORE" ? "TRAIN2_EXTRA10" : "TRAIN1_EXTRA10";
    const initialName = C.prices[initialCode]?.name || "Đào tạo thêm tối đa 10 giáo viên";
    const section = document.createElement("section");
    section.id = "training-addons-block";
    section.innerHTML = `
      <h3>Đào tạo bổ sung</h3>
      <p class="help">Khóa khởi tạo đã gồm tối đa 20 giáo viên. Mỗi block bổ sung thêm tối đa 10 người; tối đa 3 block (50 giáo viên). Trên 50 giáo viên dùng cấu hình riêng.</p>
      <div class="three">
        <div class="field"><label>${esc(initialName)} · số block</label><input data-training-extra="initialBlocks" type="number" min="0" max="3" value="${Number(state.trainingExtras.initialBlocks || 0)}"></div>
        <div class="field"><label>Tái đào tạo 1 phân môn · số đợt</label><input data-training-extra="retrain1" type="number" min="0" max="1" value="${Number(state.trainingExtras.retrain1 || 0)}"></div>
        <div class="field"><label>Tái đào tạo +10 GV – 1 phân môn · số block</label><input data-training-extra="retrain1Blocks" type="number" min="0" max="3" value="${Number(state.trainingExtras.retrain1Blocks || 0)}"></div>
        <div class="field"><label>Tái đào tạo 2 phân môn · số đợt</label><input data-training-extra="retrain2" type="number" min="0" max="1" value="${Number(state.trainingExtras.retrain2 || 0)}"></div>
        <div class="field"><label>Tái đào tạo +10 GV – 2 phân môn · số block</label><input data-training-extra="retrain2Blocks" type="number" min="0" max="3" value="${Number(state.trainingExtras.retrain2Blocks || 0)}"></div>
      </div>`;

    const firstNotice = controls.querySelector(".notice");
    if (firstNotice) controls.insertBefore(section, firstNotice);
    else controls.appendChild(section);

    section.querySelectorAll("[data-training-extra]").forEach((input) => {
      input.onchange = () => {
        const key = input.dataset.trainingExtra;
        const max = key === "retrain1" || key === "retrain2" ? 1 : 3;
        state.trainingExtras[key] = Math.max(0, Math.min(max, Number(input.value || 0)));
        invalidate();
        renderContent();
      };
    });
  };
})();
