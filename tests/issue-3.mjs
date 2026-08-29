import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(path, "utf8");
const app = read("v3/app.js"), auth = read("v3/auth.js"), catalog = read("v3/catalog.js"), training = read("v3/training-addons.js"), workflow = read("v3/quote-workflow.js"), config = read("v3/configuration-description.js"), commercial = read("v3/commercial-configurator.js"), customerPolish = read("v3/quote-customer-polish.js"), integration = read("v3/SERVER-INTEGRATION.md");
const tests = [
  ["ID and password login payload", () => assert.match(auth, /login_id: loginId/)],
  ["server identity drives creator", () => assert.match(auth, /state\.user/)],
  ["creator display has no region", () => assert.doesNotMatch(auth, /Hà Nội|Đông Bắc|Bắc Trung Bộ/)],
  ["admin review loads full quote", () => assert.match(workflow, /"getQuote"/)],
  ["personal quote library exists", () => assert.match(workflow, /Báo giá của tôi/)],
  ["approve and reject are wired", () => { assert.match(workflow, /"approveQuote"/); assert.match(workflow, /"rejectQuote"/); }],
  ["approved quote export is wired", () => assert.match(workflow, /"exportQuote"/)],
  ["save asks for approval", () => assert.match(app, /desired_status: "NEEDS_APPROVAL"/)],
  ["training add-ons are selectable", () => assert.match(training, /TRAIN1_EXTRA10/) && assert.match(training, /RETRAIN2_EXTRA10/)],
  ["configuration narrative has six sections", () => { for (let i = 1; i <= 6; i++) assert.match(config, new RegExp(`## ${i}\\.`)); }],
  ["proposal separates narrative and pricing pages", () => { assert.match(config, /customer-proposal-narrative/); assert.match(config, /customer-proposal-price/); }],
  ["rights terms include 12 36 60", () => { assert.match(commercial, /\[12, 36, 60\]/); assert.match(commercial, /RIGHT_CORE_12M/); }],
  ["support uses fixed 12 36 60 month SKUs", () => { assert.match(commercial, /supportTermMonths/); assert.match(commercial, /SUPPORT_\$\{band\}_\$\{months\}M/); }],
  ["scale pricing is learner-session based", () => { assert.match(commercial, /progressivePerSessionFee/); assert.match(commercial, /\[4, 8\]/); assert.match(commercial, /SCALE_ACTIVE_MONTHS = 9/); }],
  ["8-session plan uses 1.5 frequency factor", () => { assert.match(commercial, /function frequencyFactor/); assert.match(commercial, /=== 8 \? 1\.5 : 1/); assert.match(commercial, /SCALE_BASE_SESSIONS_PER_MONTH = 4/); }],
  ["point vs scale policy is explicit", () => { assert.match(commercial, /01 điểm triển khai/); assert.match(commercial, /Từ 02 điểm trở lên/); assert.match(commercial, /QA\/audit/); }],
  ["scale pricing uses program factors and minimums", () => { assert.match(commercial, /return 0\.7/); assert.match(commercial, /return 1\.2/); assert.match(commercial, /24000000/); assert.match(commercial, /30000000/); }],
  ["scale replaces rights and support", () => { assert.match(commercial, /filter\(\(line\) => !\/\^RIGHT_/); assert.match(commercial, /!\/\^SUPPORT_/); }],
  ["mandatory Sunbot branding exists", () => { assert.match(commercial, /BRAND_DECOR_FORMEX/); assert.match(commercial, /Math\.max\(1/); assert.match(commercial, /Nhận diện Sunbot bắt buộc/); }],
  ["approval UX uses split workspace", () => assert.match(commercial, /approval-workspace/)],
  ["customer-facing commercial notes remain", () => assert.match(customerPolish, /Lưu ý thương mại/)],
  ["no hardcoded frontend catalog prices", () => assert.doesNotMatch(catalog, /price\s*:\s*\d/)],
  ["no credential material or legacy login", () => assert.doesNotMatch(app + auth + catalog + workflow + config + commercial, /PASSWORD_HASH|SHARED_PASSWORD|pinLogin|loginPinByEmail|type=["']email/)],
  ["contract documents backend version", () => assert.match(integration, /2026\.08\.28-v2/)],
  ["all frontend JavaScript parses", () => { [app,auth,catalog,training,workflow,config,commercial,customerPolish].forEach((src) => new vm.Script(src)); }],
];
let failures = 0;
for (const [name, run] of tests) { try { run(); console.log("PASS", name); } catch (error) { failures++; console.error("FAIL", name, error.message); } }
console.log(`\n${tests.length - failures}/${tests.length} frontend checks passed.`);
if (failures) process.exit(1);
