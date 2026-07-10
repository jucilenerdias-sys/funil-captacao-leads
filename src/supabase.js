import { createClient } from '@supabase/supabase-js';

// Coloque o seu link verdadeiro do Supabase entre as aspas abaixo:
const supabaseUrl = "https://obsrcrfstefjnxseqbmh.supabase.co/rest/v1/";

// Coloque a sua chave enorme do Supabase entre as aspas abaixo:
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ic3JjcmZzdGVmam54c2VxYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTAwODgsImV4cCI6MjA5OTI2NjA4OH0.pwOH1PDt3zBCDWvfn7vblyT2ceeIjKrROvMRB1c7C78";

export const supabase = createClient(supabaseUrl, supabaseKey);