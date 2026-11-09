import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const original = await readFile(path.join(root, 'page.html'), 'utf8');
const page = original.replace('<script id="seed-data"', '<script>window.SHARED_MODE=location.pathname.startsWith("/admin")?"admin":"viewer";</script><script id="seed-data"');
if (page === original) throw new Error('Dashboard seed script was not found.');

const source = `const PAGE = ${JSON.stringify(page)};
const KEY = 'latest-dashboard.json';
const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};

function responseJson(value, status=200) {
  return new Response(JSON.stringify(value), {status, headers});
}
function equalToken(a,b) {
  if (typeof a!=='string'||typeof b!=='string'||!a||!b) return false;
  let difference=a.length^b.length;
  const length=Math.max(a.length,b.length);
  for(let i=0;i<length;i++) difference|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);
  return difference===0;
}
function validCount(value) { return Number.isSafeInteger(value)&&value>=0; }
function validSummary(input) {
  const d=input?.data, m=input?.meta;
  if(!d||!m||!validCount(d.total)||!validCount(d.sales)||!validCount(d.dispatch)||!validCount(d.pending)||!validCount(d.unallocated)) return false;
  if(d.sales>d.total||d.dispatch>d.sales||d.pending!==d.sales-d.dispatch||d.unallocated!==d.total-d.sales) return false;
  if(!Array.isArray(d.age)||d.age.length!==5||!d.age.every(x=>validCount(x.count)&&typeof x.label==='string')) return false;
  if(d.age.reduce((n,x)=>n+x.count,0)>d.total) return false;
  if(!Array.isArray(d.warehouses)||d.warehouses.length>50||!d.warehouses.every(x=>typeof x.name==='string'&&typeof x.label==='string'&&validCount(x.count)&&Array.isArray(x.age)&&x.age.length===5&&x.age.every(validCount)&&x.age.reduce((n,a)=>n+a,0)<=x.count)) return false;
  if(d.warehouses.reduce((n,x)=>n+x.count,0)!==d.total) return false;
  if(!Array.isArray(d.models)||d.models.length>100||!d.models.every(x=>typeof x.name==='string'&&validCount(x.count)&&validCount(x.sales)&&x.sales<=x.count)) return false;
  if(d.models.reduce((n,x)=>n+x.count,0)!==d.total) return false;
  if(typeof m.loadedAt!=='string'||typeof m.sourceLabel!=='string'||m.sourceLabel.length>250) return false;
  return true;
}

export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    if(url.pathname==='/api/dashboard') {
      if(request.method==='GET') {
        if(!env.BUCKET) return responseJson({error:'数据存储未配置'},503);
        const stored=await env.BUCKET.get(KEY);
        if(!stored) return responseJson({error:'尚未上传在线数据'},404);
        return new Response(stored.body,{headers});
      }
      if(request.method==='PUT') {
        if(!env.ADMIN_TOKEN||!env.BUCKET) return responseJson({error:'后台尚未配置'},503);
        const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')||'';
        if(!equalToken(token,env.ADMIN_TOKEN)) return responseJson({error:'上传密码不正确'},401);
        const size=Number(request.headers.get('Content-Length')||0);
        if(size>100000) return responseJson({error:'汇总数据过大'},413);
        let payload;
        try {
          const body=await request.text();
          if(body.length>100000) return responseJson({error:'汇总数据过大'},413);
          payload=JSON.parse(body);
        } catch { return responseJson({error:'数据格式错误'},400); }
        if(!validSummary(payload)) return responseJson({error:'汇总校验失败'},400);
        const saved={data:payload.data,meta:{...payload.meta,publishedAt:new Date().toISOString()}};
        await env.BUCKET.put(KEY,JSON.stringify(saved),{httpMetadata:{contentType:'application/json'}});
        return responseJson({ok:true,total:saved.data.total,publishedAt:saved.meta.publishedAt});
      }
      return responseJson({error:'不支持此操作'},405);
    }
    if(url.pathname==='/'||url.pathname==='/admin') return new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    return new Response('Not Found',{status:404});
  }
};
`;
await writeFile(path.join(root, 'worker/index.js'), source);
process.stdout.write(JSON.stringify({pageBytes:Buffer.byteLength(page),workerBytes:Buffer.byteLength(source)})+'\n');
