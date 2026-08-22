/**
 * Supabase Client Configuration
 * BizPilot AI - Small Business Back-Office Agent
 */

import { createClient } from '@supabase/supabase-js';

// Supabase project credentials (use publishable/anon key on client side)
export const SUPABASE_URL = process.env.SUPABASE_URL || "https://owwhkybozdarcfuzckcm.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_msTnFGfVgTGUla22-amNnQ_bGQsSBtI";
export const SUPABASE_JWKS_URL = "https://owwhkybozdarcfuzckcm.supabase.co/auth/v1/.well-known/jwks.json";

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export default supabase;
