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
  adminApproval: read("v3/admin-approval-hotfix.js"),
  retail: read("v3/retail-repair.js"),
  retailRefinement: read("v3/retail-approval-refinement.js"),
  output: read("v3/document-output.js"),
  customerPolish: read("v3/quote-customer-polish.js"),
  index: read("v3/index.html"),
};

const tests = [
  ["ID/password login stays server-authenticated", () => assert.match(files.auth, /login_id: loginId/)],
  ["backend catalog remains authoritative", () => assert.match(files.app, /applyBackendCatalog/)],
  ["all quotes still require approval", () => assert.match(files.app, /desired_status: "NEEDS_APPROVAL"/)],
  ["V4 is loaded in production", () => assert.match(files.index, /approval-workflow-v4\.js/)],
  ["final Admin editor is loaded after V4", () => { assert.match(files.index, /admin-approval-hotfix\.js/); assert.ok(files.index.indexOf("admin-approval-hotfix.js") > files.index.indexOf("approval-workflow-v4.js")); }],
  ["retail refinement is the final workflow layer", () => { assert.match(files.index, /retail-approval-refinement\.js/); assert.ok(files.index.indexOf("retail-approval-refinement.js") > files.index.indexOf("admin-approval-hotfix.js")); }],
  ["legacy price-only Admin editor is not loaded", () => assert.doesNotMatch(files.index, /admin-approval-editor\.js/)],
  ["obsolete approval renderer removed from quote-workflow shim", () => { assert.doesNotMatch(files.workflow, /renderApprovals\s*=/); assert.doesNotMatch(files.workflow, /approveQuote|rejectQuote/); }],
  ["V4 review is configuration-first", () => { assert.match(files.approvalV4, /Rà soát & chốt cấu hình/); assert.match(files.approvalV4, /Sửa cấu hình & duyệt/); }],
  ["Admin can edit deployment scope", () => { for (const id of ["v4-sites","v4-students","v4-model","v4-program","v4-term","v4-sessions","v4-support-term"]) assert.match(files.approvalV4, new RegExp(id)); }],
  ["Admin final editor can edit customer qty price and narrative", () => { for (const id of ["approval-edit-client","approval-edit-qty","approval-edit-price","approval-edit-narrative"]) assert.match(files.adminApproval, new RegExp(id)); }],
  ["Admin can save revision or save-and-approve", () => { assert.match(files.adminApproval, /approval-admin-save/); assert.match(files.adminApproval, /approval-admin-save-approve/); assert.match(files.adminApproval, /adminReviseQuote/); }],
  ["request changes is explicit and coaching feedback is required", () => { assert.match(files.adminApproval, /approval-edit-feedback/); assert.match(files.adminApproval, /requestChanges/); assert.match(files.adminApproval, /rút kinh nghiệm/); }],
  ["Sales sees full change request", () => { assert.match(files.approvalV4, /Yêu cầu chỉnh sửa từ Admin/); assert.match(files.approvalV4, /change_request/); }],
  ["Sales can resume a returned solution quote", () => { assert.match(files.approvalV4, /Sửa theo yêu cầu/); assert.match(files.approvalV4, /loadIntoBuilder/); }],
  ["Sales can resume a returned retail repair quote", () => { assert.match(files.retailRefinement, /RETAIL_REPAIR/); assert.match(files.retailRefinement, /Sửa theo yêu cầu/); assert.match(files.retailRefinement, /quoteId/); assert.match(files.retailRefinement, /change_request/); }],
  ["retail repair hides solution narrative", () => { assert.match(files.retailRefinement, /không cần thuyết minh giải pháp/i); assert.match(files.retailRefinement, /customer-proposal-narrative/); assert.match(files.retailRefinement, /approval-edit-narrative/); }],
  ["Admin diff is displayed back to Sales", () => { assert.match(files.approvalV4, /admin_diff_json/); assert.match(files.approvalV4, /Admin đã hiệu chỉnh cấu hình/); }],
  ["approved output remains PDF only", () => { assert.match(files.output, /In \/ Lưu PDF A4/); assert.doesNotMatch(files.output, /application\/msword|Tải Word|WordSection1|link\.download/); }],
  ["approved snapshot is verified before output", () => assert.match(files.output, /exportQuote/)],
  ["scale 8-session factor stays 1.5", () => assert.match(files.scale, /Number\(sessions\) === 8 \? 1\.5 : 1/)],
  ["scale has explicit 4/8 comparison", () => { assert.match(files.scale, /scale_4_amount/); assert.match(files.scale, /scale_8_amount/); }],
  ["point vs scale policy persists", () => { assert.match(files.policy, /recommended_model/); assert.match(files.policy, /policy_match/); }],
  ["training add-ons remain available", () => { assert.match(files.training, /TRAIN1_EXTRA10/); assert.match(files.training, /RETRAIN2_EXTRA10/); }],
  ["employee preview still blocks writes", () => { assert.match(files.adminView, /saveSnapshot/); assert.match(files.adminView, /approveQuote/); }],
  ["customer solution output still has three document modes", () => { assert.match(files.output, /Báo giá/); assert.match(files.output, /Đề xuất/); assert.match(files.output, /Thuyết minh/); }],
  ["no hardcoded product prices in catalog", () => assert.doesNotMatch(files.catalog, /price\s*:\s*\d/)],
  ["all production JavaScript parses", () => Object.entries(files).filter(([name]) => name !== "index").forEach(([name,src]) => { if (name !== "catalog" || src.trim()) new vm.Script(src,{filename:name}); })],
];

let failures = 0;
for (const [name, run] of tests) {
  try { run(); console.log("PASS", name); }
  catch (error) { failures++; console.error("FAIL", name, error.message); }
}
console.log(`\n${tests.length - failures}/${tests.length} frontend checks passed.`);
if (failures) process.exit(1);
