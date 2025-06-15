import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://czeypzqahseqiaonyiwc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZXlwenFhaHNlcWlhb255aXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzYzMjcsImV4cCI6MjA2NTUxMjMyN30.XF80MvGcGJ8k9BRF3zjBfgxdUQ85s5PiPqZsbICY5GQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);