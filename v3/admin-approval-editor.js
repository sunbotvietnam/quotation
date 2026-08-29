// Admin approval workspace: price-only revisions, policy guardrails, and smooth final approval.
(function () {
  const statusLabel = (status) => ({
    NEEDS_APPROVAL: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Cần chỉnh sửa",
  }[String(status || "").toUpperCase()] || String(status || ""));

  const personName = (value) => ({Nhung:"Hoàng Nhung",Thu:"Minh Thu",Dung:"Lê Dung"}[String(value || "").trim()] || String(value || "").trim());
  const num = (v) => Number(v || 0);
  const pct = (v) => (num(v) * 100).toFixed(1) + "%";
  const modelLabel = (v) => String(v || "").toUpperCase() === "SCALE" ? "Theo quy mô toàn hệ thống" : "Theo điểm trường";

  function linePolicy(line, price) {
    const group = String(line.commercial_group || "").toUpperCase();
    const standard = num(line.standard_unit_price);
    const floor = num(line.floor_price_snapshot);
    const discount = standard > 0 ? Math.max(0, (standard - price) / standard) : 0;
    if (String(line.item_id) === "SELF_DELIVERY_SCALE_FEE") return {level:"locked", text:"Phí theo quy mô được khóa theo công thức hiện hành; muốn thay đổi cần sửa cấu hình."};
    if (group === "MIXED_GROWTH") {
      if (standard * num(line.qty) < 50000000) return {level: discount > 0 ? "special" : "normal", text:"Camp/Event dưới 50 triệu: không giảm."};
      if (discount <= 0.05 && (!floor || price >= floor)) return {level:"normal", text:"Trong vùng Admin: tối đa 5%, không dưới sàn."};
      return {level:"special", text:"Vượt quy tắc Camp/Event."};
    }
    if (group === "C") {
      if (!floor || price >= floor) return {level:"normal", text:"Nhóm C: Admin được chỉnh từ giá khuyến nghị xuống giá sàn."};
      return {level:"special", text:"Dưới giá sàn: ngoại lệ đặc biệt."};
    }
    if (group === "A" || group === "B") {
      if (discount <= 0.07 && (!floor || price >= floor)) return {level:"normal", text:"Trong vùng Admin: giảm tối đa 7%, không dưới sàn."};
      return {level:"special", text: price < floor ? "Dưới giá sàn: ngoại lệ đặc biệt." : "Giảm trên 7%: ngoại lệ đặc biệt."};
    }
    return {level:"special", text:"Hạng mục đặc biệt: cần lý do duyệt."};
  }

  function requiresSpecialReason(bundle, prices) {
    const q = bundle.quote || {};
    if (String(q.commercial_model || "") && String(q.recommended_model || "") && String(q.commercial_model) !== String(q.recommended_model)) return true;
    return (bundle.lines || []).some((line, i) => linePolicy(line, prices[i]).level === "special");
  }

  function modelPolicyHtml(q) {
    const selected = String(q.commercial_model || "");
    const recommended = String(q.recommended_model || "");
    if (!selected && !recommended) return "";
    const match = !selected || !recommended || selected === recommended;
    return `<div class="admin-model-policy ${match ? "ok" : "warning"}">
      <div><small>SỐ ĐIỂM</small><strong>${num(q.deployment_sites) || 1}</strong></div>
      <div><small>MÔ HÌNH ĐANG CHỌN</small><strong>${esc(modelLabel(selected))}</strong></div>
      <div><small>QUY CHẾ KHUYẾN NGHỊ</small><strong>${esc(modelLabel(recommended))}</strong></div>
      <div><small>SO SÁNH 12 THÁNG</small><strong>${money(q.point_comparison_amount || 0)} / ${money(q.scale_comparison_amount || 0)}</strong></div>
      ${match ? "" : `<p><b>Ngoại lệ mô hình.</b> ${esc(q.model_exception_reason || q.exception_reason || "Chưa có lý do.")}</p>`}
    </div>`;
  }

  function quickButtons(line, i) {
    const group = String(line.commercial_group || "").toUpperCase();
    if (String(line.item_id) === "SELF_DELIVERY_SCALE_FEE") return "";
    const items = [`<button type="button" class="mini" data-price-preset="standard" data-line="${i}">Giá chuẩn</button>`];
    if (group === "A" || group === "B") {
      items.push(`<button type="button" class="mini" data-price-preset="3" data-line="${i}">−3%</button>`);
      items.push(`<button type="button" class="mini" data-price-preset="7" data-line="${i}">−7%</button>`);
    }
    if (group === "C") items.push(`<button type="button" class="mini" data-price-preset="floor" data-line="${i}">Về sàn</button>`);
    if (group === "MIXED_GROWTH" && num(line.standard_unit_price) * num(line.qty) >= 50000000) items.push(`<button type="button" class="mini" data-price-preset="5" data-line="${i}">−5%</button>`);
    return `<div class="price-presets">${items.join("")}</div>`;
  }

  function adminEditorHtml(bundle) {
    const q = bundle.quote || {}, lines = bundle.lines || [];
    const rows = lines.map((line, i) => {
      const proposed = num(line.proposed_unit_price ?? line.unit_price_snapshot);
      const policy = linePolicy(line, proposed);
      const locked = String(line.item_id) === "SELF_DELIVERY_SCALE_FEE";
      return `<tr data-admin-line="${i}">
        <td><b>${esc(line.item_name_snapshot || line.item_id || "")}</b><small>${esc(line.unit_snapshot || "")} · Nhóm ${esc(line.commercial_group || "")}</small></td>
        <td class="money">${money(line.standard_unit_price || 0)}</td>
        <td><input class="admin-price-input" data-admin-price="${i}" type="number" min="0" step="1000" value="${proposed}" ${locked ? "disabled" : ""}>${quickButtons(line,i)}</td>
        <td class="money">${money(line.floor_price_snapshot || 0)}</td>
        <td><b data-admin-discount="${i}">${pct(line.discount_rate || 0)}</b><small class="policy-${policy.level}" data-admin-policy="${i}">${esc(policy.text)}</small></td>
      </tr>`;
    }).join("");
    return `<section class="panel admin-price-editor no-print">
      <div class="builder-head"><div><span class="badge">ADMIN</span><h3>Duyệt & điều chỉnh giá</h3><p class="help">Admin chỉ chỉnh giá. Nếu phải đổi số trẻ, số điểm, chương trình, thiết bị hoặc số lượng, hãy Trả lại chỉnh sửa cho người lập.</p></div><div class="admin-total"><small>Giá đề xuất hiện tại</small><strong id="admin-editor-total">${money(q.proposed_amount || q.final_amount || 0)}</strong></div></div>
      ${modelPolicyHtml(q)}
      <div class="approval-rule-strip">
        <span><b>A/B</b> Admin thường ≤7%, không dưới sàn</span>
        <span><b>C</b> Giá chuẩn → giá sàn</span>
        <span><b>Camp/Event</b> ≤5% nếu hạng mục ≥50 triệu</span>
        <span><b>Ngoại lệ</b> >7% hoặc dưới sàn phải có lý do</span>
      </div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Hạng mục</th><th>Giá chuẩn</th><th>Giá Admin đề xuất</th><th>Giá sàn</th><th>Kiểm tra</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="field" style="margin-top:12px"><label>Ghi chú duyệt / lý do ngoại lệ</label><textarea id="admin-approval-reason" rows="3" placeholder="Không bắt buộc nếu toàn bộ báo giá nằm trong vùng duyệt thông thường.">${esc(q.exception_reason || q.model_exception_reason || "")}</textarea></div>
      <div class="admin-approval-actions">
        <button class="btn secondary" id="admin-save-revision">Lưu chỉnh sửa</button>
        <button class="btn" id="admin-save-approve">Lưu & duyệt</button>
        <button class="btn" id="admin-approve-unchanged">Duyệt không chỉnh</button>
        <button class="btn secondary danger-soft" id="admin-return-changes">Trả lại chỉnh sửa</button>
      </div>
      <p class="help">Mỗi lần Admin lưu giá sẽ tạo phiên bản mới nhưng giữ nguyên người lập/deal owner ban đầu và ghi nhật ký người chỉnh.</p>
    </section>`;
  }

  function customerPreviewHtml(bundle) {
    const q=bundle.quote||{}, lines=bundle.lines||[];
    return `<section class="panel"><div class="builder-head"><div><h3>${esc(q.client_name || "Báo giá")}</h3><p class="help">${esc(q.quote_id || "")} · Phiên bản ${num(q.version)||1} · Người lập: ${esc(personName(q.created_by))}</p></div><span class="badge">${esc(statusLabel(q.status))}</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Hạng mục</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${lines.map(l=>`<tr><td>${esc(l.item_name_snapshot||l.item_id||"")}</td><td>${num(l.qty)}</td><td class="money">${money(l.proposed_unit_price??l.unit_price_snapshot)}</td><td class="money">${money(l.line_total)}</td></tr>`).join("")}</tbody></table></div><div class="admin-preview-total"><span>Tổng giá trị đề xuất</span><strong>${money(q.proposed_amount || q.final_amount || 0)}</strong></div></section>`;
  }

  function editedPrices(bundle) {
    return (bundle.lines || []).map((line,i) => {
      const input=document.querySelector(`[data-admin-price="${i}"]`);
      return input ? Math.max(0,num(input.value)) : num(line.proposed_unit_price ?? line.unit_price_snapshot);
    });
  }

  function updateLivePolicy(bundle) {
    const prices=editedPrices(bundle);
    let total=0;
    (bundle.lines || []).forEach((line,i)=>{
      const price=prices[i], standard=num(line.standard_unit_price);
      total += price*num(line.qty);
      const discount=standard>0?Math.max(0,(standard-price)/standard):0;
      const policy=linePolicy(line,price);
      const d=document.querySelector(`[data-admin-discount="${i}"]`), p=document.querySelector(`[data-admin-policy="${i}"]`);
      if(d) d.textContent=pct(discount);
      if(p){p.textContent=policy.text;p.className=`policy-${policy.level}`;}
    });
    const host=document.getElementById("admin-editor-total"); if(host) host.textContent=money(total);
  }

  function bindPresets(bundle) {
    document.querySelectorAll("[data-price-preset]").forEach(btn=>btn.onclick=()=>{
      const i=num(btn.dataset.line), line=(bundle.lines||[])[i], input=document.querySelector(`[data-admin-price="${i}"]`); if(!line||!input)return;
      const standard=num(line.standard_unit_price), floor=num(line.floor_price_snapshot); let value=standard;
      if(btn.dataset.pricePreset==="floor") value=floor||standard;
      else if(/^\d+$/.test(btn.dataset.pricePreset)) value=Math.round(standard*(1-num(btn.dataset.pricePreset)/100));
      if(floor && btn.dataset.pricePreset!=="standard") value=Math.max(value,floor);
      input.value=value; updateLivePolicy(bundle);
    });
    document.querySelectorAll("[data-admin-price]").forEach(input=>input.oninput=()=>updateLivePolicy(bundle));
  }

  function revisionPayload(bundle, reason) {
    const q=bundle.quote||{}, prices=editedPrices(bundle);
    return {
      quote_id:q.quote_id,
      customer_name:q.client_name,
      customer_id:q.customer_id||"",
      opportunity_id:q.opportunity_id||"",
      client_type:q.client_type||"",
      combo_code:q.combo_code||"CUSTOM",
      configuration_description:q.configuration_description||"Giữ nguyên cấu hình từ phiên bản trước.",
      notes:reason||"",
      exception_reason:reason||"",
      revision_note:reason||"Admin điều chỉnh giá trong quá trình duyệt.",
      deployment_sites:q.deployment_sites||1,
      learner_count:q.learner_count||0,
      commercial_model:q.commercial_model||"",
      recommended_model:q.recommended_model||"",
      policy_match:q.policy_match,
      scale_sessions_per_month:q.scale_sessions_per_month||0,
      frequency_factor:q.frequency_factor||0,
      point_comparison_amount:q.point_comparison_amount||0,
      scale_comparison_amount:q.scale_comparison_amount||0,
      comparison_difference:q.comparison_difference||0,
      cheaper_model:q.cheaper_model||"",
      model_exception_reason:q.model_exception_reason||"",
      lines:(bundle.lines||[]).map((line,i)=>({item_id:line.item_id,name:line.item_name_snapshot,unit:line.unit_snapshot,proposed_unit_price:prices[i],qty:num(line.qty)})),
    };
  }

  async function saveRevision(bundle, approveAfter) {
    const reason=String(document.getElementById("admin-approval-reason")?.value||"").trim(), prices=editedPrices(bundle);
    if(requiresSpecialReason(bundle,prices) && !reason) return alert("Báo giá đang có ngoại lệ thương mại. Hãy ghi rõ lý do trước khi lưu/duyệt.");
    try {
      const saved=await bridge("quotationShared","saveSnapshot",revisionPayload(bundle,reason),state.token);
      if(approveAfter) await bridge("quotationShared","approveQuote",{quote_id:saved.quote_id,reason},state.token);
      alert(approveAfter?"Đã lưu phiên bản giá mới và duyệt báo giá.":"Đã lưu phiên bản giá mới. Báo giá vẫn ở trạng thái Chờ duyệt.");
      renderApprovals();
    } catch(e){alert(friendlyError(e));}
  }

  async function openAdminReview(quoteId) {
    const host=document.getElementById("approval-detail"); if(!host)return;
    host.innerHTML='<section class="panel"><p class="help">Đang tải hồ sơ duyệt...</p></section>';
    try {
      const bundle=await bridge("quotationShared","getQuote",{quote_id:quoteId},state.token), q=bundle.quote||{};
      const editable=String(q.status).toUpperCase()==="NEEDS_APPROVAL";
      host.innerHTML=`${customerPreviewHtml(bundle)}${editable?adminEditorHtml(bundle):""}`;
      if(!editable)return;
      bindPresets(bundle); updateLivePolicy(bundle);
      document.getElementById("admin-save-revision").onclick=()=>saveRevision(bundle,false);
      document.getElementById("admin-save-approve").onclick=()=>saveRevision(bundle,true);
      document.getElementById("admin-approve-unchanged").onclick=async()=>{
        const reason=String(document.getElementById("admin-approval-reason")?.value||"").trim();
        const prices=(bundle.lines||[]).map(l=>num(l.proposed_unit_price??l.unit_price_snapshot));
        if(requiresSpecialReason(bundle,prices)&&!reason) return alert("Báo giá có ngoại lệ. Hãy ghi lý do duyệt.");
        try{await bridge("quotationShared","approveQuote",{quote_id:quoteId,reason},state.token);alert("Đã duyệt báo giá.");renderApprovals();}catch(e){alert(friendlyError(e));}
      };
      document.getElementById("admin-return-changes").onclick=async()=>{
        const reason=prompt("Nêu rõ nội dung cần người lập chỉnh sửa:",""); if(!reason?.trim())return;
        try{await bridge("quotationShared","rejectQuote",{quote_id:quoteId,reason:reason.trim()},state.token);alert("Đã trả lại báo giá để chỉnh sửa.");renderApprovals();}catch(e){alert(friendlyError(e));}
      };
    } catch(e){host.innerHTML=`<section class="panel"><p class="notice danger">${esc(friendlyError(e))}</p></section>`;}
  }

  renderApprovals = async function () {
    const el=document.getElementById("content");
    if(state.role!=="ADMIN"){state.tab="quotes";return typeof renderQuoteLibrary==="function"?renderQuoteLibrary():null;}
    el.innerHTML='<section class="panel"><h2>Duyệt báo giá</h2><p class="help">Đang tải danh sách...</p></section>';
    try{
      const quotes=await bridge("quotationShared","listQuotes",{},state.token), pending=quotes.filter(q=>String(q.status).toUpperCase()==="NEEDS_APPROVAL");
      el.innerHTML=`<div class="approval-master-detail"><section class="panel"><div class="builder-head"><div><h2>Báo giá chờ duyệt</h2><p class="help">Mở hồ sơ để duyệt, chỉnh giá hoặc trả lại chỉnh sửa.</p></div><button class="btn secondary" id="refresh-admin-approvals">Tải lại</button></div>${pending.length?`<div class="approval-card-list">${pending.map(q=>`<button class="approval-card" data-admin-review="${esc(q.quote_id)}"><span><b>${esc(q.quote_code||q.quote_id)}</b><small>${esc(q.client_name||"")} · ${esc(personName(q.created_by))}</small></span><span><strong>${money(q.final_amount)}</strong><small>${num(q.deployment_sites)||1} điểm · ${q.commercial_model?esc(modelLabel(q.commercial_model)):"Chưa ghi mô hình"}</small></span></button>`).join("")}</div>`:'<p class="notice ok">Không có báo giá chờ duyệt.</p>'}</section><div id="approval-detail"></div></div>`;
      document.getElementById("refresh-admin-approvals").onclick=renderApprovals;
      document.querySelectorAll("[data-admin-review]").forEach(btn=>btn.onclick=()=>openAdminReview(btn.dataset.adminReview));
    }catch(e){el.innerHTML=`<section class="panel"><p class="notice danger">${esc(friendlyError(e))}</p></section>`;}
  };

  const style=document.createElement("style");
  style.textContent=`
    .approval-master-detail{display:grid;grid-template-columns:minmax(300px,34%) minmax(0,66%);gap:14px;align-items:start}.approval-card-list{display:grid;gap:8px;max-height:74vh;overflow:auto}.approval-card{display:flex;justify-content:space-between;gap:12px;text-align:left;border:1px solid rgba(0,0,0,.1);background:#fff;border-radius:10px;padding:10px 11px;cursor:pointer}.approval-card:hover{border-color:rgba(15,118,110,.35);background:rgba(15,118,110,.025)}.approval-card span{display:grid;gap:2px}.approval-card span:last-child{text-align:right}.approval-card small{font-size:10px;opacity:.68}.admin-price-editor{margin-top:14px}.admin-total{text-align:right}.admin-total small{display:block;opacity:.65}.admin-total strong{font-size:20px}.admin-model-policy{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:10px;border-radius:10px;margin-bottom:10px}.admin-model-policy.ok{background:rgba(15,118,110,.06)}.admin-model-policy.warning{background:rgba(217,119,6,.08);border:1px solid rgba(217,119,6,.2)}.admin-model-policy>div{display:grid;gap:2px}.admin-model-policy small{font-size:9px;opacity:.62}.admin-model-policy strong{font-size:12px}.admin-model-policy p{grid-column:1/-1;margin:2px 0 0;font-size:11px}.approval-rule-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0}.approval-rule-strip span{padding:8px;border-radius:8px;background:rgba(0,0,0,.035);font-size:10px}.admin-price-input{width:128px;padding:7px 8px;border:1px solid rgba(0,0,0,.16);border-radius:7px;text-align:right}.admin-price-input:disabled{background:rgba(0,0,0,.045)}.price-presets{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}.mini{border:1px solid rgba(0,0,0,.1);background:#fff;border-radius:6px;padding:3px 6px;font-size:9px;cursor:pointer}.policy-normal,.policy-special,.policy-locked{display:block;margin-top:3px;font-size:9px}.policy-normal{color:#0f766e}.policy-special{color:#b45309;font-weight:700}.policy-locked{color:#475569}.admin-approval-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.danger-soft{border-color:rgba(185,28,28,.2)!important;color:#991b1b!important}.admin-preview-total{display:flex;justify-content:flex-end;gap:16px;align-items:baseline;margin-top:10px}.admin-preview-total strong{font-size:20px}@media(max-width:980px){.approval-master-detail{grid-template-columns:1fr}.admin-model-policy,.approval-rule-strip{grid-template-columns:1fr 1fr}.admin-total{text-align:left;margin-top:8px}}`;
  document.head.appendChild(style);
})();