(function () {
  const { esc, money, today, slug } = QV3Utils;
  function model(mode) {
    const state = QV3State.data,
      target = mode === "RETAIL" ? state.retail : state.solution,
      snapshot = target.preview || { lines: [], final_amount: 0 },
      saved = target.saved && !target.dirty;
    return {
      mode,
      saved,
      code: saved
        ? target.saved.quote_code || target.saved.quote_id
        : QV3_CONFIG.DRAFT_LABEL,
      version: saved ? Number(target.saved.version || 1) : null,
      date: today().display,
      customer: state.customer.name || "Quý Nhà trường / Quý Đơn vị",
      createdBy: state.createdBy || "Người lập báo giá",
      combo:
        mode === "RETAIL"
          ? "Vật liệu / sửa chữa lẻ"
          : QV3Catalog.combo(state.solution.comboCode)?.name ||
            "Cấu hình riêng",
      students: Number(state.context.students || 0),
      lines: snapshot.lines || [],
      total: Number(snapshot.final_amount || snapshot.subtotal || 0),
      customWarning: !!snapshot.custom_price_warning,
    };
  }
  function render(mode) {
    const m = model(mode),
      rows = m.lines
        .map(
          (line, index) =>
            `<tr class="quote-row"><td class="q-stt">${index + 1}</td><td class="q-name"><b>${esc(line.item_name_snapshot)}</b><small>${esc(line.note_snapshot || line.description_snapshot || line.unit_snapshot)}</small></td><td class="q-num">${Number(line.quantity).toLocaleString("vi-VN")}</td><td class="q-money">${money(line.unit_price_snapshot)}</td><td class="q-money q-line-total">${money(line.line_total)}</td></tr>`,
        )
        .join("");
    return `<article id="quote-document" class="quote-document"><div class="quote-top-accent"></div><header class="quote-header"><div class="quote-brand-block"><img class="quote-logo" src="${QV3_CONFIG.LOGO_URL}" alt="Sunbot"><div class="quote-brand-copy"><div class="quote-company">CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM</div><div class="quote-tagline">SUNBOT · PRESCHOOL ROBOTICS & CREATIVE TECHNOLOGY</div></div></div><div class="quote-meta"><div><span>Mã báo giá</span><b>${esc(m.code)}</b></div>${m.version && m.version > 1 ? `<div><span>Phiên bản</span><b>${m.version}</b></div>` : ""}<div><span>Ngày</span><b>${m.date}</b></div></div></header><section class="quote-title-block"><div class="quote-kicker">ĐỀ XUẤT THƯƠNG MẠI</div><h1>${m.mode === "RETAIL" ? "BÁO GIÁ VẬT LIỆU & SỬA CHỮA SUNBOT" : "BÁO GIÁ GIẢI PHÁP SUNBOT"}</h1><p>${esc(m.combo)}</p></section><section class="quote-recipient"><div><span>Kính gửi</span><strong>${esc(m.customer)}</strong></div><div><span>${m.mode === "RETAIL" ? "Số hạng mục" : "Quy mô dự kiến"}</span><strong>${m.mode === "RETAIL" ? m.lines.length : Number(m.students).toLocaleString("vi-VN") + " trẻ"}</strong></div><div><span>Loại báo giá</span><strong>${esc(m.combo)}</strong></div></section><section class="quote-intro">Kiro Việt Nam trân trọng gửi Quý Nhà trường/Quý Đơn vị đề xuất thương mại theo nhu cầu thực tế. Báo giá áp dụng theo chính sách giá Sunbot hiện hành.</section><section class="quote-table-section"><table class="quote-table"><thead><tr><th class="q-stt">STT</th><th>Hạng mục</th><th class="q-num">SL</th><th class="q-money">Đơn giá</th><th class="q-money">Thành tiền</th></tr></thead><tbody>${rows || '<tr><td colspan="5" style="padding:28px;text-align:center;color:#84928f">Chưa có hạng mục.</td></tr>'}</tbody></table></section><section class="quote-total-box"><div class="quote-total-label"><span>TỔNG GIÁ TRỊ ĐỀ XUẤT</span><small>Chưa bao gồm VAT và chi phí phát sinh ngoài phạm vi nếu có</small></div><div class="quote-total-value">${money(m.total)}</div></section>${m.customWarning ? `<div class="notice danger retail-preview-note"><b>${esc(QV3_CONFIG.CUSTOM_WARNING)}</b></div>` : ""}<section class="quote-conditions"><h3>Điều kiện & lưu ý</h3><div class="quote-condition-grid"><div><b>Hiệu lực báo giá</b><span>30 ngày kể từ ngày phát hành.</span></div><div><b>Phạm vi giá</b><span>Vận chuyển, đi lại và hạng mục phát sinh tính riêng nếu không được nêu trong bảng.</span></div><div><b>Thanh toán</b><span>Thực hiện theo hợp đồng hoặc thỏa thuận được hai bên xác nhận.</span></div><div><b>Chất lượng</b><span>Hạng mục cung cấp và triển khai theo tiêu chuẩn Sunbot hiện hành.</span></div></div></section><footer class="quote-footer"><div class="quote-footer-note"><b>SUNBOT</b><span>Giải pháp công nghệ giáo dục mầm non của Kiro Việt Nam</span><small>Người lập báo giá: ${esc(m.createdBy)}</small></div><div class="quote-sign"><span>ĐẠI DIỆN KIRO VIỆT NAM</span><div class="sign-space"></div><b>${esc(m.createdBy)}</b></div></footer><div class="quote-bottom-accent"></div></article>`;
  }
  function fileBase(mode) {
    const prefix =
      mode === "RETAIL" ? "SUNBOT_BAO_GIA_VAT_LIEU_SUA_CHUA" : "SUNBOT_BAO_GIA";
    return `${prefix}_${slug(QV3State.data.customer.name)}_${today().compact}`;
  }
  function print(mode) {
    if (!QV3Lifecycle.canPrint(mode))
      return alert("Hãy lưu báo giá trước khi in.");
    const old = document.title;
    document.title = fileBase(mode);
    const restore = () => {
      document.title = old;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
    setTimeout(() => {
      if (document.title !== old) document.title = old;
    }, 120000);
  }
  window.QV3Document = { render, fileBase, print };
})();
