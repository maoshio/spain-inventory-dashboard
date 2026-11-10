import {readFile,writeFile,mkdir} from 'node:fs/promises';
const source=await readFile(new URL('../page.html',import.meta.url),'utf8');
const dir=new URL('../',import.meta.url);
await mkdir(dir,{recursive:true});
for(const [name,mode] of [['index.html','viewer'],['admin.html','admin']]) {
  const config='<script>window.SHARED_MODE='+JSON.stringify(mode)+';window.DASHBOARD_API_ORIGIN="https://spain-inventory-shared-mao-1109.gsimonay.chatgpt.site";</script>';
  const result=source.replace('<script id="seed-data"',config+'<script id="seed-data"');
  if(result===source) throw new Error('Missing seed script');
  await writeFile(new URL(name,dir),result);
}
await writeFile(new URL('.nojekyll',dir),'');
console.log('Built GitHub Pages viewer and admin');
