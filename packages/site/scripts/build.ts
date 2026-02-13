import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { getEnabledPages } from "../src/lib/site-config.js";
import { renderPage } from "../src/render-page.js";
import type { SiteData } from "../src/types.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const runtimeRoot = path.resolve(SCRIPT_DIR, "..");
const ROOT_DIR = path.basename(runtimeRoot) === ".build" ? path.dirname(runtimeRoot) : runtimeRoot;
const DIST_DIR = path.join(ROOT_DIR, "dist");

async function build(data: SiteData) {
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  await fs.mkdir(DIST_DIR, { recursive: true });
  await copyLocalPhotos(data);

  const pages = getEnabledPages(data);
  for (const page of pages) {
    const html = renderPage(page, data);
    const outDir = page === "home" ? DIST_DIR : path.join(DIST_DIR, page);
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, "index.html"), html, "utf8");
  }

  console.log(`[site] built ${pages.length} page(s): ${pages.join(", ")}`);
}

async function copyLocalPhotos(data: SiteData) {
  const localPhotos = data.photos.filter((photo) => photo.sourcePath && photo.url.startsWith("/"));
  if (localPhotos.length === 0) return;

  for (const photo of localPhotos) {
    const sourcePath = photo.sourcePath as string;
    const relativeUrl = photo.url.startsWith("/") ? photo.url.slice(1) : photo.url;
    const targetPath = path.join(DIST_DIR, relativeUrl);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }
}

async function loadData(): Promise<SiteData> {
  const jsonPath = path.join(ROOT_DIR, "src/data/site-data.json");
  const raw = await fs.readFile(jsonPath, "utf8");
  return JSON.parse(raw) as SiteData;
}

loadData()
  .then((data) => build(data))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
