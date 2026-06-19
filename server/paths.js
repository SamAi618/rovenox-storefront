import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const publicDir = path.join(projectRoot, "public");
export const uploadsDir = path.join(projectRoot, "uploads");
export const dataDir = path.join(projectRoot, "data");
export const databasePath = path.join(dataDir, "rovenox.db");
