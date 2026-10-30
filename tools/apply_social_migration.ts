import 'dotenv/config';
import fs from 'fs';
import path from 'path';

async function run() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_ID;

  if (!token || !projectRef) {
    console.error('Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_ID in .env');
    process.exit(1);
  }

  const migrationPath = path.resolve('supabase/migrations/20261103_community_social_platform.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`Executing migration: 20261103_community_social_platform.sql (${sql.length} bytes)...`);

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const responseText = await response.text();
  console.log(`HTTP Status: ${response.status}`);
  if (!response.ok) {
    console.error('Migration execution failed:', responseText);
    process.exit(1);
  }

  console.log('Migration successfully applied to Supabase database!');
  console.log('Response sample:', responseText.slice(0, 300));
}

run().catch((err) => {
  console.error('Fatal error applying migration:', err);
  process.exit(1);
});
