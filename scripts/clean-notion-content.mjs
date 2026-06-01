import fs from "fs";
import path from "path";

const CONTENT_DIR = "content";
const NOTION_MANAGED_MARKER = "MANAGED_BY_NOTION_HUGO: true";

function isMarkdownFile(filePath) {
  return filePath.toLowerCase().endsWith(".md");
}

function walk(dirPath, out = []) {
  if (!fs.existsSync(dirPath)) return out;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
      continue;
    }
    if (entry.isFile() && isMarkdownFile(fullPath)) {
      out.push(fullPath);
    }
  }
  return out;
}

function main() {
  const files = walk(CONTENT_DIR);
  let removedCount = 0;

  for (const filePath of files) {
    const fileText = fs.readFileSync(filePath, "utf8");
    if (!fileText.includes(NOTION_MANAGED_MARKER)) {
      continue;
    }
    fs.unlinkSync(filePath);
    removedCount += 1;
    console.info(`[clean-notion-content] Removed ${filePath}`);
  }

  console.info(`[clean-notion-content] Removed ${removedCount} managed markdown files.`);
}

main();
