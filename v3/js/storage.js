(function () {
  window.QV3Storage = {
    getToken: () => sessionStorage.getItem(QV3_CONFIG.SESSION_KEY) || "",
    setToken: (token) => sessionStorage.setItem(QV3_CONFIG.SESSION_KEY, token),
    clearToken: () => sessionStorage.removeItem(QV3_CONFIG.SESSION_KEY),
    getCreator: () => localStorage.getItem(QV3_CONFIG.CREATOR_KEY) || "",
    setCreator: (value) =>
      localStorage.setItem(QV3_CONFIG.CREATOR_KEY, String(value || "")),
  };
})();
