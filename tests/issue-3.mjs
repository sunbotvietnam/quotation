import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(path, "utf8");
const app = read("v3/app.js"),
  auth = read("v3/auth.js"),
  catalog = read("v3/catalog.js"),
  integration = read("v3/SERVER-INTEGRATION.md");
const tests = [
  [
    "ID and password login payload",
    () => assert.match(auth, /login_id: loginId/),
  ],
  [
    "server identity drives regional creator",
    () => assert.match(auth, /state\.user/),
  ],
  ["admin approval view exists", () => assert.match(app, /Duyệt báo giá/)],
  ["approveQuote is wired", () => assert.match(app, /"approveQuote"/)],
  ["rejectQuote is wired", () => assert.match(app, /"rejectQuote"/)],
  [
    "export requires backend exportQuote",
    () => assert.match(app, /"exportQuote"/),
  ],
  [
    "save asks for NEEDS_APPROVAL",
    () => assert.match(app, /desired_status: "NEEDS_APPROVAL"/),
  ],
  [
    "revision sends quote id",
    () => assert.match(app, /quote_id: state\.quoteId/),
  ],
  [
    "no hardcoded frontend prices",
    () => assert.doesNotMatch(catalog, /price\s*:\s*\d/),
  ],
  [
    "no credential material or legacy login dependency",
    () =>
      assert.doesNotMatch(
        app + auth + catalog,
        /PASSWORD_HASH|SHARED_PASSWORD|pinLogin|loginPinByEmail|type=["']email/,
      ),
  ],
  [
    "contract documents backend version",
    () => assert.match(integration, /2026\.08\.28-v2/),
  ],
  [
    "all frontend JavaScript parses",
    () => {
      new vm.Script(app);
      new vm.Script(auth);
      new vm.Script(catalog);
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
console.log(
  `\n${tests.length - failures}/${tests.length} frontend checks passed.`,
);
if (failures) process.exit(1);
