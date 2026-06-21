import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { publicDir } from "./paths.js";

const defaultBrandModules = [
  ["Louis Vuitton", "images/annekali/brands/louis-vuitton.png"],
  ["Chanel", "images/annekali/brands/chanel.png"],
  ["Gucci", "images/annekali/brands/gucci.png"],
  ["Dior", "images/annekali/brands/dior.png"],
  ["Hermes", "images/annekali/brands/hermes.png"],
  ["Yves Saint Laurent", "images/annekali/brands/ysl.png"],
  ["Celine", "images/annekali/brands/celine.png"],
  ["Fendi", "images/annekali/brands/fendi.png"],
  ["Burberry", "images/annekali/brands/burberry.png"],
  ["Prada", "images/annekali/brands/prada.png"],
  ["Bottega Veneta", "images/annekali/brands/bottega-veneta.png"],
  ["Givenchy", "images/annekali/brands/givenchy.png"],
  ["Balenciaga", "images/annekali/brands/balenciaga.png"],
  ["Miu Miu", "images/annekali/brands/miu-miu.png"],
  ["Loewe", "images/annekali/brands/loewe.png"]
];

const defaultCategoryModules = [
  ["ROLEX", "images/annekali/watches/rolex-1051164-rolex-datejust-m126334-0022.webp", "Rolex watches"],
  ["Audemars Piguet", "images/annekali/watches/audemars-1051447-audemars-piguet-royal-oak-chronograph-26331s.webp", "Audemars Piguet watches"],
  ["Cartier", "images/annekali/watches/cartier-1051020-ballon-bleu-de-cartier-wjbb0042.webp", "Cartier watches"],
  ["ROLEX DAYTONA", "images/annekali/watches/rolex-1051143-rolex-cosmograph-daytona-m116519ln-0038.webp", "Rolex Daytona watches"],
  ["Patek Philippe", "images/annekali/watches/patek-1051397-5711-1r-001-patek-philippe-nautilus.webp", "Patek Philippe watches"],
  ["IWC", "images/annekali/watches/iwc-1051050-iwc-pilot-series-iw327006-watch.webp", "IWC watches"],
  ["Tag Heuer", "images/annekali/watches/tag-heuer-1051372-tag-heuer-carrera-automatic-chronograph-diam.webp", "Tag Heuer watches"],
  ["PATEK PHILIPPE", "images/annekali/watches/patek-1051399-5164a-patek-philippe-aquanaut.webp", "Patek Philippe Nautilus watches"]
];

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
  const declaration = /\b(?:const|let)\s+products\s*=\s*/.exec(appSource);
  if (!declaration) throw new Error("Cannot find products array in app.js");

  const arrayStart = appSource.indexOf("[", declaration.index + declaration[0].length);
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

  if (modules.length > 0) return modules;

  return [
    ...defaultBrandModules.map(([title, imagePath], sortOrder) => ({
      moduleType: "brand_logo",
      linkUrl: "#related",
      imagePath,
      title,
      alt: title,
      sortOrder
    })),
    ...defaultCategoryModules.map(([title, imagePath, alt], sortOrder) => ({
      moduleType: "image_category",
      linkUrl: "#related",
      imagePath,
      title,
      alt,
      sortOrder
    }))
  ];
}

export async function loadCurrentStorefrontData() {
  const appSource = await readFile(path.join(publicDir, "app.js"), "utf8");
  const indexSource = await readFile(path.join(publicDir, "index.html"), "utf8");

  return {
    products: extractProducts(appSource),
    homeModules: extractImageModules(indexSource)
  };
}
