import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(path, "utf8");
const app = read("v3/app.js"), auth = read("v3/auth.js"), catalog = read("v3/catalog.js"), training = read("v3/training-addons.js"), workflow = read("v3/quote-workflow.js"), config = read("v3/configuration-description.js"), commercial = read("v3/commercial-configurator.js"), policy = read("v3/commercial-policy-workflow.js"), scaleIntegrity = read("v3/scale-pricing-integrity.js"), adminEditor = read("v3/admin-approval-editor.js"), adminView = read("v3/admin-view-mode.js"), documentOutput = read("v3/document-output.js"), printA4 = read("v3/print-a4.css"), customerPolish = read("v3/quote-customer-polish.js"), integration = read("v3/SERVER-INTEGRATION.md"), index = read("v3/index.html");
const tests = [
  ["ID and password login payload", () => assert.match(auth, /login_id: loginId/)],
  ["server identity drives creator", () => assert.match(auth, /state\.user/)],
  ["creator display has no region", () => assert.doesNotMatch(auth, /Hà Nội|Đông Bắc|Bắc Trung Bộ/)],
  ["admin review loads full quote", () => assert.match(workflow + adminEditor, /"getQuote"/)],
  ["personal quote library exists", () => assert.match(workflow, /Báo giá của tôi/)],
  ["approve and return are wired", () => { assert.match(adminEditor, /"approveQuote"/); assert.match(adminEditor, /"rejectQuote"/); assert.match(adminEditor, /Trả lại chỉnh sửa/); }],
  ["approved quote export is wired", () => assert.match(workflow + documentOutput, /"exportQuote"/)],
  ["save asks for approval", () => assert.match(app, /desired_status: "NEEDS_APPROVAL"/)],
  ["training add-ons are selectable", () => assert.match(training, /TRAIN1_EXTRA10/) && assert.match(training, /RETRAIN2_EXTRA10/)],
  ["configuration narrative has six sections", () => { for (let i = 1; i <= 6; i++) assert.match(config, new RegExp(`## ${i}\\.`)); }],
  ["proposal separates narrative and pricing pages", () => { assert.match(config, /customer-proposal-narrative/); assert.match(config, /customer-proposal-price/); }],
  ["rights terms include 12 36 60", () => { assert.match(commercial, /\[12, 36, 60\]/); assert.match(commercial, /RIGHT_CORE_12M/); }],
  ["support uses fixed 12 36 60 month SKUs", () => { assert.match(commercial, /supportTermMonths/); assert.match(commercial, /SUPPORT_\$\{band\}_\$\{months\}M/); }],
  ["scale pricing is learner-session based", () => { assert.match(commercial, /progressivePerSessionFee/); assert.match(commercial, /\[4, 8\]/); assert.match(commercial, /SCALE_ACTIVE_MONTHS = 9/); }],
  ["8-session plan uses 1.5 frequency factor", () => { assert.match(scaleIntegrity, /Number\(sessions\) === 8 \? 1\.5 : 1/); assert.match(scaleIntegrity, /baseMinimum\(\) \* factor/); }],
  ["4 and 8 session prices are displayed side by side", () => { assert.match(scaleIntegrity, /4 buổi\/tháng/); assert.match(scaleIntegrity, /8 buổi\/tháng/); assert.match(scaleIntegrity, /scale_4_amount/); assert.match(scaleIntegrity, /scale_8_amount/); }],
  ["frequency adjusted minimum prevents equal 4 and 8 prices", () => { assert.match(policy, /minimumSchoolYearFee\(\) \* factor/); assert.match(policy, /scaleComparisonFee\(4\)/); assert.match(policy, /scaleComparisonFee\(8\)/); }],
  ["site count drives model policy", () => { assert.match(commercial, /SITE_COUNT_KEY/); assert.match(commercial, /siteCount/); assert.match(commercial, /Từ 02 điểm trở lên/); }],
  ["point vs scale comparison exists", () => { assert.match(commercial, /pointComparisonFee/); assert.match(commercial, /scaleSchoolYearFee/); assert.match(commercial, /So sánh nhanh/); }],
  ["scale replaces rights and support", () => { assert.match(commercial, /filter\(\(line\) => !\/\^RIGHT_/); assert.match(commercial, /!\/\^SUPPORT_/); }],
  ["mandatory Sunbot branding exists", () => { assert.match(commercial, /BRAND_DECOR_FORMEX/); assert.match(commercial, /Math\.max\(state\.siteCount/); assert.match(commercial, /Nhận diện Sunbot bắt buộc/); }],
  ["policy context saves program and frequency", () => { assert.match(policy, /scale_program/); assert.match(policy, /scale_sessions_per_month/); assert.match(policy, /frequency_factor/); }],
  ["policy exception requires a reason", () => { assert.match(policy, /Mô hình đang chọn là ngoại lệ/); assert.match(policy, /model_exception_reason/); assert.match(policy, /next\.exception_reason/); }],
  ["admin can edit price but scope stays read-only", () => { assert.match(adminEditor, /Admin chỉ chỉnh giá/); assert.match(adminEditor, /admin-price-input/); assert.match(adminEditor, /Trả lại chỉnh sửa/); }],
  ["admin A B normal approval cap is 7 percent", () => { assert.match(adminEditor, /discount <= 0\.07/); assert.match(adminEditor, /giảm tối đa 7%/); }],
  ["admin C uses recommended to floor", () => assert.match(adminEditor, /Nhóm C: Admin được chỉnh từ giá khuyến nghị xuống giá sàn/)],
  ["admin camp event cap is 5 percent", () => { assert.match(adminEditor, /discount <= 0\.05/); assert.match(adminEditor, /50 triệu/); }],
  ["special approval requires reason", () => { assert.match(adminEditor, /requiresSpecialReason/); assert.match(adminEditor, /Hãy ghi rõ lý do/); }],
  ["admin revision preserves quote id", () => { assert.match(adminEditor, /quote_id:q\.quote_id/); assert.match(adminEditor, /saveSnapshot/); }],
  ["legacy A4 fallback still has physical margins", () => { assert.match(printA4, /@page\s*\{\s*size:\s*A4 portrait;\s*margin:\s*12mm 14mm/); assert.match(printA4, /table-header-group/); }],
  ["standalone outputs use clean A4 document", () => { assert.match(documentOutput, /@page\{size:A4 portrait;margin:12mm 14mm 13mm\}/); assert.match(documentOutput, /sanitizeClone/); assert.match(documentOutput, /documentHtml/); }],
  ["print path does not use popup windows", () => { assert.doesNotMatch(documentOutput, /window\.open/); assert.match(documentOutput, /createElement\("iframe"\)/); assert.match(documentOutput, /contentWindow\?\.print/); }],
  ["approved output is PDF-only and has no editable Word export", () => { assert.match(documentOutput, /In \/ Lưu PDF A4/); assert.doesNotMatch(documentOutput, /application\/msword|new Blob|URL\.createObjectURL|link\.download|data-doc-action=["']word|Tải Word|WordSection1/); }],
  ["three independent customer documents exist", () => { assert.match(documentOutput, /Báo giá/); assert.match(documentOutput, /Đề xuất/); assert.match(documentOutput, /Thuyết minh/); assert.match(documentOutput, /mode === "quote"/); assert.match(documentOutput, /mode === "narrative"/); }],
  ["standalone quote table wraps names and protects rows", () => { assert.match(documentOutput, /table-layout:fixed/); assert.match(documentOutput, /overflow-wrap:anywhere/); assert.match(documentOutput, /page-break-inside:avoid/); assert.match(documentOutput, /table-header-group/); }],
  ["admin employee preview exists", () => { assert.match(adminView, /Xem như Nhân viên/); assert.match(adminView, /Về Admin/); assert.match(adminView, /Hoàng Nhung/); assert.match(adminView, /Minh Thu/); assert.match(adminView, /Lê Dung/); }],
  ["employee preview blocks server writes", () => { assert.match(adminView, /saveSnapshot/); assert.match(adminView, /approveQuote/); assert.match(adminView, /rejectQuote/); assert.match(adminView, /chế độ xem thử Nhân viên/i); }],
  ["employee preview filters quote list", () => assert.match(adminView, /subaction === "listQuotes"/)],
  ["integrity and document output layers load in correct order", () => { assert.match(index, /commercial-policy-workflow\.js[\s\S]*scale-pricing-integrity\.js[\s\S]*admin-approval-editor\.js/); assert.match(index, /admin-view-mode\.js[\s\S]*document-output\.js/); }],
  ["customer-facing commercial notes remain", () => assert.match(customerPolish, /Lưu ý thương mại/)],
  ["no hardcoded frontend catalog prices", () => assert.doesNotMatch(catalog, /price\s*:\s*\d/)],
  ["no credential material or legacy login", () => assert.doesNotMatch(app + auth + catalog + workflow + config + commercial + policy + scaleIntegrity + adminEditor + adminView + documentOutput, /PASSWORD_HASH|SHARED_PASSWORD|pinLogin|loginPinByEmail|type=["']email/)],
  ["all frontend JavaScript parses", () => { [app,auth,catalog,training,workflow,config,commercial,policy,scaleIntegrity,adminEditor,adminView,documentOutput,customerPolish].forEach((src) => new vm.Script(src)); }],
];
let failures = 0;
for (const [name, run] of tests) { try { run(); console.log("PASS", name); } catch (error) { failures++; console.error("FAIL", name, error.message); } }
console.log(`\n${tests.length - failures}/${tests.length} frontend checks passed.`);
if (failures) process.exit(1);
