import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(path, "utf8");
const app = read("v3/app.js"), auth = read("v3/auth.js"), catalog = read("v3/catalog.js"), training = read("v3/training-addons.js"), workflow = read("v3/quote-workflow.js"), config = read("v3/configuration-description.js"), commercial = read("v3/commercial-configurator.js"), policy = read("v3/commercial-policy-workflow.js"), adminEditor = read("v3/admin-approval-editor.js"), customerPolish = read("v3/quote-customer-polish.js"), integration = read("v3/SERVER-INTEGRATION.md"), index = read("v3/index.html");
const tests = [
  ["ID and password login payload", () => assert.match(auth, /login_id: loginId/)],
  ["server identity drives creator", () => assert.match(auth, /state\.user/)],
  ["creator display has no region", () => assert.doesNotMatch(auth, /Hà Nội|Đông Bắc|Bắc Trung Bộ/)],
  ["admin review loads full quote", () => assert.match(workflow + adminEditor, /"getQuote"/)],
  ["personal quote library exists", () => assert.match(workflow, /Báo giá của tôi/)],
  ["approve and return are wired", () => { assert.match(adminEditor, /"approveQuote"/); assert.match(adminEditor, /"rejectQuote"/); assert.match(adminEditor, /Trả lại chỉnh sửa/); }],
  ["approved quote export is wired", () => assert.match(workflow, /"exportQuote"/)],
  ["save asks for approval", () => assert.match(app, /desired_status: "NEEDS_APPROVAL"/)],
  ["training add-ons are selectable", () => assert.match(training, /TRAIN1_EXTRA10/) && assert.match(training, /RETRAIN2_EXTRA10/)],
  ["configuration narrative has six sections", () => { for (let i = 1; i <= 6; i++) assert.match(config, new RegExp(`## ${i}\\.`)); }],
  ["proposal separates narrative and pricing pages", () => { assert.match(config, /customer-proposal-narrative/); assert.match(config, /customer-proposal-price/); }],
  ["rights terms include 12 36 60", () => { assert.match(commercial, /\[12, 36, 60\]/); assert.match(commercial, /RIGHT_CORE_12M/); }],
  ["support uses fixed 12 36 60 month SKUs", () => { assert.match(commercial, /supportTermMonths/); assert.match(commercial, /SUPPORT_\$\{band\}_\$\{months\}M/); }],
  ["scale pricing is learner-session based", () => { assert.match(commercial, /progressivePerSessionFee/); assert.match(commercial, /\[4, 8\]/); assert.match(commercial, /SCALE_ACTIVE_MONTHS = 9/); }],
  ["8-session plan uses 1.5 frequency factor", () => { assert.match(commercial, /function frequencyFactor/); assert.match(commercial, /=== 8 \? 1\.5 : 1/); assert.match(commercial, /SCALE_BASE_SESSIONS_PER_MONTH = 4/); }],
  ["site count drives model policy", () => { assert.match(commercial, /SITE_COUNT_KEY/); assert.match(commercial, /siteCount/); assert.match(commercial, /Từ 02 điểm trở lên/); }],
  ["point vs scale comparison exists", () => { assert.match(commercial, /pointComparisonFee/); assert.match(commercial, /scaleSchoolYearFee/); assert.match(commercial, /So sánh nhanh/); }],
  ["scale pricing uses program factors and minimums", () => { assert.match(commercial, /return 0\.7/); assert.match(commercial, /return 1\.2/); assert.match(commercial, /24000000/); assert.match(commercial, /30000000/); }],
  ["scale replaces rights and support", () => { assert.match(commercial, /filter\(\(line\) => !\/\^RIGHT_/); assert.match(commercial, /!\/\^SUPPORT_/); }],
  ["mandatory Sunbot branding exists", () => { assert.match(commercial, /BRAND_DECOR_FORMEX/); assert.match(commercial, /Math\.max\(state\.siteCount/); assert.match(commercial, /Nhận diện Sunbot bắt buộc/); }],
  ["policy context is saved with approval request", () => { assert.match(policy, /deployment_sites/); assert.match(policy, /recommended_model/); assert.match(policy, /point_comparison_amount/); assert.match(policy, /scale_comparison_amount/); }],
  ["policy exception requires a reason", () => { assert.match(policy, /Mô hình đang chọn là ngoại lệ/); assert.match(policy, /model_exception_reason/); assert.match(policy, /next\.exception_reason/); }],
  ["admin can edit price but scope stays read-only", () => { assert.match(adminEditor, /Admin chỉ chỉnh giá/); assert.match(adminEditor, /admin-price-input/); assert.match(adminEditor, /Trả lại chỉnh sửa/); }],
  ["admin A B normal approval cap is 7 percent", () => { assert.match(adminEditor, /discount <= 0\.07/); assert.match(adminEditor, /giảm tối đa 7%/); }],
  ["admin C uses recommended to floor", () => assert.match(adminEditor, /Nhóm C: Admin được chỉnh từ giá khuyến nghị xuống giá sàn/)],
  ["admin camp event cap is 5 percent", () => { assert.match(adminEditor, /discount <= 0\.05/); assert.match(adminEditor, /50 triệu/); }],
  ["special approval requires reason", () => { assert.match(adminEditor, /requiresSpecialReason/); assert.match(adminEditor, /Hãy ghi rõ lý do/); }],
  ["admin revision preserves quote id", () => { assert.match(adminEditor, /quote_id:q\.quote_id/); assert.match(adminEditor, /saveSnapshot/); }],
  ["admin editor is loaded last", () => assert.match(index, /commercial-policy-workflow\.js[\s\S]*admin-approval-editor\.js/)],
  ["customer-facing commercial notes remain", () => assert.match(customerPolish, /Lưu ý thương mại/)],
  ["no hardcoded frontend catalog prices", () => assert.doesNotMatch(catalog, /price\s*:\s*\d/)],
  ["no credential material or legacy login", () => assert.doesNotMatch(app + auth + catalog + workflow + config + commercial + policy + adminEditor, /PASSWORD_HASH|SHARED_PASSWORD|pinLogin|loginPinByEmail|type=["']email/)],
  ["all frontend JavaScript parses", () => { [app,auth,catalog,training,workflow,config,commercial,policy,adminEditor,customerPolish].forEach((src) => new vm.Script(src)); }],
];
let failures = 0;
for (const [name, run] of tests) { try { run(); console.log("PASS", name); } catch (error) { failures++; console.error("FAIL", name, error.message); } }
console.log(`\n${tests.length - failures}/${tests.length} frontend checks passed.`);
if (failures) process.exit(1);
