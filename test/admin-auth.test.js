import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { db, initializeDatabase } from "../server/db.js";
import { verifyAdminLogin } from "../server/auth.js";

test("verifyAdminLogin accepts the configured administrator password", () => {
  initializeDatabase();
  const passwordHash = bcrypt.hashSync("secret-password", 10);
  db.prepare(`
    INSERT INTO admin_settings (id, admin_username, password_hash)
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      admin_username = excluded.admin_username,
      password_hash = excluded.password_hash
  `).run("owner", passwordHash);

  assert.equal(verifyAdminLogin("owner", "secret-password"), true);
  assert.equal(verifyAdminLogin("owner", "wrong-password"), false);
  assert.equal(verifyAdminLogin("other", "secret-password"), false);
});
