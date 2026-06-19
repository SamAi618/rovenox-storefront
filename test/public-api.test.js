import test from "node:test";
import assert from "node:assert/strict";
import { productRowToJson } from "../server/public-api.js";

test("productRowToJson maps database rows to storefront product shape", () => {
  const product = productRowToJson({
    slug: "rn-watch-01",
    name: "Aster Field Chrono Watch",
    category: "watches",
    price: 245,
    description: "Clean watch",
    colors_json: "[\"Steel\",\"Black\"]",
    sizes_json: "[\"40mm\",\"42mm\"]",
    badge: "Time",
    tone: "tone-silver",
    image_url: "/images/annekali/watches/watch.webp"
  });

  assert.deepEqual(product, {
    id: "rn-watch-01",
    name: "Aster Field Chrono Watch",
    category: "watches",
    price: 245,
    description: "Clean watch",
    colors: ["Steel", "Black"],
    sizes: ["40mm", "42mm"],
    badge: "Time",
    tone: "tone-silver",
    image: "images/annekali/watches/watch.webp"
  });
});
