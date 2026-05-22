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
    const sourceFiles = (
      await Promise.all([
        listSourceFiles(path.join(root, "src")),
        listSourceFiles(path.join(root, "tests"))
      ])
    ).flat();
    const referenceNames = ["Chicken" + "V1", "Ku" + "est"];
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
      /mock(Balances?|Positions?|Markets?|PnL|Prices?|Charts?|Orders?|Fills?|Activities?|Comments?)/i,
      /seed(Balances?|Positions?|Markets?|PnL|Prices?|Charts?|Orders?|Fills?|Activities?|Comments?)/i,
      /sample(Balances?|Positions?|Markets?|PnL|Prices?|Charts?|Orders?|Fills?|Activities?|Comments?)/i,
      /demo(Balances?|Positions?|Markets?|PnL|Prices?|Charts?|Orders?|Fills?|Activities?|Comments?)/i,
      /fake(Balances?|Positions?|Markets?|PnL|Prices?|Charts?|Orders?|Fills?|Activities?|Comments?)/i,
      /placeholder(Balance|Position|Market|PnL|Price|Chart|Order|Fill|Activity|Comment)/i
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
