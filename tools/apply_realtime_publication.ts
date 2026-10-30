import 'dotenv/config';

async function run() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_ID;

  if (!token || !projectRef) {
    console.error('Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_ID in .env');
    process.exit(1);
  }

  const sql = `
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'reactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'community_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'community_join_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_join_requests;
    END IF;
END $$;

ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.reactions REPLICA IDENTITY FULL;
ALTER TABLE public.community_members REPLICA IDENTITY FULL;
ALTER TABLE public.community_join_requests REPLICA IDENTITY FULL;
`;

  console.log(`Enabling Supabase Realtime for social tables...`);

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
    console.error('Publication execution failed:', responseText);
    process.exit(1);
  }

  console.log('Realtime publication enabled successfully for social tables!');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
