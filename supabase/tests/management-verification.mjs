import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
if(process.env.SUPABASE_PROJECT_REF!=='ahewjncliytgfphaepbz') throw new Error('Authorized project required');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let fixture;
const check=result=>{if(result.error)throw new Error(result.error.message);return result.data;};
try {
 const people=check(await db.from('profiles').select('id,role,department_id').in('role',['Admin','Student']));
 const admin=people.find(p=>p.role==='Admin'),student=people.find(p=>p.role==='Student');
 const email=`verification-${Date.now()}@unilab.demo`;
 fixture=check(await db.auth.admin.createUser({email,password:randomBytes(24).toString('base64url'),email_confirm:true})).user;
 const args={p_actor:admin.id,p_user_id:fixture.id,p_name:'Temporary verification user',p_email:email,p_role:'Student',p_department_id:student.department_id,p_active:false};
 const denied=await db.rpc('create_profile',{...args,p_actor:student.id});
 if(!denied.error||denied.error.code!=='42501')throw new Error('Student profile creation was not denied');
 check(await db.rpc('create_profile',args));
 const email2=`verification-updated-${Date.now()}@unilab.demo`;
 check(await db.auth.admin.updateUserById(fixture.id,{email:email2,email_confirm:true}));
 check(await db.rpc('manage_resource',{p_actor:admin.id,p_entity:'profiles',p_id:fixture.id,p_data:{email:email2}}));
 const profile=check(await db.from('profiles').select('email').eq('id',fixture.id).single());
 if(profile.email!==email2)throw new Error('Email synchronization failed');
 console.log('Hosted service-role admin user creation, Student denial, Auth email update and profile synchronization verified.');
} catch(e){console.error('Hosted management verification failed:',e.message);process.exitCode=1;}
finally {if(fixture){check(await db.from('audit_log').delete().eq('entity_id',fixture.id));check(await db.from('profiles').delete().eq('id',fixture.id));check(await db.auth.admin.deleteUser(fixture.id));console.log('Temporary Auth/profile fixture and audit removed.');}}
