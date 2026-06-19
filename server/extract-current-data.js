import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { publicDir } from "./paths.js";

export function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90) || "item";
}

export function extractProducts(appSource) {
  const marker = "const products = ";
  const start = appSource.indexOf(marker);
  if (start === -1) throw new Error("Cannot find products array in app.js");

  const arrayStart = appSource.indexOf("[", start + marker.length);
  if (arrayStart === -1) throw new Error("Cannot find products array start in app.js");

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let index = arrayStart; index < appSource.length; index += 1) {
    const char = appSource[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) {
      return vm.runInNewContext(appSource.slice(arrayStart, index + 1));
    }
  }

  throw new Error("Cannot find products array end in app.js");
}

export function extractImageModules(indexSource) {
  const modules = [];
  const brandSection = indexSource.match(/<section class="brand-logo-section"[\s\S]*?<\/section>/);
  const categorySection = indexSource.match(/<section class="image-category-section"[\s\S]*?<\/section>/);

  for (const [moduleType, section] of [
    ["brand_logo", brandSection?.[0] || ""],
    ["image_category", categorySection?.[0] || ""]
  ]) {
    const pattern = /<a[^>]*href="([^"]*)"[^>]*>\s*<img src="([^"]*)" alt="([^"]*)"[^>]*>\s*(?:<span>([^<]*)<\/span>)?/g;
    let match;
    let sortOrder = 0;
    while ((match = pattern.exec(section)) !== null) {
      modules.push({
        moduleType,
        linkUrl: match[1],
        imagePath: match[2],
        title: match[4] || match[3],
        alt: match[3],
        sortOrder
      });
      sortOrder += 1;
    }
  }

  return modules;
}

export async function loadCurrentStorefrontData() {
  const appSource = await readFile(path.join(publicDir, "app.js"), "utf8");
  const indexSource = await readFile(path.join(publicDir, "index.html"), "utf8");

  return {
    products: extractProducts(appSource),
    homeModules: extractImageModules(indexSource)
  };
}
