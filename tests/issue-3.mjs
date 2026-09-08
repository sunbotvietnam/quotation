import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(path, "utf8");
const files = {
  app: read("v3/northstar-app.js"),
  css: read("v3/northstar.css"),
  index: read("v3/index.html"),
};

const tests = [
  ["production loads only the clean North Star application", () => {
    assert.match(files.index, /northstar-app\.js/);
    assert.match(files.index, /northstar\.css/);
    assert.doesNotMatch(files.index, /app\.js|approval-workflow|commercial-configurator|legacy-builder|print-stable-fix/);
  }],
  ["ID/password login remains server-authenticated", () => {
    assert.match(files.app, /quotationAccess/);
    assert.match(files.app, /login_id:id,password/);
  }],
  ["Sale submits quote requests instead of building prices", () => {
    assert.match(files.app, /submitQuoteRequest/);
    assert.match(files.app, /Gửi Admin lập báo giá/);
    assert.doesNotMatch(files.app, /desired_status/);
  }],
  ["Admin creates North Star quotes from requests", () => {
    assert.match(files.app, /createNorthStarQuote/);
    assert.match(files.app, /Lưu & phát hành báo giá/);
    assert.match(files.app, /approveQuote/);
  }],
  ["North Star pricing comes from backend", () => {
    assert.match(files.app, /northstarPricing/);
    assert.match(files.app, /bridge\("quotationShared","catalog"/);
  }],
  ["customer quote has no automatic configuration narrative", () => {
    assert.doesNotMatch(files.index, /configuration-description\.js/);
    assert.match(files.app, /Tạo thuyết minh/);
  }],
  ["retail and repair remain available without narrative", () => {
    assert.match(files.app, /Bán lẻ & sửa chữa/);
    assert.match(files.app, /RETAIL_REPAIR/);
  }],
  ["print uses the quote code and customer for the default document title", () => {
    assert.match(files.app, /document\.title=\(quoteCode\(q\)/);
    assert.match(files.app, /slug\(q\.client_name/);
    assert.match(files.app, /window\.print\(\)/);
  }],
  ["print CSS has a dedicated A4-safe path without global visibility hiding", () => {
    assert.match(files.css, /@media print/);
    assert.match(files.css, /@page\{size:A4/);
    assert.doesNotMatch(files.css, /visibility\s*:\s*hidden/);
  }],
  ["Sale request captures the essential school context", () => {
    for (const name of ["school_name","learner_count","existing_sunbot","asset_option","teacher_status","expected_start","decision_maker","sales_proposal"]) assert.match(files.app, new RegExp(name));
  }],
  ["Admin builder keeps discount and CEO exception fields", () => {
    assert.match(files.app, /discount_pct/);
    assert.match(files.app, /ceo_approval_note/);
  }],
  ["one-subject hardware set remains configurable", () => {
    for (const id of ["ROBOT","MAP","OBSTACLE","CARDS","BOX","TRAIN_1","RETRAIN_1"]) assert.match(files.app, new RegExp(id));
  }],
  ["all production JavaScript parses", () => new vm.Script(files.app,{filename:"northstar-app.js"})],
];

let failures = 0;
for (const [name, run] of tests) {
  try { run(); console.log("PASS", name); }
  catch (error) { failures++; console.error("FAIL", name, error.message); }
}
console.log(`\n${tests.length - failures}/${tests.length} North Star frontend checks passed.`);
if (failures) process.exit(1);
