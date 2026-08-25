(function () {
  const params = new URLSearchParams(location.search);
  const data = {
    token: QV3Storage.getToken(),
    boot: null,
    catalog: null,
    materials: [],
    mode: "SOLUTION",
    view: "COMBOS",
    customer: {
      name: params.get("customer_name") || params.get("school_name") || "",
      id: params.get("customer_id") || "",
      opportunityId: params.get("opportunity_id") || "",
    },
    createdBy: QV3Storage.getCreator(),
    context: { students: 150, teachers: 2 },
    solution: {
      comboCode: "",
      lines: [],
      preview: null,
      saved: null,
      dirty: true,
    },
    retail: {
      query: "",
      category: "Tất cả",
      lines: [],
      preview: null,
      saved: null,
      dirty: true,
    },
  };
  window.QV3State = {
    data,
    markDirty(mode) {
      const target = mode === "RETAIL" ? data.retail : data.solution;
      target.dirty = true;
    },
    markSaved(mode, result) {
      const target = mode === "RETAIL" ? data.retail : data.solution;
      target.saved = result;
      target.preview = result;
      target.dirty = false;
    },
    quoteStatus(mode) {
      const target = mode === "RETAIL" ? data.retail : data.solution;
      return target.saved && !target.dirty ? "SAVED" : "DRAFT";
    },
  };
})();
