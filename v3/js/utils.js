(function () {
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const money = (value) => Number(value || 0).toLocaleString("vi-VN") + " ₫";
  const pad = (value) => String(value).padStart(2, "0");
  const today = () => {
    const d = new Date();
    return {
      display: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
      compact: `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`,
    };
  };
  const slug = (value) =>
    String(value || "KHACH_HANG")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase()
      .slice(0, 60) || "KHACH_HANG";
  const friendlyError = (error) => {
    const raw = String(error?.message || error || "");
    if (/mật khẩu không đúng/i.test(raw))
      return "Mật khẩu không đúng. Vui lòng thử lại.";
    if (/hết hạn/i.test(raw))
      return "Phiên làm việc đã hết hạn. Vui lòng nhập lại mật khẩu.";
    return "Chưa kết nối được. Vui lòng tải lại trang và thử lại.";
  };
  const debounce = (fn, wait = 250) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };
  window.QV3Utils = { esc, money, today, slug, friendlyError, debounce };
})();
