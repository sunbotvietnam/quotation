window.SUNBOT_CATALOG = {
  version: '2026.08.24-master-v1.1',
  masterUrl: 'https://docs.google.com/spreadsheets/d/1YsvqJoz6m4E0KHKI_BfKXZakfldIVFkkL_1qNAue2_0/edit',
  manualUrl: 'https://docs.google.com/document/d/1VHaY_nTB0Z9X9hRRbxLuHZo0jTG_Y-LVjDgTR7SYhpk/edit',
  prices: {
    RIGHT_LT_3Y: {name:'Quyền Lập trình tư duy cùng Sunbot – 3 năm', unit:'điểm', price:45000000},
    RIGHT_LT_5Y: {name:'Quyền Lập trình tư duy cùng Sunbot – 5 năm', unit:'điểm', price:60000000},
    RIGHT_STEAM_3Y: {name:'Quyền STEAM cùng Sunbot – 3 năm', unit:'điểm', price:18000000},
    RIGHT_STEAM_5Y: {name:'Quyền STEAM cùng Sunbot – 5 năm', unit:'điểm', price:24000000},
    RIGHT_CORE_3Y: {name:'Quyền Sunbot Core – 2 phân môn – 3 năm', unit:'điểm', price:60000000},
    RIGHT_CORE_5Y: {name:'Quyền Sunbot Core – 2 phân môn – 5 năm', unit:'điểm', price:80000000},
    ROBOT: {name:'Robot Sunbot', unit:'robot', price:4800000},
    MAP: {name:'Bản đồ robot chuẩn', unit:'bản', price:600000},
    OBSTACLE: {name:'Bộ chướng ngại vật Sunbot chuẩn', unit:'bộ', price:1500000},
    CARDS: {name:'Bộ thẻ flashcard, thẻ đích, bản đồ giấy', unit:'bộ', price:1500000},
    BOX: {name:'Android Box', unit:'bộ', price:1500000},
    STEAM_Y1: {name:'Bộ học cụ STEAM Sunbot – Năm 1', unit:'bộ/trường', price:16500000},
    TRAIN_1: {name:'Đào tạo giáo viên – 1 phân môn, ≤20 người', unit:'đợt', price:11000000},
    TRAIN_2: {name:'Đào tạo giáo viên – 2 phân môn, ≤20 người', unit:'đợt', price:19000000},
    CERT_1: {name:'Sát hạch & chứng nhận – 1 phân môn', unit:'người', price:500000},
    CERT_2: {name:'Sát hạch & chứng nhận – 2 phân môn', unit:'người', price:800000},
    SUPPORT_A: {name:'Gói đồng hành ≤150 trẻ', unit:'điểm/năm', price:12000000},
    SUPPORT_B: {name:'Gói đồng hành 151–300 trẻ', unit:'điểm/năm', price:15000000},
    SUPPORT_C: {name:'Gói đồng hành 301–500 trẻ', unit:'điểm/năm', price:18000000},
    SUPPORT_D: {name:'Gói đồng hành >500 trẻ', unit:'điểm/năm', price:24000000},
    CAMP_BASIC: {name:'Sunbot Camp Cơ bản – 26 tiết', unit:'trẻ', price:1200000},
    CAMP_STANDARD: {name:'Sunbot Camp Chuẩn – 26 tiết', unit:'trẻ', price:1800000},
    CAMP_PLUS: {name:'Sunbot Camp Cao cấp – 26 tiết', unit:'trẻ', price:2400000},
    EVENT_SMALL: {name:'Hỗ trợ sự kiện Sunbot quy mô nhỏ', unit:'sự kiện', price:5000000},
    LEGACY_A: {name:'Tái kích hoạt A – nhẹ', unit:'điểm', price:5000000},
    LEGACY_B: {name:'Tái kích hoạt B – nâng cấp', unit:'điểm', price:8000000},
    LEGACY_C: {name:'Tái kích hoạt C – gần như mới', unit:'điểm', price:12000000}
  },
  combos: {
    BASIC: {name:'Sunbot Basic',tag:'Khởi động gọn',recommended:false,description:'Ưu tiên Lập trình tư duy; đủ cấu hình để trường bắt đầu triển khai có cấu trúc.',program:'LT',years:3,items:{ROBOT:3,MAP:2,OBSTACLE:2,CARDS:1,BOX:1,STEAM_Y1:0,TRAIN_1:1}},
    STANDARD: {name:'Sunbot Standard',tag:'Khuyến nghị',recommended:true,description:'Cấu hình cân bằng cho đa số trường: Core đầy đủ, 4 robot theo logic 3 hoạt động + 1 dự phòng, có STEAM Năm 1.',program:'CORE',years:3,items:{ROBOT:4,MAP:3,OBSTACLE:2,CARDS:1,BOX:1,STEAM_Y1:1,TRAIN_2:1}},
    PLUS: {name:'Sunbot Plus',tag:'Tăng cường',recommended:false,description:'Cho trường chất lượng cao/flagship: Core đầy đủ, thời hạn dài hơn và nhiều thiết bị để tăng số nhóm hoạt động đồng thời.',program:'CORE',years:5,items:{ROBOT:6,MAP:5,OBSTACLE:5,CARDS:1,BOX:1,STEAM_Y1:1,TRAIN_2:1}}
  }
};
