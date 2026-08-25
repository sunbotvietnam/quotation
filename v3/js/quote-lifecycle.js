(function () {
  function payload(mode) {
    const state = QV3State.data,
      target = mode === "RETAIL" ? state.retail : state.solution;
    return {
      mode,
      quote_id: target.saved?.quote_id || "",
      customer_name: state.customer.name,
      customer_id: state.customer.id,
      opportunity_id: state.customer.opportunityId,
      created_by: state.createdBy,
      client_type:
        mode === "RETAIL" ? "Vật liệu / sửa chữa" : "Giải pháp Sunbot",
      combo_code:
        mode === "RETAIL" ? "RETAIL_MATERIAL_REPAIR" : state.solution.comboCode,
      context: state.context,
      lines: target.lines.map((line) => ({
        item_id: line.item_id,
        quantity: Number(line.quantity),
        note: line.note || "",
        custom_name: line.custom_name || "",
        custom_unit: line.custom_unit || "",
        custom_unit_price: Number(line.custom_unit_price || 0),
      })),
    };
  }
  async function preview(mode) {
    const target =
      mode === "RETAIL" ? QV3State.data.retail : QV3State.data.solution;
    if (!target.lines.length) {
      target.preview = null;
      return null;
    }
    target.preview = await QV3Api.call(
      QV3State.data.token,
      "preview",
      payload(mode),
    );
    return target.preview;
  }
  async function save(mode) {
    const state = QV3State.data;
    if (!state.customer.name.trim())
      throw new Error("Hãy nhập tên khách hàng.");
    if (!state.createdBy.trim()) throw new Error("Hãy nhập người lập báo giá.");
    const result = await QV3Api.call(state.token, "save", payload(mode));
    QV3State.markSaved(mode, result);
    return result;
  }
  const canPrint = (mode) => QV3State.quoteStatus(mode) === "SAVED";
  window.QV3Lifecycle = { payload, preview, save, canPrint };
})();
