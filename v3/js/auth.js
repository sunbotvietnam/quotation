(function () {
  const { esc, friendlyError } = QV3Utils;
  function render(message = "") {
    document.getElementById("app").innerHTML =
      `<div class="wrap"><section class="panel login shared-login"><div class="brand"><img src="${QV3_CONFIG.LOGO_URL}" alt="Sunbot" style="width:88px;height:auto"><div><h1>SUNBOT - CÔNG CỤ BÁO GIÁ</h1><small>Dành cho nội bộ Kiro - Sunbot</small></div></div><h2>Nhập mật khẩu để tiếp tục</h2><div class="field"><label>Mật khẩu</label><input id="access-password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu"></div><button class="btn" id="login">Vào ứng dụng</button>${message ? `<p class="notice danger">${esc(message)}</p>` : ""}<p class="help">Dùng mật khẩu nội bộ được cấp để truy cập công cụ báo giá.</p></section></div>`;
    const input = document.getElementById("access-password");
    document.getElementById("login").onclick = login;
    input.onkeydown = (e) => {
      if (e.key === "Enter") login();
    };
    setTimeout(() => input.focus(), 50);
  }
  async function login() {
    const password = document.getElementById("access-password").value;
    if (!password) return render("Hãy nhập mật khẩu truy cập.");
    try {
      document.body.classList.add("busy");
      const result = await QV3Api.login(password);
      if (!result?.token) throw new Error("Không tạo được phiên làm việc.");
      QV3State.data.token = result.token;
      QV3Storage.setToken(result.token);
      await QV3App.bootstrap();
    } catch (error) {
      QV3Storage.clearToken();
      QV3State.data.token = "";
      render(friendlyError(error));
    } finally {
      document.body.classList.remove("busy");
    }
  }
  function logout() {
    QV3Storage.clearToken();
    QV3State.data.token = "";
    render();
  }
  window.QV3Auth = { render, login, logout };
})();
