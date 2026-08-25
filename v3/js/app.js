(function () {
  const { esc, friendlyError } = QV3Utils,
    state = () => QV3State.data;
  async function bootstrap() {
    try {
      document.body.classList.add("busy");
      const [boot, catalog, materials] = await Promise.all([
        QV3Api.call(state().token, "bootstrap"),
        QV3Api.call(state().token, "catalog"),
        QV3Api.call(state().token, "materials"),
      ]);
      if (!catalog?.items?.length)
        throw new Error("Danh mục hiện hành chưa sẵn sàng.");
      state().boot = boot;
      state().catalog = catalog;
      state().materials = materials?.items || [];
      render();
    } catch (error) {
      QV3Storage.clearToken();
      state().token = "";
      QV3Auth.render(friendlyError(error));
    } finally {
      document.body.classList.remove("busy");
    }
  }
  function shell() {
    const context =
      state().customer.id || state().customer.opportunityId
        ? `<div class="context-note">Đã nhận thông tin khách hàng từ Sunbot Ops.</div>`
        : "";
    document.getElementById("app").innerHTML =
      `<div class="wrap"><header class="top"><div class="brand"><img src="${QV3_CONFIG.LOGO_URL}" alt="Sunbot" style="width:96px;height:auto"><div><h1>SUNBOT - CÔNG CỤ BÁO GIÁ</h1><small>Báo giá giải pháp · vật liệu · sửa chữa</small></div></div><button class="btn secondary" id="logout">Đăng xuất</button></header>${context}<nav class="nav no-print"><button class="tab ${state().mode === "SOLUTION" ? "active" : ""}" data-mode="SOLUTION">Giải pháp Sunbot</button><button class="tab ${state().mode === "RETAIL" ? "active" : ""} retail-tab" data-mode="RETAIL">Vật liệu & sửa chữa lẻ</button></nav><main id="content"></main><footer class="footer">Sunbot · Giá áp dụng theo bảng giá hiện hành, chưa gồm VAT và chi phí phát sinh nếu không ghi khác.</footer></div>`;
    document.getElementById("logout").onclick = QV3Auth.logout;
    document.querySelectorAll("[data-mode]").forEach(
      (button) =>
        (button.onclick = () => {
          state().mode = button.dataset.mode;
          render();
        }),
    );
  }
  function render() {
    if (!state().token) return QV3Auth.render();
    shell();
    if (state().mode === "RETAIL") QV3Retail.render();
    else if (state().view === "BUILDER") QV3Solution.render();
    else QV3Solution.renderCombos();
  }
  window.QV3App = { bootstrap, render };
  state().token ? bootstrap() : QV3Auth.render();
})();
