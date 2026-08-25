// Quotation V3 runs as a simple internal sales tool.
// Keep the legacy Sunbot Ops session key empty so the older runtime patch does not attempt user-based authentication.
try {
  sessionStorage.removeItem('sunbot_pricebook_v3_session');
  if (typeof state !== 'undefined') state.token = '';
} catch (e) {}
