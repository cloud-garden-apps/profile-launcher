import { execSync } from "child_process";
import { mkdirSync, cpSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { appConfig } from "../app.config";

config();

const ROOT = process.cwd();

const run = (command: string, options?: { cwd?: string }) => {
  console.log(`> ${command}`);
  execSync(command, { stdio: "inherit", ...options });
};

const deployToNetlify = (siteId: string, sourceDir: string, includeFunctions: boolean) => {
  const tempDir = `/tmp/netlify-deploy-${Date.now()}`;
  mkdirSync(tempDir, { recursive: true });

  cpSync(sourceDir, tempDir, { recursive: true });

  if (includeFunctions) {
    const functionsSource = join(ROOT, "packages/api/functions");
    const functionsTarget = join(tempDir, "netlify/functions");
    mkdirSync(functionsTarget, { recursive: true });
    cpSync(functionsSource, functionsTarget, { recursive: true });
  }

  const command = `netlify deploy --dir=. --prod`;
  const env = {
    ...process.env,
    NETLIFY_SITE_ID: siteId,
    NETLIFY_AUTH_TOKEN: process.env.NETLIFY_AUTH_TOKEN,
  };

  execSync(command, { stdio: "inherit", cwd: tempDir, env });

  rmSync(tempDir, { recursive: true, force: true });
};

const getSiteId = async (siteName: string): Promise<string> => {
  const response = await fetch(
    `https://api.netlify.com/api/v1/sites?filter=all`,
    {
      headers: { Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}` },
    }
  );
  const sites = await response.json();
  const site = sites.find((s: { name: string }) => s.name === siteName);
  if (!site) {
    throw new Error(`Site ${siteName} not found. Create it first via Netlify dashboard or API.`);
  }
  return site.id;
};

const deployLanding = async () => {
  console.log(`\nDeploying landing page for ${appConfig.name}...`);

  const siteId = await getSiteId(appConfig.netlify.landingSiteName);
  const sourceDir = join(ROOT, "packages/landing");

  deployToNetlify(siteId, sourceDir, false);

  console.log(`\nLanding page deployed to: https://${appConfig.netlify.landingSiteName}.netlify.app`);
};

const deployApp = async () => {
  console.log(`\nBuilding app for ${appConfig.name}...`);
  run("yarn workspace app build");

  console.log(`\nDeploying app for ${appConfig.name}...`);

  const siteId = await getSiteId(appConfig.netlify.appSiteName);
  const sourceDir = join(ROOT, "packages/app/dist");

  deployToNetlify(siteId, sourceDir, true);

  console.log(`\nApp deployed to: https://${appConfig.netlify.appSiteName}.netlify.app`);
};

const main = async () => {
  const target = process.argv[2];

  if (!process.env.NETLIFY_AUTH_TOKEN) {
    console.error("Error: NETLIFY_AUTH_TOKEN not set in .env");
    process.exit(1);
  }

  if (target === "landing") {
    await deployLanding();
  } else if (target === "app") {
    await deployApp();
  } else if (target === "all") {
    await deployLanding();
    await deployApp();
  } else {
    console.log("Usage: yarn deploy [landing|app|all]");
    process.exit(1);
  }
};

main();
