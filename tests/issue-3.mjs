import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(path, "utf8");
const app = read("v3/app.js"), auth = read("v3/auth.js"), catalog = read("v3/catalog.js"), training = read("v3/training-addons.js"), workflow = read("v3/quote-workflow.js"), config = read("v3/configuration-description.js"), commercial = read("v3/commercial-configurator.js"), policy = read("v3/commercial-policy-workflow.js"), scaleIntegrity = read("v3/scale-pricing-integrity.js"), adminEditor = read("v3/admin-approval-editor.js"), adminView = read("v3/admin-view-mode.js"), documentOutput = read("v3/document-output.js"), disableWord = read("v3/disable-word-output.js"), printGesture = read("v3/print-gesture-fix.js"), printA4 = read("v3/print-a4.css"), customerPolish = read("v3/quote-customer-polish.js"), integration = read("v3/SERVER-INTEGRATION.md"), index = read("v3/index.html");
const tests = [
  ["ID and password login payload", () => assert.match(auth, /login_id: loginId/)],
  ["server identity drives creator", () => assert.match(auth, /state\.user/)],
  ["creator display has no region", () => assert.doesNotMatch(auth, /Hà Nội|Đông Bắc|Bắc Trung Bộ/)],
  ["admin review loads full quote", () => assert.match(workflow + adminEditor, /"getQuote"/)],
  ["personal quote library exists", () => assert.match(workflow, /Báo giá của tôi/)],
  ["approve and return are wired", () => { assert.match(adminEditor, /"approveQuote"/); assert.match(adminEditor, /"rejectQuote"/); assert.match(adminEditor, /Trả lại chỉnh sửa/); }],
  ["approved quote export is wired", () => assert.match(workflow + documentOutput + printGesture, /"exportQuote"/)],
  ["save asks for approval", () => assert.match(app, /desired_status: "NEEDS_APPROVAL"/)],
  ["training add-ons are selectable", () => assert.match(training, /TRAIN1_EXTRA10/) && assert.match(training, /RETRAIN2_EXTRA10/)],
  ["configuration narrative has six sections", () => { for (let i = 1; i <= 6; i++) assert.match(config, new RegExp(`## ${i}\\.`)); }],
  ["proposal separates narrative and pricing pages", () => { assert.match(config, /customer-proposal-narrative/); assert.match(config, /customer-proposal-price/); }],
  ["rights terms include 12 36 60", () => { assert.match(commercial, /\[12, 36, 60\]/); assert.match(commercial, /RIGHT_CORE_12M/); }],
  ["support uses fixed 12 36 60 month SKUs", () => { assert.match(commercial, /supportTermMonths/); assert.match(commercial, /SUPPORT_\$\{band\}_\$\{months\}M/); }],
  ["scale pricing is learner-session based", () => { assert.match(commercial, /progressivePerSessionFee/); assert.match(commercial, /\[4, 8\]/); assert.match(commercial, /SCALE_ACTIVE_MONTHS = 9/); }],
  ["8-session plan uses 1.5 frequency factor", () => { assert.match(scaleIntegrity, /Number\(sessions\) === 8 \? 1\.5 : 1/); assert.match(scaleIntegrity, /baseMinimum\(\) \* factor/); }],
  ["frequency adjusted minimum prevents equal 4 and 8 prices", () => { assert.match(policy, /minimumSchoolYearFee\(\) \* factor/); assert.match(policy, /scaleComparisonFee\(4\)/); assert.match(policy, /scaleComparisonFee\(8\)/); }],
  ["site count drives model policy", () => { assert.match(commercial, /SITE_COUNT_KEY/); assert.match(commercial, /siteCount/); assert.match(commercial, /Từ 02 điểm trở lên/); }],
  ["scale replaces rights and support", () => { assert.match(commercial, /filter\(\(line\) => !\/\^RIGHT_/); assert.match(commercial, /!\/\^SUPPORT_/); }],
  ["mandatory Sunbot branding exists", () => { assert.match(commercial, /BRAND_DECOR_FORMEX/); assert.match(commercial, /Nhận diện Sunbot bắt buộc/); }],
  ["admin can edit price but scope stays read-only", () => { assert.match(adminEditor, /Admin chỉ chỉnh giá/); assert.match(adminEditor, /admin-price-input/); assert.match(adminEditor, /Trả lại chỉnh sửa/); }],
  ["legacy A4 fallback still has physical margins", () => { assert.match(printA4, /@page\s*\{\s*size:\s*A4 portrait;\s*margin:\s*12mm 14mm/); assert.match(printA4, /table-header-group/); }],
  ["print path has no popup window", () => { assert.doesNotMatch(printGesture, /window\.open/); assert.match(printGesture, /data-sunbot-print-frame/); assert.match(printGesture, /contentWindow\.print\(\)/); }],
  ["print verification happens before click", () => { const prepareIndex = printGesture.indexOf('await bridge("quotationShared", "exportQuote"'); const clickIndex = printGesture.indexOf('btn.onclick = function'); assert.ok(prepareIndex >= 0 && clickIndex > prepareIndex); }],
  ["print click is synchronous", () => { const click = printGesture.slice(printGesture.indexOf('btn.onclick = function')); const block = click.slice(0, click.indexOf('};') + 2); assert.doesNotMatch(block, /await|setTimeout|fonts\.ready|bridge\(/); assert.match(block, /contentWindow\.print\(\)/); }],
  ["Word export UI is removed", () => { assert.match(disableWord, /data-doc-action="word"/); assert.match(disableWord, /group\.remove\(\)/); assert.match(disableWord, /In \/ Lưu PDF A4/); }],
  ["three independent customer documents exist", () => { assert.match(printGesture, /"quote"/); assert.match(printGesture, /"proposal"/); assert.match(printGesture, /"narrative"/); }],
  ["admin employee preview exists", () => { assert.match(adminView, /Xem như Nhân viên/); assert.match(adminView, /Về Admin/); assert.match(adminView, /Hoàng Nhung/); assert.match(adminView, /Minh Thu/); assert.match(adminView, /Lê Dung/); }],
  ["employee preview blocks server writes", () => { assert.match(adminView, /saveSnapshot/); assert.match(adminView, /approveQuote/); assert.match(adminView, /rejectQuote/); }],
  ["print gesture fix loads after document output", () => assert.match(index, /document-output\.js[\s\S]*disable-word-output\.js[\s\S]*print-gesture-fix\.js/)],
  ["customer-facing commercial notes remain", () => assert.match(customerPolish, /Lưu ý thương mại/)],
  ["no hardcoded frontend catalog prices", () => assert.doesNotMatch(catalog, /price\s*:\s*\d/)],
  ["all frontend JavaScript parses", () => { [app,auth,catalog,training,workflow,config,commercial,policy,scaleIntegrity,adminEditor,adminView,documentOutput,disableWord,printGesture,customerPolish].forEach((src) => new vm.Script(src)); }],
];
let failures = 0;
for (const [name, run] of tests) { try { run(); console.log("PASS", name); } catch (error) { failures++; console.error("FAIL", name, error.message); } }
console.log(`\n${tests.length - failures}/${tests.length} frontend checks passed.`);
if (failures) process.exit(1);
