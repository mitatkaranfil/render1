import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://orsdzataosugvjvrushu.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yc2R6YXRhb3N1Z3ZqdnJ1c2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NjgwODgsImV4cCI6MjA1OTM0NDA4OH0.irjY1OgOhw8kDHYxgGTGblgPz4iH4u1Vvwxy4YcsQuc';

// Log Supabase configuration
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key available:', Boolean(supabaseKey));

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 