import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {readFile} from 'node:fs/promises';
let mf:Miniflare;
beforeAll(async()=>{mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:await readFile(new URL('../dist/index.js',import.meta.url),'utf8'),compatibilityDate:'2026-07-30',durableObjects:{ROOMS:{className:'OvenRoom',useSQLite:true}},ratelimits:{CONNECT_LIMIT:{namespace_id:'9487',simple:{limit:1000,period:60}}}}));await mf.ready;},15000);
afterAll(async()=>{await mf?.dispose();});
function next(ws:any):Promise<any>{return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('No message')),2000);ws.addEventListener('message',(e:any)=>{clearTimeout(timer);resolve(JSON.parse(e.data));},{once:true});});}
async function socket(room:string){const response=await mf.dispatchFetch('http://localhost/v1/rooms/'+room+'/socket',{headers:{Upgrade:'websocket'}});expect(response.status).toBe(101);const ws=response.webSocket!;ws.accept();return ws;}
async function hello(ws:any,role:string,auth:string){const response=next(ws);ws.send(JSON.stringify({type:'hello',role,auth}));return response;}
describe('blind live relay',()=>{
  it('authenticates a device and app and forwards opaque packets in both directions',async()=>{
    const room='01'.repeat(16),auth='ab'.repeat(32),device=await socket(room);expect(await hello(device,'device',auth)).toEqual({type:'ready',deviceOnline:true});
    const app=await socket(room);expect(await hello(app,'app',auth)).toEqual({type:'ready',deviceOnline:true});
    const incoming=next(device);app.send(JSON.stringify({type:'data',payload:'opaque-ciphertext'}));expect(await incoming).toEqual({type:'data',payload:'opaque-ciphertext'});
    const reply=next(app);device.send(JSON.stringify({type:'data',payload:'opaque-reply'}));expect(await reply).toEqual({type:'data',payload:'opaque-reply'});
    app.close();device.close();
  });
  it('rejects apps before device enrollment and rejects a wrong relay token',async()=>{
    const app=await socket('02'.repeat(16));const closed=new Promise<void>(r=>app.addEventListener('close',()=>r(),{once:true}));app.send(JSON.stringify({type:'hello',role:'app',auth:'ab'.repeat(32)}));await closed;
    const device=await socket('03'.repeat(16));await hello(device,'device','ab'.repeat(32));
    const wrong=await socket('03'.repeat(16));const rejected=new Promise<void>(r=>wrong.addEventListener('close',()=>r(),{once:true}));wrong.send(JSON.stringify({type:'hello',role:'app',auth:'cd'.repeat(32)}));await rejected;device.close();
  });
  it('reports an offline oven instead of retaining commands',async()=>{
    const room='04'.repeat(16),auth='ab'.repeat(32),device=await socket(room);await hello(device,'device',auth);
    const app=await socket(room);await hello(app,'app',auth);
    const offline=next(app);device.close();expect(await offline).toEqual({type:'offline'});
    const refused=next(app);app.send(JSON.stringify({type:'data',payload:'do-not-queue'}));expect(await refused).toEqual({type:'offline'});
    const online=next(app),replacement=await socket(room);await hello(replacement,'device',auth);expect(await online).toEqual({type:'online'});
    const fresh=next(replacement);app.send(JSON.stringify({type:'data',payload:'fresh'}));expect((await fresh).payload).toBe('fresh');app.close();replacement.close();
  });
});
