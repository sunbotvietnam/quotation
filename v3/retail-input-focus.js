// Preserve typing focus/caret when Retail & Repair view refreshes its live preview.
(function () {
  const baseRenderRetailRepair = window.renderRetailRepair;
  if (typeof baseRenderRetailRepair !== "function") return;

  window.renderRetailRepair = function () {
    const active = document.activeElement;
    const id = active?.id || "";
    const supported = ["retail-client", "retail-search", "retail-notes"].includes(id);
    const start = supported && typeof active.selectionStart === "number" ? active.selectionStart : null;
    const end = supported && typeof active.selectionEnd === "number" ? active.selectionEnd : null;
    baseRenderRetailRepair();
    if (!supported) return;
    const next = document.getElementById(id);
    if (!next) return;
    next.focus({ preventScroll: true });
    if (start !== null && typeof next.setSelectionRange === "function") {
      const length = String(next.value || "").length;
      next.setSelectionRange(Math.min(start, length), Math.min(end ?? start, length));
    }
  };
})();
