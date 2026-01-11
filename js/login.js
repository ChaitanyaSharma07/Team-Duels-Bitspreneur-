document.addEventListener('DOMContentLoaded', () => {

    // --- Farmer Login ---
    const farmerForm = document.getElementById('farmerLoginForm');
    if (farmerForm) {
        farmerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const mobileNumber = document.getElementById('mobileNumber').value;
            const btn = farmerForm.querySelector('button');
            const errorMsg = document.getElementById('errorMsg');

            btn.textContent = 'Logging in...';
            btn.disabled = true;
            errorMsg.style.display = 'none';

            try {
                if (!window.supabaseClient) throw new Error('Supabase not connected');

                // Check Manual table first
                let { data: manualData, error: manualError } = await window.supabaseClient
                    .from('farmers_manual')
                    .select('*')
                    .eq('mobile_number', mobileNumber)
                    .single(); // Assuming unique mobile numbers

                if (manualError && manualError.code !== 'PGRST116') throw manualError; // Ignore "Row not found" error, throw others

                // Check Agristack table if not found
                let userStartData = manualData;
                let userType = 'manual';

                if (!userStartData) {
                    const { data: agristackData, error: agError } = await window.supabaseClient
                        .from('farmers_agristack')
                        .select('*')
                        .eq('mobile_number', mobileNumber)
                        .single();

                    if (agError && agError.code !== 'PGRST116') throw agError;

                    if (agristackData) {
                        userStartData = agristackData;
                        userType = 'agristack';
                    }
                }

                if (!userStartData) {
                    throw new Error('User not found. Please register first.');
                }

                // Success
                const userProfile = {
                    id: userStartData.id,
                    name: userStartData.full_name,
                    role: 'Farmer',
                    village: userStartData.village,
                    district: userStartData.district,
                    credit_score: userStartData.credit_score, // Note: We use this internally but dashboard might hide it if requested
                    type: userType
                };
                localStorage.setItem('active_user', JSON.stringify(userProfile));

                // Redirect
                window.location.href = '../farmer/dashboard.html';

            } catch (err) {
                console.error(err);
                errorMsg.textContent = err.message;
                errorMsg.style.display = 'block';
                btn.textContent = 'Log In';
                btn.disabled = false;
            }
        });
    }

    // --- MFI Login ---
    const mfiForm = document.getElementById('mfiLoginForm');
    if (mfiForm) {
        mfiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const orgName = document.getElementById('orgName').value;
            const rbiReg = document.getElementById('rbiRegNumber').value;
            const btn = mfiForm.querySelector('button');
            const errorMsg = document.getElementById('errorMsg');

            btn.textContent = 'Logging in...';
            btn.disabled = true;
            errorMsg.style.display = 'none';

            try {
                if (!window.supabaseClient) throw new Error('Supabase not connected');

                // Check MFI table
                const { data, error } = await window.supabaseClient
                    .from('mfi_registrations')
                    .select('*')
                    .ilike('org_name', orgName) // Case-insensitive check might be better
                    .eq('rbi_reg_number', rbiReg)
                    .single();

                if (error || !data) {
                    throw new Error('Organization not found or details incorrect.');
                };

                // Success
                const userProfile = {
                    id: data.id,
                    name: data.org_name,
                    role: 'MFI / Bank',
                    type: data.institution_type
                };
                localStorage.setItem('active_user', JSON.stringify(userProfile));

                // Redirect
                window.location.href = '../bank/dashboard.html';

            } catch (err) {
                console.error(err);
                errorMsg.textContent = err.message;
                errorMsg.style.display = 'block';
                btn.textContent = 'Log In';
                btn.disabled = false;
            }
        });
    }
});
