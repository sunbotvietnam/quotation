// Sunbot quotation refinement V19 — V1 operations links and neutral naming.
(function(){
  const V1_STANDARD='https://docs.google.com/document/d/1KOCmfwmKq7fKHTnQ1MTnTw11eBF1S39elvudTH2saho/edit';
  const V1_SKILL='https://drive.google.com/file/d/1mzmTCfq20x7i-8BEAM0V6rVxwYjZ2wis/view';
  const V1_CHECK='https://docs.google.com/document/d/1Cv-8bgOQN5w_FS9MlbLPi6wXVYqSPdo-9zf3cw-WddE/edit';
  const SALE_GUIDE='https://docs.google.com/document/d/1qb7AeFuS6QQKyqUNRiE-0O8sRIGTqtcE0zZYVLmNpu4/edit';
  const ADMIN_GUIDE='https://docs.google.com/document/d/1hsdxofZDFUZ3ELmdMXxlEV_gDtHCEtBZn_nd0Dgd2KU/edit';
  const PRICEBOOK='https://docs.google.com/spreadsheets/d/1Er11CKeojfSKWfb9zYGTXSLDWocfYX7d-Gi5Sya2EDg/edit';
  const SALES_HUB='https://docs.google.com/document/d/1h_1V_ntX94vxsqmdlaI8fvad4JDR3wW6q0jA-H7IBL0/edit';

  const oldNav=nav;
  nav=function(){return oldNav().replace(/Bán lẻ & sửa chữa/g,'Hạng mục rời & sửa chữa')};

  const oldBindCommon=bindCommon;
  bindCommon=function(){
    oldBindCommon();
    const old=document.getElementById('resource-center');
    if(!old)return;
    const btn=old.cloneNode(true);
    old.parentNode.replaceChild(btn,old);
    btn.onclick=()=>{
      const admin=state.role==='ADMIN';
      const cards=admin?[
        ['Cẩm nang Admin thương mại','Quy tắc cấu hình, giá, duyệt và phát hành',ADMIN_GUIDE],
        ['Backend giá & danh mục','Nguồn dữ liệu giá và danh mục quản trị',PRICEBOOK],
        ['Chuẩn tài liệu V1','Chuẩn thiết kế, cấu trúc A4 và logic sinh tài liệu đã khóa',V1_STANDARD],
        ['Checklist nghiệm thu V1','Ca kiểm thử bắt buộc và checklist vận hành',V1_CHECK],
        ['Skill dự phòng V1','File Markdown dùng để tái tạo tài liệu bằng ChatGPT khi app có sự cố',V1_SKILL],
        ['Cẩm nang Sale','Xem đúng nội dung Sale đang sử dụng',SALE_GUIDE],
        ['Sales Hub','Cổng công cụ và tài liệu vận hành',SALES_HUB]
      ]:[
        ['Cẩm nang Sale','Cách khảo sát, gửi yêu cầu và làm việc với báo giá',SALE_GUIDE],
        ['Sales Hub','Cổng công cụ và tài liệu dành cho Sale',SALES_HUB]
      ];
      modal('Trung tâm tài liệu',`<div class="doc-grid">${cards.map(([t,d,u])=>`<a class="doc-card" href="${u}" target="_blank" rel="noopener"><b>${esc(t)}</b><span>${esc(d)}</span><strong>Mở tài liệu →</strong></a>`).join('')}</div>`);
    };
  };
})();
