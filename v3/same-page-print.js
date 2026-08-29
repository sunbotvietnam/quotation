// Stable print path: no popup, no iframe, no network call on click.
// A temporary print root is rendered inside the current page, then window.print() is called synchronously.
(function () {
  const PRINT_CLASS = "sunbot-native-print";
  const ROOT_ID = "sunbot-print-root";

  function cleanPrintRoot() {
    document.getElementById(ROOT_ID)?.remove();
    document.body.classList.remove(PRINT_CLASS);
  }

  function sourceDocument() {
    return document.getElementById("quote-document");
  }

  function cloneForPrint(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll("script,button,.no-print,.admin-price-editor,.admin-model-policy,.approval-rule-strip,.toolbar").forEach((el) => el.remove());
    clone.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
    clone.querySelectorAll("img").forEach((img) => {
      try { img.src = new URL(img.getAttribute("src") || "", location.href).href; } catch (_) {}
    });
    return clone;
  }

  function sectionsFor(mode, doc) {
    const narrative = doc.querySelector(".customer-proposal-narrative");
    const price = doc.querySelector(".customer-proposal-price");
    if (mode === "quote") return [price || doc];
    if (mode === "narrative") return narrative ? [narrative] : [];
    const both = [narrative, price].filter(Boolean);
    return both.length ? both : [doc];
  }

  function buildPrintRoot(mode) {
    cleanPrintRoot();
    const doc = sourceDocument();
    if (!doc) throw new Error("Chưa có báo giá để in.");
    const sections = sectionsFor(mode, doc);
    if (!sections.length) throw new Error("Báo giá này chưa có phần thuyết minh để in riêng.");

    const root = document.createElement("main");
    root.id = ROOT_ID;
    root.setAttribute("aria-hidden", "true");
    sections.forEach((section, index) => {
      const wrapper = document.createElement("section");
      wrapper.className = "sunbot-print-section";
      if (index < sections.length - 1) wrapper.classList.add("sunbot-print-break");
      wrapper.appendChild(cloneForPrint(section));
      root.appendChild(wrapper);
    });
    document.body.appendChild(root);
    document.body.classList.add(PRINT_CLASS);
    return root;
  }

  function printNow(mode) {
    try {
      buildPrintRoot(mode);
      // Must stay synchronous in the click handler to preserve browser user activation.
      window.print();
    } catch (error) {
      cleanPrintRoot();
      alert(typeof friendlyError === "function" ? friendlyError(error) : String(error?.message || error));
    }
  }

  function wireToolbar() {
    const toolbar = document.getElementById("sunbot-document-output");
    if (!toolbar || toolbar.dataset.samePagePrint === "1") return;
    toolbar.dataset.samePagePrint = "1";

    toolbar.querySelectorAll('[data-doc-action="word"]').forEach((el) => el.remove());
    toolbar.querySelectorAll(".document-output-group").forEach((group) => {
      const label = group.querySelector(":scope > span");
      if (label && /word/i.test(label.textContent || "")) group.remove();
    });

    const title = toolbar.querySelector(".document-output-label b");
    const help = toolbar.querySelector(".document-output-label small");
    if (title) title.textContent = "In / Lưu PDF A4";
    if (help) help.textContent = "In trực tiếp trong trang hiện tại — không mở cửa sổ mới, không dùng popup.";

    toolbar.querySelectorAll('[data-doc-action="print"][data-doc-output]').forEach((btn) => {
      btn.disabled = false;
      btn.onclick = function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        printNow(btn.dataset.docOutput);
      };
    });
  }

  window.addEventListener("afterprint", cleanPrintRoot);
  const observer = new MutationObserver(wireToolbar);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  wireToolbar();

  const style = document.createElement("style");
  style.textContent = `
    #${ROOT_ID}{display:none}
    @media print{
      @page{size:A4 portrait;margin:12mm 14mm 13mm}
      body.${PRINT_CLASS}{margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important}
      body.${PRINT_CLASS}>*:not(#${ROOT_ID}){display:none!important}
      body.${PRINT_CLASS} #${ROOT_ID}{display:block!important;width:100%!important;margin:0!important;padding:0!important;background:#fff!important}
      body.${PRINT_CLASS} .sunbot-print-section{display:block!important;width:100%!important;margin:0!important;padding:0!important}
      body.${PRINT_CLASS} .sunbot-print-break{break-after:page!important;page-break-after:always!important}
      body.${PRINT_CLASS} .quote-document,
      body.${PRINT_CLASS} .customer-proposal-page{width:100%!important;max-width:none!important;min-height:0!important;margin:0!important;padding:0!important;box-shadow:none!important;border:0!important;border-radius:0!important;overflow:visible!important;background:#fff!important}
      body.${PRINT_CLASS} .quote-table{width:100%!important;max-width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
      body.${PRINT_CLASS} .quote-table thead{display:table-header-group!important}
      body.${PRINT_CLASS} .quote-table tr{break-inside:avoid!important;page-break-inside:avoid!important}
      body.${PRINT_CLASS} .quote-table .q-name{white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important}
      body.${PRINT_CLASS} .quote-table .q-money{white-space:nowrap!important}
      body.${PRINT_CLASS} .quote-header,
      body.${PRINT_CLASS} .quote-recipient,
      body.${PRINT_CLASS} .quote-total-box,
      body.${PRINT_CLASS} .quote-footer{break-inside:avoid!important;page-break-inside:avoid!important}
      body.${PRINT_CLASS} .customer-config-prose p,
      body.${PRINT_CLASS} .config-prose p{orphans:3;widows:3}
      body.${PRINT_CLASS} .customer-config-prose h3,
      body.${PRINT_CLASS} .config-prose h3{break-after:avoid!important;page-break-after:avoid!important}
      body.${PRINT_CLASS} .no-print,
      body.${PRINT_CLASS} button{display:none!important}
    }
  `;
  document.head.appendChild(style);
})();
