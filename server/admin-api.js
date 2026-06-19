import { Router } from "express";
import { requireAdmin, verifyAdminLogin } from "./auth.js";

export const adminApi = Router();

adminApi.post("/login", (request, response) => {
  const { username, password } = request.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    response.status(400).json({ error: "Username and password are required" });
    return;
  }
  if (!verifyAdminLogin(username, password)) {
    response.status(401).json({ error: "Invalid username or password" });
    return;
  }
  request.session.admin = { username };
  response.json({ ok: true, username });
});

adminApi.post("/logout", requireAdmin, (request, response) => {
  request.session.destroy(() => {
    response.json({ ok: true });
  });
});

adminApi.get("/session", (request, response) => {
  response.json({
    authenticated: Boolean(request.session?.admin),
    username: request.session?.admin?.username || null
  });
});
