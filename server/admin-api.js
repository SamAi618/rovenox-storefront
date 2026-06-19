import { Router } from "express";
import { requireAdmin, verifyAdminLogin } from "./auth.js";
import { db } from "./db.js";
import { createMediaRecord, deleteMediaAsset, uploadImage } from "./media.js";

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

adminApi.get("/media", requireAdmin, (request, response) => {
  const media = db.prepare("SELECT * FROM media_assets ORDER BY created_at DESC, id DESC").all();
  response.json({ media });
});

adminApi.post("/media", requireAdmin, uploadImage.single("image"), (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: "Image file is required" });
    return;
  }
  response.status(201).json({ media: createMediaRecord(request.file) });
});

adminApi.delete("/media/:id", requireAdmin, async (request, response, next) => {
  try {
    await deleteMediaAsset(Number(request.params.id));
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
