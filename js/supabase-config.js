
// Initialize Supabase client
const supabaseUrl = 'https://rlngtrrbtwehcmbmcahx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbmd0cnJidHdlaGNtYm1jYWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTI2OTIsImV4cCI6MjA4MjQ4ODY5Mn0.Jh_RiGSLU5sD7CA6K06cqymku-aWyK87QBWR-x2vBFI';

// Check if supabase global exists (loaded via CDN)
if (window.supabase) {
    // We attach the client to window.supabaseClient to avoid conflict with the library 'window.supabase'
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase initialized successfully');
} else {
    console.error('Supabase library not loaded. Make sure to include the CDN script before this file.');
}
