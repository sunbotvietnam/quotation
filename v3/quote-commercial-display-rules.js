// Final commercial display rules — 2026-09-08.
// Customer rule: repair/retail quotes never carry a configuration explanation.
// Legacy quotes use only a concise restart scope. Price-table wording must be understandable by itself.
(function(){
  const escText=s=>String(s||'');
  const retailWords=/THIẾT BỊ\s*\/\s*PHỤ KIỆN|THIẾT BỊ\s*\/\s*DỊCH VỤ|PHỤ KIỆN\s*·\s*SỬA CHỮA|SỬA CHỮA/i;
  const legacyWords=/TÁI KHỞI ĐỘNG|KHÔI PHỤC VÀ CHUẨN HÓA|TÁI TRIỂN KHAI/i;

  function documentMode(doc){
    const text=String(doc?.innerText||'');
    if(retailWords.test(text))return 'RETAIL';
    if(legacyWords.test(text))return 'LEGACY';
    return 'SOLUTION';
  }

  function polishLineNames(doc){
    doc.querySelectorAll('.q-name b, .quote-table td:nth-child(2) b').forEach(el=>{
      let t=escText(el.textContent).trim();
      t=t.replace(/Tái kích hoạt A\s*[–-]\s*nhẹ/gi,'Gói tái khởi động cơ bản – kiểm tra hiện trạng và đưa chương trình vào vận hành lại')
         .replace(/Tái kích hoạt B\s*[–-]\s*nâng cấp/gi,'Gói khôi phục và chuẩn hóa – rà soát, bổ sung và chuẩn hóa triển khai')
         .replace(/Tái kích hoạt C\s*[–-]\s*gần như mới/gi,'Gói tái triển khai toàn diện – khôi phục hệ thống trên cơ sở quyền và tài sản đã có')
         .replace(/Flashcard\s*Level\s*(\d+)/gi,'Bộ thẻ học liệu – Cấp độ $1')
         .replace(/Bản đồ giấy\s*Level\s*(\d+)/gi,'Bản đồ học liệu – Cấp độ $1')
         .replace(/\bLevel\s*(\d+)/gi,'Cấp độ $1');
      el.textContent=t;
    });
  }

  function compactLegacy(doc){
    let section=doc.querySelector('.customer-proposal-narrative');
    const html='<div class="proposal-page-title"><div class="proposal-eyebrow">PHẠM VI TÁI KHỞI ĐỘNG</div><h1>Khôi phục và tiếp tục triển khai Sunbot</h1></div><div class="customer-config-prose"><p>Nhà trường không phải thanh toán lại các quyền chương trình, thiết bị và học liệu đã sở hữu hợp lệ.</p><p>Bảng giá dưới đây chỉ gồm phần cần khôi phục, bổ sung hoặc mở rộng; các cấp độ và nội dung mới được tính theo phạm vi nhà trường chưa sở hữu.</p><p>Số lượng thiết bị, học cụ và phạm vi đào tạo được đối chiếu với hiện trạng thực tế trước khi ký.</p></div>';
    if(section){section.innerHTML=html;}
    else{
      const price=doc.querySelector('.customer-proposal-price');
      if(price){section=document.createElement('section');section.className='customer-proposal-narrative';section.innerHTML=html;doc.insertBefore(section,price);}
    }
  }

  function apply(doc){
    if(!doc||doc.dataset.commercialRulesApplied==='1')return;
    const m=documentMode(doc);
    if(m==='RETAIL') doc.querySelectorAll('.customer-proposal-narrative').forEach(x=>x.remove());
    if(m==='LEGACY') compactLegacy(doc);
    polishLineNames(doc);
    doc.dataset.commercialRulesApplied='1';
  }

  function scan(root=document){root.querySelectorAll?.('#quote-document,.quote-document').forEach(apply);}
  new MutationObserver(()=>scan()).observe(document.documentElement,{subtree:true,childList:true});
  scan();

  // Approval workspace: for retail/repair, a configuration explanation is not part of the quote.
  // For legacy, label it as restart scope rather than configuration explanation.
  document.addEventListener('click',ev=>{
    const btn=ev.target?.closest?.('[data-approval-hotfix-review]'); if(!btn)return;
    const id=String(btn.dataset.approvalHotfixReview||''); if(!id)return;
    setTimeout(async()=>{
      try{
        const bundle=await bridge('quotationShared','getQuoteFast',{quote_id:id},state.token);
        const q=bundle?.quote||{}, combo=String(q.combo_code||'').toUpperCase(), qt=String(q.quote_type||'').toUpperCase();
        const retail=combo==='RETAIL_REPAIR'||qt==='RETAIL';
        const legacy=combo==='LEGACY_REBUILD'||combo.indexOf('LEGACY_')===0||qt==='LEGACY'||(bundle?.lines||[]).some(x=>String(x.item_id||'').toUpperCase().indexOf('LEGACY_')===0);
        const area=document.getElementById('approval-edit-narrative');
        if(!area)return;
        const wrap=area.closest('.field');
        const heading=wrap?.previousElementSibling;
        if(retail){ if(heading)heading.style.display='none'; if(wrap)wrap.style.display='none'; }
        else if(legacy){ if(heading)heading.textContent='2. Phạm vi tái khởi động'; area.placeholder='Mô tả ngắn phạm vi khôi phục, phần đã có và phần mua bổ sung...'; }
      }catch(_){ }
    },60);
  },true);
})();
