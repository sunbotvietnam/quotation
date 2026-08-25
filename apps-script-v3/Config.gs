const QV3_CONFIG = Object.freeze({
  SCHEMA_VERSION: '3.0.0',
  PRICEBOOK_VERSION: 'SUNBOT-2026-08-24',
  DEFAULT_CURRENCY: 'VND',
  SHEETS: Object.freeze({
    CATALOG_ITEMS: 'CATALOG_ITEMS', PRICE_VERSIONS: 'PRICE_VERSIONS',
    COMBO_DEFINITIONS: 'COMBO_DEFINITIONS', COMBO_COMPONENTS: 'COMBO_COMPONENTS',
    PRICING_RULES: 'PRICING_RULES', QUOTES: 'QUOTES', QUOTE_LINES: 'QUOTE_LINES',
    USERS: 'USERS', PERMISSIONS: 'PERMISSIONS', AUDIT_LOG: 'AUDIT_LOG'
  })
});

function qv3Spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('QUOTATION_V3_SPREADSHEET_ID');
  if (!id) throw new Error('Thiếu Script Property QUOTATION_V3_SPREADSHEET_ID.');
  return SpreadsheetApp.openById(id);
}
