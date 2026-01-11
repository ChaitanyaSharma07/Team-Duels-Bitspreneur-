document.addEventListener('DOMContentLoaded', () => {
    console.log('GreatWhite Fin App Initialized');

    // Auto-Login Logic
    try {
        const user = JSON.parse(localStorage.getItem('active_user'));

        // If user is already logged in, redirect to respective dashboard
        // Only do this if we are currently on index.html or a public page (not already on a dashboard)
        const path = window.location.pathname;
        const page = path.split("/").pop();

        // Exclude redirection if we are already on a dashboard or in the registration/login flow that might need to be accessed
        // We assume 'index.html' is the main entry point to check.
        if (user && (page === 'index.html' || page === '')) {
            console.log('User logged in, redirecting to dashboard...');
            if (user.role === 'Farmer') {
                window.location.href = 'farmer/dashboard.html';
            } else if (user.role === 'MFI / Bank') {
                window.location.href = 'bank/dashboard.html';
            }
        }
    } catch (e) {
        console.error('Error checking user session:', e);
    }
});
