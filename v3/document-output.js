// Approved customer documents are exportable only through Print / Save as PDF.
// No editable Word output is exposed after Admin approval.
(function () {
  const ABS = (src) => {
    try { return new URL(src, location.href).href; } catch { return src; }
  };

  function quoteIdFromDocument(doc) {
    const code = doc?.querySelector(".quote-meta b")?.textContent?.trim() || "";
    const m = code.match(/^BG\/SUNBOT\/(\d{4})\/(\d{4})-(\d{3})$/);
    return m ? `BG-SUNBOT-${m[1]}-${m[2]}-${m[3]}` : String(state.lastQuote?.quote_id || state.quoteId || "");
  }

  function sanitizeClone(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll("script,button,.no-print,.admin-price-editor,.admin-model-policy,.approval-rule-strip,.toolbar").forEach((x) => x.remove());
    clone.querySelectorAll("img").forEach((img) => img.setAttribute("src", ABS(img.getAttribute("src") || "")));
    clone.querySelectorAll("[id]").forEach((x) => x.removeAttribute("id"));
    return clone;
  }

  function sectionsFor(doc, mode) {
    const narrative = doc.querySelector(".customer-proposal-narrative");
    const price = doc.querySelector(".customer-proposal-price");
    if (mode === "quote") return price ? [price] : [doc];
    if (mode === "narrative") return narrative ? [narrative] : [];
    const sections = [narrative, price].filter(Boolean);
    return sections.length ? sections : [doc];
  }

  function titleFor(mode) {
    if (mode === "quote") return "Báo giá Sunbot";
    if (mode === "narrative") return "Thuyết minh cấu hình Sunbot";
    return "Đề xuất giải pháp Sunbot";
  }

  function pdfTitle(mode, sourceDoc) {
    const quoteId = quoteIdFromDocument(sourceDoc) || "Bao-gia-Sunbot";
    return `${quoteId} - ${titleFor(mode)}`;
  }

  function standaloneCss() {
    return `
      @page{size:A4 portrait;margin:12mm 14mm 13mm}
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;background:#fff;color:#243331;font-family:Arial,"Helvetica Neue",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      body{font-size:9.5pt;line-height:1.42}
      .print-doc{width:100%;margin:0;padding:0}
      .doc-section{width:100%;margin:0;padding:0;break-after:page;page-break-after:always}
      .doc-section:last-child{break-after:auto;page-break-after:auto}
      .quote-document,.customer-proposal-page{width:100%!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;border-radius:0!important;overflow:visible!important;background:#fff!important}
      .quote-top-accent,.quote-bottom-accent{height:3mm!important;width:100%!important;position:static!important;margin:0 0 3mm!important;background:#0f766e!important}
      .quote-bottom-accent{margin:3mm 0 0!important}
      .quote-header{display:flex!important;justify-content:space-between!important;align-items:flex-start!important;gap:7mm!important;padding:0 0 4.5mm!important;margin:0!important;border-bottom:1px solid #dbe5e2!important;break-inside:avoid;page-break-inside:avoid}
      .quote-brand-block{display:flex!important;align-items:center!important;gap:4mm!important;min-width:0!important;flex:1 1 auto!important}
      .quote-logo{width:34mm!important;max-width:34mm!important;height:auto!important;object-fit:contain!important;display:block!important}
      .quote-brand-copy{padding-left:3mm!important;border-left:1px solid #dbe5e2!important;max-width:78mm!important;min-width:0!important}
      .quote-company{font-size:7.7pt!important;line-height:1.28!important;font-weight:800!important;letter-spacing:.02em!important}
      .quote-tagline{font-size:6.7pt!important;line-height:1.3!important;margin-top:1.2mm!important;color:#667c78!important}
      .quote-meta{display:grid!important;gap:1.2mm!important;min-width:39mm!important;max-width:48mm!important}
      .quote-meta>div{display:grid!important;grid-template-columns:15mm minmax(0,1fr)!important;gap:2mm!important;padding-bottom:1mm!important;border-bottom:1px solid #edf2f1!important}
      .quote-meta span{font-size:6.4pt!important;color:#71817e!important;text-transform:uppercase!important;letter-spacing:.04em!important}
      .quote-meta b{font-size:6.8pt!important;line-height:1.25!important;text-align:right!important;white-space:normal!important;overflow-wrap:anywhere!important}
      .proposal-page-title,.quote-title-block{padding:5mm 0 3.5mm!important;margin:0!important;break-inside:avoid;page-break-inside:avoid}
      .proposal-eyebrow,.quote-kicker{font-size:7pt!important;font-weight:800!important;letter-spacing:.11em!important;color:#b45309!important}
      .proposal-page-title h1,.quote-title-block h1{font-size:16.5pt!important;line-height:1.15!important;margin:1.5mm 0 1.8mm!important;color:#123f3a!important;overflow-wrap:anywhere!important}
      .proposal-page-title p,.quote-title-block p{font-size:8.6pt!important;line-height:1.42!important;margin:0!important;color:#667c78!important}
      .quote-recipient{display:grid!important;grid-template-columns:minmax(0,1.6fr) minmax(27mm,.7fr) minmax(29mm,.85fr)!important;width:100%!important;margin:0 0 4mm!important;border:1px solid #d8e4e1!important;border-radius:2mm!important;overflow:hidden!important;break-inside:avoid;page-break-inside:avoid}
      .quote-recipient>div{min-width:0!important;padding:2.2mm 2.6mm!important;border-right:1px solid #e5ecea!important}
      .quote-recipient>div:last-child{border-right:0!important}
      .quote-recipient span{display:block!important;font-size:6.3pt!important;text-transform:uppercase!important;letter-spacing:.06em!important;color:#84928f!important;margin-bottom:.8mm!important}
      .quote-recipient strong{font-size:8.2pt!important;line-height:1.3!important;white-space:normal!important;overflow-wrap:anywhere!important}
      .quote-intro,.quote-courtesy{font-size:8.5pt!important;line-height:1.48!important;margin:0 0 3mm!important}
      .customer-config-prose,.config-prose{padding:0!important;font-size:9pt!important;line-height:1.48!important}
      .customer-config-prose h3,.config-prose h3{font-size:9.5pt!important;line-height:1.3!important;margin:3.2mm 0 1.2mm!important;padding-top:2mm!important;border-top:1px solid #e5ecea!important;break-after:avoid;page-break-after:avoid;break-inside:avoid;page-break-inside:avoid}
      .customer-config-prose p,.config-prose p{margin:0 0 2.4mm!important;orphans:3;widows:3;text-align:justify;hyphens:none;overflow-wrap:break-word;word-break:normal}
      .quote-table-section{width:100%!important;margin:0!important;overflow:visible!important}
      .quote-table{width:100%!important;max-width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;font-size:8pt!important}
      .quote-table thead{display:table-header-group!important}
      .quote-table th{background:#0f766e!important;color:#fff!important;padding:2mm 1.5mm!important;font-size:7pt!important;line-height:1.2!important;text-transform:uppercase!important;text-align:left!important}
      .quote-table td{padding:2.2mm 1.5mm!important;border-bottom:1px solid #e3eae8!important;vertical-align:top!important;line-height:1.3!important}
      .quote-table tr{break-inside:avoid;page-break-inside:avoid}
      .quote-table .q-stt{width:8%!important;text-align:center!important}
      .quote-table .q-name{width:43%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important}
      .quote-table .q-name b{font-size:8pt!important;line-height:1.3!important;white-space:normal!important;overflow-wrap:anywhere!important}
      .quote-table .q-name small{display:block!important;margin-top:.7mm!important;font-size:6.7pt!important;line-height:1.25!important;color:#7b8c89!important;white-space:normal!important}
      .quote-table .q-num{width:8%!important;text-align:center!important}
      .quote-table .q-money{width:20.5%!important;text-align:right!important;white-space:nowrap!important;font-variant-numeric:tabular-nums!important}
      .quote-total-box{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:5mm!important;width:67%!important;max-width:100%!important;margin:4mm 0 3.5mm auto!important;padding:2.8mm 3mm!important;border:1px solid #b9ddd5!important;border-radius:2mm!important;background:#edf8f5!important;break-inside:avoid;page-break-inside:avoid}
      .quote-total-label{display:grid!important;gap:.7mm!important}.quote-total-label span{font-size:7.1pt!important;font-weight:800!important}.quote-total-label small{font-size:6.2pt!important;line-height:1.3!important;color:#728481!important}
      .quote-total-value{font-size:13.5pt!important;font-weight:900!important;color:#0f766e!important;white-space:nowrap!important}
      .quote-commercial-notes,.quote-conditions{margin-top:3.5mm!important;padding-top:3mm!important;border-top:1px solid #dce7e4!important;font-size:7.7pt!important;line-height:1.42!important;break-inside:avoid;page-break-inside:avoid}
      .quote-condition-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:2.5mm 5mm!important}.quote-condition-grid>div{min-width:0!important}.quote-condition-grid b{font-size:7.4pt!important}.quote-condition-grid span{font-size:7pt!important;line-height:1.4!important;white-space:normal!important;overflow-wrap:anywhere!important}
      .quote-footer{display:flex!important;justify-content:space-between!important;align-items:flex-end!important;gap:7mm!important;margin-top:5mm!important;padding-top:3.5mm!important;border-top:1px solid #dce7e4!important;break-inside:avoid;page-break-inside:avoid}
      .quote-footer-note{display:grid!important;gap:.8mm!important}.quote-footer-note>b{font-size:10pt!important;color:#0f766e!important}.quote-footer-note span{font-size:7pt!important}.quote-footer-note small{font-size:6.4pt!important;color:#899793!important}
      .quote-sign{min-width:42mm!important;text-align:center!important}.quote-sign>span,.quote-sign>b{font-size:7pt!important}.sign-space{height:10mm!important}
      .no-print,.admin-price-editor,.admin-model-policy,.approval-rule-strip,.toolbar,.btn{display:none!important}
      @media print{body{margin:0!important}.doc-section{width:100%!important}}
    `;
  }

  function documentHtml(mode, sourceDoc) {
    const sections = sectionsFor(sourceDoc, mode);
    if (!sections.length) throw new Error("Chưa có nội dung phù hợp để xuất tài liệu này.");
    const content = sections.map((s) => `<section class="doc-section">${sanitizeClone(s).outerHTML}</section>`).join("");
    return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${pdfTitle(mode, sourceDoc)}</title><style>${standaloneCss()}</style></head><body><main class="print-doc">${content}</main></body></html>`;
  }

  async function verifyApproved(doc) {
    const quoteId = quoteIdFromDocument(doc);
    if (!quoteId) throw new Error("Không xác định được mã báo giá.");
    await bridge("quotationShared", "exportQuote", { quote_id: quoteId }, state.token);
    return quoteId;
  }

  function removePrintFrame() {
    document.getElementById("sunbot-print-frame")?.remove();
  }

  function printInFrame(mode, sourceDoc) {
    removePrintFrame();
    const frame = document.createElement("iframe");
    frame.id = "sunbot-print-frame";
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "1px";
    frame.style.height = "1px";
    frame.style.border = "0";
    frame.style.opacity = "0";
    frame.style.pointerEvents = "none";
    document.body.appendChild(frame);

    const frameDoc = frame.contentDocument || frame.contentWindow?.document;
    if (!frameDoc) throw new Error("Trình duyệt không cho tạo vùng in nội bộ.");
    frameDoc.open();
    frameDoc.write(documentHtml(mode, sourceDoc));
    frameDoc.close();

    const trigger = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch (e) {
        removePrintFrame();
        throw e;
      }
      setTimeout(removePrintFrame, 4000);
    };
    if (frameDoc.fonts?.ready) frameDoc.fonts.ready.then(() => setTimeout(trigger, 120));
    else setTimeout(trigger, 250);
  }

  async function printApproved(mode, sourceDoc) {
    try {
      await verifyApproved(sourceDoc);
      printInFrame(mode, sourceDoc);
    } catch (e) {
      alert(friendlyError(e));
    }
  }

  function installToolbar() {
    const doc = document.getElementById("quote-document");
    const exportButton = document.getElementById("detailExport");
    if (!doc || !exportButton || document.getElementById("sunbot-document-output")) return;
    exportButton.style.display = "none";
    const host = exportButton.closest(".toolbar") || exportButton.parentElement;
    if (!host) return;
    const toolbar = document.createElement("div");
    toolbar.id = "sunbot-document-output";
    toolbar.className = "document-output-toolbar no-print";
    toolbar.innerHTML = `
      <div class="document-output-label"><b>In / Lưu PDF A4</b><small>Bản chính thức sau duyệt chỉ xuất qua In hoặc Lưu PDF; không cung cấp định dạng chỉnh sửa.</small></div>
      <div class="document-output-group">
        <button class="btn" data-doc-output="quote">Báo giá</button>
        <button class="btn secondary" data-doc-output="proposal">Đề xuất</button>
        <button class="btn secondary" data-doc-output="narrative">Thuyết minh</button>
      </div>`;
    host.appendChild(toolbar);
    toolbar.querySelectorAll("[data-doc-output]").forEach((btn) => {
      btn.onclick = () => printApproved(btn.dataset.docOutput, doc);
    });
  }

  const observer = new MutationObserver(() => installToolbar());
  observer.observe(document.documentElement, {childList:true,subtree:true});
  installToolbar();

  const style = document.createElement("style");
  style.textContent = `
    .document-output-toolbar{display:grid;grid-template-columns:minmax(210px,1fr) auto;align-items:center;gap:10px 16px;width:100%;padding:10px 12px;border:1px solid rgba(15,118,110,.2);border-radius:11px;background:rgba(15,118,110,.04)}
    .document-output-label{display:grid;gap:1px}.document-output-label small{font-size:11px;color:#667c78;line-height:1.4}
    .document-output-group{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.document-output-group .btn{width:auto!important;min-width:82px}
    @media(max-width:920px){.document-output-toolbar{grid-template-columns:1fr}.document-output-group{justify-content:flex-start}}
  `;
  document.head.appendChild(style);
})();