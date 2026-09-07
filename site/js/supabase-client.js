// Shared Supabase client for the portfolio site + dashboard.
// Data lives in the "portfolio" schema of Josué's Matambre project
// (kept fully separate from that client's own "public" schema/tables).
(() => {
  const SUPABASE_URL = 'https://jvvwxzjczzplatehvlag.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_IOHDiv5YjxNBB88Z1P9L8g_c7FiGwzO';

  if (!window.supabase) {
    console.warn('supabase-js failed to load from the CDN; falling back to static content.');
    return;
  }

  window.portfolioSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    db: { schema: 'portfolio' },
  });
})();
