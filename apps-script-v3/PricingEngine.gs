function qv3Money_(v) { const n=Number(v); if (!isFinite(n) || n < 0) throw new Error('Giá trị tiền không hợp lệ.'); return Math.round(n); }
function qv3Bool_(v) { return v === true || String(v).toUpperCase() === 'TRUE' || Number(v) === 1; }

function qv3EvaluateRule_(rule, input) {
  const cfg = typeof rule.expression === 'string' ? JSON.parse(rule.expression || '{}') : (rule.expression || {});
  switch (String(rule.rule_type).toUpperCase()) {
    case 'TIER': {
      const value=Number(input[cfg.input]), tiers=cfg.tiers||[];
      const tier=tiers.find(function(t){return t.max == null || value <= Number(t.max)});
      if(!tier) throw new Error('Không có bậc giá hợp lệ.'); return {amount:qv3Money_(tier.amount), tier:tier.code};
    }
    case 'FORMULA': {
      if(cfg.formula !== 'OPERATOR_NETWORK_FEE') throw new Error('Formula chưa được hỗ trợ: '+cfg.formula);
      const usage=Number(input.learners)*Number(input.sessions)*Number(cfg.unit_price||4000), cap=Number(input.learners)*Number(input.core_tuition)*Number(cfg.cap_rate||.12);
      return {amount:qv3Money_(Math.min(usage,cap)), usage:qv3Money_(usage), cap:qv3Money_(cap)};
    }
    case 'MINIMUM': {
      const tier=(cfg.territories||{})[String(input.territory||'').toLowerCase()]; if(!tier) throw new Error('Cấp quyền địa bàn không hợp lệ.');
      return {amount:qv3Money_(Math.max(Number(input.amount||0),Number(tier.amount||0))), minimum:qv3Money_(tier.amount||0), learner_warning:Number(input.learners||0)<Number(tier.learners||0)};
    }
    case 'ELIGIBILITY': return {eligible:!input.legal_override, approval_required:!!input.legal_override};
    default: throw new Error('Rule type chưa được hỗ trợ: '+rule.rule_type);
  }
}

function qv3ComputePreview_(catalog, prices, rules, request, permission) {
  const itemById={}; catalog.forEach(function(i){itemById[String(i.item_id)]=i});
  const priceByItem={}; prices.forEach(function(p){priceByItem[String(p.item_id)]=p});
  const ruleById={}; rules.forEach(function(r){ruleById[String(r.rule_id)]=r});
  const calculated=(request.lines||[]).map(function(line,index){
    const item=itemById[String(line.item_id)]; if(!item || String(item.status)!=='ACTIVE' || !qv3Bool_(item.quote_selectable)) throw new Error('Hạng mục không được phép báo giá: '+line.item_id);
    const price=priceByItem[String(item.item_id)]; if(!price) throw new Error('Không có giá hợp lệ hiện hành: '+item.item_id);
    let recommended=qv3Money_(price.recommended_price), unitPrice=recommended, ruleResult=null;
    if(String(item.price_mode)!=='FIXED') { const rule=ruleById[String(item.pricing_rule_id)]; if(!rule) throw new Error('Không có rule hợp lệ: '+item.pricing_rule_id); ruleResult=qv3EvaluateRule_(rule,Object.assign({},request.context||{},line.inputs||{})); unitPrice=qv3Money_(ruleResult.amount); recommended=unitPrice; }
    const qty=Number(line.quantity); if(!isFinite(qty)||qty<=0) throw new Error('Số lượng không hợp lệ ở dòng '+(index+1));
    const requested=line.requested_unit_price==null?recommended:qv3Money_(line.requested_unit_price), floor=qv3Money_(price.floor_price), belowRecommended=requested<recommended, belowFloor=requested<floor;
    const maxDiscount=Number(permission.max_discount||0), discount=recommended?1-requested/recommended:0;
    return {line_no:index+1,item_id:item.item_id,name:item.name,description:item.description,unit:item.unit,quantity:qty,list_price:qv3Money_(price.list_price),recommended_price:recommended,unit_price:requested,line_total:qv3Money_(requested*qty),price_id:price.price_id,rule_id:item.pricing_rule_id||'',rule_version:ruleResult&&ruleById[String(item.pricing_rule_id)]?ruleById[String(item.pricing_rule_id)].version:'',customer_visible:qv3Bool_(item.customer_visible),approval_required:belowFloor||discount>maxDiscount,approval_reason:belowFloor?'BELOW_FLOOR':(discount>maxDiscount?'DISCOUNT_OVER_LIMIT':''),_floor:floor};
  });
  const subtotal=calculated.reduce(function(s,l){return s+l.recommended_price*l.quantity},0), final=calculated.reduce(function(s,l){return s+l.line_total},0);
  return {lines:calculated,subtotal:subtotal,discount:subtotal-final,final:final,approval_required:calculated.some(function(l){return l.approval_required}),pricebook_version:QV3_CONFIG.PRICEBOOK_VERSION};
}
