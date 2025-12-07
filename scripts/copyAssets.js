import fs from "fs";
import path from "path";

function copyFolderSync(src, dest) {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const ROOT = path.resolve(".");

copyFolderSync(path.join(ROOT, "src/views"), path.join(ROOT, "dist/views"));
copyFolderSync(path.join(ROOT, "src/public"), path.join(ROOT, "dist/public"));
copyFolderSync(path.join(ROOT, "uploads"), path.join(ROOT, "dist/uploads"));

console.log("📁 Assets copied successfully!");
