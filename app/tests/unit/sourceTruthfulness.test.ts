import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function listSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(filePath)));
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      files.push(filePath);
    }
  }

  return files;
}

describe("source truthfulness", () => {
  it("does not import runtime code from reference apps", async () => {
    const root = process.cwd();
    const sourceFiles = await listSourceFiles(path.join(root, "src"));
    const referenceNames = ["ChickenV1", "Kuest"];
    const violations: string[] = [];

    for (const file of sourceFiles) {
      const content = await readFile(file, "utf8");
      const importLines = content
        .split("\n")
        .filter((line) => /\bimport\b|\bfrom\b/.test(line));

      for (const line of importLines) {
        if (referenceNames.some((name) => line.includes(name))) {
          violations.push(`${path.relative(root, file)}: ${line.trim()}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not define market-data stand-ins in source", async () => {
    const root = process.cwd();
    const sourceFiles = await listSourceFiles(path.join(root, "src"));
    const bannedPatterns = [
      /mockMarkets?/i,
      /seedMarkets?/i,
      /sampleMarkets?/i,
      /demoMarkets?/i,
      /fake(Balances?|Positions?|Markets?|PnL|Prices?|Chart)/i,
      /placeholder(Balance|Position|Market|PnL|Price|Chart)/i
    ];
    const violations: string[] = [];

    for (const file of sourceFiles) {
      const content = await readFile(file, "utf8");
      for (const pattern of bannedPatterns) {
        if (pattern.test(content)) {
          violations.push(`${path.relative(root, file)} matches ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
