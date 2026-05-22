import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const bannedPatterns = [
  /mock(Balances?|Positions?|Markets?|PnL|Prices?|Charts?|Orders?|Fills?|Activities?|Comments?)/i,
  /seed(Balances?|Positions?|Markets?|PnL|Prices?|Charts?|Orders?|Fills?|Activities?|Comments?)/i,
  /sample(Balances?|Positions?|Markets?|PnL|Prices?|Charts?|Orders?|Fills?|Activities?|Comments?)/i,
  /demo(Balances?|Positions?|Markets?|PnL|Prices?|Charts?|Orders?|Fills?|Activities?|Comments?)/i,
  /fake(Balances?|Positions?|Markets?|PnL|Prices?|Charts?|Orders?|Fills?|Activities?|Comments?)/i,
  /placeholder(Balance|Position|Market|PnL|Price|Chart|Order|Fill|Activity|Comment)/i
];

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(filePath)));
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      files.push(filePath);
    }
  }

  return files;
}

const violations = [];

for (const file of await listFiles(sourceRoot)) {
  const content = await readFile(file, "utf8");
  for (const pattern of bannedPatterns) {
    if (pattern.test(content)) {
      violations.push(`${path.relative(root, file)} matches ${pattern}`);
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("market-data truthfulness check passed");
