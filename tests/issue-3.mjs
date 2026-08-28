import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(path, "utf8");
const app = read("v3/app.js"),
  auth = read("v3/auth.js"),
  catalog = read("v3/catalog.js"),
  training = read("v3/training-addons.js"),
  workflow = read("v3/quote-workflow.js"),
  config = read("v3/configuration-description.js"),
  commercial = read("v3/commercial-configurator.js"),
  customerPolish = read("v3/quote-customer-polish.js"),
  integration = read("v3/SERVER-INTEGRATION.md");
const tests = [
  ["ID and password login payload", () => assert.match(auth, /login_id: loginId/)],
  ["server identity drives creator", () => assert.match(auth, /state\.user/)],
  ["creator display has no region", () => assert.doesNotMatch(auth, /Hà Nội|Đông Bắc|Bắc Trung Bộ/)],
  ["admin review loads full quote", () => assert.match(workflow, /"getQuote"/)],
  ["personal quote library exists", () => assert.match(workflow, /Báo giá của tôi/)],
  ["approveQuote is wired", () => assert.match(workflow, /"approveQuote"/)],
  ["rejectQuote is wired", () => assert.match(workflow, /"rejectQuote"/)],
  ["approved quote export is wired", () => assert.match(workflow, /"exportQuote"/)],
  ["save asks for NEEDS_APPROVAL", () => assert.match(app, /desired_status: "NEEDS_APPROVAL"/)],
  ["revision sends quote id", () => assert.match(app, /quote_id: state\.quoteId/)],
  ["training add-ons are selectable", () => assert.match(training, /TRAIN1_EXTRA10/) && assert.match(training, /RETRAIN2_EXTRA10/)],
  ["configuration narrative has six explanatory sections", () => {
    for (let i = 1; i <= 6; i++) assert.match(config, new RegExp(`## ${i}\\.`));
  }],
  ["configuration narrative is persisted with quote", () => assert.match(config, /configuration_description/)],
  ["customer proposal separates narrative and pricing pages", () => {
    assert.match(config, /customer-proposal-narrative/);
    assert.match(config, /customer-proposal-price/);
    assert.match(config, /page-break-after:always/);
  }],
  ["monthly rights terms include 12 36 60", () => {
    assert.match(commercial, /\[12,36,60\]/);
    assert.match(commercial, /RIGHT_CORE_12M/);
  }],
  ["support is quoted by month quantity", () => {
    assert.match(commercial, /supportMonths/);
    assert.match(commercial, /qty: Number\(state\.supportMonths\)/);
  }],
  ["Flex model is visible but locked pending official rate", () => {
    assert.match(commercial, /Theo số trẻ · Flex/);
    assert.match(commercial, /Chờ khóa đơn giá chính thức/);
  }],
  ["approval UX uses split workspace", () => assert.match(commercial, /approval-workspace/)],
  ["customer-facing commercial notes remain present", () => assert.match(customerPolish, /Lưu ý thương mại/)],
  ["no hardcoded frontend product prices", () => assert.doesNotMatch(catalog, /price\s*:\s*\d/)],
  [
    "no credential material or legacy login dependency",
    () => assert.doesNotMatch(app + auth + catalog + workflow + config + commercial, /PASSWORD_HASH|SHARED_PASSWORD|pinLogin|loginPinByEmail|type=["']email/),
  ],
  ["contract documents backend version", () => assert.match(integration, /2026\.08\.28-v2/)],
  [
    "all frontend JavaScript parses",
    () => {
      new vm.Script(app);
      new vm.Script(auth);
      new vm.Script(catalog);
      new vm.Script(training);
      new vm.Script(workflow);
      new vm.Script(config);
      new vm.Script(commercial);
      new vm.Script(customerPolish);
    },
  ],
];

let failures = 0;
for (const [name, run] of tests) {
  try {
    run();
    console.log("PASS", name);
  } catch (error) {
    failures++;
    console.error("FAIL", name, error.message);
  }
}
console.log(`\n${tests.length - failures}/${tests.length} frontend checks passed.`);
if (failures) process.exit(1);
