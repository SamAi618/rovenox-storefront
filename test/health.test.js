import test from "node:test";
import assert from "node:assert/strict";
import { databasePath, publicDir, uploadsDir } from "../server/paths.js";

test("project paths point to expected runtime locations", () => {
  assert.match(databasePath, /data\/rovenox\.db$/);
  assert.match(publicDir, /public$/);
  assert.match(uploadsDir, /uploads$/);
});
