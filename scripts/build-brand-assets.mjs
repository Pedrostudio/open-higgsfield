/* Builds every raster brand asset from the one mark geometry.

   The mark is authored once as SVG (src/app/icon.svg for the favicon,
   src/openhiggsfield/futuru-mark.tsx for the interface). Apple, the web app
   manifest and Open Graph all need rasters, so this script draws the same
   32-unit field in a headless Chromium and screenshots it at each size.

     node scripts/build-brand-assets.mjs

   Uses a local Chrome, Chromium or Edge on macOS or Windows; point CHROME_BIN
   at any Chrome build to use a different one. Outputs are committed — this
   runs when the mark changes, not on every build. */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/* ---------- the mark ---------- */

/* Keep in step with src/brand.ts and src/app/icon.svg. The gradient runs in
   user space so it crosses the square at the angle futuru.pt's icon does. */
const FROM = "#1f2aff";
const TO = "#ed02d6";

const gradient = (id) => `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse"
  x1="-19.56" y1="43.82" x2="45.04" y2="6.13">
  <stop offset="0" stop-color="${FROM}"/><stop offset="1" stop-color="${TO}"/>
</linearGradient></defs>`;

/** The three stepped bars on a 32-unit field. */
function bars(fill = "#fff") {
  return `<g fill="${fill}">
    <rect x="9.14" y="8.55" width="13.71" height="3.66"/>
    <rect x="9.14" y="14.17" width="10.95" height="3.66"/>
    <rect x="9.14" y="19.8" width="4.6" height="3.66"/>
  </g>`;
}

const roundedPlate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  ${gradient("g")}
  <rect width="32" height="32" rx="7.5" fill="url(#g)"/>
  ${bars()}
</svg>`;

/** Full-bleed square: Apple and the maskable spec apply their own mask. */
const bleedPlate = (size, scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  ${gradient("g")}
  <rect width="32" height="32" fill="url(#g)"/>
  <g transform="translate(16 16) scale(${scale}) translate(-16 -16)">${bars()}</g>
</svg>`;

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

/* ---------- renderer ---------- */

function findChrome() {
  const programFiles = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA];
  const candidates = [
    process.env.CHROME_BIN,
    ...["1237", "1228"].map((build) =>
      join(
        homedir(),
        "Library/Caches/ms-playwright",
        `chromium-${build}/chrome-mac-arm64`,
        "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      ),
    ),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ...programFiles
      .filter(Boolean)
      .flatMap((dir) => [
        join(dir, "Google/Chrome/Application/chrome.exe"),
        join(dir, "Microsoft/Edge/Application/msedge.exe"),
      ]),
  ].filter(Boolean);

  const found = candidates.find((path) => existsSync(path));
  if (found) return found;
  throw new Error(
    "No Chrome found. Install one, or set CHROME_BIN to a Chrome/Chromium binary.",
  );
}

const CHROME = findChrome();
const ROOT = resolve(import.meta.dirname, "..");
const WORK = mkdtempSync(join(tmpdir(), "futuru-brand-"));

function shoot(out, html, width, height, { transparent = false } = {}) {
  const page = join(WORK, `${width}x${height}-${Math.abs(hash(out))}.html`);
  writeFileSync(page, html);
  mkdirSync(resolve(out, ".."), { recursive: true });
  execFileSync(
    CHROME,
    [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--virtual-time-budget=6000",
      ...(transparent ? ["--default-background-color=00000000"] : []),
      `--window-size=${width},${height}`,
      `--screenshot=${out}`,
      pathToFileURL(page).href,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  console.log(`  ${relative(ROOT, out)}  ${width}×${height}`);
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return h;
}

const shell = (body, bg = "transparent") =>
  `<!doctype html><meta charset="utf-8"><style>
   *{margin:0;padding:0;box-sizing:border-box}
   html,body{width:100%;height:100%;background:${bg};overflow:hidden}
   body{display:flex}
   </style>${body}`;

/* ---------- app icons ---------- */

console.log("app icons");
shoot(join(ROOT, "public/icon-512.png"), shell(roundedPlate(512)), 512, 512, {
  transparent: true,
});
shoot(join(ROOT, "public/icon-192.png"), shell(roundedPlate(192)), 192, 192, {
  transparent: true,
});
// The bars already sit inside the maskable spec's 80%-diameter safe circle.
shoot(join(ROOT, "public/icon-maskable-512.png"), shell(bleedPlate(512, 1)), 512, 512);
shoot(join(ROOT, "src/app/apple-icon.png"), shell(bleedPlate(180, 1)), 180, 180);

/* ---------- open graph card ----------
   The studio's own near-black ground, the brand's colour held to one wash and
   the mark; the bars repeat large and faint as the card's one device. */

const og = `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&display=block" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{
    position:relative;
    background:
      radial-gradient(90% 80% at 0% 0%, rgba(31,42,255,0.16), transparent 58%),
      radial-gradient(80% 90% at 100% 100%, rgba(237,2,214,0.12), transparent 60%),
      #0a0a0b;
    color:#edefef;
    font-family:"Instrument Sans", ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing:antialiased;
    padding:74px 88px;
    display:flex;
    flex-direction:column;
    justify-content:space-between;
  }
  .field{position:absolute;top:120px;right:-40px;line-height:0;opacity:.045}
  .grain{position:absolute;inset:0;background-image:${GRAIN};background-size:180px;opacity:.06}
  .band{position:relative}
  .mid{position:relative;flex:1;display:flex;align-items:center}
  .mark{display:flex}
  h1{font-size:104px;font-weight:600;letter-spacing:-.045em;line-height:.95;color:#f2f4f4}
  .descriptor{margin-top:22px;font-size:17px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:#93bbff}
  .rule{margin:34px 0 28px;width:455px;height:1px;background:rgba(255,255,255,.09)}
  p{font-size:24px;line-height:1.45;color:#a8aeaf;max-width:560px;letter-spacing:-.011em}
</style>
<div class="field"><svg xmlns="http://www.w3.org/2000/svg" viewBox="8 7 18 18" width="420" height="420">${bars()}</svg></div>
<div class="band mark">${roundedPlate(62)}</div>
<div class="mid"><div class="band">
  <h1>Futuru Studio</h1>
  <div class="descriptor">AI image and video studio</div>
  <div class="rule"></div>
  <p>One prompt bar for image and video. Each model&rsquo;s own settings, and every finished run in one gallery.</p>
</div></div>
<div class="grain"></div>`;

console.log("open graph");
// public/, not app/opengraph-image.png — see the OG_IMAGE note in src/site.ts.
shoot(join(ROOT, "public/og.png"), og, 1200, 630);

rmSync(WORK, { recursive: true, force: true });
