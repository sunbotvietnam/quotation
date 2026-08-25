(function () {
  const { esc, money, friendlyError, debounce } = QV3Utils,
    state = () => QV3State.data;
  function filtered() {
    const retail = state().retail,
      q = retail.query.trim().toLowerCase();
    return state().materials.filter(
      (item) =>
        (retail.category === "Tất cả" || item.category === retail.category) &&
        (!q ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)),
    );
  }
  function add(id) {
    const retail = state().retail,
      found = retail.lines.find((line) => line.item_id === id);
    found
      ? found.quantity++
      : retail.lines.push({ item_id: id, quantity: 1, note: "" });
    QV3State.markDirty("RETAIL");
    render();
    refreshPreview();
  }
  function addCustom() {
    const name = document.getElementById("customName").value.trim(),
      unit = document.getElementById("customUnit").value.trim(),
      price = Number(document.getElementById("customPrice").value || 0);
    if (!name || !unit || price <= 0)
      return alert("Hãy nhập đầy đủ tên, đơn vị và đơn giá.");
    state().retail.lines.push({
      item_id: "CUSTOM-" + Date.now(),
      quantity: 1,
      note: QV3_CONFIG.CUSTOM_WARNING,
      custom_name: name,
      custom_unit: unit,
      custom_unit_price: price,
    });
    QV3State.markDirty("RETAIL");
    render();
    refreshPreview();
  }
  function lineInfo(line) {
    if (line.item_id.startsWith("CUSTOM-"))
      return {
        name: line.custom_name,
        unit: line.custom_unit,
        price: line.custom_unit_price,
        category: "Tùy chỉnh",
      };
    return (
      state().materials.find((item) => item.item_id === line.item_id) || {
        name: line.item_id,
        unit: "",
        price: 0,
        category: "",
      }
    );
  }
  function render() {
    const retail = state().retail,
      categories = QV3Catalog.categories(state().materials),
      saved = QV3State.quoteStatus("RETAIL") === "SAVED",
      hasPrevious = Boolean(retail.saved);
    document.getElementById("content").innerHTML =
      `<div class="retail-shell"><section class="panel retail-controls no-print"><div class="retail-head"><div><span class="badge">BÁO GIÁ LẺ</span><h2>Vật liệu & sửa chữa lẻ</h2><p class="help">Chọn học cụ, vật tư, linh kiện hoặc dịch vụ cần báo giá.</p></div></div><div class="three"><div class="field"><label>Khách hàng</label><input id="retailCustomer" value="${esc(state().customer.name)}" placeholder="Tên trường / đơn vị"></div><div class="field"><label>Người lập báo giá</label><input id="retailCreator" value="${esc(state().createdBy)}" placeholder="Họ và tên"></div><div class="field"><label>Nhóm</label><select id="retailCategory">${categories.map((category) => `<option ${category === retail.category ? "selected" : ""}>${esc(category)}</option>`).join("")}</select></div></div><div class="field"><label>Tìm hạng mục</label><input id="retailSearch" value="${esc(retail.query)}" placeholder="Tìm vật tư, linh kiện..."></div><div class="retail-catalog">${
        filtered()
          .map(
            (item) =>
              `<div class="retail-item"><div><h4>${esc(item.name)}</h4><small>${esc(item.category)} · ${esc(item.unit)}</small></div><div><div class="retail-item-price">${money(item.recommended_price)}</div><button class="retail-add" data-add="${esc(item.item_id)}">+ Thêm</button></div></div>`,
          )
          .join("") ||
        '<div class="retail-empty">Không có hạng mục phù hợp.</div>'
      }</div><div class="retail-custom"><b>Hạng mục tùy chỉnh</b><p class="help">${esc(QV3_CONFIG.CUSTOM_WARNING)}</p><div class="retail-custom-grid"><div class="field"><label>Tên hạng mục</label><input id="customName"></div><div class="field"><label>ĐVT</label><input id="customUnit" value="Cái"></div><div class="field"><label>Đơn giá</label><input id="customPrice" type="number" min="0"></div><button class="btn secondary" id="addCustom">Thêm</button></div></div><div class="retail-cart"><h3>Hạng mục đã chọn</h3>${
        retail.lines
          .map((line) => {
            const item = lineInfo(line);
            return `<div class="retail-cart-row"><div><b>${esc(item.name)}</b><small>${money(item.recommended_price || item.price)} / ${esc(item.unit)}</small></div><input data-retail-qty="${esc(line.item_id)}" type="number" min="1" value="${line.quantity}"><input data-retail-note="${esc(line.item_id)}" value="${esc(line.note || "")}" placeholder="Ghi chú"><button class="retail-remove" data-retail-remove="${esc(line.item_id)}">×</button></div>`;
          })
          .join("") || '<div class="retail-empty">Chưa chọn hạng mục.</div>'
      }</div><div class="toolbar builder-actions"><button class="btn secondary" id="saveRetail">${hasPrevious ? "Lưu phiên bản mới" : "Lưu báo giá"}</button><button class="btn" id="printRetail" ${saved ? "" : "disabled"}>In / Lưu PDF</button></div><div class="file-name-hint">Tên file đề xuất: <b>${esc(QV3Document.fileBase("RETAIL"))}.pdf</b><br>${saved ? `Đã lưu: <b>${esc(retail.saved.quote_code || retail.saved.quote_id)}</b> · phiên bản ${retail.saved.version}` : "Lưu báo giá để cấp mã chính thức và mở chức năng in."}</div><div id="retailError"></div></section><section class="quote-preview-wrap">${QV3Document.render("RETAIL")}</section></div>`;
    bind();
  }
  function dirtyAndPreview() {
    QV3State.markDirty("RETAIL");
    render();
    refreshPreview();
  }
  function bind() {
    document.getElementById("retailCustomer").onchange = (e) => {
      state().customer.name = e.target.value;
      dirtyAndPreview();
    };
    document.getElementById("retailCreator").onchange = (e) => {
      state().createdBy = e.target.value;
      QV3Storage.setCreator(state().createdBy);
      dirtyAndPreview();
    };
    document.getElementById("retailCategory").onchange = (e) => {
      state().retail.category = e.target.value;
      render();
    };
    document.getElementById("retailSearch").oninput = (e) => {
      state().retail.query = e.target.value;
      render();
      const search = document.getElementById("retailSearch");
      search.focus();
      search.setSelectionRange(search.value.length, search.value.length);
    };
    document
      .querySelectorAll("[data-add]")
      .forEach((button) => (button.onclick = () => add(button.dataset.add)));
    document.querySelectorAll("[data-retail-remove]").forEach(
      (button) =>
        (button.onclick = () => {
          state().retail.lines = state().retail.lines.filter(
            (line) => line.item_id !== button.dataset.retailRemove,
          );
          dirtyAndPreview();
        }),
    );
    document.querySelectorAll("[data-retail-qty]").forEach(
      (input) =>
        (input.onchange = () => {
          const line = state().retail.lines.find(
            (x) => x.item_id === input.dataset.retailQty,
          );
          if (line) line.quantity = Math.max(1, Number(input.value || 1));
          dirtyAndPreview();
        }),
    );
    document.querySelectorAll("[data-retail-note]").forEach(
      (input) =>
        (input.onchange = () => {
          const line = state().retail.lines.find(
            (x) => x.item_id === input.dataset.retailNote,
          );
          if (line) line.note = input.value;
          dirtyAndPreview();
        }),
    );
    document.getElementById("addCustom").onclick = addCustom;
    document.getElementById("saveRetail").onclick = save;
    document.getElementById("printRetail").onclick = () =>
      QV3Document.print("RETAIL");
  }
  const refreshPreview = debounce(async () => {
    try {
      await QV3Lifecycle.preview("RETAIL");
      if (state().mode === "RETAIL") render();
    } catch (error) {
      const box = document.getElementById("retailError");
      if (box)
        box.innerHTML = `<div class="notice danger">${esc(friendlyError(error))}</div>`;
    }
  }, 180);
  async function save() {
    try {
      document.body.classList.add("busy");
      await QV3Lifecycle.save("RETAIL");
      render();
    } catch (error) {
      alert(error?.message || friendlyError(error));
    } finally {
      document.body.classList.remove("busy");
    }
  }
  window.QV3Retail = { render, refreshPreview };
})();
