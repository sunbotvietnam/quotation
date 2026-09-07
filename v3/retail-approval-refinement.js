// Sunbot V3 refinement 2026-09-07.
// 1) Admin feedback is preserved as revision coaching when Admin edits directly.
// 2) Retail/repair quotations do not show a solution narrative to customers or Admin.
// 3) Returned retail/repair quotations reopen directly in the Retail & Repair editor.
(function () {
  let lastQuoteBundle = null;
  const bundleById = new Map();

  function isRetail(bundle) {
    const q = bundle?.quote || {};
    return String(q.combo_code || '').toUpperCase() === 'RETAIL_REPAIR' || String(q.quote_type || '').toUpperCase() === 'RETAIL';
  }

  function rememberBundle(bundle) {
    if (!bundle?.quote?.quote_id) return;
    lastQuoteBundle = bundle;
    bundleById.set(String(bundle.quote.quote_id), bundle);
    setTimeout(() => applyRetailPresentation(bundle), 0);
  }

  // Observe getQuote results without changing Backend behavior.
  if (typeof bridge === 'function') {
    const baseBridge = bridge;
    bridge = async function (...args) {
      const result = await baseBridge.apply(this, args);
      const action = String(args[1] || '');
      if (action === 'getQuote' && result?.quote) rememberBundle(result);
      return result;
    };
  }

  function applyRetailPresentation(bundle) {
    if (!isRetail(bundle)) return;

    // Customer/preview output: no solution narrative page for accessories & repairs.
    document.querySelectorAll('.customer-proposal-narrative').forEach((el) => el.remove());
    document.querySelectorAll('.customer-proposal-page .quote-title-block h1').forEach((el) => {
      el.textContent = 'BÁO GIÁ HỌC CỤ, PHỤ KIỆN & SỬA CHỮA SUNBOT';
    });

    // Admin workspace: keep the hidden backend field populated for compatibility,
    // but remove the narrative from the review experience.
    const narrative = document.getElementById('approval-edit-narrative');
    if (narrative) {
      const field = narrative.closest('.field');
      if (field) field.style.display = 'none';
      let heading = field?.previousElementSibling;
      if (heading && /thuyết minh/i.test(heading.textContent || '')) heading.style.display = 'none';
      narrative.dataset.retailHidden = '1';
    }

    const workspace = document.querySelector('.admin-approval-edit-workspace');
    if (workspace && !workspace.querySelector('.retail-admin-note')) {
      const note = document.createElement('div');
      note.className = 'notice ok retail-admin-note';
      note.innerHTML = '<b>Báo giá Bán lẻ / Sửa chữa:</b> không cần thuyết minh giải pháp. Admin tập trung kiểm tra hạng mục, số lượng, đơn giá, ghi chú kỹ thuật và điều kiện dịch vụ.';
      const firstH3 = workspace.querySelector('h3');
      if (firstH3) firstH3.insertAdjacentElement('beforebegin', note);
      else workspace.appendChild(note);
    }
  }

  function loadRetailBundle(bundle) {
    const q = bundle?.quote || {};
    const lines = Array.isArray(bundle?.lines) ? bundle.lines : [];
    state.retailRepair = state.retailRepair || {};
    state.retailRepair.cart = {};
    lines.forEach((line, index) => {
      const code = String(line.item_id || `CUSTOM_RETAIL_RETURN_${index}`);
      const custom = line.is_custom === true || String(line.is_custom || '').toUpperCase() === 'TRUE' || String(line.commercial_group || '').toUpperCase() === 'CUSTOM' || /^CUSTOM_RETAIL_/.test(code);
      state.retailRepair.cart[code] = {
        code,
        name: String(line.item_name_snapshot || line.name || code),
        unit: String(line.unit_snapshot || line.unit || 'Cái'),
        price: Number(line.proposed_unit_price ?? line.unit_price_snapshot ?? 0),
        qty: Number(line.qty || 0),
        custom,
        category: custom ? 'Tùy chỉnh' : 'Đã lưu',
      };
    });
    state.retailRepair.quoteId = String(q.quote_id || '');
    state.retailRepair.notes = String(q.notes || '');
    state.retailRepair.adminFeedback = String(q.change_request || q.rejection_reason || '');
    state.client = String(q.client_name || '');
    state.createdBy = String(q.created_by || state.createdBy || '');
    state.tab = 'retailRepair';
    renderContent();
    document.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('active', x.dataset.tab === 'retailRepair'));
    setTimeout(showRetailFeedback, 0);
  }

  function showRetailFeedback() {
    const feedback = String(state.retailRepair?.adminFeedback || '').trim();
    if (!feedback) return;
    const content = document.getElementById('content');
    if (!content || content.querySelector('.retail-admin-feedback')) return;
    const box = document.createElement('section');
    box.className = 'panel retail-admin-feedback';
    box.innerHTML = `<div class="builder-head"><div><span class="badge">PHẢN HỒI TỪ ADMIN</span><h3>Cần chỉnh trước khi gửi lại</h3></div></div><div class="notice">${typeof esc === 'function' ? esc(feedback) : feedback}</div><p class="help">Sau khi chỉnh xong, bấm <b>Lưu & gửi duyệt</b>. Hệ thống giữ nguyên mã báo giá và tạo phiên bản tiếp theo.</p>`;
    content.prepend(box);
  }

  // Make coaching text survive direct Admin edits too: if Admin wrote feedback,
  // copy it into revision_note before the existing save handler runs.
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.matches('#approval-admin-save, #approval-admin-save-approve')) {
      const feedback = String(document.getElementById('approval-edit-feedback')?.value || '').trim();
      const note = document.getElementById('approval-edit-revision-note');
      if (feedback && note) {
        const existing = String(note.value || '').trim();
        note.value = existing ? `${existing} | Phản hồi cho Sales: ${feedback}` : feedback;
      }
    }
  }, true);

  // V4's generic "Sửa theo yêu cầu" reopens a normal solution builder. Retail/repair
  // needs to reopen the retail editor instead, with its existing lines ready to edit.
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.matches('#v4-resume')) return;
    if (!lastQuoteBundle || !isRetail(lastQuoteBundle)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    loadRetailBundle(lastQuoteBundle);
  }, true);

  const observer = new MutationObserver(() => {
    if (lastQuoteBundle) applyRetailPresentation(lastQuoteBundle);
    if (state.tab === 'retailRepair') showRetailFeedback();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const style = document.createElement('style');
  style.textContent = `
    .retail-admin-note{margin:12px 0}
    .retail-admin-feedback{border-left:4px solid #ea580c}
    .retail-admin-feedback h3{margin:3px 0 0}
  `;
  document.head.appendChild(style);
})();
