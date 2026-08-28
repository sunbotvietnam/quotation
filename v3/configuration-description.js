// Rich auto-generated configuration proposal with Sales edit support.
(function () {
  const DEFAULT_KEY = "sunbot_pricebook_v3_config_description";
  const DIRTY_KEY = "sunbot_pricebook_v3_config_description_dirty";

  state.configDescription = sessionStorage.getItem(DEFAULT_KEY) || "";
  state.configDescriptionDirty = sessionStorage.getItem(DIRTY_KEY) === "1";

  const unique = (values) => [...new Set(values.filter(Boolean))];
  function naturalJoin(values) {
    const list = unique(values);
    if (!list.length) return "";
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} và ${list[1]}`;
    return `${list.slice(0, -1).join(", ")} và ${list[list.length - 1]}`;
  }

  function programInfo() {
    if (state.program === "LT") return {
      name: "phân môn Lập trình tư duy cùng Sunbot",
      value: "giúp trẻ làm quen với phương hướng, trình tự, mệnh lệnh và thuật toán đơn giản; hình thành thói quen quan sát, dự đoán, thử nghiệm và tự sửa khi kết quả chưa đúng",
      count: "01 phân môn",
    };
    if (state.program === "STEAM") return {
      name: "phân môn STEAM Sáng tạo cùng Sunbot",
      value: "đưa trẻ vào chu trình quan sát – thiết kế – chế tạo – thử nghiệm – cải tiến thông qua các tình huống gần gũi, từ đó tăng khả năng hợp tác, diễn đạt ý tưởng và giải quyết vấn đề",
      count: "01 phân môn",
    };
    return {
      name: "02 phân môn Lập trình tư duy cùng Sunbot và STEAM Sáng tạo cùng Sunbot",
      value: "kết hợp tư duy trình tự, mệnh lệnh và giải quyết vấn đề với chu trình quan sát – thiết kế – chế tạo – thử nghiệm – cải tiến; nhờ đó trẻ vừa phát triển tư duy logic, vừa có không gian sáng tạo và làm việc nhóm",
      count: "02 phân môn",
    };
  }

  function selectedPhysicalItems() {
    const items = [];
    Object.entries(state.items || {}).forEach(([code, qty]) => {
      const n = Number(qty || 0);
      if (!n) return;
      const item = C.prices?.[code];
      if (!item) return;
      const type = String(item.item_type || "").toUpperCase();
      if (!["HARDWARE", "MATERIAL"].includes(type)) return;
      items.push({ code, qty: n, name: item.name, unit: String(item.unit || "bộ").replace(/^đ\//, "") });
    });
    return items;
  }

  function equipmentText(items) {
    return naturalJoin(items.map((x) => `${x.qty} ${x.unit || "bộ"} ${x.name}`));
  }

  function equipmentRationale(items) {
    if (!items.length) return "Thiết bị và học cụ sẽ được xác nhận sau khi hai bên rà soát điều kiện lớp học và cách tổ chức hoạt động thực tế.";
    const notes = [];
    if (items.some((x) => /robot/i.test(x.name))) notes.push("robot đóng vai trò học cụ tương tác để trẻ quan sát kết quả của lệnh, kiểm tra dự đoán và điều chỉnh phương án thay vì chỉ thao tác trên màn hình");
    if (items.some((x) => /android|box/i.test(x.name))) notes.push("Android Box hỗ trợ đưa nội dung số và hướng dẫn hoạt động lên màn hình lớp học, giúp giáo viên tổ chức bài học thống nhất và thuận tiện hơn");
    if (items.some((x) => /map|bản đồ/i.test(x.name))) notes.push("bản đồ và học cụ định hướng tạo không gian thao tác trực quan cho các hoạt động phương hướng, trình tự và giải quyết nhiệm vụ");
    if (items.some((x) => /steam|kit/i.test(x.name))) notes.push("STEAM Kit cung cấp vật liệu cho các dự án chế tạo, thử nghiệm và cải tiến, bảo đảm trẻ có trải nghiệm bằng tay chứ không chỉ quan sát công nghệ");
    if (!notes.length) notes.push("thiết bị và học cụ được lựa chọn để phục vụ trực tiếp cho cách tổ chức bài học, không phải là các hạng mục độc lập tách khỏi chương trình");
    return notes.map((x) => x.charAt(0).toUpperCase() + x.slice(1) + ".").join(" ");
  }

  function extraTrainingText() {
    const labels = [];
    const map = {
      TRAIN1_EXTRA10: "đào tạo bổ sung theo block +10 giáo viên",
      TRAIN2_EXTRA10: "đào tạo bổ sung theo block +10 giáo viên",
      RETRAIN_1: "tái đào tạo 1 phân môn",
      RETRAIN_2: "tái đào tạo 2 phân môn",
      RETRAIN1_EXTRA10: "tái đào tạo bổ sung theo block +10 giáo viên",
      RETRAIN2_EXTRA10: "tái đào tạo bổ sung theo block +10 giáo viên",
    };
    Object.entries(state.items || {}).forEach(([code, qty]) => {
      if (Number(qty || 0) > 0 && map[code]) labels.push(map[code]);
    });
    return naturalJoin(labels);
  }

  function supportBand(students) {
    if (!students) return "quy mô sẽ được xác nhận";
    if (students <= 150) return "quy mô đến 150 trẻ";
    if (students <= 300) return "quy mô 151–300 trẻ";
    if (students <= 500) return "quy mô 301–500 trẻ";
    return "quy mô trên 500 trẻ";
  }

  function generateConfigurationDescription() {
    const students = Math.max(0, Number(state.students || 0));
    const years = Number(state.years || 0);
    const teachers = Math.max(0, Number(state.teachers || 0));
    const program = programInfo();
    const physical = selectedPhysicalItems();
    const equipment = equipmentText(physical);
    const extraTraining = extraTrainingText();

    const scaleSentence = students
      ? `Phương án này được xây dựng trên quy mô dự kiến khoảng ${students} trẻ và ${program.count}, với thời hạn quyền sử dụng ${years || "…"} năm.`
      : `Phương án này được xây dựng trên quy mô dự kiến của Nhà trường và ${program.count}, với thời hạn quyền sử dụng ${years || "…"} năm.`;

    const equipmentSentence = equipment
      ? `Cấu hình thiết bị/học cụ hiện tại gồm ${equipment}. Số lượng này là mức đề xuất ban đầu để tổ chức hoạt động theo nhóm/lớp và có thể được tinh chỉnh sau khi rà soát số lớp, sĩ số, không gian và tần suất sử dụng thực tế.`
      : "Phần thiết bị/học cụ đang để ở mức linh hoạt và sẽ được xác nhận sau khi hai bên rà soát số lớp, không gian và cách tổ chức hoạt động thực tế.";

    const trainingSentence = teachers
      ? `Gói đào tạo khởi tạo giúp đội ngũ nắm cấu trúc bài học, cách sử dụng robot/học cụ và cách đặt câu hỏi để trẻ chủ động quan sát – suy nghĩ – thử – sửa. Phương án hiện dự kiến sát hạch/chứng nhận cho ${teachers} giáo viên${extraTraining ? `, đồng thời có ${extraTraining}` : ""}.`
      : `Gói đào tạo khởi tạo giúp đội ngũ nắm cấu trúc bài học, cách sử dụng robot/học cụ và cách đặt câu hỏi để trẻ chủ động quan sát – suy nghĩ – thử – sửa${extraTraining ? `; phương án đồng thời có ${extraTraining}` : ""}.`;

    return [
      "## 1. Căn cứ đề xuất",
      `${scaleSentence} Mục tiêu của cấu hình là tạo một phương án đủ để Nhà trường triển khai chương trình ổn định, nhưng vẫn tránh đầu tư dư thừa trước khi có số liệu vận hành thực tế. Vì vậy, các hạng mục dưới đây được lựa chọn theo logic chương trình – thiết bị – đào tạo – đồng hành, thay vì tách thành những món hàng độc lập.`,

      "## 2. Vì sao chương trình phù hợp",
      `Sunbot đề xuất ${program.name}. Nội dung này ${program.value}. Với trẻ mầm non 3–6 tuổi, robot không được đặt ở vị trí “trình diễn công nghệ” mà đóng vai trò học cụ: trẻ phải quan sát, trao đổi với bạn, đưa ra phương án, kiểm tra kết quả và điều chỉnh. Cách tổ chức này giúp công nghệ phục vụ mục tiêu phát triển của trẻ và vẫn giữ giáo viên là người dẫn dắt hoạt động học tập.`,

      "## 3. Cấu hình thiết bị và học cụ",
      `${equipmentSentence} ${equipmentRationale(physical)}`,

      "## 4. Đào tạo và khả năng triển khai của đội ngũ",
      `${trainingSentence} Việc đào tạo được thiết kế theo năng lực triển khai thực tế, không chỉ hướng dẫn thao tác thiết bị. Mục tiêu là sau đào tạo, giáo viên có thể tổ chức hoạt động đúng tiến trình, xử lý tình huống trong lớp và hiểu cách điều chỉnh mức độ khó phù hợp với trẻ.`,

      "## 5. Đồng hành vận hành và kiểm soát chất lượng",
      `Gói đồng hành được xác định theo ${supportBand(students)}. Sunbot sử dụng phần đồng hành để hỗ trợ giai đoạn bắt đầu triển khai, tiếp nhận phản hồi của giáo viên, rà soát việc sử dụng chương trình/học cụ và điều chỉnh những điểm chưa phù hợp trong vận hành. Điều này đặc biệt quan trọng ở giai đoạn đầu, khi hiệu quả không chỉ phụ thuộc vào thiết bị mà còn phụ thuộc vào cách giáo viên tổ chức lớp và mức độ duy trì chương trình trong năm học.`,

      "## 6. Nguyên tắc xác nhận cấu hình cuối cùng",
      `Đây là cấu hình đề xuất trên cơ sở thông tin hiện có. Trước khi ký hợp đồng hoặc đơn đặt hàng, Kiro Việt Nam và Nhà trường sẽ cùng xác nhận lại số trẻ, số lớp, số giáo viên, không gian triển khai, thiết bị/học cụ hiện có và phạm vi đồng hành cần thiết. Nếu điều kiện thực tế thay đổi, cấu hình có thể được tăng, giảm hoặc thay thế hạng mục để bảo đảm phù hợp hơn về chuyên môn và hiệu quả đầu tư; mọi thay đổi sẽ được hai bên thống nhất trước khi trở thành cấu hình chính thức.`,
    ].join("\n\n");
  }

  function setGenerated(force) {
    if (!force && state.configDescriptionDirty) return;
    state.configDescription = generateConfigurationDescription();
    state.configDescriptionDirty = false;
    sessionStorage.setItem(DEFAULT_KEY, state.configDescription);
    sessionStorage.setItem(DIRTY_KEY, "0");
  }

  function renderNarrative(text) {
    const blocks = String(text || "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
    return blocks.map((block) => {
      if (/^##\s+/.test(block)) return `<h3>${esc(block.replace(/^##\s+/, ""))}</h3>`;
      return `<p>${esc(block).replace(/\n/g, "<br>")}</p>`;
    }).join("");
  }

  setGenerated(false);

  const baseApplyCombo = applyCombo;
  applyCombo = function (code) {
    baseApplyCombo(code);
    state.configDescriptionDirty = false;
    setGenerated(true);
    renderContent();
  };

  const baseRenderBuilder = renderBuilder;
  renderBuilder = function () {
    if (!state.configDescriptionDirty) setGenerated(true);
    baseRenderBuilder();
    const controls = document.querySelector(".builder-controls");
    if (!controls || document.getElementById("configuration-description")) return;
    const panel = document.createElement("section");
    panel.className = "panel config-description-panel";
    panel.innerHTML = `
      <div class="builder-head config-editor-head">
        <div>
          <span class="config-step">THUYẾT MINH CẤU HÌNH</span>
          <h3>Vì sao cấu hình này phù hợp với khách hàng?</h3>
          <p class="help">Hệ thống tự tạo một bản thuyết minh đầy đủ từ quy mô và cấu hình đang chọn. Sales có thể chỉnh câu chữ, bổ sung bối cảnh riêng của trường nhưng không thêm cam kết ngoài phạm vi.</p>
        </div>
        <button type="button" class="btn secondary" id="regenerate-config-description">Tạo lại từ cấu hình</button>
      </div>
      <div class="config-editor-grid">
        <div class="config-editor-pane">
          <label class="config-pane-label">Nội dung Sales có thể chỉnh</label>
          <textarea id="configuration-description" rows="24" maxlength="5000">${esc(state.configDescription)}</textarea>
          <div class="help" id="config-description-status">Nội dung này sẽ được lưu theo phiên bản báo giá và gửi Admin duyệt.</div>
        </div>
        <div class="config-preview-pane">
          <div class="config-preview-head"><span>Bản xem trước trang thuyết minh</span><small>Khách hàng sẽ đọc phần này trước trang báo giá</small></div>
          <div id="configuration-description-preview" class="config-prose">${renderNarrative(state.configDescription)}</div>
        </div>
      </div>`;
    controls.insertAdjacentElement("afterend", panel);

    const textarea = document.getElementById("configuration-description");
    const preview = document.getElementById("configuration-description-preview");
    textarea.addEventListener("input", () => {
      state.configDescription = textarea.value;
      state.configDescriptionDirty = true;
      sessionStorage.setItem(DEFAULT_KEY, state.configDescription);
      sessionStorage.setItem(DIRTY_KEY, "1");
      preview.innerHTML = renderNarrative(state.configDescription);
      document.getElementById("config-description-status").textContent = "Đã chỉnh thủ công · hệ thống sẽ không tự ghi đè.";
    });
    document.getElementById("regenerate-config-description").onclick = () => {
      state.configDescriptionDirty = false;
      setGenerated(true);
      textarea.value = state.configDescription;
      preview.innerHTML = renderNarrative(state.configDescription);
      document.getElementById("config-description-status").textContent = "Đã tạo lại toàn bộ thuyết minh theo cấu hình hiện tại.";
    };
  };

  const baseBridge = bridge;
  bridge = function (mode, subaction, payload = {}, token = state.token) {
    if (mode === "quotationShared" && subaction === "saveSnapshot") {
      const copy = { ...(payload || {}) };
      const textarea = document.getElementById("configuration-description");
      const text = String(textarea?.value ?? state.configDescription ?? "").trim();
      copy.configuration_description = text || generateConfigurationDescription();
      state.configDescription = copy.configuration_description;
      sessionStorage.setItem(DEFAULT_KEY, state.configDescription);
      return baseBridge(mode, subaction, copy, token);
    }
    return baseBridge(mode, subaction, payload, token);
  };

  function quoteIdFromDocument(doc) {
    const code = doc.querySelector(".quote-meta b")?.textContent?.trim() || "";
    const match = code.match(/^BG\/SUNBOT\/(\d{4})\/(\d{4})-(\d{3})$/);
    return match ? `BG-SUNBOT-${match[1]}-${match[2]}-${match[3]}` : "";
  }

  function cloneHeader(doc) {
    const header = doc.querySelector(".quote-header")?.cloneNode(true);
    if (!header) return null;
    header.querySelectorAll("[id]").forEach((x) => x.removeAttribute("id"));
    return header;
  }

  async function splitCustomerDocument(doc) {
    if (!doc || doc.dataset.configDescriptionInjected === "1") return;
    doc.dataset.configDescriptionInjected = "1";

    let description = "";
    const quoteId = quoteIdFromDocument(doc);
    if (quoteId && state.token) {
      try {
        const bundle = await baseBridge("quotationShared", "getQuote", { quote_id: quoteId }, state.token);
        description = String(bundle?.quote?.configuration_description || "").trim();
      } catch (_) {}
    }
    if (!description) description = String(state.configDescription || "").trim();
    if (!description) return;

    const originalHeader = doc.querySelector(".quote-header");
    const titleBlock = doc.querySelector(".quote-title-block");
    const recipient = doc.querySelector(".quote-recipient");
    const courtesy = doc.querySelector(".quote-courtesy");
    const table = doc.querySelector(".quote-table-section");
    const total = doc.querySelector(".quote-total-box");
    const notes = doc.querySelector(".quote-commercial-notes");
    const footer = doc.querySelector(".quote-footer");
    if (!originalHeader || !table || !total || !footer) return;

    const narrativePage = document.createElement("section");
    narrativePage.className = "customer-proposal-page customer-proposal-narrative";
    const narrativeHeader = cloneHeader(doc);
    if (narrativeHeader) narrativePage.appendChild(narrativeHeader);
    const intro = document.createElement("div");
    intro.className = "proposal-page-title";
    intro.innerHTML = `<div class="proposal-eyebrow">ĐỀ XUẤT GIẢI PHÁP</div><h1>THUYẾT MINH CẤU HÌNH SUNBOT</h1><p>Phương án được xây dựng riêng trên cơ sở quy mô và các hạng mục đang đề xuất cho Quý Nhà trường/Quý Đơn vị.</p>`;
    narrativePage.appendChild(intro);
    if (recipient) narrativePage.appendChild(recipient.cloneNode(true));
    if (courtesy) narrativePage.appendChild(courtesy.cloneNode(true));
    const prose = document.createElement("div");
    prose.className = "config-prose customer-config-prose";
    prose.innerHTML = renderNarrative(description);
    narrativePage.appendChild(prose);

    const pricePage = document.createElement("section");
    pricePage.className = "customer-proposal-page customer-proposal-price";
    const priceHeader = cloneHeader(doc);
    if (priceHeader) pricePage.appendChild(priceHeader);
    const priceTitle = document.createElement("div");
    priceTitle.className = "proposal-page-title price-page-title";
    priceTitle.innerHTML = `<div class="proposal-eyebrow">ĐỀ XUẤT THƯƠNG MẠI</div><h1>BÁO GIÁ CHI TIẾT</h1><p>Các hạng mục dưới đây tương ứng với cấu hình thuyết minh tại trang trước và là cơ sở để hai bên tiếp tục xác nhận phương án chính thức.</p>`;
    pricePage.appendChild(priceTitle);
    if (recipient) pricePage.appendChild(recipient.cloneNode(true));
    pricePage.appendChild(table.cloneNode(true));
    pricePage.appendChild(total.cloneNode(true));
    if (notes) pricePage.appendChild(notes.cloneNode(true));
    pricePage.appendChild(footer.cloneNode(true));

    doc.innerHTML = "";
    doc.appendChild(narrativePage);
    doc.appendChild(pricePage);
  }

  const style = document.createElement("style");
  style.textContent = `
    .config-description-panel { margin-top:16px; overflow:hidden; }
    .config-step { display:inline-block; font-size:11px; font-weight:800; letter-spacing:.08em; opacity:.65; margin-bottom:4px; }
    .config-editor-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:16px; margin-top:14px; }
    .config-editor-pane, .config-preview-pane { min-width:0; }
    .config-pane-label { display:block; font-weight:700; margin-bottom:7px; }
    .config-description-panel textarea { width:100%; box-sizing:border-box; font:inherit; line-height:1.55; padding:14px 15px; border:1px solid rgba(0,0,0,.16); border-radius:12px; resize:vertical; min-height:470px; }
    .config-preview-pane { border:1px solid rgba(0,0,0,.1); border-radius:14px; background:#fff; overflow:hidden; }
    .config-preview-head { padding:12px 15px; border-bottom:1px solid rgba(0,0,0,.08); display:flex; justify-content:space-between; gap:10px; align-items:baseline; }
    .config-preview-head span { font-weight:800; }
    .config-preview-head small { opacity:.65; text-align:right; }
    .config-prose { padding:17px 18px; line-height:1.62; font-size:13px; }
    .config-prose h3 { margin:17px 0 6px; font-size:13px; line-height:1.35; }
    .config-prose h3:first-child { margin-top:0; }
    .config-prose p { margin:0 0 11px; }
    .proposal-page-title { padding:22px 0 14px; }
    .proposal-page-title h1 { margin:3px 0 7px; font-size:25px; letter-spacing:-.02em; }
    .proposal-page-title p { margin:0; max-width:760px; line-height:1.55; font-size:12.5px; opacity:.78; }
    .proposal-eyebrow { font-size:10.5px; font-weight:850; letter-spacing:.12em; opacity:.62; }
    .customer-proposal-page { background:#fff; }
    .customer-config-prose { padding:8px 0 0; font-size:12.3px; }
    .customer-config-prose h3 { padding-top:8px; border-top:1px solid rgba(0,0,0,.08); }
    .customer-proposal-price .quote-recipient { margin-bottom:14px; }
    @media (max-width: 980px) { .config-editor-grid { grid-template-columns:1fr; } .config-description-panel textarea { min-height:360px; } }
    @media print {
      .customer-proposal-page { page-break-after:always; break-after:page; min-height:calc(297mm - 28mm); }
      .customer-proposal-page:last-child { page-break-after:auto; break-after:auto; }
      .customer-proposal-narrative, .customer-proposal-price { break-inside:avoid; }
      .customer-config-prose { font-size:11.3px; line-height:1.5; }
      .customer-config-prose h3 { font-size:11.7px; margin-top:10px; }
      .proposal-page-title { padding-top:16px; }
      .proposal-page-title h1 { font-size:22px; }
    }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(() => {
    document.querySelectorAll(".quote-document").forEach(splitCustomerDocument);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.querySelectorAll(".quote-document").forEach(splitCustomerDocument);
})();
