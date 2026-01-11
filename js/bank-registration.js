// js/bank-registration.js

// 1. Helper to collect data from forms
function saveStepData(stepName) {
    const form = document.querySelector('form');
    // If no form (e.g. success page), skip
    if (!form) return;

    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
        // Handle checkboxes (arrays) if multiple with same name, or just booleans
        if (data[key]) {
            if (!Array.isArray(data[key])) {
                data[key] = [data[key]];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    });

    let currentSessionData = JSON.parse(sessionStorage.getItem('mfi_registration_data') || '{}');
    sessionStorage.setItem('mfi_registration_data', JSON.stringify({ ...currentSessionData, ...data }));
}

// 2. Attach listeners to forms to save data before navigating
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            // Check if this is Step 7 (Payment)
            const path = window.location.pathname;

            if (path.includes('register-step7.html')) {
                e.preventDefault();
                saveStepData('payment');
                submitMfiRegistration();
            } else {
                // For other steps, just save and let default action happen (or JS handle it)
                saveStepData('step');
            }
        });
    }
});

// 3. Final Submission Logic
async function submitMfiRegistration() {
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Registering...';
    submitBtn.disabled = true;

    try {
        const allData = JSON.parse(sessionStorage.getItem('mfi_registration_data') || '{}');

        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized.');
        }

        // A. Insert MFI Registration
        const mfiPayload = {
            org_name: allData.org_name || 'Demo Org',
            institution_type: allData.institution_type,
            rbi_reg_number: allData.rbi_reg_number,
            settlement_account_number: allData.account_number,
            merchant_id: allData.merchant_id
        };

        const { data: mfiData, error: mfiError } = await window.supabaseClient
            .from('mfi_registrations')
            .insert([mfiPayload])
            .select()
            .single();

        if (mfiError) throw mfiError;

        const mfiId = mfiData.id;

        // B. Insert Products (Linked by mfiId)
        const productPayload = {
            mfi_id: mfiId,
            product_name: allData.product_name || 'Standard Crop Loan',
            min_loan_amount: allData.min_loan_amount || 10000,
            max_loan_amount: allData.max_loan_amount || 500000,
        };

        const { error: productError } = await window.supabaseClient
            .from('mfi_products')
            .insert([productPayload]);

        if (productError) throw productError;

        alert('Registration Successful!');

        // Save user session for dashboard display
        const userProfile = {
            name: allData.org_name,
            role: 'MFI / Bank',
            type: allData.institution_type,
            id: mfiId
        };
        localStorage.setItem('active_user', JSON.stringify(userProfile));

        sessionStorage.removeItem('mfi_registration_data');

        // REDIRECT TO DASHBOARD
        window.location.href = 'dashboard.html';

    } catch (err) {
        console.error(err);
        alert('Registration failed: ' + err.message);
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}
