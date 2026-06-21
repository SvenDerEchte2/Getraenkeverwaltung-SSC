const supabaseUrl = "https://tldwrqgigaadglocbbyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZHdycWdpZ2FhZGdsb2NiYnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDExNjgsImV4cCI6MjA5NzM3NzE2OH0.ZTeGYHXvBtK5s-ZdGtsQmKiNWH_kE2_KLof-viZRxRo";

// WICHTIG: createClient direkt aus window.supabase holen
const { createClient } = supabase;

window.supabaseClient = createClient(supabaseUrl, supabaseKey);