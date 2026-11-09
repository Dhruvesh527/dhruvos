import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
const root=path.resolve("out");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json",".svg":"image/svg+xml",".png":"image/png",".woff2":"font/woff2",".txt":"text/plain; charset=utf-8",".ico":"image/x-icon",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp"};
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://localhost");
    const name=decodeURIComponent(url.pathname);
    let file=path.resolve(root,"."+name);
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end("Forbidden");return;}
    const stat=await fs.stat(file).catch(()=>null);
    if(stat?.isDirectory())file=path.join(file,"index.html");
    const bytes=await fs.readFile(file).catch(()=>null);
    if(!bytes){res.writeHead(404,{"Content-Type":"text/html; charset=utf-8"});res.end(await fs.readFile(path.join(root,"404.html")).catch(()=>"Not found"));return;}
    const type=mime[path.extname(file)]??"application/octet-stream";
    // Compress text like a real host would (Vercel/Netlify do this automatically), so local speed tests are realistic.
    const compress=/^(text\/|application\/json|image\/svg)/.test(type)&&/\bgzip\b/.test(req.headers["accept-encoding"]??"");
    const body=compress?gzipSync(bytes):bytes;
    res.writeHead(200,{"Content-Type":type,"Cache-Control":"no-cache","X-Content-Type-Options":"nosniff",...(compress?{"Content-Encoding":"gzip","Vary":"Accept-Encoding"}:{})});
    res.end(req.method==="HEAD"?undefined:body);
  }catch{res.writeHead(400);res.end("Bad request");}
});
server.listen(Number(process.env.PORT??3210),"127.0.0.1",()=>console.log("DhruvOS preview: http://127.0.0.1:"+server.address().port));
