// V26 UI wording: remove V24's stale recovery-price exception note after calculator parity took ownership.
(function(){
  const previous=lineTable;
  lineTable=function(b){
    let html=previous(b);
    if(!b||b.kind!=='SOLUTION')return html;
    html=html.replace(/<div class="policy-note"><b>Quy tắc chiết khấu:<\/b>[\s\S]*?<\/div>$/,'');
    return html+'<div class="policy-note"><b>Quy tắc phương án:</b> Phí chương trình là dòng duy nhất nhận giảm giá chung. Cấu hình thiết bị thay đổi bằng <b>số lượng cấu phần</b>; nếu thấp hơn chuẩn phải ghi lý do. Phí đồng hành điểm triển khai, đào tạo, sát hạch và thu hồi vốn được tính lại từ chính phương án, không coi là chiết khấu.</div>';
  };
})();
