(function () {
  const data = () =>
    QV3State.data.catalog || { items: [], combos: [], components: [] };
  const item = (id) => data().items.find((x) => x.item_id === id);
  const combo = (code) => data().combos.find((x) => x.combo_code === code);
  const comboLines = (code) =>
    data()
      .components.filter((x) => x.combo_code === code)
      .sort((a, b) => a.line_order - b.line_order)
      .map((component) => ({
        item_id: component.item_id,
        quantity: Number(component.quantity || 0),
        required: component.required,
        can_edit: component.can_edit,
        note: "",
      }));
  const itemsByType = (type) =>
    data().items.filter((x) => x.item_type === type);
  const categories = (items) => [
    "Tất cả",
    ...new Set(items.map((x) => x.category).filter(Boolean)),
  ];
  window.QV3Catalog = { item, combo, comboLines, itemsByType, categories };
})();
