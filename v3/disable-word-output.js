// Product rule: Word download is disabled. Customer documents are exported only through Print / Save as PDF.
(function () {
  function stripWordOutput() {
    const root = document.getElementById("sunbot-document-output");
    if (!root) return;

    root.querySelectorAll('[data-doc-action="word"]').forEach((button) => button.remove());

    root.querySelectorAll(".document-output-group").forEach((group) => {
      const label = group.querySelector(":scope > span");
      if (label && /word/i.test(label.textContent || "")) group.remove();
    });

    const description = root.querySelector(".document-output-label small");
    if (description) {
      description.textContent = "Không mở cửa sổ mới. Chọn Báo giá, Đề xuất hoặc Thuyết minh để in hay lưu PDF A4.";
    }

    const title = root.querySelector(".document-output-label b");
    if (title) title.textContent = "In / Lưu PDF A4";
  }

  const observer = new MutationObserver(stripWordOutput);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  stripWordOutput();
})();
