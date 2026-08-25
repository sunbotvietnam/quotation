const QV3_HEADERS = Object.freeze({
  CATALOG_ITEMS: ['item_id','item_type','category','name','description','unit','status','sales_visible','customer_visible','quote_selectable','price_mode','pricing_rule_id','sort_order','tags','source_ref','metadata_json','updated_at','updated_by'],
  PRICE_VERSIONS: ['price_id','item_id','list_price','recommended_price','floor_price','valid_from','valid_to','currency','tax_rule_id','approved_by','approved_at'],
  COMBO_DEFINITIONS: ['combo_code','name','description','status','recommended','sort_order'],
  COMBO_COMPONENTS: ['combo_code','component_item_id','qty','required','can_edit','condition_rule_id','line_order'],
  PRICING_RULES: ['rule_id','rule_type','input_schema','expression','effective_from','effective_to','version','status'],
  QUOTES: ['quote_id','quote_version','client_id','client_name','created_by','created_at','status','pricebook_version','rule_version','subtotal','discount','final','approval_required','approved_by','approved_at','parent_quote_id','context_json','snapshot_hash'],
  QUOTE_LINES: ['quote_id','quote_version','line_no','item_id','name_snapshot','description_snapshot','unit_snapshot','quantity','list_price_snapshot','recommended_price_snapshot','unit_price_snapshot','line_total','price_id','rule_id','rule_version','customer_visible','metadata_json'],
  USERS: ['user_id','email','role','active'],
  PERMISSIONS: ['role','can_view_floor','max_discount','can_approve','can_admin_catalog'],
  AUDIT_LOG: ['event_id','event_type','actor','object_id','before_json','after_json','timestamp']
});

function qv3EnsureSchema_() {
  const ss = qv3Spreadsheet_();
  Object.keys(QV3_HEADERS).forEach(function(name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = QV3_HEADERS[name];
    const current = sh.getLastColumn() ? sh.getRange(1,1,1,Math.max(sh.getLastColumn(),headers.length)).getDisplayValues()[0] : [];
    headers.forEach(function(h,i) { if (!current[i]) sh.getRange(1,i+1).setValue(h); else if (current[i] !== h) throw new Error(name + ': cột ' + (i+1) + ' phải là ' + h + ', hiện là ' + current[i]); });
    sh.setFrozenRows(1);
  });
  return {schema_version: QV3_CONFIG.SCHEMA_VERSION, sheets: Object.keys(QV3_HEADERS)};
}
