import { createClient } from '@supabase/supabase-js';
import { appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret=process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) throw new Error('Set the Supabase project URL and server secret key before seeding.');
if(new URL(url).hostname!=='ahewjncliytgfphaepbz.supabase.co') throw new Error('Seed is restricted to the authorized Universitylab project.');
const db=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
function check(error: {message:string}|null) {if(error) throw new Error(error.message);}
const id=(n:number)=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const department=id(1);
async function seed() {
 check((await db.from('departments').upsert([{id:department,name:'Electrical & Computer Engineering'},{id:id(2),name:'Computer Science'},{id:id(3),name:'Mechanical Engineering'}])).error);
 check((await db.from('categories').upsert(['Development Kits','Measurement','Computing','Robotics','Fabrication'].map((name,i)=>({id:id(10+i),name})))).error);
 const roles=[['STUDENT','Student','Ayesha Khan'],['LAB_STAFF','Lab Staff','Usman Ali'],['COORDINATOR','Coordinator','Dr. Sara Ahmed'],['ADMIN','Admin','UniLab Administrator']] as const;
 const users: Record<string,string>={};
 const existing=(await db.auth.admin.listUsers({perPage:1000}));check(existing.error);
 let newEnv='';
 for(const [key,role,name] of roles){
  const email=process.env[`DEMO_${key}_EMAIL`] || `${key.toLowerCase()}@unilab.demo`;
  const password=process.env[`DEMO_${key}_PASSWORD`] || randomBytes(24).toString('base64url');
  if(!process.env[`DEMO_${key}_EMAIL`]) newEnv+=`\nDEMO_${key}_EMAIL=${email}`;
  if(!process.env[`DEMO_${key}_PASSWORD`]) newEnv+=`\nDEMO_${key}_PASSWORD=${password}`;
  let user=existing.data.users.find(u=>u.email===email);
  if(user){check((await db.auth.admin.updateUserById(user.id,{password,email_confirm:true})).error);}
  else {const result=await db.auth.admin.createUser({email,password,email_confirm:true});check(result.error);user=result.data.user!;}
  users[key]=user.id;
  check((await db.from('profiles').upsert({id:user.id,name,email,role,department_id:department,active:true})).error);
 }
 if(newEnv) appendFileSync('.env.local',`${newEnv}\nDEMO_MODE=true\n`);
 const labs=[
 {id:id(100),name:'Embedded Systems Lab',department_id:department,capacity:30,location:'Engineering Block · Floor 2',facilities:['Arduino Kits','Oscilloscopes','High-speed Wi-Fi','Projector'],image_url:'/images/lab.webp',description:'A collaborative space for microcontroller projects, embedded programming and electronics experiments.'},
 {id:id(101),name:'Computer Science Lab',department_id:id(2),capacity:40,location:'Computing Block · Floor 1',facilities:['40 Workstations','High-speed Wi-Fi','Projector','Air Conditioning'],image_url:'/images/lab.webp',description:'Modern workstations for software engineering, data science and programming classes.'},
 {id:id(102),name:'Electronics & Circuits Lab',department_id:department,capacity:24,location:'Engineering Block · Floor 1',facilities:['Oscilloscopes','Power Supplies','Breadboards','Safety Equipment'],image_url:'/images/lab.webp',description:'Hands-on circuit design and measurement with professional instrumentation.'},
 {id:id(103),name:'Robotics & Innovation Lab',department_id:department,capacity:20,location:'Innovation Centre · Ground Floor',facilities:['Robot Kits','3D Printers','Workbenches','Projector'],image_url:'/images/lab.webp',description:'Build and test robotic systems in a dedicated prototyping environment.'},
 {id:id(104),name:'Mechanical Workshop',department_id:id(3),capacity:25,location:'Mechanical Block · Ground Floor',facilities:['CNC Equipment','Safety Equipment','Workbenches','Tool Storage'],image_url:'/images/lab.webp',description:'A supervised workshop for fabrication, design and mechanical projects.'}];
 check((await db.from('labs').upsert(labs.map(l=>({...l,status:'Available'})))).error);
 const equipmentNames=['Arduino Uno Kit','Digital Oscilloscope','Raspberry Pi 5','Breadboard Kit','Digital Multimeter','Bench Power Supply','Soldering Station','Logic Analyzer','Laptop Workstation','USB Microscope','ESP32 Development Kit','Sensor Module Kit','Robot Car Kit','3D Printer','Servo Motor Kit','Stepper Motor Kit','Precision Tool Set','Safety Goggles','Function Generator','CNC Training Machine'];
 check((await db.from('equipment').upsert(equipmentNames.map((name,i)=>({id:id(200+i),name,category:['Development Kits','Measurement','Computing','Robotics','Fabrication'][Math.floor(i/4)],category_id:id(10+Math.floor(i/4)),total_quantity:i===0?20:i===13||i===19?2:12,lab_id:labs[Math.floor(i/4)].id,condition:'Good',maintenance_status:false,unit_value_high:[1,13,19].includes(i),description:`${name} for supervised university coursework and research.`,image_url:'/images/equipment.webp'})))).error);
 check((await db.from('rules').upsert([{key:'max_duration_hours',value:4},{key:'max_advance_days',value:14},{key:'max_quantity_per_user',value:10},{key:'late_return_limit',value:3},{key:'restriction_days',value:7},{key:'high_value_approval_required',value:true}])).error);
 // Stable IDs make rerunning the seed safe. All history is clearly marked demo data.
 const now=new Date();
 const history=Array.from({length:60},(_,i)=>{const day=new Date(now);day.setUTCDate(day.getUTCDate()-(60-i));day.setUTCHours(4+(i%5),0,0,0);const end=new Date(+day+2*3600000); const state=i%11===0?'Rejected':i%9===0?'Cancelled':'Completed';return {id:id(1000+i),user_id:users.STUDENT,lab_id:labs[i%5].id,start_at:day.toISOString(),end_at:end.toISOString(),purpose:['Demo: Embedded systems practical','Demo: Coursework project','Demo: Research experimentation','Demo: Robotics workshop'][i%4],attendees:8+(i%12),booking_status:state,approval_status:state==='Rejected'?'Rejected':'Approved',approved_by:users.ADMIN,notes:'Seeded demonstration data; not measured university usage.',created_at:new Date(+day-86400000).toISOString()};});
 check((await db.from('bookings').upsert(history,{ignoreDuplicates:true})).error);
 check((await db.from('booking_items').upsert(history.map((b,i)=>({booking_id:b.id,equipment_id:id(200+(i%20)),quantity:1+i%3})),{onConflict:'booking_id,equipment_id',ignoreDuplicates:true})).error);
 const start=new Date(+now-10*60000),end=new Date(+now+110*60000);
 const live=[{id:id(1100),user_id:users.COORDINATOR,lab_id:null,start_at:start.toISOString(),end_at:end.toISOString(),purpose:'Demo: Arduino kit reservation',attendees:1,booking_status:'Reserved',approval_status:'Approved',approved_by:users.ADMIN},{id:id(1101),user_id:users.LAB_STAFF,lab_id:null,start_at:start.toISOString(),end_at:end.toISOString(),purpose:'Demo: Embedded systems practical',attendees:1,booking_status:'In Use',approval_status:'Approved',approved_by:users.ADMIN}];
 check((await db.from('bookings').upsert(live,{ignoreDuplicates:true})).error);
 check((await db.from('booking_items').upsert([{booking_id:id(1100),equipment_id:id(200),quantity:8},{booking_id:id(1101),equipment_id:id(200),quantity:5}],{onConflict:'booking_id,equipment_id',ignoreDuplicates:true})).error);
 check((await db.from('issue_returns').upsert({id:id(1200),booking_id:id(1101),equipment_id:id(200),quantity:5,issued_at:start.toISOString(),due_at:end.toISOString(),issue_condition:'Good',issued_by:users.LAB_STAFF},{onConflict:'booking_id,equipment_id',ignoreDuplicates:true})).error);
 const tomorrow=new Date(now);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);tomorrow.setUTCHours(5,0,0,0);
 check((await db.from('bookings').upsert({id:id(1102),user_id:users.STUDENT,lab_id:id(100),start_at:tomorrow.toISOString(),end_at:new Date(+tomorrow+2*3600000).toISOString(),purpose:'Demo: Embedded systems project',attendees:12,booking_status:'Pending Approval',approval_status:'Pending'},{ignoreDuplicates:true})).error);
 check((await db.from('booking_items').upsert({booking_id:id(1102),equipment_id:id(200),quantity:3},{onConflict:'booking_id,equipment_id',ignoreDuplicates:true})).error);
 check((await db.from('notifications').upsert([{id:id(1300),user_id:users.STUDENT,booking_id:id(1102),message:'Your Embedded Systems Lab booking is pending approval.',category:'Bookings'},{id:id(1301),user_id:users.STUDENT,message:'Welcome to UniLab. Browse labs and equipment to begin your next project.',category:'System'}],{ignoreDuplicates:true})).error);
 check((await db.from('audit_log').upsert({id:id(1400),actor:users.ADMIN,action:'demo.seeded',entity:'system',after_data:{demonstration:true,labs:5,equipment:20,history_days:60}},{ignoreDuplicates:true})).error);
 console.log('Seed complete: five labs, twenty equipment entries, four Auth accounts and sixty days of clearly labeled demonstration data. Demo credentials saved server-side to .env.local.');
}
seed().catch(error => { console.error('Seeding failed:', error.message); process.exitCode = 1; });

