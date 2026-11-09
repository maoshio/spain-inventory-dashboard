import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../worker/index.js';

const page=await readFile(new URL('../page.html',import.meta.url),'utf8');
const seed=JSON.parse(page.match(/<script id="seed-data" type="application\/json">([^<]+)<\/script>/)[1]);
const objects=new Map();
const env={ADMIN_TOKEN:'test-secret',BUCKET:{
  async get(key){const data=objects.get(key);return data?{body:data}:null;},
  async put(key,value){objects.set(key,value);},
}};
const request=(path,method='GET',body,token)=>new Request(`https://example.com${path}`,{method,headers:token?{'Authorization':`Bearer ${token}`}:{},body:body?JSON.stringify(body):undefined});

let response=await worker.fetch(request('/api/dashboard'),env);
assert.equal(response.status,404);
response=await worker.fetch(request('/api/dashboard','PUT',seed,'wrong'),env);
assert.equal(response.status,401);
response=await worker.fetch(request('/api/dashboard','PUT',seed,'test-secret'),env);
assert.equal(response.status,200);
response=await worker.fetch(request('/api/dashboard'),env);
assert.equal(response.status,200);
const latest=await response.json();
assert.equal(latest.data.total,3624);
assert.equal(latest.data.sales,340);
assert.equal(latest.data.dispatch,27);
assert.equal(JSON.stringify(latest).includes('VIN'),false);
response=await worker.fetch(request('/'),env);
assert.equal(response.status,200);
const viewer=await response.text();
assert.match(viewer,/SHARED_MODE=location.pathname/);
response=await worker.fetch(request('/admin'),env);
assert.equal(response.status,200);
assert.match(await response.text(),/admin-password/);
console.log('PASS public view, protected publish, shared aggregate');
