(function () {
  const { esc, friendlyError, debounce } = QV3Utils,
    state = () => QV3State.data;
  const programLine = () =>
    state().solution.lines.find(
      (line) => QV3Catalog.item(line.item_id)?.item_type === "PROGRAM",
    );
  function certificationFor(program) {
    const two = (program?.tags || []).some((tag) =>
      /bundle|2 phân môn/i.test(tag),
    );
    return state().catalog.items.find(
      (item) =>
        /chứng nhận|sát hạch/i.test(item.category) &&
        item.tags.some((tag) =>
          two ? /2 phân môn|bundle/i.test(tag) : /1 phân môn/i.test(tag),
        ),
    );
  }
  function ensureCertification() {
    const solution = state().solution,
      program = QV3Catalog.item(programLine()?.item_id),
      wanted = certificationFor(program);
    solution.lines = solution.lines.filter(
      (line) =>
        !/chứng nhận|sát hạch/i.test(
          QV3Catalog.item(line.item_id)?.category || "",
        ),
    );
    if (wanted && state().context.teachers > 0)
      solution.lines.push({
        item_id: wanted.item_id,
        quantity: state().context.teachers,
        required: false,
        can_edit: true,
        note: "",
      });
  }
  function selectCombo(code, custom = false) {
    const source =
      code ||
      state().catalog.combos.find((c) => c.recommended)?.combo_code ||
      state().catalog.combos[0]?.combo_code;
    state().solution.comboCode = custom ? "CUSTOM" : source;
    state().solution.lines = QV3Catalog.comboLines(source);
    state().view = "BUILDER";
    ensureCertification();
    QV3State.markDirty("SOLUTION");
    render();
    refreshPreview();
  }
  function renderCombos() {
    const combos = state().catalog.combos || [];
    document.getElementById("content").innerHTML =
      `<div class="notice ok"><b>Basic / Standard / Plus là cấu hình triển khai.</b> Chọn cấu hình phù hợp rồi điều chỉnh theo nhu cầu thực tế.</div><div class="grid" style="margin-top:14px">${combos.map((combo) => `<article class="panel combo ${combo.recommended ? "recommended" : ""}"><div class="meta"><span class="badge">${esc(combo.combo_code)}</span>${combo.recommended ? '<span class="badge">KHUYẾN NGHỊ</span>' : ""}</div><h3>${esc(combo.name)}</h3><p>${esc(combo.description)}</p><div class="price">${QV3Catalog.comboLines(combo.combo_code).length} cấu phần</div><button class="btn" data-combo="${esc(combo.combo_code)}">Chọn cấu hình</button></article>`).join("")}<article class="panel combo"><span class="badge">LINH HOẠT</span><h3>Tự cấu hình</h3><p>Bắt đầu từ cấu hình khuyến nghị rồi thêm, bớt hoặc điều chỉnh theo nhu cầu.</p><div class="price">Theo cấu hình</div><button class="btn secondary" id="customCombo">Tạo cấu hình riêng</button></article></div>`;
    document
      .querySelectorAll("[data-combo]")
      .forEach(
        (button) => (button.onclick = () => selectCombo(button.dataset.combo)),
      );
    document.getElementById("customCombo").onclick = () =>
      selectCombo("", true);
  }
  function lineRows() {
    return state()
      .solution.lines.filter(
        (line) => QV3Catalog.item(line.item_id)?.item_type !== "PROGRAM",
      )
      .map((line) => {
        const item = QV3Catalog.item(line.item_id);
        return `<div class="config-line"><div><b>${esc(item?.name || line.item_id)}</b><small>${esc(item?.category || "")} · ${esc(item?.unit || "")}</small></div><input data-item="${esc(line.item_id)}" type="number" min="0" value="${line.quantity}" ${line.can_edit === false ? "disabled" : ""}><button class="retail-remove" data-remove-item="${esc(line.item_id)}" ${line.required ? "disabled" : ""}>×</button></div>`;
      })
      .join("");
  }
  function addOptions() {
    const selected = new Set(
      state().solution.lines.map((line) => line.item_id),
    );
    return state()
      .catalog.items.filter(
        (item) =>
          !selected.has(item.item_id) &&
          item.item_type !== "PROGRAM" &&
          item.quote_selectable,
      )
      .map(
        (item) =>
          `<option value="${esc(item.item_id)}">${esc(item.category)} · ${esc(item.name)}</option>`,
      )
      .join("");
  }
  function render() {
    const solution = state().solution,
      programs = QV3Catalog.itemsByType("PROGRAM"),
      program = programLine(),
      saved = QV3State.quoteStatus("SOLUTION") === "SAVED",
      hasPrevious = Boolean(solution.saved);
    document.getElementById("content").innerHTML =
      `<div class="builder-shell"><section class="panel builder-controls no-print"><div class="builder-head"><div><span class="badge">${esc(solution.comboCode === "CUSTOM" ? "Cấu hình riêng" : QV3Catalog.combo(solution.comboCode)?.name || "Giải pháp Sunbot")}</span><h2>Tạo cấu hình & báo giá</h2><p class="help">Hoàn thiện cấu hình, kiểm tra bản xem trước rồi lưu để cấp mã chính thức.</p></div><button class="btn secondary" id="backCombo">Đổi cấu hình</button></div><div class="three"><div class="field"><label>Khách hàng</label><input id="customerName" value="${esc(state().customer.name)}" placeholder="Tên trường / đơn vị"></div><div class="field"><label>Người lập báo giá</label><input id="createdBy" value="${esc(state().createdBy)}" placeholder="Họ và tên"></div><div class="field"><label>Số trẻ triển khai</label><input id="students" type="number" min="1" value="${state().context.students}"></div></div><div class="three"><div class="field"><label>Phạm vi và thời hạn chương trình</label><select id="programItem">${programs.map((item) => `<option value="${esc(item.item_id)}" ${program?.item_id === item.item_id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select></div><div class="field"><label>Số giáo viên sát hạch</label><input id="teachers" type="number" min="0" value="${state().context.teachers}"></div><div class="field"><label>Thêm hạng mục</label><div class="toolbar"><select id="addItem">${addOptions()}</select><button class="btn secondary" id="addLine">Thêm</button></div></div></div><h3>Cấu phần triển khai</h3><div class="config-lines">${lineRows()}</div><div class="toolbar builder-actions"><button class="btn secondary" id="saveQuote">${hasPrevious ? "Lưu phiên bản mới" : "Lưu báo giá"}</button><button class="btn" id="printQuote" ${saved ? "" : "disabled"}>In / Lưu PDF</button></div><div class="file-name-hint">Tên file đề xuất: <b>${esc(QV3Document.fileBase("SOLUTION"))}.pdf</b><br>${saved ? `Đã lưu: <b>${esc(solution.saved.quote_code || solution.saved.quote_id)}</b> · phiên bản ${solution.saved.version}` : "Lưu báo giá để cấp mã chính thức và mở chức năng in."}</div><div id="solutionError"></div></section><section class="quote-preview-wrap">${QV3Document.render("SOLUTION")}</section></div>`;
    bind();
  }
  function updateField() {
    state().customer.name = document.getElementById("customerName").value;
    state().createdBy = document.getElementById("createdBy").value;
    QV3Storage.setCreator(state().createdBy);
    state().context.students = Number(
      document.getElementById("students").value || 0,
    );
    state().context.teachers = Number(
      document.getElementById("teachers").value || 0,
    );
    const selectedProgram = document.getElementById("programItem").value,
      programIndex = state().solution.lines.findIndex(
        (line) => QV3Catalog.item(line.item_id)?.item_type === "PROGRAM",
      );
    if (programIndex >= 0)
      state().solution.lines[programIndex].item_id = selectedProgram;
    else
      state().solution.lines.unshift({
        item_id: selectedProgram,
        quantity: 1,
        required: true,
        can_edit: false,
        note: "",
      });
    ensureCertification();
    QV3State.markDirty("SOLUTION");
    render();
    refreshPreview();
  }
  function bind() {
    [
      "customerName",
      "createdBy",
      "students",
      "teachers",
      "programItem",
    ].forEach((id) => (document.getElementById(id).onchange = updateField));
    document.querySelectorAll("[data-item]").forEach(
      (input) =>
        (input.onchange = () => {
          const line = state().solution.lines.find(
            (x) => x.item_id === input.dataset.item,
          );
          if (line) line.quantity = Number(input.value || 0);
          QV3State.markDirty("SOLUTION");
          render();
          refreshPreview();
        }),
    );
    document.querySelectorAll("[data-remove-item]").forEach(
      (button) =>
        (button.onclick = () => {
          state().solution.lines = state().solution.lines.filter(
            (line) => line.item_id !== button.dataset.removeItem,
          );
          QV3State.markDirty("SOLUTION");
          render();
          refreshPreview();
        }),
    );
    document.getElementById("addLine").onclick = () => {
      const id = document.getElementById("addItem").value;
      if (id)
        state().solution.lines.push({
          item_id: id,
          quantity: 1,
          required: false,
          can_edit: true,
          note: "",
        });
      QV3State.markDirty("SOLUTION");
      render();
      refreshPreview();
    };
    document.getElementById("backCombo").onclick = () => {
      state().view = "COMBOS";
      QV3App.render();
    };
    document.getElementById("saveQuote").onclick = save;
    document.getElementById("printQuote").onclick = () =>
      QV3Document.print("SOLUTION");
  }
  const refreshPreview = debounce(async () => {
    try {
      await QV3Lifecycle.preview("SOLUTION");
      if (state().mode === "SOLUTION" && state().view === "BUILDER") render();
    } catch (error) {
      const box = document.getElementById("solutionError");
      if (box)
        box.innerHTML = `<div class="notice danger">${esc(friendlyError(error))}</div>`;
    }
  }, 180);
  async function save() {
    try {
      document.body.classList.add("busy");
      await QV3Lifecycle.save("SOLUTION");
      render();
    } catch (error) {
      alert(error?.message || friendlyError(error));
    } finally {
      document.body.classList.remove("busy");
    }
  }
  window.QV3Solution = { renderCombos, render, selectCombo };
})();
