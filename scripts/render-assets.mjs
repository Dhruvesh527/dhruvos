import sharp from "sharp";
import fs from "node:fs/promises";
await sharp("public/social-preview.svg").png().toFile("public/social-preview.png");
await sharp("public/icon.svg").resize(180,180).png().toFile("src/app/apple-icon.png");
console.log("Social preview and Apple icon generated.");
