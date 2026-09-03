import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(path, "utf8");
const files = {
  app: read("v3/app.js"),
  auth: read("v3/auth.js"),
  catalog: read("v3/catalog.js"),
  training: read("v3/training-addons.js"),
  workflow: read("v3/quote-workflow.js"),
  config: read("v3/configuration-description.js"),
  commercial: read("v3/commercial-configurator.js"),
  policy: read("v3/commercial-policy-workflow.js"),
  scale: read("v3/scale-pricing-integrity.js"),
  adminView: read("v3/admin-view-mode.js"),
  approvalV4: read("v3/approval-workflow-v4.js"),
  output: read("v3/document-output.js"),
  customerPolish: read("v3/quote-customer-polish.js"),
  index: read("v3/index.html"),
};

const tests = [
  ["ID/password login stays server-authenticated", () => assert.match(files.auth, /login_id: loginId/)],
  ["backend catalog remains authoritative", () => assert.match(files.app, /applyBackendCatalog/)],
  ["all quotes still require approval", () => assert.match(files.app, /desired_status: "NEEDS_APPROVAL"/)],
  ["V4 is loaded in production", () => assert.match(files.index, /approval-workflow-v4\.js/)],
  ["legacy price-only Admin editor is not loaded", () => assert.doesNotMatch(files.index, /admin-approval-editor\.js/)],
  ["V4 review is configuration-first", () => { assert.match(files.approvalV4, /Rà soát & chốt cấu hình/); assert.match(files.approvalV4, /Sửa cấu hình & duyệt/); }],
  ["Admin can edit deployment scope", () => { for (const id of ["v4-sites","v4-students","v4-model","v4-program","v4-term","v4-sessions","v4-support-term"]) assert.match(files.approvalV4, new RegExp(id)); }],
  ["Admin can add remove and change quantities", () => { assert.match(files.approvalV4, /v4-add-line-btn/); assert.match(files.approvalV4, /data-v4-remove/); assert.match(files.approvalV4, /data-v4-qty/); }],
  ["Admin can edit or regenerate narrative", () => { assert.match(files.approvalV4, /v4-narrative/); assert.match(files.approvalV4, /Tạo lại theo cấu hình hiện tại/); }],
  ["V4 does not expose discount preset buttons", () => { assert.doesNotMatch(files.approvalV4, /−3%|−7%|data-price-preset|admin-price-input/); }],
  ["request changes is explicit", () => { assert.match(files.approvalV4, /requestChanges/); assert.match(files.approvalV4, /Yêu cầu chỉnh sửa gửi cho người lập/); }],
  ["Sales sees full change request", () => { assert.match(files.approvalV4, /Yêu cầu chỉnh sửa từ Admin/); assert.match(files.approvalV4, /change_request/); }],
  ["Sales can resume a returned quote", () => { assert.match(files.approvalV4, /Sửa theo yêu cầu/); assert.match(files.approvalV4, /loadIntoBuilder/); }],
  ["Admin direct revision creates a new version via backend", () => assert.match(files.approvalV4, /adminReviseQuote/)],
  ["Admin diff is displayed back to Sales", () => { assert.match(files.approvalV4, /admin_diff_json/); assert.match(files.approvalV4, /Admin đã hiệu chỉnh cấu hình/); }],
  ["approved output remains PDF only", () => { assert.match(files.output, /In \/ Lưu PDF A4/); assert.doesNotMatch(files.output, /application\/msword|Tải Word|WordSection1|link\.download/); }],
  ["approved snapshot is verified before output", () => assert.match(files.output, /exportQuote/)],
  ["scale 8-session factor stays 1.5", () => assert.match(files.scale, /Number\(sessions\) === 8 \? 1\.5 : 1/)],
  ["scale has explicit 4/8 comparison", () => { assert.match(files.scale, /scale_4_amount/); assert.match(files.scale, /scale_8_amount/); }],
  ["point vs scale policy persists", () => { assert.match(files.policy, /recommended_model/); assert.match(files.policy, /policy_match/); }],
  ["training add-ons remain available", () => { assert.match(files.training, /TRAIN1_EXTRA10/); assert.match(files.training, /RETRAIN2_EXTRA10/); }],
  ["employee preview still blocks writes", () => { assert.match(files.adminView, /saveSnapshot/); assert.match(files.adminView, /approveQuote/); }],
  ["customer output still has three document modes", () => { assert.match(files.output, /Báo giá/); assert.match(files.output, /Đề xuất/); assert.match(files.output, /Thuyết minh/); }],
  ["no hardcoded product prices in catalog", () => assert.doesNotMatch(files.catalog, /price\s*:\s*\d/)],
  ["all production JavaScript parses", () => Object.entries(files).filter(([name]) => !["index"].includes(name)).forEach(([name,src]) => { if (name !== "catalog" || src.trim()) new vm.Script(src,{filename:name}); })],
];

let failures = 0;
for (const [name, run] of tests) {
  try { run(); console.log("PASS", name); }
  catch (error) { failures++; console.error("FAIL", name, error.message); }
}
console.log(`\n${tests.length - failures}/${tests.length} frontend checks passed.`);
if (failures) process.exit(1);
