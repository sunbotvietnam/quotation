// Static structure only. Items and prices are loaded from the authenticated backend.
window.SUNBOT_CATALOG = {
  version: "backend-required",
  masterUrl:
    "https://docs.google.com/spreadsheets/d/14wk6li0oRK3ho1fAPkPPG1vPYlTFoMccRmn3sHpeAxc/edit",
  backendUrl:
    "https://docs.google.com/spreadsheets/d/1Er11CKeojfSKWfb9zYGTXSLDWocfYX7d-Gi5Sya2EDg/edit",
  manualUrl:
    "https://docs.google.com/document/d/1VHaY_nTB0Z9X9hRRbxLuHZo0jTG_Y-LVjDgTR7SYhpk/edit",
  policyUrl:
    "https://docs.google.com/document/d/1ff_Lz7A2lgfMNMwMLd3EZuMOAmsQBvmxxVXhlfhkPcE/edit",
  prices: Object.create(null),
  combos: {
    BASIC: {
      name: "Sunbot Cơ bản",
      tag: "Khởi động gọn",
      recommended: false,
      description:
        "Ưu tiên Lập trình tư duy; đủ cấu hình để trường bắt đầu triển khai có cấu trúc.",
      program: "LT",
      years: 3,
      items: { ROBOT: 3, MAP: 2, OBSTACLE: 2, CARDS: 1, BOX: 1, STEAM_Y1: 0 },
    },
    STANDARD: {
      name: "Sunbot Chuẩn",
      tag: "Khuyến nghị",
      recommended: true,
      description:
        "Cấu hình cân bằng cho đa số trường: Core đầy đủ, 4 robot, có STEAM Năm 1.",
      program: "CORE",
      years: 3,
      items: { ROBOT: 4, MAP: 3, OBSTACLE: 2, CARDS: 1, BOX: 1, STEAM_Y1: 1 },
    },
    PLUS: {
      name: "Sunbot Cao cấp",
      tag: "Tăng cường",
      recommended: false,
      description:
        "Cho trường chất lượng cao/flagship: Core đầy đủ, thời hạn dài hơn và nhiều thiết bị.",
      program: "CORE",
      years: 5,
      items: { ROBOT: 6, MAP: 5, OBSTACLE: 5, CARDS: 1, BOX: 1, STEAM_Y1: 1 },
    },
  },
};
