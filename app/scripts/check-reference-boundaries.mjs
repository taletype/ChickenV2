import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["src", "tests"].map((entry) => path.join(root, entry));
const banned = [
  "/Users/ricky/Desktop/ChickenDinnerV2/ChickenV1",
  "/Users/ricky/Desktop/ChickenDinnerV2/Kuest",
  "src/lib/db",
  "src/lib/orders",
  "src/lib/contracts",
  "useOrder",
  "better-auth",
  "drizzle-orm",
  "postgres"
];

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(filePath)));
    } else if (/\.(ts|tsx|js|mjs|json|css)$/.test(entry.name)) {
      files.push(filePath);
    }
  }

  return files;
}

const files = (await Promise.all(scanRoots.map(listFiles))).flat();
const violations = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const token of banned) {
    if (content.includes(token)) {
      violations.push(`${path.relative(root, file)} contains banned token ${token}`);
    }
  }
}

const clientFiles = files.filter((file) => {
  const relative = path.relative(root, file);
  return (
    relative.startsWith("src/components/") ||
    relative.startsWith("src/features/") ||
    relative.startsWith("src/app/[locale]/")
  );
});

for (const file of clientFiles) {
  const content = await readFile(file, "utf8");
  if (content.includes("@polymarket/clob-client")) {
    violations.push(`${path.relative(root, file)} imports a CLOB SDK in UI code`);
  }
}

for (const entry of ["../ChickenV1", "../Kuest"]) {
  const exists = await stat(path.join(root, entry)).then(() => true, () => false);
  if (!exists) {
    continue;
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("reference boundary check passed");
