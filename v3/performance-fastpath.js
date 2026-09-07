// Sunbot Quotation V3 — published snapshot fast path.
// Employees open APPROVED quotes from immutable published snapshots, not live Sheets.
(function () {
  const baseBridge = bridge;
  const inflight = new Map();
  const memoryCache = new Map();
  const publicationCache = new Map();
  let publicationUserKey = "";

  const READ_TTL = Object.freeze({
    bootstrapFast: 30000,
    bootstrap: 30000,
    catalog: 120000,
    listQuotes: 20000,
    listPublishedQuotes: 60000,
    getQuote: 30000,
    getQuoteFast: 300000,
    getPublishedQuote: 300000,
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

  function isQuoteReadKey(key) {
    return key.startsWith("quotationShared|listQuotes|") ||
      key.startsWith("quotationShared|listPublishedQuotes|") ||
      key.startsWith("quotationShared|getQuote|") ||
      key.startsWith("quotationShared|getQuoteFast|") ||
      key.startsWith("quotationShared|getPublishedQuote|");
  }

  function localStorageKey() {
    return publicationUserKey ? `sunbot:published-quotes:${publicationUserKey}` : "";
  }

  function loadLocalPublications() {
    publicationCache.clear();
    const key = localStorageKey();
    if (!key) return;
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "{}");
      const items = Array.isArray(raw.items) ? raw.items : [];
      items.forEach((snapshot) => {
        const q = snapshot?.quote || {};
        if (String(q.status || "").toUpperCase() === "APPROVED" && q.quote_id) publicationCache.set(String(q.quote_id), snapshot);
      });
    } catch {}
  }

  function persistLocalPublications(items) {
    const key = localStorageKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify({saved_at:Date.now(),items:Array.from(items || [])}));
    } catch {}
  }

  function absorbPublications(result) {
    const items = Array.isArray(result) ? result : (Array.isArray(result?.items) ? result.items : []);
    items.forEach((snapshot) => {
      const q = snapshot?.quote || {};
      if (!q.quote_id || String(q.status || "").toUpperCase() !== "APPROVED") return;
      const id = String(q.quote_id);
      const previous = publicationCache.get(id);
      if (!previous || Number(q.version || 1) >= Number(previous?.quote?.version || 1)) publicationCache.set(id, snapshot);
    });
    persistLocalPublications(publicationCache.values());
  }

  function prefetchPublished(token) {
    if (String(state.role || "").toUpperCase() === "ADMIN") return;
    // Background only: never blocks login or normal navigation.
    bridge("quotationShared", "listPublishedQuotes", {}, token)
      .then(absorbPublications)
      .catch(() => {});
  }

  function invalidateQuotationReads() {
    for (const key of Array.from(memoryCache.keys())) if (isQuoteReadKey(key)) memoryCache.delete(key);
    for (const key of Array.from(inflight.keys())) if (isQuoteReadKey(key)) inflight.delete(key);
  }

  function routedAction(mode, action) {
    if (mode !== "quotationShared") return action;
    if (action === "getQuote" && String(state.role || "").toUpperCase() !== "ADMIN") return "getPublishedQuote";
    return action;
  }

  bridge = function (mode, subaction, payload = {}, token = state.token) {
    const requestedAction = String(subaction || "");

    // Instant path: once an approved snapshot is locally available, clicking "Xem" makes no network request.
    if (mode === "quotationShared" && requestedAction === "getQuote" && String(state.role || "").toUpperCase() !== "ADMIN") {
      const quoteId = String(payload?.quote_id || "");
      const published = publicationCache.get(quoteId);
      if (published) return Promise.resolve(published);
    }

    const action = routedAction(mode, requestedAction);
    const read = isRead(mode, action);
    const key = cacheKey(mode, action, payload, token);

    if (read) {
      const cached = memoryCache.get(key);
      if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
      if (cached) memoryCache.delete(key);
      if (inflight.has(key)) return inflight.get(key);
    } else if (mode === "quotationShared") {
      invalidateQuotationReads();
    }

    const request = baseBridge(mode, action, payload, token)
      .then((result) => {
        if (read) memoryCache.set(key, { value: result, expiresAt: Date.now() + Number(READ_TTL[action] || 0) });
        if (action === "listPublishedQuotes") absorbPublications(result);
        if ((action === "getPublishedQuote" || action === "getQuoteFast") && result?.quote?.quote_id && String(result.quote.status || "").toUpperCase() === "APPROVED") {
          publicationCache.set(String(result.quote.quote_id), result);
          persistLocalPublications(publicationCache.values());
        }
        return result;
      })
      .catch((error) => {
        // Safe compatibility fallback during backend propagation.
        if (action === "getPublishedQuote" && requestedAction === "getQuote") {
          return baseBridge(mode, "getQuoteFast", payload, token).catch(() => baseBridge(mode, "getQuote", payload, token)).then((result) => {
            if (result?.quote?.quote_id && String(result.quote.status || "").toUpperCase() === "APPROVED") {
              publicationCache.set(String(result.quote.quote_id), result);
              persistLocalPublications(publicationCache.values());
            }
            return result;
          });
        }
        throw error;
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
      publicationUserKey = String(state.loginId || state.createdBy || "").toLowerCase();
      loadLocalPublications();
    }
  }

  const legacyLoadBackend = loadBackend;
  loadBackend = async function (token) {
    try {
      const fast = await bridge("quotationShared", "bootstrapFast", {}, token);
      if (!fast?.catalog?.items?.length) throw new Error("Fast bootstrap chưa có catalog.");
      applyBackendCatalog(fast.catalog);
      applyBoot(fast);
      prefetchPublished(token);
      return fast;
    } catch (error) {
      const result = await legacyLoadBackend(token);
      try { prefetchPublished(token); } catch {}
      return result;
    }
  };

  window.SUNBOT_QUOTATION_PERFORMANCE = {
    version: "2026.09.07-published-snapshot-v1",
    clearReadCache: invalidateQuotationReads,
    refreshPublished: () => prefetchPublished(state.token),
  };
})();
