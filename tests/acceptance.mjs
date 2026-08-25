import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");
const html = read("v3/index.html");
const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map((match) => match[1]);
const source = scripts.map((path) => read(`v3/${path}`)).join("\n");
const backend = fs.readFileSync(
  "/Users/tuongvan/Documents/Kiro Sunbot/sunbot-ops/apps-script/QuotationV3Refactor.gs",
  "utf8",
);

const tests = [];
const test = (name, run) => tests.push({ name, run });

test("01 đăng nhập chỉ có mật khẩu", () => {
  const auth = read("v3/js/auth.js");
  assert.match(auth, /type="password"/);
  assert.doesNotMatch(auth, /type="email"|ID đăng nhập|PIN/);
});
test("02 sai mật khẩu có thông báo thân thiện", () =>
  assert.match(read("v3/js/utils.js"), /Mật khẩu không đúng/));
test("03 phiên lưu theo tab", () => {
  const storage = read("v3/js/storage.js");
  assert.match(storage, /sessionStorage/);
  assert.doesNotMatch(storage, /localStorage\.setItem\(QV3_CONFIG\.SESSION_KEY/);
});
test("04 phiên hết hạn quay về đăng nhập", () =>
  assert.match(read("v3/js/app.js"), /clearToken\(\)/));
test("05 chỉ có hai chế độ nghiệp vụ", () => {
  assert.match(read("v3/js/app.js"), /Giải pháp Sunbot/);
  assert.match(read("v3/js/app.js"), /Vật liệu & sửa chữa lẻ/);
});
test("06 catalog tải từ backend", () =>
  assert.match(read("v3/js/app.js"), /QV3Api\.call\(state\(\)\.token, "catalog"\)/));
test("07 materials tải từ backend", () =>
  assert.match(read("v3/js/app.js"), /QV3Api\.call\(state\(\)\.token, "materials"\)/));
test("08 không còn patch chain", () => {
  assert.doesNotMatch(source, /MutationObserver|monkeypatch|\.prototype\s*=|window\.render\s*=/);
  for (const old of ["patch.js", "pre-shared.js", "shared-tool.js", "login-polish.js", "final-cleanup.js"])
    assert.equal(fs.existsSync(new URL(`v3/${old}`, root)), false);
});
test("09 frontend không chứa giá hardcode", () =>
  assert.doesNotMatch(source, /recommended_price\s*:\s*\d|unit_price\s*:\s*\d|list_price\s*:\s*\d/));
test("10 frontend không chứa giá sàn", () =>
  assert.doesNotMatch(source, /floor_price|minimum_price|giá sàn/i));
test("11 draft không được in", () =>
  assert.match(read("v3/js/quote-lifecycle.js"), /quoteStatus\(mode\) === "SAVED"/));
test("12 draft hiện nhãn BẢN NHÁP", () =>
  assert.match(read("v3/js/config.js"), /DRAFT_LABEL: "BẢN NHÁP"/));
test("13 saved mở chức năng in", () =>
  assert.match(read("v3/js/solution-builder.js"), /id="printQuote" \$\{saved \? "" : "disabled"\}/));
test("14 sửa sau lưu trở về draft nhưng giữ quote id", () => {
  const state = read("v3/js/state.js");
  assert.match(state, /target\.dirty = true/);
  assert.doesNotMatch(state, /target\.saved = null/);
  assert.match(read("v3/js/quote-lifecycle.js"), /target\.saved\?\.quote_id/);
});
test("15 lưu lại có nhãn phiên bản mới", () =>
  assert.match(source, /Lưu phiên bản mới/));
test("16 mã hiển thị đúng định dạng", () =>
  assert.match(backend, /BG\/SUNBOT\//));
test("17 backend tăng version", () =>
  assert.match(backend, /quotationV3LatestVersion_\(existingId\)\+1/));
test("18 backend tự tính line total", () =>
  assert.match(backend, /Math\.round\(unitPrice\*qty\)/));
test("19 backend tự tính final amount", () =>
  assert.match(backend, /lines\.reduce\(function\(sum,line\)\{return sum\+line\.line_total;\},0\)/));
test("20 save luôn preview lại phía server", () =>
  assert.match(backend, /const preview=quotationV3Preview_\(payload\)/));
test("21 item hết hiệu lực bị chặn", () =>
  assert.match(backend, /Hạng mục không còn hiệu lực hoặc không được phép báo giá/));
test("22 số lượng không hợp lệ bị chặn", () =>
  assert.match(backend, /Số lượng không hợp lệ/));
test("23 dòng trùng bị chặn", () => assert.match(backend, /Hạng mục bị lặp/));
test("24 tùy chỉnh chỉ dùng cho retail", () =>
  assert.match(backend, /mode!==['"]RETAIL['"]\)throw new Error/));
test("25 tùy chỉnh có cảnh báo", () => {
  assert.match(read("v3/js/config.js"), /CUSTOM_WARNING/);
  assert.match(backend, /custom_price_warning/);
});
test("26 nhận context CRM tùy chọn", () => {
  assert.match(read("v3/js/state.js"), /customer_id/);
  assert.match(backend, /customer_id/);
  assert.match(backend, /opportunity_id/);
});
test("27 PDF có tên công ty và mã báo giá", () => {
  const doc = read("v3/js/quote-document.js");
  assert.match(doc, /CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC KIRO VIỆT NAM/);
  assert.match(doc, /Mã báo giá/);
});
test("28 tên file có mã ngày và khách hàng", () => {
  const doc = read("v3/js/quote-document.js");
  assert.match(doc, /SUNBOT_BAO_GIA/);
  assert.match(doc, /customer/);
  assert.match(doc, /date/);
});
test("29 backend route dùng session hiện hành", () => {
  assert.match(backend, /quotationSharedSession_\(token\)/);
  const bridge = fs.readFileSync(
    "/Users/tuongvan/Documents/Kiro Sunbot/sunbot-ops/apps-script/PagesBridge.gs",
    "utf8",
  );
  assert.match(bridge, /mode==='quotationV3'/);
});
test("30 mã nguồn JavaScript parse hợp lệ", () => {
  for (const path of scripts) new vm.Script(read(`v3/${path}`), { filename: path });
  new vm.Script(backend, { filename: "QuotationV3Refactor.gs" });
});

let failures = 0;
for (const { name, run } of tests) {
  try {
    await run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error.message}`);
  }
}
console.log(`\n${tests.length - failures}/${tests.length} acceptance checks passed.`);
if (failures) process.exit(1);
