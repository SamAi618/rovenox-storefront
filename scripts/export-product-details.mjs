import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const projectRoot = path.resolve(import.meta.dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const outputRoot = path.join(projectRoot, "output", "rovenox-product-details");

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90) || "item";
}

function extractProducts(appSource) {
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
      const arrayLiteral = appSource.slice(arrayStart, index + 1);
      return vm.runInNewContext(arrayLiteral);
    }
  }

  throw new Error("Cannot find products array end in app.js");
}

function manifestCategory(manifestPath) {
  if (manifestPath.includes("watches")) return "watches";
  return "shoes";
}

async function copyImage(sourceRelativePath, destinationDirectory, prefix) {
  if (!sourceRelativePath) return null;

  const sourcePath = path.join(publicRoot, sourceRelativePath);
  const extension = path.extname(sourceRelativePath);
  const fileName = `${prefix}${extension}`;
  const destinationPath = path.join(destinationDirectory, fileName);

  await copyFile(sourcePath, destinationPath);
  return path.relative(outputRoot, destinationPath);
}

async function writeJson(filePath, value) {
  await writeFile(`${filePath}.json`, `${JSON.stringify(value, null, 2)}\n`);
}

function categoryCounts(items) {
  return items.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});
}

async function exportSiteProducts(products, manifestItems) {
  const manifestByFile = new Map(manifestItems.map((item) => [item.file, item]));
  const records = [];

  for (const product of products) {
    const directory = path.join(
      outputRoot,
      "site-products",
      product.category,
      `${product.id}-${slugify(product.name)}`
    );
    await mkdir(directory, { recursive: true });

    const manifestItem = product.image ? manifestByFile.get(product.image) : null;
    const image = await copyImage(product.image, directory, "image");
    const record = {
      id: product.id,
      title: product.name,
      category: product.category,
      price: product.price,
      badge: product.badge,
      description: product.description,
      colors: product.colors,
      sizes: product.sizes,
      detailType: "modal",
      detailSelector: `[data-view="${product.id}"]`,
      image,
      originalImagePath: product.image || null,
      originalAssetTitle: manifestItem?.name || null,
      originalSourceUrl: manifestItem?.source || null
    };

    await writeJson(path.join(directory, "info"), record);
    records.push(record);
  }

  await writeJson(path.join(outputRoot, "site-products"), records);
  return records;
}

async function exportManifestCatalog(manifestItems) {
  const records = [];

  for (const item of manifestItems) {
    const directory = path.join(
      outputRoot,
      "source-catalog",
      item.category,
      `${item.id}-${slugify(item.name)}`
    );
    await mkdir(directory, { recursive: true });

    const image = await copyImage(item.file, directory, "image");
    const record = {
      id: item.id,
      title: item.name,
      category: item.category,
      brand: item.brand || null,
      image,
      originalImagePath: item.file,
      originalSourceUrl: item.source || null
    };

    await writeJson(path.join(directory, "info"), record);
    records.push(record);
  }

  await writeJson(path.join(outputRoot, "source-catalog"), records);
  return records;
}

async function main() {
  const appSource = await readFile(path.join(publicRoot, "app.js"), "utf8");
  const products = extractProducts(appSource);

  const manifestPaths = [
    path.join(publicRoot, "images", "annekali", "watches-manifest.json"),
    path.join(publicRoot, "images", "annekali", "products-manifest.json")
  ];
  const manifestItems = [];

  for (const manifestPath of manifestPaths) {
    const items = JSON.parse(await readFile(manifestPath, "utf8"));
    const category = manifestCategory(manifestPath);
    manifestItems.push(...items.map((item) => ({ ...item, category })));
  }

  await mkdir(outputRoot, { recursive: true });
  const siteProducts = await exportSiteProducts(products, manifestItems);
  const sourceCatalog = await exportManifestCatalog(manifestItems);

  const summary = {
    generatedAt: new Date().toISOString(),
    outputRoot: path.relative(projectRoot, outputRoot),
    siteProductCount: siteProducts.length,
    siteProductsWithImages: siteProducts.filter((item) => item.image).length,
    sourceCatalogCount: sourceCatalog.length,
    categories: {
      siteProducts: categoryCounts(siteProducts),
      sourceCatalog: categoryCounts(sourceCatalog)
    }
  };

  await writeJson(path.join(outputRoot, "summary"), summary);
  console.log(JSON.stringify({
    outputRoot,
    siteProductCount: summary.siteProductCount,
    siteProductsWithImages: summary.siteProductsWithImages,
    sourceCatalogCount: summary.sourceCatalogCount
  }, null, 2));
}

await main();
