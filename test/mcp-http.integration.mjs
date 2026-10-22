import assert from 'node:assert/strict'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const upstream = http.createServer((req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  res.setHeader('content-type', 'application/json')
  if (token === 'ckbot_invalid') { res.writeHead(401); res.end('{}'); return }
  if (req.url === '/api/mcp/oauth/exchange') {
    assert.equal(req.headers['x-cafekong-mcp-secret'], 'local-test-service')
    res.end(JSON.stringify({delegation_token:'ckmcp_local',expires_in:300,bot:{user_id:'oauth-user',client_id:'local-client',oauth_grant_id:'local-grant',scopes:['bot:round:read']}})); return
  }
  const user = token === 'ckmcp_local' ? 'oauth-user' : token.endsWith('_a') ? 'client-a' : 'client-b'
  setTimeout(() => res.end(JSON.stringify({bot:{user_id:user,token_id:'local-id',scopes:['bot:round:read'],round_ids:[]}})), user === 'client-a' ? 20 : 1)
})
upstream.listen(0, '127.0.0.1'); await once(upstream,'listening')
const portProbe = http.createServer();portProbe.listen(0,'127.0.0.1');await once(portProbe,'listening');const port = portProbe.address().port;await new Promise(resolve=>portProbe.close(resolve))
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{cwd:projectRoot,env:{...process.env,CAFEKONG_BASE_URL:`http://127.0.0.1:${upstream.address().port}`,CAFEKONG_MCP_SERVICE_SECRET:'local-test-service'},stdio:'ignore'})
const url=`http://127.0.0.1:${port}/api/mcp`
async function rpc(body, token='ckbot_local_a') {return fetch(url,{method:'POST',headers:{...(token?{authorization:`Bearer ${token}`} : {}),'content-type':'application/json',accept:'application/json, text/event-stream'},body:typeof body==='string'?body:JSON.stringify(body),signal:AbortSignal.timeout(10000)})}
try {
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(url)).status===401){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert(ready,'local Next server ready')
  const list={jsonrpc:'2.0',id:1,method:'tools/list'}
  assert.equal((await rpc(list,'')).status,401)
  assert.equal((await rpc(list,'ckbot_invalid')).status,401)
  const catalog=await rpc(list);assert.equal(catalog.status,200);assert.match(await catalog.text(),/cafekong_place_match_wager/)
  const me={jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'cafekong_bot_me',arguments:{}}}
  const [a,b]=await Promise.all([rpc(me,'ckbot_local_a'),rpc(me,'ckbot_local_b')]);assert.equal(a.status,200);assert.equal(b.status,200)
  const at=await a.text(),bt=await b.text();assert.match(at,/client-a/);assert.doesNotMatch(at,/client-b/);assert.match(bt,/client-b/);assert.doesNotMatch(bt,/client-a/)
  const oauth=await rpc(me,'local-oauth');assert.equal(oauth.status,200);assert.match(await oauth.text(),/oauth-user/)
  assert.equal((await rpc(' '.repeat(1024*1024+1))).status,413)
  assert.equal((await rpc(Array.from({length:101},(_,id)=>({...list,id})))).status,400)
  console.log('Local built /api/mcp: missing/invalid token=401; catalog=200; parallel clients isolated; OAuth exchange+tool=200; oversized body=413; oversized batch=400')
}finally{child.kill('SIGTERM');await once(child,'exit');await new Promise(resolve=>upstream.close(resolve))}
