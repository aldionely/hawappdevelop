import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gkbshvnatqqmlabaychu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrYnNodm5hdHFxbWxhYmF5Y2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MTIyNzAsImV4cCI6MjA2MjE4ODI3MH0.YANRQdjnC4ZyxEe6FWYl_20nIQtNOJ6XSM_pwDvgOrg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);