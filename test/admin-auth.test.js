import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { db, initializeDatabase } from "../server/db.js";
import { verifyAdminLogin } from "../server/auth.js";

initializeDatabase();
const originalAdmin = db.prepare("SELECT admin_username, password_hash FROM admin_settings WHERE id = 1").get();

function writeAdmin(username, passwordHash) {
  db.prepare(`
    INSERT INTO admin_settings (id, admin_username, password_hash)
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      admin_username = excluded.admin_username,
      password_hash = excluded.password_hash
  `).run(username, passwordHash);
}

function restoreOriginalAdmin() {
  writeAdmin(originalAdmin.admin_username, originalAdmin.password_hash);
}

test("verifyAdminLogin accepts the configured administrator password", () => {
  const passwordHash = bcrypt.hashSync("secret-password", 10);
  try {
    writeAdmin("owner", passwordHash);

    assert.equal(verifyAdminLogin("owner", "secret-password"), true);
    assert.equal(verifyAdminLogin("owner", "wrong-password"), false);
    assert.equal(verifyAdminLogin("other", "secret-password"), false);
  } finally {
    restoreOriginalAdmin();
  }
});

test("verifyAdminLogin test keeps administrator settings isolated", () => {
  const settings = db.prepare("SELECT admin_username FROM admin_settings WHERE id = 1").get();
  assert.equal(settings.admin_username, originalAdmin.admin_username);
});
