
// Helper to get form data
function getFormData(step) {
    const data = {};

    if (step === 'personal') {
        data.full_name = document.getElementById('fullName').value;
        data.mobile_number = document.getElementById('mobileNumber').value;

        // Capture Document Type
        const docTypeSelect = document.getElementById('docType');
        if (docTypeSelect) {
            data.doc_type = docTypeSelect.value;
        }

        // Combine into one address string for backward compatibility, but store individual fields if needed
        const village = document.getElementById('village').value;
        const district = document.getElementById('district').value;
        const state = document.getElementById('state').value;

        data.village = village;
        data.district = district;
        data.state = state;
        data.address = `${village}, ${district}, ${state}`;
    } else if (step === 'land') {
        data.land_size = document.getElementById('landSize').value;
        data.current_crop = document.getElementById('currentCrop').value;
        // data.land_document = document.getElementById('landDocument').files[0]; // TODO: Upload
        // data.land_photo = document.getElementById('landPhoto').files[0]; // TODO: Upload
        data.gps_lat = document.getElementById('gpsLatitude').value;
        data.gps_lng = document.getElementById('gpsLongitude').value;
    } else if (step === 'income') {
        data.annual_income = document.getElementById('annualIncome').value;
        // data.income_certificate = document.getElementById('incomeCertificate').files[0]; // TODO: Upload
    } else if (step === 'loan') {
        data.loan_amount = document.getElementById('loanAmount').value;
        data.loan_purpose = document.getElementById('loanPurpose').value;
        data.repayment_period = document.getElementById('repaymentPeriod').value;
    } else if (step === 'bank') {
        const hasAccountEl = document.getElementById('hasBankAccount');
        if (hasAccountEl) {
            data.has_bank_account = hasAccountEl.value;
            if (data.has_bank_account === 'no') {
                data.account_holder_name = 'N/A';
                data.account_number = 'N/A';
                data.ifsc_code = 'N/A';
                data.previous_loans = 'no';
                return data;
            }
        }
        data.account_holder_name = document.getElementById('accountHolderName').value;
        data.account_number = document.getElementById('accountNumber').value;
        data.ifsc_code = document.getElementById('ifscCode').value;
        data.previous_loans = document.getElementById('previousLoans').value;
    }

    return data;
}

// Handle intermediate steps
async function handleStepSubmit(event, step, nextPage) {
    event.preventDefault();

    const currentData = getFormData(step);

    // Special handling for doc_type (needs to be in top-level sessionStorage for final submit logic)
    if (currentData.doc_type) {
        sessionStorage.setItem('doc_type', currentData.doc_type);
    }

    // Async: Handle Profile Picture for Personal Step
    if (step === 'personal') {
        const fileInput = document.getElementById('profilePicture');
        if (fileInput && fileInput.files[0]) {
            try {
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(fileInput.files[0]);
                });
                currentData.profile_picture = base64;
            } catch (e) {
                console.warn("Failed to process profile picture", e);
            }
        }
    }

    // Retrieve existing data
    let allData = JSON.parse(sessionStorage.getItem('greatwhitefin_registration_data') || '{}');

    // Merge new data
    allData = { ...allData, ...currentData };

    // Save back to session storage
    sessionStorage.setItem('greatwhitefin_registration_data', JSON.stringify(allData));

    console.log('Data saved for step:', step, allData);

    // Navigate to next page
    window.location.href = nextPage;
}

// Handle final submission
// Handle final submission
async function handleFinalSubmit(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = 'Submitting...';
    submitBtn.disabled = true;

    try {
        const currentData = getFormData('bank');
        let allData = JSON.parse(sessionStorage.getItem('greatwhitefin_registration_data') || '{}');
        const regType = sessionStorage.getItem('registration_type') || 'manual';
        const docType = sessionStorage.getItem('doc_type') || 'unknown';

        // Helper to safely parse numbers
        const safeParseFloat = (val) => {
            if (!val || val === '') return 0;
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        };

        // Clean data before calculation and submission
        allData.annual_income = safeParseFloat(allData.annual_income);
        allData.land_size = safeParseFloat(allData.land_size);
        allData.gps_lat = safeParseFloat(allData.gps_lat);
        allData.gps_lng = safeParseFloat(allData.gps_lng);

        // Helper: Calculate Credit Score (Simple Simulation)
        function calculateCreditScore(data) {
            let score = 300; // Base score
            // 1. Income factor
            if (data.annual_income > 500000) score += 150;
            else if (data.annual_income > 200000) score += 100;
            else score += 50;

            // 2. Land factor
            if (data.land_size > 5) score += 150;
            else if (data.land_size > 2) score += 100;
            else score += 50;

            // 3. Document Verification Bonus
            if (docType === 'aadhar') score += 50;

            // 4. AgriStack Verified Bonus
            if (regType === 'agristack') score += 100;

            return Math.min(900, score);
        }

        // Merge final data
        let finalPayload = { ...allData, ...currentData };
        finalPayload.doc_type = docType;
        finalPayload.credit_score = calculateCreditScore(finalPayload);

        // Remove loan fields if they exist (since we removed loan page)
        delete finalPayload.loan_amount;
        delete finalPayload.loan_purpose;
        delete finalPayload.repayment_period;

        // Ensure payload fields match schema types (handle potential empty strings for numeric columns if schema changed)
        // If explicit schema validation is needed, add here. For now, cleaned numbers above help.

        console.log(`Submitting as [${regType}] to Supabase:`, finalPayload);

        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized. check your connection or config.');
        }

        let tableName = 'farmers_manual';
        if (regType === 'agristack') {
            tableName = 'farmers_agristack';
        }

        const { data, error } = await window.supabaseClient
            .from(tableName)
            .insert([finalPayload])
            .select();

        if (error) {
            throw error;
        }

        alert('Registration Successful!');

        // Save user session for dashboard display
        const userProfile = {
            name: finalPayload.full_name,
            role: 'Farmer',
            village: finalPayload.village,
            district: finalPayload.district,
            credit_score: finalPayload.credit_score,
            id: (data && data[0] && data[0].id) ? data[0].id : null, // Store ID if returned
            profile_picture: finalPayload.profile_picture
        };
        localStorage.setItem('active_user', JSON.stringify(userProfile));

        sessionStorage.removeItem('greatwhitefin_registration_data');
        sessionStorage.removeItem('registration_type');
        sessionStorage.removeItem('doc_type');

        window.location.href = '../farmer/dashboard.html';

    } catch (error) {
        console.error('Error submitting application:', error);
        alert('Failed to submit application: ' + error.message);
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
}
