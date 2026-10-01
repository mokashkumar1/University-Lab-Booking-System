import postgres from 'postgres';
import { readFileSync } from 'node:fs';

const authorizedProject = 'ahewjncliytgfphaepbz';
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = process.env.SUPABASE_PROJECT_REF;
if (projectRef !== authorizedProject || new URL(projectUrl || 'https://invalid').hostname !== `${authorizedProject}.supabase.co`) {
  throw new Error('This migration is limited to the authorized Universitylab Supabase project.');
}

const connection = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connection) throw new Error('Database connection is not configured.');

const sql = postgres(connection, { ssl: 'require', max: 1 });
try {
  const migration = readFileSync('supabase/migrations/20261001143000_auth_lifecycle.sql', 'utf8');
  await sql.begin((transaction) => transaction.unsafe(migration));
  console.log('Account lifecycle migration applied.');
} finally {
  await sql.end();
}
