import bcrypt from "bcryptjs";
import { db } from "./db.js";

export function requireAdmin(request, response, next) {
  if (!request.session?.admin) {
    response.status(401).json({ error: "Admin login required" });
    return;
  }
  next();
}

export function verifyAdminLogin(username, password) {
  const settings = db.prepare("SELECT admin_username, password_hash FROM admin_settings WHERE id = 1").get();
  if (!settings) return false;
  if (username !== settings.admin_username) return false;
  return bcrypt.compareSync(password, settings.password_hash);
}
