wrangler deploy --env production  # Worker
supabase db push                  # Finalize schema
npm run build && npm run preview # Frontend (Cloudflare Pages)