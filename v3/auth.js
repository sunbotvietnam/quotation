// Authentication UI for Sunbot Sales Pricebook V3.
// IMPORTANT: no real passwords or password hashes belong in this public frontend.
(function () {
  const LOGIN_KEY = "sunbot_pricebook_v3_login_id";
  const MANAGERS = [
    { name: "Hoàng Nhung", region: "Hà Nội" },
    { name: "Minh Thu", region: "Đông Bắc" },
    { name: "Lê Dung", region: "Bắc Trung Bộ" },
  ];
  state.loginId = sessionStorage.getItem(LOGIN_KEY) || "";

  const baseRegionOf = regionOf;
  regionOf = function (name) {
    if (
      state.user &&
      String(name || "").toLowerCase() ===
        String(state.user.display_name || "").toLowerCase()
    )
      return state.user.region || "";
    const manager = MANAGERS.find((x) => x.name === name);
    return manager?.region || baseRegionOf(name);
  };

  creatorOptions = function () {
    if (state.role === "ADMIN") {
      return (
        '<option value="">-- Chọn người lập báo giá --</option>' +
        MANAGERS.map(
          (manager) =>
            `<option value="${esc(manager.name)}" ${state.createdBy === manager.name ? "selected" : ""}>${esc(manager.name)}</option>`,
        ).join("")
      );
    }
    const manager = state.user;
    if (!manager?.display_name)
      return '<option value="">-- Tài khoản chưa gắn người lập báo giá --</option>';
    state.createdBy = manager.display_name;
    sessionStorage.setItem(CREATOR_KEY, manager.display_name);
    return `<option value="${esc(manager.display_name)}" selected>${esc(manager.display_name)}</option>`;
  };

  loginView = function (msg = "") {
    app.innerHTML = `<div class="wrap"><section class="panel login shared-login">
      <div class="brand"><img src="../assets/img/logo-sunbot.png" alt="Sunbot" style="width:88px;height:auto"><div><h1>SUNBOT - CÔNG CỤ BÁO GIÁ</h1><small>Dành cho nội bộ Kiro - Sunbot</small></div></div>
      <h2>Đăng nhập</h2>
      <div class="field"><label>ID</label><input id="login-id" type="text" autocomplete="username" value="${esc(state.loginId || "")}" placeholder="Nhập ID"></div>
      <div class="field"><label>Mật khẩu</label><input id="access-password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu"></div>
      <button class="btn" id="login">Vào ứng dụng</button>
      ${msg ? `<p class="notice danger">${esc(msg)}</p>` : ""}
      <p class="help">Dùng ID và mật khẩu nội bộ được cấp. Mật khẩu được kiểm tra ở máy chủ và không được lưu trong mã nguồn frontend.</p>
    </section></div>`;
    document.getElementById("login").onclick = login;
    document.getElementById("access-password").onkeydown = (e) => {
      if (e.key === "Enter") login();
    };
    document.getElementById("login-id").onkeydown = (e) => {
      if (e.key === "Enter")
        document.getElementById("access-password")?.focus();
    };
    setTimeout(
      () =>
        document
          .getElementById(state.loginId ? "access-password" : "login-id")
          ?.focus(),
      50,
    );
  };

  login = async function () {
    const loginId = String(
      document.getElementById("login-id")?.value || "",
    ).trim();
    const password = String(
      document.getElementById("access-password")?.value || "",
    );
    if (!loginId) return loginView("Hãy nhập ID.");
    if (!password) return loginView("Hãy nhập mật khẩu.");
    try {
      const r = await bridge(
        "quotationAccess",
        "",
        { login_id: loginId, identifier: loginId, password },
        "",
      );
      if (!r?.token) throw new Error("ID hoặc mật khẩu không đúng.");
      state.token = r.token;
      state.loginId = String(r.login_id || loginId);
      sessionStorage.setItem(LOGIN_KEY, state.loginId);
      sessionStorage.setItem(SESSION_KEY, r.token);
      await loadBackend(r.token);
      render();
    } catch (e) {
      state.token = "";
      sessionStorage.removeItem(SESSION_KEY);
      state.loginId = loginId;
      sessionStorage.setItem(LOGIN_KEY, loginId);
      loginView(friendlyError(e));
    }
  };

  const baseLogout = logout;
  logout = function () {
    baseLogout();
    sessionStorage.removeItem(LOGIN_KEY);
    state.loginId = "";
  };

  if (!state.token) loginView();
})();
