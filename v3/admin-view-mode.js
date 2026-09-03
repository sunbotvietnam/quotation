// Admin can inspect the exact employee-facing UI without logging out.
// Preview mode is deliberately read-only for server writes: it is a QA/view mode,
// not identity impersonation.
(function () {
  const MODE_KEY = "sunbot_pricebook_v3_admin_view_mode";
  const PERSON_KEY = "sunbot_pricebook_v3_admin_preview_person";
  const PEOPLE = [
    { id: "Nhung", name: "Hoàng Nhung" },
    { id: "Thu", name: "Minh Thu" },
    { id: "Dung", name: "Lê Dung" },
  ];

  state.adminViewMode = sessionStorage.getItem(MODE_KEY) || "ADMIN";
  state.adminPreviewPerson = sessionStorage.getItem(PERSON_KEY) || "Nhung";
  state.actualRole = state.actualRole || "";
  state.actualUser = state.actualUser || null;

  const previewPerson = () => PEOPLE.find((x) => x.id === state.adminPreviewPerson) || PEOPLE[0];
  const isEmployeePreview = () => state.actualRole === "ADMIN" && state.adminViewMode === "EMPLOYEE";

  function rememberActualIdentity() {
    if (String(state.role || "").toUpperCase() === "ADMIN") {
      state.actualRole = "ADMIN";
      state.actualUser = state.user ? { ...state.user } : null;
    }
  }

  function applyModeIdentity() {
    if (state.actualRole !== "ADMIN") return;
    if (state.adminViewMode === "EMPLOYEE") {
      const person = previewPerson();
      state.role = "REGIONAL_MANAGER";
      state.user = {
        ...(state.actualUser || {}),
        login_id: person.id,
        display_name: person.name,
        role: "REGIONAL_MANAGER",
        region: "",
      };
      state.createdBy = person.name;
      sessionStorage.setItem(CREATOR_KEY, person.name);
      if (["approvals"].includes(state.tab)) state.tab = "combos";
    } else {
      state.role = "ADMIN";
      if (state.actualUser) state.user = { ...state.actualUser };
    }
  }

  const baseLoadBackend = loadBackend;
  loadBackend = async function (token) {
    const result = await baseLoadBackend(token);
    rememberActualIdentity();
    applyModeIdentity();
    return result;
  };

  function switchMode(mode) {
    state.adminViewMode = mode === "EMPLOYEE" ? "EMPLOYEE" : "ADMIN";
    sessionStorage.setItem(MODE_KEY, state.adminViewMode);
    applyModeIdentity();
    state.tab = "combos";
    render();
  }

  function switchPerson(id) {
    if (!PEOPLE.some((x) => x.id === id)) return;
    state.adminPreviewPerson = id;
    sessionStorage.setItem(PERSON_KEY, id);
    applyModeIdentity();
    state.tab = "combos";
    render();
  }

  function injectModeControls() {
    if (state.actualRole !== "ADMIN") return;
    const toolbar = document.querySelector("header.top .toolbar");
    if (!toolbar || toolbar.querySelector(".admin-view-switch")) return;

    const preview = isEmployeePreview();
    const person = previewPerson();
    const box = document.createElement("div");
    box.className = `admin-view-switch ${preview ? "employee" : "admin"}`;
    box.innerHTML = preview
      ? `<span><small>ĐANG XEM NHƯ NHÂN VIÊN</small><b>${esc(person.name)}</b></span>
         <select id="admin-preview-person" aria-label="Chọn nhân viên để xem giao diện">
           ${PEOPLE.map((x) => `<option value="${x.id}" ${x.id === person.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}
         </select>
         <button class="btn secondary" id="back-admin-view" type="button">Về Admin</button>`
      : `<span><small>GÓC NHÌN</small><b>Admin</b></span>
         <button class="btn secondary" id="employee-view" type="button">Xem như Nhân viên</button>`;
    toolbar.prepend(box);

    document.getElementById("employee-view")?.addEventListener("click", () => switchMode("EMPLOYEE"));
    document.getElementById("back-admin-view")?.addEventListener("click", () => switchMode("ADMIN"));
    document.getElementById("admin-preview-person")?.addEventListener("change", (e) => switchPerson(e.target.value));
  }

  function injectPreviewBanner() {
    if (!isEmployeePreview()) return;
    const content = document.getElementById("content");
    if (!content || content.querySelector(".employee-preview-banner")) return;
    const person = previewPerson();
    const banner = document.createElement("div");
    banner.className = "notice employee-preview-banner no-print";
    banner.innerHTML = `<b>Chế độ xem thử giao diện Nhân viên · ${esc(person.name)}</b><span>Bạn vẫn đăng nhập bằng Admin. Chế độ này chỉ để kiểm tra giao diện và luồng nhìn của nhân viên; các thao tác ghi dữ liệu lên máy chủ bị khóa.</span>`;
    content.prepend(banner);
  }

  const baseRender = render;
  render = function () {
    applyModeIdentity();
    baseRender();
    injectModeControls();
    injectPreviewBanner();
  };

  const baseRenderContent = renderContent;
  renderContent = function () {
    applyModeIdentity();
    const result = baseRenderContent();
    queueMicrotask(() => {
      injectModeControls();
      injectPreviewBanner();
      if (isEmployeePreview()) {
        document.querySelectorAll("#saveQuote,[data-approve],[data-reject],#detailApprove,#detailReject,#v4-approve-unchanged,#v4-revise-approve,#v4-request-changes").forEach((el) => {
          el.disabled = true;
          el.title = "Chế độ xem thử Nhân viên không ghi dữ liệu lên máy chủ.";
        });
      }
    });
    return result;
  };

  // This layer wraps the shared bridge and blocks every write path, including V4.
  const baseBridge = bridge;
  bridge = async function (mode, subaction, payload = {}, token = state.token) {
    if (isEmployeePreview() && mode === "quotationShared") {
      const blocked = ["saveSnapshot", "approveQuote", "rejectQuote", "requestChanges", "adminReviseQuote"];
      if (blocked.includes(String(subaction || ""))) {
        throw new Error("Đây là chế độ xem thử Nhân viên. Hãy chuyển về Góc nhìn Admin hoặc đăng nhập bằng tài khoản nhân viên để ghi dữ liệu.");
      }
      if (subaction === "listQuotes") {
        const rows = await baseBridge(mode, subaction, payload, token);
        const person = previewPerson();
        return (Array.isArray(rows) ? rows : []).filter((q) => {
          const creator = String(q.created_by || "").trim();
          return creator === person.id || creator === person.name;
        });
      }
    }
    return baseBridge(mode, subaction, payload, token);
  };

  const style = document.createElement("style");
  style.textContent = `
    .admin-view-switch{display:flex;align-items:center;gap:8px;padding:5px 6px 5px 10px;border:1px solid var(--line);border-radius:11px;background:#fff}
    .admin-view-switch>span{display:grid;line-height:1.05}.admin-view-switch small{font-size:8px;letter-spacing:.08em;color:var(--muted);font-weight:800}.admin-view-switch b{font-size:12px;margin-top:3px}.admin-view-switch select{max-width:150px;border:1px solid var(--line);border-radius:8px;background:#fff;padding:7px 8px;font-size:12px}
    .admin-view-switch.employee{border-color:#e8c66b;background:#fffaf0}.employee-preview-banner{display:grid;gap:3px;margin-bottom:14px;background:#fff8df;border-color:#ead18b}.employee-preview-banner span{font-size:12px;line-height:1.45}
    @media(max-width:900px){.admin-view-switch{width:100%;flex-wrap:wrap}.admin-view-switch>span{margin-right:auto}}
  `;
  document.head.appendChild(style);

  rememberActualIdentity();
  applyModeIdentity();
})();
