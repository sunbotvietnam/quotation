(function () {
  const pending = new Map(),
    requestId = () =>
      `qv3_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  window.addEventListener("message", (event) => {
    if (
      !(
        event.origin === "https://script.google.com" ||
        event.origin.endsWith(".googleusercontent.com")
      )
    )
      return;
    const data = event.data || {},
      request = pending.get(data.requestId);
    if (data.type !== "sunbot-pages-response" || !request) return;
    pending.delete(data.requestId);
    clearTimeout(request.timer);
    request.frame.remove();
    data.ok
      ? request.resolve(data.result)
      : request.reject(new Error(data.error || "Không xử lý được yêu cầu."));
  });
  function bridge(mode, subaction, payload, token) {
    return new Promise((resolve, reject) => {
      const id = requestId(),
        frame = document.createElement("iframe");
      frame.name = id;
      frame.className = "bridge-frame";
      document.body.appendChild(frame);
      const timer = setTimeout(() => {
        pending.delete(id);
        frame.remove();
        reject(new Error("Kết nối quá thời gian."));
      }, QV3_CONFIG.API_TIMEOUT_MS);
      pending.set(id, { resolve, reject, frame, timer });
      const form = document.createElement("form");
      form.method = "POST";
      form.action = QV3_CONFIG.API_URL;
      form.target = id;
      form.className = "bridge-form";
      Object.entries({
        action: "pagesBridge",
        request_id: id,
        mode,
        subaction: subaction || "",
        token: token || "",
        payload: JSON.stringify(payload || {}),
      }).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      form.remove();
    });
  }
  window.QV3Api = {
    login: (password) => bridge("quotationAccess", "", { password }, ""),
    call: (token, action, payload = {}) =>
      bridge("quotationV3", action, payload, token),
  };
})();
