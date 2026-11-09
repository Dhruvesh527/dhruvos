import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
const base=process.argv[2]||"http://127.0.0.1:3210";
const checks=[
 ["/","Power on portfolio"],
 ["/simple/","Selected work"],
 ["/projects/dhruvos/","The challenge"],
 ["/projects/ozzat/","Ozzat"],
 ["/projects/ozzat/","ozzat.com"],
 ["/resume/","Lead Full-Stack Developer"],
 ["/wallpaper.svg","<svg"],
 ["/projects/dhruvos.svg","DhruvOS"],
 ["/robots.txt","User-Agent"],
 ["/sitemap.xml","urlset"],
];
for(const [route,expected] of checks){
 const response=await fetch(base+route);
 assert.equal(response.status,200,route+" returns 200");
 const body=await response.text();
 assert.ok(body.toLowerCase().includes(expected.toLowerCase()),route+" contains expected content");
 console.log("PASS "+route);
}
const missing=await fetch(base+"/this-file-does-not-exist/");
assert.equal(missing.status,404);
console.log("PASS missing route returns 404");
const home=await fs.readFile("out/index.html","utf8");
assert.ok(home.includes("<noscript>"));
assert.ok(home.includes("JavaScript is disabled."));
assert.ok(home.includes("Simple view"));
console.log("PASS no-JavaScript content is exported");
let count=0;
async function walk(dir){
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())await walk(file);
  else if(file.endsWith(".html")){
   const html=await fs.readFile(file,"utf8");
   for(const match of html.matchAll(/(?:src|href)="(\/[^"#?]+)(?:[?#][^"]*)?"/g)){
    const url=match[1];if(url.includes("&amp;"))continue;
    let asset=path.join("out",url);
    const stat=await fs.stat(asset).catch(()=>null);
    if(stat?.isDirectory())asset=path.join(asset,"index.html");
    assert.ok(await fs.stat(asset).catch(()=>null),file+" refers to existing "+url);
    count++;
   }
  }
 }
}
await walk("out");
console.log("PASS "+count+" internal exported links/assets resolve");
