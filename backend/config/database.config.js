// BACKEND/CONFIG/DATABASE.CONFIG.JS

// import 'dotenv/config';
import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);