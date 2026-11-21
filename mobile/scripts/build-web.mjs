import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import imageUtils from "@expo/image-utils";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destination = path.join(root, "dist-web");
const exported = spawnSync(
  process.execPath,
  [
    path.join(root, "node_modules/expo/bin/cli"),
    "export",
    "--platform",
    "web",
    "--output-dir",
    destination,
  ],
  {
    cwd: root,
    env: { ...process.env, EXPO_NO_TELEMETRY: "1", EXPO_OFFLINE: "1" },
    stdio: "inherit",
  },
);
if (exported.status !== 0) process.exit(exported.status || 1);
for (const name of ["LICENSE", "BRAND-NOTICE.md", "THIRD_PARTY_NOTICES.txt"]) {
  await fs.copyFile(path.join(root, name), path.join(destination, name));
}
await fs.mkdir(path.join(destination, "icons"), { recursive: true });
for (const size of [192, 512]) {
  const image = await imageUtils.generateImageAsync(
    { projectRoot: root, cacheType: "pwa-icons" },
    {
      src: path.join(root, "assets/app-icon.png"),
      width: size,
      height: size,
      resizeMode: "contain",
      backgroundColor: "#101315",
    },
  );
  await fs.writeFile(
    path.join(destination, `icons/icon-${size}.png`),
    image.source,
  );
}
const manifest = {
  id: "/",
  name: "Drevos Smoker",
  short_name: "Drevos",
  description: "Dein Räucherofen. Zuhause und unterwegs.",
  lang: "de",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#101315",
  theme_color: "#101315",
  icons: [192, 512].map((size) => ({
    src: `/icons/icon-${size}.png`,
    sizes: `${size}x${size}`,
    type: "image/png",
    purpose: "any",
  })),
};
await fs.writeFile(
  path.join(destination, "manifest.webmanifest"),
  JSON.stringify(manifest, null, 2) + "\n",
);
async function files(directory, prefix = "") {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory())
      result.push(...(await files(path.join(directory, entry.name), relative)));
    else if (
      !["_headers", "sw-template.js", "sw.js", "android-update.json"].includes(
        entry.name,
      )
    )
      result.push(relative);
  }
  return result.sort();
}
const assets = await files(destination);
const digest = createHash("sha256");
for (const asset of assets) {
  digest.update(asset);
  digest.update(await fs.readFile(path.join(destination, asset)));
}
const cache = "drevos-shell-" + digest.digest("hex").slice(0, 16);
const template = await fs.readFile(
  path.join(root, "public/sw-template.js"),
  "utf8",
);
await fs.writeFile(
  path.join(destination, "sw.js"),
  template
    .replace("__CACHE_NAME__", JSON.stringify(cache))
    .replace("__ASSETS__", JSON.stringify(assets.map((asset) => "/" + asset))),
);
// This source template is not a runnable public service worker.
await fs.unlink(path.join(destination, "sw-template.js"));
console.log(`Drevos PWA ready: ${assets.length} public assets; ${cache}`);
