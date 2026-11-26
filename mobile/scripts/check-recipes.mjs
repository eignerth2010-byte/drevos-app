import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeCatalog, MAX_CATALOG_CHARS } from "../src/catalogClient.js";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/recipes",
);
const text = await fs.readFile(path.join(root, "catalog.json"), "utf8");
if (text.length > MAX_CATALOG_CHARS) throw Error("Catalog too large");
const catalog = normalizeCatalog(JSON.parse(text));
for (const recipe of catalog.recipes) {
  const file = await fs.readFile(
    path.join(root, "images", recipe.image + ".jpg"),
  );
  if (file.length > 8 * 1024 * 1024 || file[0] !== 0xff || file[1] !== 0xd8)
    throw Error("Invalid or oversized JPEG: " + recipe.image);
}
console.log(
  `${catalog.recipes.length} valid recipes; catalog ${catalog.revision}; all product JPEGs present.`,
);
