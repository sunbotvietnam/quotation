// Sunbot Quotation V3 — client fast path.
// Goals: fewer Apps Script round-trips, request coalescing, short read cache,
// and immediate invalidation after any write so approval state stays correct.
(function () {
  const baseBridge = bridge;
  const inflight = new Map();
  const memoryCache = new Map();

  const READ_TTL = Object.freeze({
    bootstrapFast: 30000,
    bootstrap: 30000,
    catalog: 120000,
    listQuotes: 15000,
    getQuote: 30000,
  });

  function stablePayload(payload) {
    try {
      const obj = payload && typeof payload === "object" ? payload : {};
      return JSON.stringify(obj, Object.keys(obj).sort());
    } catch {
      return JSON.stringify(payload || {});
    }
  }

  function cacheKey(mode, subaction, payload, token) {
    return [String(mode || ""), String(subaction || ""), String(token || ""), stablePayload(payload)].join("|");
  }

  function isRead(mode, subaction) {
    return mode === "quotationShared" && Object.prototype.hasOwnProperty.call(READ_TTL, String(subaction || ""));
  }

  function invalidateQuotationReads() {
    for (const key of Array.from(memoryCache.keys())) {
      if (key.startsWith("quotationShared|listQuotes|") || key.startsWith("quotationShared|getQuote|")) memoryCache.delete(key);
    }
    for (const key of Array.from(inflight.keys())) {
      if (key.startsWith("quotationShared|listQuotes|") || key.startsWith("quotationShared|getQuote|")) inflight.delete(key);
    }
  }

  bridge = function (mode, subaction, payload = {}, token = state.token) {
    const action = String(subaction || "");
    const read = isRead(mode, action);
    const key = cacheKey(mode, action, payload, token);

    if (read) {
      const cached = memoryCache.get(key);
      if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
      if (cached) memoryCache.delete(key);
      if (inflight.has(key)) return inflight.get(key);
    } else if (mode === "quotationShared") {
      // Approval, revisions, save and export can change status/audit-visible state.
      invalidateQuotationReads();
    }

    const request = baseBridge(mode, action, payload, token)
      .then((result) => {
        if (read) {
          memoryCache.set(key, { value: result, expiresAt: Date.now() + Number(READ_TTL[action] || 0) });
        }
        return result;
      })
      .finally(() => {
        if (read) inflight.delete(key);
      });

    if (read) inflight.set(key, request);
    return request;
  };

  function applyBoot(boot) {
    state.role = String(boot?.role || boot?.user?.role || "REGIONAL_MANAGER").toUpperCase();
    state.loginId = String(boot?.login_id || boot?.user?.login_id || "");
    state.user = {
      login_id: state.loginId,
      display_name: String(boot?.display_name || boot?.user?.display_name || state.loginId),
      role: state.role,
      region: String(boot?.region || boot?.user?.region || ""),
    };
    if (state.role !== "ADMIN") {
      state.createdBy = state.user.display_name;
      sessionStorage.setItem(CREATOR_KEY, state.createdBy);
    }
  }

  const legacyLoadBackend = loadBackend;
  loadBackend = async function (token) {
    try {
      const fast = await bridge("quotationShared", "bootstrapFast", {}, token);
      if (!fast?.catalog?.items?.length) throw new Error("Fast bootstrap chưa có catalog.");
      applyBackendCatalog(fast.catalog);
      applyBoot(fast);
      return fast;
    } catch (error) {
      // Compatibility fallback while a backend deployment is propagating.
      return legacyLoadBackend(token);
    }
  };

  window.SUNBOT_QUOTATION_PERFORMANCE = {
    version: "2026.09.07-fastpath-v1",
    clearReadCache: invalidateQuotationReads,
  };
})();
