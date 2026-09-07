// Quotation navigation/bootstrap shim — 2026-09-07.
// Approval, history, resume and export are owned by approval-workflow-v4.js,
// with the final Admin editor in admin-approval-hotfix.js.
// This file now only provides shared navigation/UI polish so there is one approval workflow owner.
(function () {
  const baseRender = render;
  render = function () {
    baseRender();
    if (!state.token) return;
    const nav = document.querySelector('nav.nav');
    if (!nav || nav.querySelector('[data-tab="quotes"]')) return;
    const approvals = nav.querySelector('[data-tab="approvals"]');
    const button = document.createElement('button');
    button.className = `tab ${state.tab === 'quotes' ? 'active' : ''}`;
    button.dataset.tab = 'quotes';
    button.textContent = state.role === 'ADMIN' ? 'Tất cả báo giá' : 'Báo giá của tôi';
    if (approvals) approvals.insertAdjacentElement('afterend', button);
    else nav.querySelector('[data-tab="builder"]')?.insertAdjacentElement('afterend', button);
    button.onclick = () => {
      state.tab = 'quotes';
      renderContent();
      document.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('active', x.dataset.tab === 'quotes'));
    };
  };

  const baseRenderBuilder = renderBuilder;
  renderBuilder = function () {
    baseRenderBuilder();
    const labels = Array.from(document.querySelectorAll('.builder-controls .field label'));
    labels.forEach((label) => {
      const text = label.textContent.trim();
      if (text === 'Khu vực') label.closest('.field')?.remove();
      if (text === 'Trưởng vùng / người lập') label.textContent = 'Người lập báo giá';
    });
    const footer = document.querySelector('.quote-footer-note small');
    if (footer) footer.textContent = `Người lập: ${state.createdBy || 'Chưa chọn'}`;
  };

  copySummary = async function (lines, total) {
    const txt = `${state.client || 'Khách hàng'}\nNgười lập: ${state.createdBy || '-'}\n${lines.map((l) => `${l.name}: ${l.qty} x ${money(l.price)} = ${money(l.qty * l.price)}`).join('\n')}\nTỔNG: ${money(total)}\nTRẠNG THÁI: CHỜ ADMIN DUYỆT`;
    try {
      await navigator.clipboard.writeText(txt);
      alert('Đã sao chép tóm tắt nội bộ.');
    } catch {
      alert(txt);
    }
  };
})();
