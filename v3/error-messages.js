// Error-message policy: distinguish real connectivity failures from business/backend validation.
(function(){
  friendlyError = function(e) {
    const s = String(e?.message || e || "").trim();
    if (!s) return "Không thực hiện được.";
    if (/phiên.*hết hạn|hết hạn.*phiên/i.test(s)) return "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.";
    if (/kết nối máy chủ quá thời gian|network error|failed to fetch|load failed|connection reset|err_connection|timeout/i.test(s)) {
      return "Chưa kết nối được hệ thống. Vui lòng tải lại trang và thử lại.";
    }
    // Validation/configuration errors from Apps Script are actionable and must not be hidden
    // behind a generic connectivity message.
    return s;
  };
})();
