import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist-web');
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
const rules = [];
let rule;
for (const line of (await fs.readFile(path.join(root, '_headers'), 'utf8')).split(/\r?\n/)) {
  if (line.startsWith('/')) { rule = { path: line.trim(), headers: {} }; rules.push(rule); }
  else if (rule && /^\s+[^:]+:/.test(line)) { const value=line.trim(),colon=value.indexOf(':');rule.headers[value.slice(0,colon)]=value.slice(colon+1).trim(); }
}
const server = http.createServer(async (request,response)=>{
  try {
    if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405).end();return; }
    const url=new URL(request.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
    const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!filename.startsWith(root+path.sep)||pathname==='/_headers'){response.writeHead(404).end();return;}
    const headers={'Content-Type':mime[path.extname(filename)]||'application/octet-stream'};
    for(const r of rules)if(r.path.endsWith('*')?pathname.startsWith(r.path.slice(0,-1)):pathname===r.path)Object.assign(headers,r.headers);
    const body=await fs.readFile(filename);response.writeHead(200,headers);response.end(request.method==='HEAD'?undefined:body);
  } catch { response.writeHead(404).end('Not found'); }
});
server.listen(8796,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:8796'));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
