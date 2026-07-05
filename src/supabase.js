import { createClient } from '@supabase/supabase-js';

// Coloque o seu link verdadeiro do Supabase entre as aspas abaixo:
const supabaseUrl = "https://aeygpbcmypouyhrcjoam.supabase.co";

// Coloque a sua chave enorme do Supabase entre as aspas abaixo:
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleWdwYmNteXBvdXlocmNqb2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDkyMzIsImV4cCI6MjA5MzMyNTIzMn0.WfhmiNUda3FG5yUnGrYC53gdTzCmkCx4K0QIH0y9B5E";

export const supabase = createClient(supabaseUrl, supabaseKey);