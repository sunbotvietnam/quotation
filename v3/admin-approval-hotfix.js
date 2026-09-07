// Admin approval workspace hotfix 2026-09-07 v2.
// Final UI layer: Admin can edit quotation lines + narrative directly, approve, or return with coaching feedback.
(function () {
  const personName = (value) => ({
    Nhung: "Hoàng Nhung",
    Thu: "Minh Thu",
    Dung: "Lê Dung",
    thaovu: "Vũ Phương Thảo",
  }[String(value || "").trim()] || String(value || "").trim());

  const displayCode = (id) => {
    const m = String(id || "").match(/^BG-SUNBOT-(\d{4})-(\d{4})-(\d{3})$/);
    return m ? `BG/SUNBOT/${m[1]}/${m[2]}-${m[3]}` : String(id || "");
  };
  const num = (v) => Number(v || 0);

  const asQuoteArray = (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.quotes)) return result.quotes;
    if (Array.isArray(result?.items)) return result.items;
    if (Array.isArray(result?.data)) return result.data;
    return [];
  };

  function editableDetailHtml(bundle) {
    const q = bundle?.quote || {};
    const lines = Array.isArray(bundle?.lines) ? bundle.lines : [];
    const rows = lines.map((line, i) => {
      const price = num(line.proposed_unit_price ?? line.unit_price_snapshot);
      const qty = num(line.qty);
      const custom = String(line.is_custom || "").toUpperCase() === "TRUE" || line.is_custom === true || String(line.commercial_group || "").toUpperCase() === "CUSTOM";
      return `<tr data-admin-edit-line="${i}">
        <td>${i + 1}</td>
        <td><b>${esc(line.item_name_snapshot || line.item_id || "")}</b><small>${esc(line.item_id || "")}${custom ? " · TÙY CHỈNH" : ""}</small></td>
        <td><input class="approval-edit-qty" data-edit-qty="${i}" type="number" min="0" step="1" value="${qty}"></td>
        <td><input class="approval-edit-price" data-edit-price="${i}" type="number" min="0" step="1000" value="${price}"></td>
        <td class="money" data-edit-total="${i}">${money(price * qty)}</td>
      </tr>`;
    }).join("");
    const note = String(q.exception_reason || q.notes || "").trim();
    const narrative = String(q.configuration_description || "");
    return `<section class="panel admin-approval-edit-workspace">
      <div class="builder-head">
        <div><span class="badge">ADMIN · ĐANG RÀ SOÁT</span><h2>${esc(q.client_name || "Báo giá")}</h2><p class="help">${esc(displayCode(q.quote_id))} · Người lập: ${esc(personName(q.created_by))} · Phiên bản ${num(q.version) || 1}</p></div>
        <div class="approval-edit-grand-total"><small>Tổng sau chỉnh</small><strong id="approval-edit-grand-total">${money(q.proposed_amount || q.final_amount || 0)}</strong></div>
      </div>

      <div class="two" style="margin-top:12px">
        <div class="field"><label>Tên khách hàng / trường</label><input id="approval-edit-client" value="${esc(q.client_name || "")}"></div>
        <div class="field"><label>Ghi chú nội bộ / lý do hiệu chỉnh</label><input id="approval-edit-revision-note" value="${esc(note)}" placeholder="Ví dụ: điều chỉnh cấu hình theo quy mô thực tế"></div>
      </div>

      <h3 style="margin-top:16px">1. Sửa trực tiếp hạng mục báo giá</h3>
      <p class="help">Admin có thể sửa số lượng và đơn giá. Nếu cần thay hẳn loại sản phẩm/học cụ, nên trả lại Sales hoặc dùng luồng cấu hình đầy đủ để tránh sai logic Pricebook.</p>
      <div class="table-wrap"><table class="table"><thead><tr><th>STT</th><th>Hạng mục</th><th>SL</th><th>Đơn giá Admin</th><th>Thành tiền</th></tr></thead><tbody>${rows}</tbody></table></div>

      <h3 style="margin-top:16px">2. Sửa trực tiếp thuyết minh</h3>
      <div class="field"><textarea id="approval-edit-narrative" rows="18" style="width:100%" placeholder="Thuyết minh cấu hình gửi khách...">${esc(narrative)}</textarea></div>

      <h3 style="margin-top:16px">3. Ghi phản hồi để Sales rút kinh nghiệm</h3>
      <div class="field"><textarea id="approval-edit-feedback" rows="4" style="width:100%" placeholder="Viết rõ điều gì cần sửa và vì sao. Nội dung này sẽ hiển thị cho người lập khi báo giá được trả lại."></textarea></div>

      <div class="approval-edit-actions no-print">
        <button class="btn secondary" id="approval-admin-save">Lưu bản Admin chỉnh</button>
        <button class="btn" id="approval-admin-save-approve">Lưu chỉnh & duyệt</button>
        <button class="btn secondary" id="approval-admin-approve-unchanged">Duyệt nguyên trạng</button>
        <button class="btn secondary danger-soft" id="approval-admin-return">Trả lại Sales chỉnh</button>
      </div>
      <p class="help" style="margin-top:8px"><b>Nguyên tắc lịch sử:</b> “Lưu bản Admin chỉnh” tạo phiên bản mới nhưng giữ nguyên người lập/deal owner. Sales sẽ thấy báo giá đã được Admin hiệu chỉnh. “Trả lại Sales chỉnh” lưu lời phản hồi và Sales có thể mở lại bằng nút <b>Sửa theo yêu cầu</b>.</p>
    </section>`;
  }

  function readEditedLines(bundle) {
    return (bundle.lines || []).map((line, i) => ({
      item_id: String(line.item_id || ""),
      name: String(line.item_name_snapshot || line.item_id || ""),
      unit: String(line.unit_snapshot || ""),
      qty: Math.max(0, num(document.querySelector(`[data-edit-qty="${i}"]`)?.value ?? line.qty)),
      proposed_unit_price: Math.max(0, num(document.querySelector(`[data-edit-price="${i}"]`)?.value ?? line.proposed_unit_price ?? line.unit_price_snapshot)),
    })).filter((x) => x.qty > 0);
  }

  function refreshEditedTotals(bundle) {
    let total = 0;
    (bundle.lines || []).forEach((line, i) => {
      const qty = Math.max(0, num(document.querySelector(`[data-edit-qty="${i}"]`)?.value ?? line.qty));
      const price = Math.max(0, num(document.querySelector(`[data-edit-price="${i}"]`)?.value ?? line.proposed_unit_price ?? line.unit_price_snapshot));
      total += qty * price;
      const cell = document.querySelector(`[data-edit-total="${i}"]`);
      if (cell) cell.textContent = money(qty * price);
    });
    const host = document.getElementById("approval-edit-grand-total");
    if (host) host.textContent = money(total);
  }

  function revisionPayload(bundle, approveAfter) {
    const q = bundle.quote || {};
    const revisionNote = String(document.getElementById("approval-edit-revision-note")?.value || "").trim() || "Admin hiệu chỉnh trực tiếp trong quá trình duyệt.";
    return {
      quote_id: q.quote_id,
      customer_name: String(document.getElementById("approval-edit-client")?.value || q.client_name || "").trim(),
      customer_id: q.customer_id || "",
      opportunity_id: q.opportunity_id || "",
      client_type: q.client_type || "",
      combo_code: q.combo_code || "CUSTOM",
      configuration_description: String(document.getElementById("approval-edit-narrative")?.value || "").trim(),
      revision_note: revisionNote,
      notes: revisionNote,
      exception_reason: revisionNote,
      reason: revisionNote,
      approve_after: !!approveAfter,
      deployment_sites: q.deployment_sites || 1,
      learner_count: q.learner_count || 0,
      commercial_model: q.commercial_model || "",
      recommended_model: q.recommended_model || "",
      policy_match: q.policy_match,
      scale_program: q.scale_program || "",
      scale_sessions_per_month: q.scale_sessions_per_month || 0,
      frequency_factor: q.frequency_factor || 0,
      point_comparison_amount: q.point_comparison_amount || 0,
      scale_comparison_amount: q.scale_comparison_amount || 0,
      scale_4_amount: q.scale_4_amount || 0,
      scale_8_amount: q.scale_8_amount || 0,
      comparison_difference: q.comparison_difference || 0,
      cheaper_model: q.cheaper_model || "",
      model_exception_reason: q.model_exception_reason || "",
      lines: readEditedLines(bundle),
    };
  }

  async function saveAdminRevision(bundle, approveAfter) {
    const payload = revisionPayload(bundle, approveAfter);
    if (!payload.customer_name) return alert("Tên khách hàng không được để trống.");
    if (!payload.configuration_description) return alert("Thuyết minh cấu hình không được để trống.");
    if (!payload.lines.length) return alert("Báo giá phải còn ít nhất một hạng mục.");
    try {
      const result = await bridge("quotationShared", "adminReviseQuote", payload, state.token);
      alert(approveAfter
        ? `Đã lưu phiên bản ${result?.version || "mới"} do Admin chỉnh và duyệt. Sales vẫn xem được lịch sử thay đổi.`
        : `Đã lưu phiên bản ${result?.version || "mới"} do Admin chỉnh. Báo giá vẫn ở trạng thái Chờ duyệt.`);
      renderApprovals();
    } catch (e) {
      alert(friendlyError(e));
    }
  }

  async function openPendingQuote(quoteId) {
    const host = document.getElementById("approval-hotfix-detail");
    if (!host) return;
    host.innerHTML = '<section class="panel"><p class="help">Đang tải hồ sơ duyệt...</p></section>';
    try {
      const bundle = await bridge("quotationShared", "getQuote", { quote_id: quoteId }, state.token);
      host.innerHTML = editableDetailHtml(bundle);
      document.querySelectorAll("[data-edit-qty],[data-edit-price]").forEach((el) => el.addEventListener("input", () => refreshEditedTotals(bundle)));
      document.getElementById("approval-admin-save")?.addEventListener("click", () => saveAdminRevision(bundle, false));
      document.getElementById("approval-admin-save-approve")?.addEventListener("click", () => saveAdminRevision(bundle, true));
      document.getElementById("approval-admin-approve-unchanged")?.addEventListener("click", async () => {
        const reason = String(document.getElementById("approval-edit-revision-note")?.value || bundle?.quote?.exception_reason || "").trim();
        try {
          await bridge("quotationShared", "approveQuote", { quote_id: quoteId, reason }, state.token);
          alert("Đã duyệt báo giá nguyên trạng.");
          renderApprovals();
        } catch (e) { alert(friendlyError(e)); }
      });
      document.getElementById("approval-admin-return")?.addEventListener("click", async () => {
        const feedback = String(document.getElementById("approval-edit-feedback")?.value || "").trim();
        if (!feedback) return alert("Hãy ghi rõ nội dung cần Sales chỉnh và lý do để người lập rút kinh nghiệm.");
        try {
          await bridge("quotationShared", "requestChanges", { quote_id: quoteId, change_request: feedback, reason: feedback }, state.token);
          alert("Đã trả lại báo giá. Sales sẽ thấy phản hồi và có thể mở lại bằng ‘Sửa theo yêu cầu’.");
          renderApprovals();
        } catch (e) { alert(friendlyError(e)); }
      });
    } catch (e) {
      host.innerHTML = `<section class="panel"><p class="notice danger">${esc(friendlyError(e))}</p></section>`;
    }
  }

  renderApprovals = async function () {
    const el = document.getElementById("content");
    if (!el) return;
    if (String(state.role || "").toUpperCase() !== "ADMIN") {
      state.tab = "quotes";
      return typeof renderQuoteLibrary === "function" ? renderQuoteLibrary() : renderContent();
    }
    el.innerHTML = '<section class="panel"><h2>Duyệt báo giá</h2><p class="help">Đang tải danh sách chờ duyệt...</p></section>';
    try {
      const raw = await bridge("quotationShared", "listQuotes", {}, state.token);
      const pending = asQuoteArray(raw)
        .filter((q) => String(q.status || "").trim().toUpperCase() === "NEEDS_APPROVAL")
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      el.innerHTML = `<div class="approval-hotfix-layout">
        <section class="panel">
          <div class="builder-head"><div><h2>Báo giá chờ duyệt</h2><p class="help">Có <b>${pending.length}</b> báo giá đang chờ Admin rà soát.</p></div><button class="btn secondary" id="approval-hotfix-refresh">Tải lại</button></div>
          ${pending.length ? `<div class="approval-card-list">${pending.map((q) => `<button class="approval-card" data-approval-hotfix-review="${esc(q.quote_id)}"><span><b>${esc(q.quote_code || displayCode(q.quote_id))}</b><small>${esc(q.client_name || "")} · ${esc(personName(q.created_by))}</small></span><span><strong>${money(q.final_amount || 0)}</strong><small>v${num(q.version) || 1}</small></span></button>`).join("")}</div>` : '<p class="notice ok">Hiện không có báo giá nào chờ duyệt.</p>'}
        </section>
        <div id="approval-hotfix-detail"></div>
      </div>`;
      document.getElementById("approval-hotfix-refresh")?.addEventListener("click", renderApprovals);
      document.querySelectorAll("[data-approval-hotfix-review]").forEach((btn) => btn.addEventListener("click", () => openPendingQuote(btn.dataset.approvalHotfixReview)));
    } catch (e) {
      el.innerHTML = `<section class="panel"><h2>Duyệt báo giá</h2><p class="notice danger">Không tải được danh sách chờ duyệt: ${esc(friendlyError(e))}</p><button class="btn secondary" id="approval-hotfix-retry">Thử lại</button></section>`;
      document.getElementById("approval-hotfix-retry")?.addEventListener("click", renderApprovals);
    }
  };

  const style = document.createElement("style");
  style.textContent = `
    .approval-hotfix-layout{display:grid;grid-template-columns:minmax(330px,34%) minmax(0,66%);gap:14px;align-items:start}
    .approval-card-list{display:grid;gap:8px;max-height:78vh;overflow:auto}.approval-card{display:flex;justify-content:space-between;gap:10px;text-align:left;border:1px solid rgba(0,0,0,.1);background:#fff;border-radius:10px;padding:10px;cursor:pointer}.approval-card:hover{border-color:rgba(15,118,110,.35);background:rgba(15,118,110,.025)}.approval-card span{display:grid;gap:2px}.approval-card span:last-child{text-align:right}.approval-card small{font-size:10px;opacity:.66}
    .admin-approval-edit-workspace td small{display:block;font-size:9px;opacity:.62;margin-top:2px}.approval-edit-qty{width:70px}.approval-edit-price{width:135px}.approval-edit-qty,.approval-edit-price{padding:7px;border:1px solid var(--line);border-radius:7px;text-align:right;background:#fff}.approval-edit-grand-total{text-align:right}.approval-edit-grand-total small{display:block;color:var(--muted)}.approval-edit-grand-total strong{font-size:20px;color:#0f766e}.approval-edit-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.danger-soft{color:#991b1b!important;border-color:rgba(185,28,28,.25)!important}
    @media(max-width:1050px){.approval-hotfix-layout{grid-template-columns:1fr}.approval-card-list{max-height:none}}
  `;
  document.head.appendChild(style);
})();
