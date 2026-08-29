// Preserve browser user activation for printing: prepare hidden A4 frames in advance,
// then call print() synchronously from the user's click. No popup, no async work on click.
(function () {
  const READY = new Map();
  const MODES = ["quote", "proposal", "narrative"];

  function sourceDoc() { return document.getElementById("quote-document"); }

  function modeButtons() {
    return Array.from(document.querySelectorAll('#sunbot-document-output [data-doc-output]'))
      .filter((b) => !b.closest('[data-disabled-word]'));
  }

  function quoteIdFromDocument(doc) {
    const code = doc?.querySelector(".quote-meta b")?.textContent?.trim() || "";
    const m = code.match(/^BG\/SUNBOT\/(\d{4})\/(\d{4})-(\d{3})$/);
    return m ? `BG-SUNBOT-${m[1]}-${m[2]}-${m[3]}` : String(state.lastQuote?.quote_id || state.quoteId || "");
  }

  function setButtonsReady(ready, text) {
    modeButtons().forEach((btn) => {
      btn.disabled = !ready;
      btn.setAttribute("aria-disabled", ready ? "false" : "true");
    });
    const small = document.querySelector("#sunbot-document-output .document-output-label small");
    if (small && text) small.textContent = text;
  }

  function cleanupFrames() {
    document.querySelectorAll('iframe[data-sunbot-print-frame="1"]').forEach((f) => f.remove());
    READY.clear();
  }

  function makeFrame(mode, doc) {
    const frame = document.createElement("iframe");
    frame.dataset.sunbotPrintFrame = "1";
    frame.dataset.mode = mode;
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.left = "-10000px";
    frame.style.top = "0";
    frame.style.width = "210mm";
    frame.style.height = "297mm";
    frame.style.border = "0";
    frame.style.opacity = "0";
    frame.style.pointerEvents = "none";
    document.body.appendChild(frame);

    const fdoc = frame.contentDocument || frame.contentWindow?.document;
    if (!fdoc) throw new Error("Không tạo được vùng in nội bộ.");
    // Reuse the already-loaded document-output renderer. It is intentionally global only
    // through its existing toolbar, so here we clone the prepared customer pages and copy
    // the same A4 stylesheet from the parent document.
    const narrative = doc.querySelector(".customer-proposal-narrative");
    const price = doc.querySelector(".customer-proposal-price");
    let nodes = [];
    if (mode === "quote") nodes = [price || doc];
    else if (mode === "narrative") nodes = narrative ? [narrative] : [];
    else nodes = [narrative, price].filter(Boolean);
    if (!nodes.length) throw new Error("Chưa có nội dung phù hợp để in.");

    const clones = nodes.map((node) => {
      const c = node.cloneNode(true);
      c.querySelectorAll("script,button,.no-print,.admin-price-editor,.admin-model-policy,.approval-rule-strip,.toolbar").forEach((x) => x.remove());
      c.querySelectorAll("[id]").forEach((x) => x.removeAttribute("id"));
      c.querySelectorAll("img").forEach((img) => {
        try { img.src = new URL(img.getAttribute("src") || "", location.href).href; } catch (_) {}
      });
      return `<section class="doc-section">${c.outerHTML}</section>`;
    }).join("");

    const css = `
      @page{size:A4 portrait;margin:12mm 14mm 13mm}
      *{box-sizing:border-box} html,body{margin:0;padding:0;background:#fff;color:#243331;font-family:Arial,"Helvetica Neue",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      body{font-size:9.5pt;line-height:1.42}.print-doc{width:100%;margin:0;padding:0}.doc-section{width:100%;margin:0;padding:0;break-after:page;page-break-after:always}.doc-section:last-child{break-after:auto;page-break-after:auto}
      .quote-document,.customer-proposal-page{width:100%!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;border-radius:0!important;overflow:visible!important;background:#fff!important}
      .quote-top-accent,.quote-bottom-accent{height:3mm!important;width:100%!important;position:static!important;margin:0 0 3mm!important;background:#0f766e!important}.quote-bottom-accent{margin:3mm 0 0!important}
      .quote-header{display:flex!important;justify-content:space-between!important;align-items:flex-start!important;gap:7mm!important;padding:0 0 4.5mm!important;margin:0!important;border-bottom:1px solid #dbe5e2!important;break-inside:avoid;page-break-inside:avoid}.quote-brand-block{display:flex!important;align-items:center!important;gap:4mm!important;min-width:0!important;flex:1 1 auto!important}.quote-logo{width:34mm!important;max-width:34mm!important;height:auto!important;object-fit:contain!important;display:block!important}.quote-brand-copy{padding-left:3mm!important;border-left:1px solid #dbe5e2!important;max-width:78mm!important;min-width:0!important}.quote-company{font-size:7.7pt!important;line-height:1.28!important;font-weight:800!important}.quote-tagline{font-size:6.7pt!important;line-height:1.3!important;margin-top:1.2mm!important;color:#667c78!important}
      .quote-meta{display:grid!important;gap:1.2mm!important;min-width:39mm!important;max-width:48mm!important}.quote-meta>div{display:grid!important;grid-template-columns:15mm minmax(0,1fr)!important;gap:2mm!important;padding-bottom:1mm!important;border-bottom:1px solid #edf2f1!important}.quote-meta span{font-size:6.4pt!important;color:#71817e!important;text-transform:uppercase!important}.quote-meta b{font-size:6.8pt!important;line-height:1.25!important;text-align:right!important;white-space:normal!important;overflow-wrap:anywhere!important}
      .proposal-page-title,.quote-title-block{padding:5mm 0 3.5mm!important;margin:0!important;break-inside:avoid;page-break-inside:avoid}.proposal-eyebrow,.quote-kicker{font-size:7pt!important;font-weight:800!important;color:#b45309!important}.proposal-page-title h1,.quote-title-block h1{font-size:16.5pt!important;line-height:1.15!important;margin:1.5mm 0 1.8mm!important;color:#123f3a!important;overflow-wrap:anywhere!important}.proposal-page-title p,.quote-title-block p{font-size:8.6pt!important;line-height:1.42!important;margin:0!important;color:#667c78!important}
      .quote-recipient{display:grid!important;grid-template-columns:minmax(0,1.6fr) minmax(27mm,.7fr) minmax(29mm,.85fr)!important;width:100%!important;margin:0 0 4mm!important;border:1px solid #d8e4e1!important;border-radius:2mm!important;overflow:hidden!important;break-inside:avoid;page-break-inside:avoid}.quote-recipient>div{min-width:0!important;padding:2.2mm 2.6mm!important;border-right:1px solid #e5ecea!important}.quote-recipient>div:last-child{border-right:0!important}.quote-recipient span{display:block!important;font-size:6.3pt!important;color:#84928f!important;margin-bottom:.8mm!important}.quote-recipient strong{font-size:8.2pt!important;line-height:1.3!important;white-space:normal!important;overflow-wrap:anywhere!important}
      .customer-config-prose,.config-prose{padding:0!important;font-size:9pt!important;line-height:1.48!important}.customer-config-prose h3,.config-prose h3{font-size:9.5pt!important;line-height:1.3!important;margin:3.2mm 0 1.2mm!important;padding-top:2mm!important;border-top:1px solid #e5ecea!important;break-after:avoid;page-break-after:avoid;break-inside:avoid;page-break-inside:avoid}.customer-config-prose p,.config-prose p{margin:0 0 2.4mm!important;orphans:3;widows:3;text-align:justify;overflow-wrap:break-word;word-break:normal}
      .quote-table-section{width:100%!important;margin:0!important;overflow:visible!important}.quote-table{width:100%!important;max-width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;font-size:8pt!important}.quote-table thead{display:table-header-group!important}.quote-table th{background:#0f766e!important;color:#fff!important;padding:2mm 1.5mm!important;font-size:7pt!important;line-height:1.2!important;text-align:left!important}.quote-table td{padding:2.2mm 1.5mm!important;border-bottom:1px solid #e3eae8!important;vertical-align:top!important;line-height:1.3!important}.quote-table tr{break-inside:avoid;page-break-inside:avoid}.quote-table .q-stt{width:8%!important;text-align:center!important}.quote-table .q-name{width:43%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important}.quote-table .q-num{width:8%!important;text-align:center!important}.quote-table .q-money{width:20.5%!important;text-align:right!important;white-space:nowrap!important}
      .quote-total-box{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:5mm!important;width:67%!important;max-width:100%!important;margin:4mm 0 3.5mm auto!important;padding:2.8mm 3mm!important;border:1px solid #b9ddd5!important;border-radius:2mm!important;background:#edf8f5!important;break-inside:avoid;page-break-inside:avoid}.quote-total-value{font-size:13.5pt!important;font-weight:900!important;color:#0f766e!important;white-space:nowrap!important}.quote-footer{display:flex!important;justify-content:space-between!important;align-items:flex-end!important;gap:7mm!important;margin-top:5mm!important;padding-top:3.5mm!important;border-top:1px solid #dce7e4!important;break-inside:avoid;page-break-inside:avoid}.sign-space{height:10mm!important}
      .no-print,.btn,.toolbar{display:none!important}`;

    fdoc.open();
    fdoc.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><main class="print-doc">${clones}</main></body></html>`);
    fdoc.close();
    READY.set(mode, frame);
    return frame;
  }

  async function prepare() {
    const doc = sourceDoc();
    const toolbar = document.getElementById("sunbot-document-output");
    if (!doc || !toolbar || toolbar.dataset.gesturePrepared === "1") return;
    toolbar.dataset.gesturePrepared = "1";
    cleanupFrames();
    setButtonsReady(false, "Đang chuẩn bị bản in A4…");
    const quoteId = quoteIdFromDocument(doc);
    if (!quoteId) { setButtonsReady(false, "Không xác định được mã báo giá."); return; }
    try {
      // Approval verification is intentionally done before user clicks Print.
      await bridge("quotationShared", "exportQuote", { quote_id: quoteId }, state.token);
      MODES.forEach((mode) => makeFrame(mode, doc));
      setButtonsReady(true, "Bản in A4 đã sẵn sàng. Không mở cửa sổ mới.");

      modeButtons().forEach((btn) => {
        const mode = btn.dataset.docOutput;
        btn.onclick = function (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const frame = READY.get(mode);
          if (!frame?.contentWindow) return alert("Bản in chưa sẵn sàng. Hãy mở lại báo giá.");
          // Critical: synchronous call inside the click handler preserves browser user activation.
          frame.contentWindow.focus();
          frame.contentWindow.print();
        };
      });
    } catch (e) {
      setButtonsReady(false, typeof friendlyError === "function" ? friendlyError(e) : String(e?.message || e));
    }
  }

  const observer = new MutationObserver(() => prepare());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  prepare();
})();
