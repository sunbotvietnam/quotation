function qv3Rows_(sheetName) {
  const sh = qv3Spreadsheet_().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues(), headers = values.shift().map(String);
  return values.filter(function(r){return r.some(function(v){return v !== ''})}).map(function(r){const o={};headers.forEach(function(h,i){o[h]=r[i]});return o});
}

function qv3Append_(sheetName, record) {
  const sh = qv3Spreadsheet_().getSheetByName(sheetName), headers = QV3_HEADERS[sheetName];
  sh.appendRow(headers.map(function(h){return record[h] == null ? '' : record[h]}));
  return record;
}

function qv3Upsert_(sheetName, key, record) {
  const sh = qv3Spreadsheet_().getSheetByName(sheetName), headers = QV3_HEADERS[sheetName], keyCol = headers.indexOf(key);
  if (keyCol < 0) throw new Error('Khóa không hợp lệ: ' + key);
  const rows = qv3Rows_(sheetName), index = rows.findIndex(function(r){return String(r[key]) === String(record[key])});
  const merged = index < 0 ? record : Object.assign({}, rows[index], record);
  const values = headers.map(function(h){return merged[h] == null ? '' : merged[h]});
  if (index < 0) sh.appendRow(values); else sh.getRange(index + 2, 1, 1, headers.length).setValues([values]);
  return merged;
}

function qv3UpsertComposite_(sheetName, keys, record) {
  const sh=qv3Spreadsheet_().getSheetByName(sheetName),headers=QV3_HEADERS[sheetName],rows=qv3Rows_(sheetName);
  const index=rows.findIndex(function(row){return keys.every(function(k){return String(row[k])===String(record[k])})});
  const merged=index<0?record:Object.assign({},rows[index],record),values=headers.map(function(h){return merged[h]==null?'':merged[h]});
  if(index<0)sh.appendRow(values);else sh.getRange(index+2,1,1,headers.length).setValues([values]);return merged;
}

function qv3Audit_(type, actor, objectId, before, after) {
  return qv3Append_('AUDIT_LOG', {event_id: Utilities.getUuid(), event_type:type, actor:actor, object_id:objectId, before_json:JSON.stringify(before||null), after_json:JSON.stringify(after||null), timestamp:new Date()});
}

function qv3ActivePrice_(itemId, at) {
  const when = at ? new Date(at) : new Date();
  return qv3Rows_('PRICE_VERSIONS').filter(function(p){
    const from = new Date(p.valid_from), to = p.valid_to ? new Date(p.valid_to) : null;
    return String(p.item_id) === String(itemId) && !isNaN(from) && from <= when && (!to || to >= when);
  }).sort(function(a,b){return new Date(b.valid_from)-new Date(a.valid_from)})[0] || null;
}
