import express from "express";
import session from "express-session";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { adminApi } from "./server/admin-api.js";
import { initializeDatabase } from "./server/db.js";
import { publicDir, uploadsDir } from "./server/paths.js";
import { publicApi } from "./server/public-api.js";

initializeDatabase();
mkdirSync(uploadsDir, { recursive: true });

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "1mb" }));
app.use(session({
  name: "rovenox.sid",
  secret: process.env.SESSION_SECRET || "rovenox-local-dev-secret-change-before-deploy",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false
  }
}));

app.get("/api/health", (request, response) => {
  response.json({ ok: true });
});

app.use("/api/public", publicApi);
app.use("/api/admin", adminApi);
app.get("/admin", (request, response) => {
  response.sendFile(path.join(publicDir, "admin", "index.html"));
});
app.use((error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  response.status(error.status || 500).json({ error: error.message || "Server error" });
});
app.use("/uploads", express.static(uploadsDir, { fallthrough: false }));
app.use(express.static(publicDir));

app.listen(port, "127.0.0.1", () => {
  console.log(`RoveNox running at http://127.0.0.1:${port}`);
});
