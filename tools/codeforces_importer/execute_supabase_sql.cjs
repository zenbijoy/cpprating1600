const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

async function runSql() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_ID || 'ptwrscbantaseijldwgt';

  if (!token) {
    console.error('Error: SUPABASE_ACCESS_TOKEN is missing');
    process.exit(1);
  }

  const migrationFile = path.resolve(__dirname, '../../supabase/migrations/20261029_codeforces_engine.sql');
  const sql = fs.readFileSync(migrationFile, 'utf-8');

  console.log(`[SQL Runner] Executing migration for project '${projectRef}'...`);
  console.log(`[SQL Runner] SQL Migration length: ${sql.length} characters`);

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  console.log(`[SQL Runner] HTTP Response status: ${res.status}`);
  const text = await res.text();
  console.log('[SQL Runner] Response:', text.slice(0, 500));

  if (res.ok) {
    console.log('[SQL Runner] Migration successfully applied to Supabase database!');
  } else {
    console.error('[SQL Runner] Failed to apply migration.');
    process.exit(1);
  }
}

runSql().catch((err) => {
  console.error('[SQL Runner] Fatal error:', err);
  process.exit(1);
});
