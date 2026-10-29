// Extrait les icônes Lucide utilisées vers apps/core/icons.json.
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const config = JSON.parse(readFileSync("static/src/icons.json", "utf8"));
const used = new Set(config.extra);
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith(".html")) {
      for (const m of readFileSync(path, "utf8").matchAll(/\{%\s*icon\s+"([a-z0-9-]+)"/g)) used.add(m[1]);
    }
  }
};
["templates", "apps"].forEach(walk);

const icons = {};
for (const name of [...used].sort()) {
  if (config.brands[name]) continue;
  const svg = readFileSync(`node_modules/lucide-static/icons/${name}.svg`, "utf8");
  icons[name] = svg.slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>")).replace(/\s*\n\s*/g, "").replace(/\s*\/>/g, "/>");
}
const out = { lucide: icons, brands: config.brands };
writeFileSync("apps/core/icons.json", JSON.stringify(out, null, 1) + "\n");
console.log(`${Object.keys(icons).length} icônes Lucide, ${Object.keys(config.brands).length} marques`);
