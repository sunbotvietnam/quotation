// Sunbot quotation refinement V16 — richer deployment narrative + standalone items.
(function(){
  const oldNavV16=nav;
  const oldRequestFormV16=requestForm;
  const oldNewBuilderV16=newBuilder;
  const oldBuilderFormV16=builderForm;
  const oldRenderQuotePaperV16=renderQuotePaper;

  function protectedStandaloneItem(item){
    const id=String(item?.item_id||item?.price_id||'').toUpperCase();
    if(!id)return true;
    // Không đưa kiến trúc thương mại cũ/quyền chương trình cũ vào luồng bán rời.
    if(/^(RIGHT_|LEGACY_|SUPPORT_)/.test(id))return true;
    if(id==='SELF_DELIVERY_SCALE_FEE')return true;
    // Học liệu Level cũ giữ trong lịch sử, không đưa trở lại danh mục thương mại hiện hành.
    if(/^RETAIL_(FC|BD)[1-9]$/.test(id))return true;
    return false;
  }

  function standaloneSubtypeFromRequest(req){
    const t=String(req?.sales_proposal||'').toLowerCase();
    if(/sửa chữa|hỏng|mạch|pin|động cơ|linh kiện/.test(t))return 'REPAIR';
    if(/đào tạo|tái đào tạo|sát hạch|chứng nhận|dịch vụ|mentoring|hướng dẫn|sự kiện/.test(t))return 'SERVICE';
    if(/mua bổ sung|phụ kiện|thiết bị|học cụ|robot|bản đồ|steam/.test(t))return 'RETAIL';
    return 'MIXED';
  }

  nav=function(){
    return oldNavV16().replace(/Bán lẻ\s*&\s*sửa chữa/g,'Hạng mục rời & sửa chữa');
  };

  requestForm=function(){
    let html=oldRequestFormV16();
    html=html
      .replace(/Bán lẻ\s*\/\s*sửa chữa/g,'Hạng mục rời / sửa chữa')
      .replace(/Yêu cầu bán lẻ\s*\/\s*sửa chữa/g,'Yêu cầu hạng mục rời / sửa chữa')
      .replace('Dành cho trường/khách hàng đã và đang triển khai. Không cần nhập quy mô trẻ hay thông tin triển khai chương trình.','Dành cho khách hàng hiện hữu hoặc trường kế thừa cần mua một hạng mục độc lập: đào tạo, tái đào tạo, thiết bị, học cụ, dịch vụ bổ sung, linh kiện hoặc sửa chữa. Không cần nhập quy mô trẻ hay cấu hình chương trình.')
      .replace('<option>Sửa chữa robot/thiết bị</option><option>Mua phụ kiện/linh kiện</option><option>Mua bổ sung robot/học cụ</option><option>Khác</option>',
        '<option>Sửa chữa robot/thiết bị</option><option>Đào tạo / tái đào tạo</option><option>Dịch vụ / hạng mục bổ sung</option><option>Mua phụ kiện/linh kiện</option><option>Mua bổ sung robot/học cụ</option><option>Khác</option>');
    return html;
  };

  newBuilder=function(kind,req=null){
    const b=oldNewBuilderV16(kind,req);
    if(kind==='RETAIL_REPAIR' && req)b.retail_subtype=standaloneSubtypeFromRequest(req);
    return b;
  };

  // Danh mục hạng mục rời: rộng, nhưng loại trừ quyền/gói thương mại cũ.
  catalogSearchMarkup=function(kind,q){
    const query=String(q||'').trim().toLowerCase();
    let rows=state.catalog.filter(i=>{
      if(kind!=='RETAIL_REPAIR')return true;
      return !protectedStandaloneItem(i);
    });
    if(query)rows=rows.filter(i=>[i.item_id,i.price_id,i.name,i.category,i.description,i.unit].some(v=>String(v||'').toLowerCase().includes(query)));
    rows=rows.slice(0,24);
    return rows.map(i=>`<button type="button" class="search-result" data-add-item="${esc(i.item_id||i.price_id)}"><span><b>${esc(i.name)}</b><small>${esc(classifyItem(i))} · ${esc(i.unit||'')}</small>${i.description?`<em>${esc(i.description)}</em>`:''}</span><strong>${money(itemPrice(i))}</strong></button>`).join('')||`<div class="empty compact">Không tìm thấy hạng mục phù hợp. Admin có thể tạo hạng mục tùy chỉnh.</div>`;
  };

  function teacherParagraph(b){
    if(b.teacher_status==='NEW_TRAIN')return 'Đội ngũ giáo viên được chuẩn bị từ đầu để hiểu mục tiêu bài học, cách tổ chức hoạt động với robot và cách quan sát phản ứng học tập của trẻ. Hạng mục đào tạo được thể hiện riêng trong báo giá để Nhà trường nhìn rõ phần đầu tư cho năng lực giáo viên.';
    if(b.teacher_status==='NEED_RETRAIN')return 'Với đội ngũ đã từng triển khai nhưng có thay đổi nhân sự hoặc gián đoạn trong thời gian dài, Sunbot đề xuất tái đào tạo/chuẩn hóa để giáo viên mới và giáo viên cũ cùng trở về một cách tổ chức lớp thống nhất, giảm rủi ro “có thiết bị nhưng không còn tự tin dạy”.';
    if(b.teacher_status==='TRAINED')return 'Đội ngũ đã có nền tảng triển khai. Sunbot ưu tiên rà soát nhanh cách tổ chức lớp, cập nhật tài nguyên mới và hỗ trợ giáo viên lựa chọn lộ trình phù hợp thay vì yêu cầu học lại những gì đã nắm được.';
    return 'Nhu cầu đào tạo sẽ được xác nhận theo thực tế đội ngũ. Nguyên tắc là chỉ bổ sung đúng phần Nhà trường cần, tránh tạo thêm chi phí nếu giáo viên đã đủ năng lực triển khai.';
  }

  function assetParagraph(b){
    const legacy=String(b.existing_sunbot||'NO')==='YES';
    if(b.asset_option==='SUNBOT_CUNG_CAP_THIET_BI')return 'Nhà trường không cần đầu tư thiết bị ban đầu. Sunbot bố trí và quản lý các thiết bị lõi cần thiết cho việc triển khai theo quy mô đã xác định. Cách làm này giúp Nhà trường giảm áp lực đầu tư ngay từ đầu nhưng vẫn có một cấu hình đủ để tổ chức lớp. Bộ học cụ STEAM không nằm trong phần thiết bị Sunbot đầu tư; nếu Nhà trường có nhu cầu mở rộng sang hoạt động STEAM, hạng mục này được báo riêng.';
    if(b.asset_option==='TRUONG_MUA_THIET_BI')return `${legacy?'Sunbot ưu tiên kiểm kê và tận dụng tài sản Nhà trường đã có trước khi đề xuất mua bổ sung. ':'Nhà trường đầu tư và sở hữu thiết bị; cấu hình mẫu được xây theo quy mô để tránh mua thiếu hoặc mua dư. '}Thiết bị được thể hiện thành từng hạng mục rõ ràng, có thể điều chỉnh theo thực tế lớp học. ${legacy?'Bộ nhận diện Sunbot là tùy chọn nếu không gian hiện có vẫn phù hợp.':'Với điểm triển khai mới, bộ nhận diện Sunbot được đưa vào cấu hình để tạo một không gian học tập nhất quán, dễ nhận biết và thuận lợi cho tổ chức lớp.'}`;
    return `${legacy?'Đây là phương án ưu tiên cho trường kế thừa: Sunbot ghi nhận và tận dụng robot, học cụ, thiết bị Nhà trường đã sở hữu; chỉ bổ sung những thành phần thực sự thiếu hoặc không còn phù hợp.':'Nhà trường sử dụng thiết bị hiện có hoặc tự đầu tư theo nhu cầu thực tế.'} Mục tiêu là đưa chương trình trở lại vận hành một cách gọn, không buộc Nhà trường mua lại những gì còn sử dụng tốt.`;
  }

  defaultNarrative=function(b){
    if(b.kind!=='SOLUTION')return '';
    const n=Number(b.learner_count||0),legacy=String(b.existing_sunbot||'NO')==='YES';
    const schoolScale=n?`${n.toLocaleString('vi-VN')} trẻ`:'quy mô thực tế của Nhà trường';
    return `## 1. Bối cảnh và mục tiêu của phương án
${legacy?'Nhà trường đã có nền tảng Sunbot từ giai đoạn trước. Phương án lần này không đặt mục tiêu “mua lại từ đầu”, mà ưu tiên khôi phục năng lực triển khai trên chính những tài sản và kinh nghiệm Nhà trường đã có, đồng thời bổ sung chương trình, tài nguyên số và hỗ trợ hiện hành cần thiết.':'Sunbot đề xuất một phương án triển khai đủ gọn để Nhà trường có thể bắt đầu thuận lợi, nhưng đủ cấu trúc để chương trình vận hành ổn định trong suốt chu kỳ 12 tháng.'} Cấu hình được xây cho ${schoolScale}, với nguyên tắc chi phí đi theo quy mô và nhu cầu thực tế, không khóa Nhà trường theo các “Level” thương mại.

## 2. Giá trị giáo dục cốt lõi
Lập trình tư duy cùng Sunbot không đặt trọng tâm vào việc cho trẻ nhỏ học mã lệnh hay thao tác màn hình. Robot là một học cụ hữu hình để trẻ chuyển suy nghĩ thành hành động: quan sát nhiệm vụ → dự đoán đường đi → sắp xếp trình tự → ra lệnh → kiểm tra kết quả → sửa khi chưa đúng. Chu trình đó tạo cơ hội luyện tư duy trình tự, định hướng không gian, dự đoán, giải quyết vấn đề, khả năng hợp tác và sự kiên trì theo cách phù hợp với lứa tuổi mầm non.

## 3. Chương trình mở trong 12 tháng – lộ trình có hướng dẫn
Trong thời hạn triển khai, Nhà trường được tiếp cận thư viện chương trình hiện hành của phân môn cùng tài nguyên số và các cập nhật thuộc phạm vi gói. Nội dung không bị chia thành các Level phải mua lần lượt. Giáo viên có thể triển khai 4 buổi/tháng, 8 buổi/tháng hoặc nhịp khác phù hợp kế hoạch của trường; Sunbot cung cấp lộ trình khuyến nghị và logic tiến trình để giáo viên biết nên bắt đầu ở đâu, bài nào cần nền tảng trước và khi nào có thể mở rộng. Quyền tiếp cận là như nhau; đường học có thể khác nhau tùy mức sẵn sàng của trẻ và nhà trường.

## 4. Thiết bị và không gian triển khai
${assetParagraph(b)}

## 5. Giáo viên là người làm chương trình sống được trong lớp
${teacherParagraph(b)} Sunbot xem robot là học cụ; chất lượng lớp học vẫn phụ thuộc vào cách giáo viên đặt nhiệm vụ, gợi mở câu hỏi, cho trẻ thử – sai và tổ chức tương tác giữa các bạn.

## 6. Đồng hành trong thời hạn 12 tháng
Phí gói chương trình đã bao gồm phần đồng hành tiêu chuẩn: tài nguyên số hiện hành, cập nhật chương trình, hướng dẫn lựa chọn tiến độ, hỗ trợ chuyên môn từ xa và hỗ trợ vận hành trong phạm vi thỏa thuận. Nhà trường vì vậy không phải ghép nhiều khoản phí nhỏ để duy trì chương trình. Các nhu cầu ngoài phạm vi chuẩn như đào tạo chính thức, tái đào tạo, sự kiện, thiết bị/học cụ bổ sung hoặc hỗ trợ đặc biệt được tách riêng để Nhà trường chỉ trả cho phần thực sự cần.

## 7. Cách khởi động đề xuất
Sau khi thống nhất phương án, hai bên rà soát tài sản và nhân sự, xác nhận lịch bắt đầu, chuẩn bị giáo viên, kích hoạt tài nguyên và triển khai những tuần đầu theo lộ trình phù hợp. Giai đoạn đầu ưu tiên quan sát khả năng tổ chức lớp và mức đáp ứng của trẻ, sau đó mới tăng nhịp hoặc mở rộng nhiệm vụ. Cách này giúp chương trình đi vào nề nếp thay vì “bàn giao xong là kết thúc”.

## 8. Điều Nhà trường nhận được từ phương án này
Nhà trường có một cấu trúc chi phí dễ dự toán; có quyền tiếp cận chương trình hiện hành trong 12 tháng; có lộ trình linh hoạt theo tiến độ thực tế; ${legacy?'được tận dụng những tài sản Sunbot đã đầu tư từ trước thay vì bị yêu cầu mua lại;':'có cấu hình thiết bị phù hợp với quy mô thay vì mua theo cảm tính;'} và có một đầu mối chuyên môn để hỗ trợ khi chương trình đi vào vận hành. Mục tiêu cuối cùng không phải là sở hữu thêm thiết bị, mà là giúp giáo viên dạy được và trẻ thực sự có trải nghiệm học tập có ý nghĩa.`;
  };

  builderForm=function(kind){
    let html=oldBuilderFormV16(kind),b=state.builder;
    if(kind==='RETAIL_REPAIR'){
      html=html
        .replace(/Báo giá bán lẻ\s*&\s*sửa chữa/g,'Báo giá hạng mục rời & sửa chữa')
        .replace('Tìm nhanh theo tên, loại hạng mục hoặc mã. Không tạo thuyết minh cho bán lẻ/sửa chữa.','Dành cho khách hàng hiện hữu cần mua độc lập một sản phẩm hoặc dịch vụ. Danh mục là gợi ý; Admin có thể thêm hạng mục mới. Luồng này không tạo thuyết minh.')
        .replace('Danh mục giá','Danh mục gợi ý')
        .replace('<option value="RETAIL"','<option value="SERVICE" '+(b.retail_subtype==='SERVICE'?'selected':'')+'>Dịch vụ / hạng mục bổ sung</option><option value="RETAIL"');
    }else{
      html=html.replace('Nếu để trống, hệ thống chỉ tạo báo giá. Nếu có nội dung, sau khi phát hành sẽ có thêm link Thuyết minh và Đề xuất trên Google Drive.','Nếu để trống, hệ thống chỉ tạo báo giá. Khi có nội dung, Admin có thể mở lại báo giá đã lưu để xuất Thuyết minh hoặc Đề xuất A4/PDF khi cần.');
    }
    return html;
  };

  renderQuotePaper=function(q,lines){
    let html=oldRenderQuotePaperV16(q,lines);
    const notes=String(q?.notes||''),m=notes.match(/\[\[RETAIL_SUBTYPE=([^\]]*)\]\]/),sub=m?String(m[1]||'').toUpperCase():'';
    if(String(q?.combo_code||'').toUpperCase()==='RETAIL_REPAIR' && sub==='SERVICE'){
      html=html
        .replace('BÁO GIÁ THIẾT BỊ / PHỤ KIỆN SUNBOT','BÁO GIÁ DỊCH VỤ / HẠNG MỤC BỔ SUNG SUNBOT')
        .replace('THIẾT BỊ · PHỤ KIỆN · SỬA CHỮA','DỊCH VỤ · HẠNG MỤC BỔ SUNG');
    }
    return html;
  };
})();