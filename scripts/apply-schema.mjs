import postgres from 'postgres';
import { readFileSync } from 'node:fs';
const authorizedProject='ahewjncliytgfphaepbz';
const projectRef=process.env.SUPABASE_PROJECT_REF;
const projectUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(projectRef!==authorizedProject || new URL(projectUrl || 'https://invalid').hostname!==`${authorizedProject}.supabase.co`) throw new Error('Set SUPABASE_PROJECT_REF to the authorized Universitylab project and verify the public project URL before deploying.');
const connection=process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if(!connection) throw new Error('Database connection is not configured. Add the target project database URL server-side.');
const sql=postgres(connection,{ssl:'require',max:1});
try {
 const tables=await sql`select tablename from pg_tables where schemaname='public'`;
 console.log('Public application tables:', tables.map(x=>x.tablename).join(', ') || 'empty');
 if(tables.length) throw new Error('Existing schema detected; deployment skipped. Review an incremental migration before changing it.');
 await sql.begin(async transaction=>{for(const path of ['supabase/schemas/01_core.sql','supabase/schemas/02_workflows.sql','supabase/schemas/03_management.sql']) await transaction.unsafe(readFileSync(path,'utf8'));});
 console.log('UniLab schema deployed transactionally to the authorized empty project.');
} catch(e) { console.error('Schema deployment failed:', e.message);process.exitCode=1; } finally {await sql.end();}
