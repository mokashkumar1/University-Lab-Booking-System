import postgres from 'postgres';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
if(process.env.SUPABASE_PROJECT_REF!=='ahewjncliytgfphaepbz') throw new Error('Only the authorized project may be tested.');
const db=postgres(process.env.POSTGRES_URL_NON_POOLING||process.env.POSTGRES_URL,{ssl:'require',max:12});
const lab=randomUUID(),equipment=randomUUID();let created=false;
try {
 const [actor]=await db`select id,department_id from profiles where email=${process.env.DEMO_STUDENT_EMAIL} and active`;
 if(!actor)throw new Error('Seed Student account first.');
 await db.begin(async tx=>{
 await tx`insert into labs(id,name,department_id,capacity,location) values(${lab},'Temporary concurrency fixture',${actor.department_id},30,'Automated verification')`;
 await tx`insert into equipment(id,name,category,total_quantity,lab_id) values(${equipment},'Temporary concurrency kits','Verification',10,${lab})`;
 });created=true;
 const start=new Date(Date.now()+2*86400000).toISOString(),end=new Date(Date.now()+2*86400000+3600000).toISOString();
 const call=(labId,items)=>db`select create_booking(${actor.id}::uuid,${labId}::uuid,${start}::timestamptz,${end}::timestamptz,'Automated concurrency verification',1,${db.json(items)}::jsonb,'Temporary fixture') id`;
 const labResults=await Promise.allSettled(Array.from({length:10},()=>call(lab,[])));
 assert.equal(labResults.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(labResults.filter(r=>r.status==='rejected'&&r.reason.code==='23P01').length,9);
 console.log('Hosted concurrent lab requests: one committed; nine rejected by exclusion constraint.');
 const eqResults=await Promise.allSettled([call(null,[{equipment_id:equipment,quantity:8}]),call(null,[{equipment_id:equipment,quantity:8}])]);
 assert.equal(eqResults.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(eqResults.filter(r=>r.status==='rejected'&&/insufficient quantity/.test(r.reason.message)).length,1);
 console.log('Hosted concurrent eight-of-ten equipment requests: one committed; one rejected after stock lock/recheck.');
} catch(e){console.error('Hosted concurrency verification failed:',e.message);process.exitCode=1;}
finally {
 if(created)await db.begin(async tx=>{
 const fixtures=await tx`select distinct b.id from bookings b left join booking_items i on i.booking_id=b.id where b.lab_id=${lab} or i.equipment_id=${equipment}`;
 const ids=fixtures.map(x=>x.id);
 if(ids.length){await tx`delete from notifications where booking_id in ${tx(ids)}`;await tx`delete from issue_returns where booking_id in ${tx(ids)}`;await tx`delete from booking_items where booking_id in ${tx(ids)}`;await tx`delete from audit_log where entity_id in ${tx(ids)}`;await tx`delete from bookings where id in ${tx(ids)}`;}
 await tx`delete from equipment where id=${equipment}`;await tx`delete from labs where id=${lab}`;
 });
 console.log('Temporary concurrency fixtures and generated records removed.');await db.end();
}
