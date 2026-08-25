function quotationV3Handle_(subaction, payload, token) {
  const auth=qv3Auth_(token), action=String(subaction||''); payload=payload||{};
  if(action==='bootstrap')return qv3Bootstrap_(auth);
  if(action==='catalog')return qv3Catalog_(auth);
  if(action==='item_detail')return qv3ItemDetail_(auth,payload);
  if(action==='combo')return qv3Combo_(auth,payload);
  if(action==='preview')return qv3Preview_(auth,payload);
  if(action==='create')return qv3Create_(auth,payload);
  if(action==='history')return qv3History_(auth);
  if(action==='get')return qv3Get_(auth,payload);
  if(action==='submit_approval')return qv3SubmitApproval_(auth,payload);
  if(action==='approve')return qv3Approve_(auth,payload);
  if(action==='admin.catalog_upsert')return qv3CatalogUpsert_(auth,payload);
  if(action==='admin.price_version_create')return qv3PriceCreate_(auth,payload);
  if(action==='admin.combo_upsert')return qv3ComboUpsert_(auth,payload);
  if(action==='admin.rule_upsert')return qv3RuleUpsert_(auth,payload);
  throw new Error('Quotation V3 action chưa được hỗ trợ: '+action);
}

/* Trong router pagesBridge hiện hành, thêm đúng một nhánh:
 * if (mode === 'quotationV3') return quotationV3Handle_(subaction, payload, token);
 */
