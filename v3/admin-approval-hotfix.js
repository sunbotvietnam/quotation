// Admin approval hotfix 2026-09-07.
// Keeps approval workflow usable even if another UI layer fails or returns an unexpected list shape.
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

  const asQuoteArray = (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.quotes)) return result.quotes;
    if (Array.isArray(result?.items)) return result.items;
    if (Array.isArray(result?.data)) return result.data;
    return [];
  };

  function detailHtml(bundle) {
    const q = bundle?.quote || {};
    const lines = Array.isArray(bundle?.lines) ? bundle.lines : [];
    const rows = lines.map((line, i) => {
      const price = Number(line.proposed_unit_price ?? line.unit_price_snapshot ?? 0);
      const qty = Number(line.qty || 0);
      return `<tr>
        <td>${i + 1}</td>
        <td><b>${esc(line.item_name_snapshot || line.item_id || "")}</b><small>${esc(line.unit_snapshot || "")}${line.is_custom ? " · Tùy chỉnh" : ""}</small></td>
        <td class="money">${qty}</td>
        <td class="money">${money(price)}</td>
        <td class="money">${money(Number(line.line_total || price * qty))}</td>
      </tr>`;
    }).join("");
    const note = String(q.exception_reason || q.notes || "").trim();
    return `<section class="panel admin-approval-detail-fallback">
      <div class="builder-head"><div><span class="badge">CHỜ DUYỆT</span><h2>${esc(q.client_name || "Báo giá")}</h2><p class="help">${esc(displayCode(q.quote_id))} · Người lập: ${esc(personName(q.created_by))} · Phiên bản ${Number(q.version || 1)}</p></div><div class="price">${money(q.proposed_amount || q.final_amount || 0)}</div></div>
      ${note ? `<p class="notice"><b>Ghi chú / ngoại lệ:</b> ${esc(note)}</p>` : ""}
      <div class="table-wrap"><table class="table"><thead><tr><th>STT</th><th>Hạng mục</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${q.configuration_description ? `<details style="margin-top:12px"><summary><b>Xem thuyết minh cấu hình</b></summary><div class="help" style="white-space:pre-wrap;margin-top:8px">${esc(q.configuration_description)}</div></details>` : ""}
      <div class="toolbar no-print" style="margin-top:14px">
        <button class="btn" id="approval-hotfix-approve">Duyệt báo giá</button>
        <button class="btn secondary" id="approval-hotfix-return">Trả lại chỉnh sửa</button>
      </div>
    </section>`;
  }

  async function openPendingQuote(quoteId) {
    const host = document.getElementById("approval-hotfix-detail");
    if (!host) return;
    host.innerHTML = '<section class="panel"><p class="help">Đang tải hồ sơ duyệt...</p></section>';
    try {
      const bundle = await bridge("quotationShared", "getQuote", { quote_id: quoteId }, state.token);
      host.innerHTML = detailHtml(bundle);
      document.getElementById("approval-hotfix-approve")?.addEventListener("click", async () => {
        const defaultReason = String(bundle?.quote?.exception_reason || "").trim();
        const reason = prompt("Ghi chú duyệt (có thể để trống nếu báo giá chuẩn):", defaultReason);
        if (reason === null) return;
        try {
          await bridge("quotationShared", "approveQuote", { quote_id: quoteId, reason: String(reason || "").trim() }, state.token);
          alert("Đã duyệt báo giá.");
          renderApprovals();
        } catch (e) {
          alert(friendlyError(e));
        }
      });
      document.getElementById("approval-hotfix-return")?.addEventListener("click", async () => {
        const reason = prompt("Nêu rõ nội dung cần chỉnh sửa:", "");
        if (!reason?.trim()) return;
        try {
          await bridge("quotationShared", "requestChanges", { quote_id: quoteId, change_request: reason.trim(), reason: reason.trim() }, state.token);
          alert("Đã gửi yêu cầu chỉnh sửa cho người lập báo giá.");
          renderApprovals();
        } catch (e) {
          alert(friendlyError(e));
        }
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
      const quotes = asQuoteArray(raw);
      const pending = quotes
        .filter((q) => String(q.status || "").trim().toUpperCase() === "NEEDS_APPROVAL")
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      el.innerHTML = `<div class="approval-hotfix-layout">
        <section class="panel">
          <div class="builder-head"><div><h2>Báo giá chờ duyệt</h2><p class="help">Backend hiện có <b>${pending.length}</b> báo giá ở trạng thái NEEDS_APPROVAL.</p></div><button class="btn secondary" id="approval-hotfix-refresh">Tải lại</button></div>
          ${pending.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Khách hàng</th><th>Người lập</th><th>Giá trị</th><th></th></tr></thead><tbody>${pending.map((q) => `<tr><td><b>${esc(q.quote_code || displayCode(q.quote_id))}</b><small>v${Number(q.version || 1)}</small></td><td>${esc(q.client_name || "")}</td><td>${esc(personName(q.created_by))}</td><td class="money">${money(q.final_amount || 0)}</td><td><button class="btn" data-approval-hotfix-review="${esc(q.quote_id)}">Xem & duyệt</button></td></tr>`).join("")}</tbody></table></div>` : '<p class="notice ok">Hiện không có báo giá nào chờ duyệt.</p>'}
        </section>
        <div id="approval-hotfix-detail"></div>
      </div>`;

      document.getElementById("approval-hotfix-refresh")?.addEventListener("click", renderApprovals);
      document.querySelectorAll("[data-approval-hotfix-review]").forEach((btn) => {
        btn.addEventListener("click", () => openPendingQuote(btn.dataset.approvalHotfixReview));
      });
    } catch (e) {
      el.innerHTML = `<section class="panel"><h2>Duyệt báo giá</h2><p class="notice danger">Không tải được danh sách chờ duyệt: ${esc(friendlyError(e))}</p><button class="btn secondary" id="approval-hotfix-retry">Thử lại</button></section>`;
      document.getElementById("approval-hotfix-retry")?.addEventListener("click", renderApprovals);
    }
  };

  const style = document.createElement("style");
  style.textContent = `.approval-hotfix-layout{display:grid;grid-template-columns:minmax(420px,48%) minmax(0,52%);gap:14px;align-items:start}.admin-approval-detail-fallback td small{display:block;font-size:10px;opacity:.65;margin-top:2px}@media(max-width:980px){.approval-hotfix-layout{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
})();
