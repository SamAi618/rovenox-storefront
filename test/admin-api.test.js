import test from "node:test";
import assert from "node:assert/strict";
import { isDuplicateProductSlugError } from "../server/admin-api.js";

test("duplicate product slug database errors are recognized", () => {
  assert.equal(isDuplicateProductSlugError({
    code: "SQLITE_CONSTRAINT_UNIQUE",
    message: "UNIQUE constraint failed: products.slug"
  }), true);
  assert.equal(isDuplicateProductSlugError({
    code: "SQLITE_CONSTRAINT_UNIQUE",
    message: "UNIQUE constraint failed: media_assets.url"
  }), false);
});
