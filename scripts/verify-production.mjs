import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.VERIFY_URL||'https://university-lab-booking-system.vercel.app';
const browser=await chromium.launch({headless:true,channel:'chrome'}),checks=[],errors=[];
await mkdir('docs/evidence/production',{recursive:true});
for(const role of ['Student','Lab Staff','Coordinator','Admin']){
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();page.on('pageerror',e=>errors.push({role,message:e.message}));
 try{
  await page.goto(`${base}/login`);await page.getByRole('button',{name:role,exact:false}).click();await page.waitForURL('**/dashboard',{timeout:60000});await page.waitForFunction(()=>document.documentElement.dataset.unilabReady==='true');checks.push({role,check:'Production demo access uses real authentication',passed:true});
  const routes=role==='Student'?['dashboard','browse','book','bookings','notifications']:role==='Lab Staff'?['approvals','issue-return','blocks']:role==='Coordinator'?['approvals','reports','rules']:['admin/users','admin/equipment','admin/categories','admin/audit'];
  for(const viewport of [{width:390,height:844},{width:1440,height:900}]){await page.setViewportSize(viewport);for(const route of routes){await page.goto(`${base}/${route}`);await page.waitForFunction(()=>document.documentElement.dataset.unilabReady==='true');const details=await page.evaluate(()=>({width:document.documentElement.scrollWidth,text:document.querySelector('main')?.innerText||''}));checks.push({role,route,width:viewport.width,check:'Production workspace renders and fits viewport',passed:details.width<=viewport.width+1&&!/Application error|Permission required|database is not ready/i.test(details.text)});if(['dashboard','reports','admin/users','approvals'].includes(route))await page.screenshot({path:`docs/evidence/production/${role.replaceAll(' ','-')}-${route.replaceAll('/','-')}-${viewport.width}.png`,fullPage:true});}}
 }catch(error){checks.push({role,check:'Production verification',passed:false,message:error.message});}await context.close();
}
await browser.close();await writeFile('docs/evidence/production/results.json',JSON.stringify({url:base,checked:new Date().toISOString(),checks,pageErrors:errors},null,2));console.log(JSON.stringify({checks:checks.length,failures:checks.filter(c=>!c.passed),pageErrors:errors}));if(checks.some(c=>!c.passed)||errors.length)process.exitCode=1;
