// Customer-facing quotation copy and presentation polish.
// Keeps commercial/legal wording out of the core quotation workflow.
(function () {
  const STYLE_ID = "sunbot-quote-customer-polish-style";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .quote-courtesy {
        margin: 14px 0 18px;
        padding: 13px 16px;
        border-left: 3px solid currentColor;
        line-height: 1.55;
        font-size: 13px;
      }
      .quote-courtesy p { margin: 0; }
      .quote-commercial-notes {
        margin: 18px 0 8px;
        padding: 14px 16px;
        border: 1px solid rgba(0,0,0,.12);
        border-radius: 10px;
        font-size: 11.5px;
        line-height: 1.5;
      }
      .quote-commercial-notes h3 {
        margin: 0 0 7px;
        font-size: 12px;
        letter-spacing: .02em;
        text-transform: uppercase;
      }
      .quote-commercial-notes ol {
        margin: 0;
        padding-left: 18px;
      }
      .quote-commercial-notes li { margin: 3px 0; }
      .quote-recipient-note {
        margin-top: 5px;
        font-size: 12px;
        line-height: 1.45;
      }
      @media print {
        .quote-courtesy, .quote-commercial-notes { break-inside: avoid; }
      }
    `;
    document.head.appendChild(style);
  }

  function polishQuote(doc) {
    if (!doc || doc.dataset.customerPolished === "1") return;
    doc.dataset.customerPolished = "1";
    ensureStyles();

    const tagline = doc.querySelector(".quote-tagline");
    if (tagline) tagline.textContent = "SUNBOT · STEAM TÍCH HỢP ROBOT & LẬP TRÌNH TƯ DUY CHO TRẺ 3–6 TUỔI";

    const kicker = doc.querySelector(".quote-title-block .quote-kicker");
    if (kicker) kicker.textContent = "ĐỀ XUẤT CẤU HÌNH & THƯƠNG MẠI";
    const title = doc.querySelector(".quote-title-block h1");
    if (title) title.textContent = "ĐỀ XUẤT CẤU HÌNH & BÁO GIÁ SUNBOT";

    const recipient = doc.querySelector(".quote-recipient");
    if (recipient) {
      const courtesy = document.createElement("div");
      courtesy.className = "quote-courtesy";
      courtesy.innerHTML = `<p>Kiro Việt Nam trân trọng gửi Quý Nhà trường/Quý Đơn vị đề xuất cấu hình Sunbot được xây dựng trên các thông tin nhu cầu hiện có. Chúng tôi mong muốn cùng Quý Nhà trường/Quý Đơn vị rà soát và thống nhất cấu hình phù hợp nhất trước khi triển khai.</p>`;
      recipient.insertAdjacentElement("afterend", courtesy);
    }

    const totalNote = doc.querySelector(".quote-total-label small");
    if (totalNote) totalNote.textContent = "Giá trị đề xuất · Chưa bao gồm VAT";

    const footer = doc.querySelector(".quote-footer");
    if (footer) {
      const notes = document.createElement("section");
      notes.className = "quote-commercial-notes";
      notes.innerHTML = `
        <h3>Lưu ý thương mại</h3>
        <ol>
          <li>Đây là <b>cấu hình và mức giá đề xuất</b> trên cơ sở thông tin nhu cầu hiện có. Cấu hình chính thức, số lượng, phạm vi triển khai và giá trị cuối cùng sẽ được xác nhận lại với Quý Nhà trường/Quý Đơn vị trước khi ký kết hợp đồng hoặc đơn đặt hàng.</li>
          <li>Các mức giá trong đề xuất này <b>chưa bao gồm thuế giá trị gia tăng (VAT)</b>. Thuế được áp dụng theo quy định pháp luật tại thời điểm xuất hóa đơn.</li>
          <li>Các hạng mục hoặc chi phí phát sinh ngoài phạm vi cấu hình nêu trong báo giá, nếu có, chỉ được thực hiện sau khi hai bên trao đổi và xác nhận.</li>
          <li>Báo giá này có giá trị tham chiếu cho việc thống nhất phương án hợp tác và <b>không thay thế hợp đồng, phụ lục hợp đồng hoặc đơn đặt hàng</b> giữa hai bên.</li>
        </ol>`;
      footer.insertAdjacentElement("beforebegin", notes);
    }

    const footerText = doc.querySelector(".quote-footer-note span");
    if (footerText) footerText.textContent = "STEAM tích hợp Robot & Lập trình tư duy dành cho trẻ mầm non 3–6 tuổi";
  }

  const observer = new MutationObserver(() => {
    document.querySelectorAll(".quote-document").forEach(polishQuote);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.querySelectorAll(".quote-document").forEach(polishQuote);
})();
