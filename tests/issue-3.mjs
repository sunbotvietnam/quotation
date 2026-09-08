import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(path, "utf8");
const files = {
  app: read("v3/quotation-app.js"),
  css: read("v3/quotation.css"),
  index: read("v3/index.html"),
};

const tests = [
  ["production loads refined quotation application", () => {
    assert.match(files.index, /quotation-app\.js/);
    assert.match(files.index, /quotation\.css/);
    assert.doesNotMatch(files.index, /northstar|approval-workflow|commercial-configurator|legacy-builder/i);
  }],
  ["visible UI does not brand the product as North Star", () => {
    assert.doesNotMatch(files.app, /North Star/i);
    assert.doesNotMatch(files.index, /North Star/i);
  }],
  ["ID/password login remains server-authenticated", () => {
    assert.match(files.app, /quotationAccess/);
    assert.match(files.app, /login_id:id,password/);
  }],
  ["Sale submits quote requests and does not build prices", () => {
    assert.match(files.app, /submitQuoteRequest/);
    assert.match(files.app, /Gửi Admin lập báo giá/);
  }],
  ["Admin creates and approves commercial quotes", () => {
    assert.match(files.app, /createCommercialQuote/);
    assert.match(files.app, /approveQuote/);
    assert.match(files.app, /Phát hành báo giá/);
  }],
  ["pricing and catalog come from backend", () => {
    assert.match(files.app, /pricingPolicy/);
    assert.match(files.app, /bridge\("quotationShared","catalog"/);
  }],
  ["interaction feedback shows elapsed waiting time", () => {
    assert.match(files.app, /Đã chờ/);
    assert.match(files.app, /setInterval\(tick,1000\)/);
  }],
  ["standard Sunbot logo is used", () => assert.match(files.app, /logo-sunbot\.png/)],
  ["customer quote keeps courtesy VAT payment and validity", () => {
    for (const t of ["Kính gửi","Lưu ý thương mại","VAT","Thanh toán","Hiệu lực"]) assert.match(files.app, new RegExp(t));
  }],
  ["Drive documents are first-class outputs", () => {
    assert.match(files.app, /getCommercialDocumentLinks/);
    assert.match(files.app, /Tài liệu Google Drive/);
    assert.match(files.app, /Thuyết minh/);
    assert.match(files.app, /Đề xuất giải pháp/);
  }],
  ["retail repair uses searchable catalog and no narrative", () => {
    assert.match(files.app, /Bán lẻ & sửa chữa/);
    assert.match(files.app, /catalog-query/);
    assert.match(files.app, /RETAIL_REPAIR/);
  }],
  ["solution template keeps hardware and training suggestions", () => {
    for (const id of ["ROBOT","MAP","OBSTACLE","CARDS","BOX","TRAIN_1","RETRAIN_1"]) assert.match(files.app, new RegExp(id));
  }],
  ["STEAM kit rule is explicit for Sunbot-provided equipment", () => {
    assert.match(files.app, /Bộ học cụ STEAM/);
    assert.match(files.app, /không bao gồm/);
  }],
  ["print CSS has dedicated A4 safe path without visibility hiding", () => {
    assert.match(files.css, /@media print/);
    assert.match(files.css, /@page\{size:A4/);
    assert.doesNotMatch(files.css, /visibility\s*:\s*hidden/);
  }],
  ["all production JavaScript parses", () => new vm.Script(files.app,{filename:"quotation-app.js"})],
];

let failures = 0;
for (const [name, run] of tests) {
  try { run(); console.log("PASS", name); }
  catch (error) { failures++; console.error("FAIL", name, error.message); }
}
console.log(`\n${tests.length - failures}/${tests.length} refined quotation checks passed.`);
if (failures) process.exit(1);
