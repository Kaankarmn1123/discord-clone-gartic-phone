import { createClient } from '@supabase/supabase-js';

// Using hardcoded credentials because process.env is not available in the browser without a build step.
export const supabaseUrl = 'https://jrdznwtwnbzizneflvij.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZHpud3R3bmJ6aXpuZWZsdmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MzUxMzQsImV4cCI6MjA3NjMxMTEzNH0.0uMgY-XZRnz6TawnPQN5kyPj2DkKpAJE5Kcgp-m2BSU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);