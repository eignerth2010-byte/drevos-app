import {DurableObject} from 'cloudflare:workers';
interface Env {ROOMS:DurableObjectNamespace;CONNECT_LIMIT:RateLimit}
type Role='device'|'app';
type Attachment={role?:Role;authenticated:boolean;opened:number;count:number;window:number};
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function close(ws:WebSocket,code=1008){try{ws.close(code,'Connection closed');}catch{/* closed peer */}}
async function tokenHash(token:string):Promise<string>{
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
function equal(a:string,b:string):boolean {if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
export default {
  async fetch(request:Request,env:Env):Promise<Response>{
    const url=new URL(request.url);
    if(url.pathname==='/health')return Response.json({service:'drevos-relay',version:'0.2.0',protocol:1},{headers});
    const match=url.pathname.match(/^\/v1\/rooms\/([a-f0-9]{32})\/socket$/);
    if(request.method!=='GET'||!match||url.search||request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('Not found',{status:404,headers});
    const limit=await env.CONNECT_LIMIT.limit({key:request.headers.get('CF-Connecting-IP')??'unknown'});
    if(!limit.success)return new Response('Please retry later',{status:429,headers});
    return env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(request);
  }
} satisfies ExportedHandler<Env>;

/** Blind, live-only transport. Oven readings, commands and encryption keys are never stored. */
export class OvenRoom extends DurableObject<Env> {
  constructor(ctx:DurableObjectState,env:Env){super(ctx,env);ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));}
  async fetch():Promise<Response>{
    if(this.ctx.getWebSockets().length>=7)return new Response('Busy',{status:429,headers});
    const [client,server]=Object.values(new WebSocketPair());
    server.serializeAttachment({authenticated:false,opened:Date.now(),window:Date.now(),count:0} satisfies Attachment);
    this.ctx.acceptWebSocket(server);
    await this.ctx.storage.setAlarm(Date.now()+6000);
    return new Response(null,{status:101,webSocket:client});
  }
  private peers(role:Role){return this.ctx.getWebSockets().filter(ws=>{const a=ws.deserializeAttachment() as Attachment;return a?.authenticated&&a.role===role;});}
  async webSocketMessage(ws:WebSocket,message:string|ArrayBuffer){
    const a=ws.deserializeAttachment() as Attachment;
    if(typeof message!=='string'||message.length>32768||!a){close(ws);return;}
    let data:any;try{data=JSON.parse(message);}catch{close(ws);return;}
    if(!a.authenticated){
      if(Date.now()-a.opened>5000||data?.type!=='hello'||!['device','app'].includes(data.role)||! /^[a-f0-9]{64}$/.test(data.auth??'')){close(ws);return;}
      const hash=await tokenHash(data.auth);
      const allowed=await this.ctx.blockConcurrencyWhile(async()=>{
        let saved=await this.ctx.storage.get<string>('authHash');
        if(!saved&&data.role==='device'){saved=hash;await this.ctx.storage.put('authHash',hash);}
        return !!saved&&equal(saved,hash);
      });
      if(!allowed){close(ws);return;}
      a.role=data.role;a.authenticated=true;ws.serializeAttachment(a);
      if(a.role==='device')for(const old of this.peers('device'))if(old!==ws)close(old,1000);
      ws.send(JSON.stringify({type:'ready',deviceOnline:this.peers('device').length>0}));
      if(a.role==='device')for(const app of this.peers('app'))app.send(JSON.stringify({type:'online'}));
      return;
    }
    if(Date.now()-a.window>60000){a.window=Date.now();a.count=0;}
    if(++a.count>240||data?.type!=='data'||typeof data.payload!=='string'||data.payload.length>30000){close(ws);return;}
    ws.serializeAttachment(a);
    const peers=this.peers(a.role==='app'?'device':'app');
    if(a.role==='app'&&!peers.length){ws.send(JSON.stringify({type:'offline'}));return;}
    const frame=JSON.stringify({type:'data',payload:data.payload});
    for(const peer of peers)try{peer.send(frame);}catch{close(peer,1000);}
  }
  webSocketClose(ws:WebSocket,code:number){
    const a=ws.deserializeAttachment() as Attachment;
    close(ws,code===1000?1000:1001);
    if(a?.role==='device'&&!this.peers('device').some(p=>p!==ws))for(const app of this.peers('app'))try{app.send(JSON.stringify({type:'offline'}));}catch{close(app);}
  }
  webSocketError(ws:WebSocket){this.webSocketClose(ws,1001);}
  async alarm(){
    for(const ws of this.ctx.getWebSockets()){const a=ws.deserializeAttachment() as Attachment;if(!a?.authenticated&&Date.now()-a.opened>=5000)close(ws);}
  }
}
