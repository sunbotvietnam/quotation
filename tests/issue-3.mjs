import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(path, "utf8");
const app = read("v3/app.js"),
  auth = read("v3/auth.js"),
  catalog = read("v3/catalog.js"),
  training = read("v3/training-addons.js"),
  workflow = read("v3/quote-workflow.js"),
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
  ["no hardcoded frontend prices", () => assert.doesNotMatch(catalog, /price\s*:\s*\d/)],
  [
    "no credential material or legacy login dependency",
    () => assert.doesNotMatch(app + auth + catalog + workflow, /PASSWORD_HASH|SHARED_PASSWORD|pinLogin|loginPinByEmail|type=["']email/),
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
