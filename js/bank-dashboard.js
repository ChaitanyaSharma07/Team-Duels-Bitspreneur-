document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation Logic
    const tabs = document.querySelectorAll('.sidebar-link[data-tab]');
    const contents = document.querySelectorAll('.tab-content');
    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.text-light');

    // --- Session Verification ---
    const user = JSON.parse(localStorage.getItem('active_user'));
    if (!user || user.role !== 'MFI / Bank') {
        window.location.href = '../index.html';
        return;
    }
    if (user && user.role === 'MFI / Bank') {
        // Update Sidebar Profile
        const sidebarRole = document.querySelector('.user-info .role');

        if (sidebarRole) sidebarRole.textContent = user.name;

        // Update Header Avatar (Initials)
        const headerAvatar = document.querySelector('#profileDropdownBtn .avatar');
        if (headerAvatar) {
            // Abbreviate name (e.g. State Bank of India -> SBI)
            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 3).toUpperCase();
            headerAvatar.textContent = initials;
        }

        // Profile Menu Logic moved to end of file
    }

    const titles = {
        'home': { title: 'Bank Overview', subtitle: 'Manage your lending portfolio and review applications.' },
        'loans': { title: 'Loan Management', subtitle: 'View and manage all your active and pending loans.' },
        'applicants': { title: 'Applicant Management', subtitle: 'Review farmer applications and general registered farmers.' }
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');

            // Hide all content
            contents.forEach(c => c.classList.remove('active'));

            // Show target content
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');

                // Update header text
                if (titles[targetId]) {
                    pageTitle.textContent = titles[targetId].title;
                    pageSubtitle.textContent = titles[targetId].subtitle;
                }
            }
        });
    });

    // Sub-tab toggling for Applicants (Farmers Applied vs General Farmers)
    const viewButtons = document.querySelectorAll('.toggle-view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-view'); // Note: HTML needs update to support this attr if missing
            // Fallback if data-view is missing but using onclick in HTML
            // The HTML uses explicit onclicks that handle display. 
            // We can leave this listener as redundant or strictly for "active" class toggling if implemented.
        });
    });

    // Modal Logic
    const modalOverlay = document.getElementById('farmerModal');
    const closeModalBtn = document.querySelector('.modal-close');

    function openModal(farmerData, context = 'general') {
        const nameEl = modalOverlay.querySelector('.farmer-name');
        if (nameEl) nameEl.textContent = farmerData.name || 'Unknown Farmer';

        // Helper to safely set text
        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || '--';
        };

        const setDisplay = (id, show) => {
            const el = document.getElementById(id);
            // Hide the parent container if it's a detail row
            if (el && el.parentElement && el.parentElement.tagName === 'DIV' && el.parentElement.parentElement) {
                // The structure is Label - Value. Parent is the Flex row. 
                // Checks if we are targeting the Value span, its parent is the row.
                el.parentElement.style.display = show ? 'flex' : 'none';
            } else if (el) {
                el.style.display = show ? 'block' : 'none';
            }
        };

        // Populate common details
        setText('modalFarmerLocation', '📍 ' + (farmerData.location || (farmerData.village + ', ' + farmerData.district) || 'Unknown'));

        // Contextual Privacy Logic
        // "do not show their bank name and IFSC code just their credit history should be visible and neither their phone number"

        // ALWAYS SHOW:
        // 1. Profile Pic
        // 2. Name & Location (Done above)
        // 3. Crop
        // 4. Credit History

        // ALWAYS HIDE (for General View per request, likely for Loans too unless needed):
        // Contact Details

        setText('modalCreditScore', 'Credit Score: ' + (farmerData.credit_score || 'N/A'));
        setText('modalLandArea', farmerData.land_size ? farmerData.land_size + ' Acres' : '--');
        setText('modalCrops', farmerData.current_crop || '--');

        // Use 'modalFinancialHistory' for Credit History text
        const historyText = farmerData.credit_history || (farmerData.credit_score > 700 ? 'Good repayment history.' : 'Limited credit history.');
        setText('modalFinancialHistory', historyText);

        // Hide sensitive info in General View
        // The user request: "neither their phone number"
        const showSensitive = false; // Always false for now based on strict instructions

        setDisplay('modalMobile', showSensitive);
        setDisplay('modalAccount', showSensitive);
        setDisplay('modalIFSC', showSensitive);
        setDisplay('modalBankName', showSensitive);

        // Also hide Soil/Irrigation if not requested? User list: "profile picture, name, location, crop, credit history".
        // Implicitly implies others might be hidden or optional. I'll keep Land/Soil visible as they are 'Crop' related context, but can hide if cluttered. 
        // User didn't say *only* these, but "show the following things". I will leave Land/Soil as they are harmless farm info.

        setText('modalSoilType', farmerData.soil_type || '--');
        setText('modalIrrigation', farmerData.irrigation_source || '--');

        // Image
        const imgEl = document.getElementById('modalFarmerImage');
        if (imgEl) {
            // Use profile_picture from DB if available, else default
            imgEl.src = farmerData.profile_picture || farmerData.image || `https://api.dicebear.com/9.x/micah/svg?seed=${farmerData.name}`;
        }

        modalOverlay.classList.add('active');
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // --- Supabase Integration ---
    async function fetchMFILoans() {
        if (!window.supabaseClient) return;
        const user = JSON.parse(localStorage.getItem('active_user'));
        if (!user || !user.id) return; // Need user ID

        const container = document.querySelector('.loans-grid');
        if (!container) return;

        // If the container is in the 'applicants' tab it might overlap if class names are reused. 
        // Ensure we are in the Loan Management tab's grid.
        // The HTML uses .loans-grid in .tab-content#loans .

        // Wait, if content is hidden, we can still populate it.

        const { data, error } = await window.supabaseClient
            .from('mfi_products')
            .select('*')
            //.eq('mfi_id', user.id); // FILTER BY MFI ID
            // If the user ID in local storage (from registration sim) doesn't match a real UUID in DB, this returns nothing.
            // For Demo purposes, if we want to show *created* loans, we must ensure MFI ID matches.
            // If the mfi_id is null in DB or mismatched, we get 0.
            // I will remove the filter for debugging if empty, BUT current requirement is "showing loans of registered mfis". 
            // Actually, "bank dashboard is not showing the same".
            // If the bank created them, they should see them.
            // I will strictly filter by MFI ID to be correct.
            .eq('mfi_id', user.id);

        if (error) {
            console.error(error);
            return;
        }

        // fallback if no data found and it's a demo user
        if ((!data || data.length === 0) && user.id === 'demo-mfi-id') {
            // Mock display
        } else if (data && data.length > 0) {
            container.innerHTML = createAddLoanButton();
            data.forEach(product => {
                const card = document.createElement('div');
                card.className = 'loan-card';
                card.innerHTML = `
                    <h4 class="loan-title" style="font-size: 1.2rem; font-weight: 700;">${product.product_name}</h4>
                    <div class="loan-details">
                         <div class="detail-item">
                            <span class="label">Amount Range</span>
                            <span class="value">₹${product.min_loan_amount} - ₹${product.max_loan_amount}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:0.5rem; width:100%;">
                        <button class="btn btn-outline" style="flex:1;" onclick="window.location.href='create-loan.html?id=${product.id}'">Edit Details</button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            // Empty state but allow adding
            container.innerHTML = createAddLoanButton() + '<p style="width:100%; text-align:center; margin-top:1rem; color:#888;">No loans created yet.</p>';
        }
    }

    function createAddLoanButton() {
        return `
        <div class="loan-card" style="border: 2px dashed #ccc; background: #fafafa; justify-content: center; align-items: center; cursor: pointer; min-height: 200px;" onclick="window.location.href='create-loan.html'">
            <div style="font-size: 3rem; color: #ccc;">+</div>
            <h4 style="color: #666; font-weight: 600;">Create New Loan</h4>
        </div>
        `;
    }

    function helperInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    // Call fetchGeneralFarmers when tab toggled
    // We also redefine it below in init

    // Initial Load
    fetchDashboardStats();

    async function fetchDashboardStats() {
        if (!window.supabaseClient) return;
        const user = JSON.parse(localStorage.getItem('active_user'));
        if (!user || !user.id) return;

        // Fetch all applications for this MFI
        const { data: apps, error } = await window.supabaseClient
            .from('loan_applications')
            .select('status, amount')
            .eq('mfi_id', user.id);

        if (error) {
            console.error('Error fetching stats:', error);
            return;
        }

        let totalLoans = 0;
        let pending = 0;
        let disbursedAmount = 0;

        if (apps) {
            apps.forEach(app => {
                if (app.status === 'approved') {
                    totalLoans++;
                    disbursedAmount += (app.amount || 0);
                } else if (app.status === 'pending') {
                    pending++;
                }
            });
        }

        // Update UI
        updateStat('statTotalLoans', totalLoans);
        updateStat('statPending', pending);
        updateStat('statDisbursed', '₹ ' + formatCurrency(disbursedAmount));
    }

    function updateStat(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function formatCurrency(num) {
        if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
        if (num >= 100000) return (num / 100000).toFixed(2) + ' L';
        return num.toLocaleString('en-IN');
    }

    // Unified Click Handler
    document.addEventListener('click', async (e) => {
        // GENERAL VIEW (Registered Farmers)
        if (e.target.closest('.view-farmer-btn-general')) {
            const btn = e.target.closest('.view-farmer-btn-general');
            const id = btn.dataset.id;
            const source = btn.dataset.source || 'manual';
            await loadAndShowFarmer(id, 'general', source);
        }

        // LOAN APPLICANT VIEW 
        // LOAN APPLICANT VIEW 
        if (e.target.closest('.view-farmer-btn-loan')) {
            const btn = e.target.closest('.view-farmer-btn-loan');
            const id = btn.dataset.id;
            const source = btn.dataset.source || 'manual';
            await loadAndShowFarmer(id, 'general', source);
        }

        // APPROVE LOAN
        if (e.target.closest('.approve-loan-btn')) {
            const btn = e.target.closest('.approve-loan-btn');
            const appId = btn.dataset.id;

            // Check if ID is valid
            if (!appId || appId === 'undefined') {
                alert('Error: Invalid Application ID. Please refresh and try again.');
                return;
            }

            btn.textContent = 'Approving...';
            btn.disabled = true;

            const { error } = await window.supabaseClient
                .from('loan_applications')
                .update({ status: 'approved' })
                .eq('id', appId);

            // Update Farmer Status in Background (Optimistic)
            const farmerId = btn.dataset.farmerId;
            if (farmerId) {
                window.supabaseClient.from('farmers_manual').update({ application_status: 'approved' }).eq('id', farmerId).then(() => { });
                window.supabaseClient.from('farmers_agristack').update({ application_status: 'approved' }).eq('id', farmerId).then(() => { });
            }

            if (!error) {
                btn.textContent = 'Approved';
                const row = btn.closest('tr');
                if (row) {
                    const badge = row.querySelector('.status-badge');
                    if (badge) {
                        badge.className = 'status-badge status-approved';
                        badge.textContent = 'approved';
                    }
                }
            } else {
                console.error('Error approving loan:', error);
                alert('Error approving: ' + (error.message || 'Unknown error'));
                btn.textContent = 'Approve';
                btn.disabled = false;
            }
        }
    });

    async function loadAndShowFarmer(id, context, source = 'manual') {
        console.log(`Loading farmer: ${id} from ${source}`);
        if (!window.supabaseClient) return;

        let tableName = 'farmers_manual';
        if (source === 'agristack') tableName = 'farmers_agristack';

        // Try fetching from the specified source
        let { data, error } = await window.supabaseClient
            .from(tableName)
            .select('*')
            .eq('id', id)
            .single();

        // Fallback: If not found and source wasn't explicitly certain (or if we want to be robust)
        // Check the other table if first failed
        if (!data && source === 'manual') {
            const res = await window.supabaseClient.from('farmers_agristack').select('*').eq('id', id).single();
            if (res.data) data = res.data;
        } else if (!data && source === 'agristack') {
            const res = await window.supabaseClient.from('farmers_manual').select('*').eq('id', id).single();
            if (res.data) data = res.data;
        }

        if (!data) {
            alert('Could not load farmer details.');
            return;
        }

        openModal(data, context);
    }

    // Fetch Applications
    window.fetchApplications = async function () {
        if (!window.supabaseClient) return;
        const user = JSON.parse(localStorage.getItem('active_user'));
        if (!user || !user.id) return;

        // Target BOTH tables:
        // 1. The main Applicants tab table
        // 2. The 'Farmers Applied for Loans' table in the Loans tab
        const tbodies = [
            document.getElementById('view-applicants-body'),
            document.querySelector('#loan-applicants-section tbody')
        ].filter(el => el != null);

        if (tbodies.length === 0) return;

        // Fetch Apps
        const { data: apps, error: appError } = await window.supabaseClient
            .from('loan_applications')
            .select('*')
            .eq('mfi_id', user.id);

        if (appError) return;

        // If no apps, show empty state in all tables
        if (!apps || apps.length === 0) {
            tbodies.forEach(tbody => {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No applications found.</td></tr>';
            });
            return;
        }

        // Fetch Farmer Details
        const farmerIds = [...new Set(apps.map(a => a.farmer_id))];

        // Fetch from Manual
        const { data: manualFarmers } = await window.supabaseClient
            .from('farmers_manual')
            .select('id, full_name, village, district, credit_score')
            .in('id', farmerIds);

        // Fetch from Agristack
        const { data: agristackFarmers } = await window.supabaseClient
            .from('farmers_agristack')
            .select('id, full_name, village, district, credit_score')
            .in('id', farmerIds);

        let farmers = [];
        if (manualFarmers) farmers = farmers.concat(manualFarmers.map(f => ({ ...f, source: 'manual' })));
        if (agristackFarmers) farmers = farmers.concat(agristackFarmers.map(f => ({ ...f, source: 'agristack' })));

        const farmerMap = {};
        if (farmers) farmers.forEach(f => farmerMap[f.id] = f);

        // Fetch Products
        const productIds = [...new Set(apps.map(a => a.product_id))];
        const { data: products } = await window.supabaseClient
            .from('mfi_products')
            .select('id, product_name')
            .in('id', productIds);

        const productMap = {};
        if (products) products.forEach(p => productMap[p.id] = p);

        // Render Loan Applications Table
        tbodies.forEach(tbody => {
            tbody.innerHTML = '';
            apps.forEach(app => {
                const farmer = farmerMap[app.farmer_id] || {};
                const product = productMap[app.product_id] || { product_name: 'Unknown' };
                const date = new Date(app.created_at).toLocaleDateString();

                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${farmer.full_name || 'N/A'}</td>
                <td>${product.product_name}</td>
                <td>${date}</td>
                <td><span class="status-badge status-${app.status}">${app.status}</span></td>
                <td>
                    <button class="btn btn-outline action-btn view-farmer-btn-loan" data-id="${app.farmer_id}" data-source="${farmer.source || 'manual'}">View Profile</button>
                    <button class="btn btn-primary action-btn approve-loan-btn" style="margin-left: 0.5rem;" data-id="${app.id}" data-farmer-id="${app.farmer_id}" ${app.status === 'approved' ? 'disabled' : ''}>${app.status === 'approved' ? 'Approved' : 'Approve'}</button>
                </td>
            `;
                tbody.appendChild(row);
            });
        });
    }

    // Fetch General Farmers - LIST VIEW implementation
    async function fetchGeneralFarmers() {
        if (!window.supabaseClient) return;

        const container = document.querySelector('#view-general');
        if (!container) return;

        // Reset container
        container.innerHTML = '<h3>Registered Farmers Directory</h3><p>Loading...</p>';

        // Fetch Manual Farmers
        const { data: manualFarmers, error: manualError } = await window.supabaseClient
            .from('farmers_manual')
            .select('id, full_name, village, district, credit_score, application_status');

        console.log('Fetch Manual Result:', { manualFarmers, manualError });

        // Fetch Agristack Farmers
        const { data: agristackFarmers, error: agristackError } = await window.supabaseClient
            .from('farmers_agristack')
            .select('id, full_name, village, district, credit_score, application_status');

        console.log('Fetch Agristack Result:', { agristackFarmers, agristackError });

        if (manualError) console.error('Error fetching farmers_manual:', manualError);
        if (agristackError) console.error('Error fetching farmers_agristack:', agristackError);

        if (manualError && agristackError) {
            container.innerHTML = '<h3>Registered Farmers Directory</h3><p>Error fetching data from both tables. Check Supabase permissions.</p>';
            return;
        }

        // Combine Data
        let allFarmers = [];
        if (manualFarmers) {
            allFarmers = allFarmers.concat(manualFarmers.map(f => ({ ...f, source: 'manual', is_agristack: false })));
        }
        if (agristackFarmers) {
            allFarmers = allFarmers.concat(agristackFarmers.map(f => ({ ...f, source: 'agristack', is_agristack: true })));
        }

        container.innerHTML = '<h3>Registered Farmers Directory</h3>';

        if (allFarmers.length === 0) {
            let msg = '<p>No farmers registered yet.</p>';
            if (manualError || agristackError) {
                msg += `<p style="color:red; font-size:0.9rem;">⚠️ Debug: Failed to fetch from one or more tables. See console for details (F12).</p>`;
            }
            container.innerHTML += msg;
            return;
        }

        const table = document.createElement('table');
        table.className = 'data-table';
        table.style.marginTop = '1rem';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Village</th>
                    <th>District</th>
                    <th>Agristack Status</th>
                    <th>Credit Score</th>
                    <th>Loan Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        allFarmers.forEach(farmer => {
            const row = document.createElement('tr');

            // Status Badge Logic
            let statusBadge = '<span class="status-badge" style="background:#f4f5f7; color:#666;">Not Verified</span>';
            if (farmer.is_agristack) {
                statusBadge = '<span class="status-badge status-approved">Agristack Approved</span>';
            } else {
                statusBadge = '<span class="status-badge" style="background:#fff3cdf7; color:#b7791f;">Manual Reg.</span>';
            }

            row.innerHTML = `
                <td>${farmer.full_name || 'N/A'}</td>
                <td>${farmer.village || '--'}</td>
                <td>${farmer.district || '--'}</td>
                <td>${statusBadge}</td>
                <td><span class="status-badge" style="background:#e3fcef; color:#006644;">${farmer.credit_score || 'N/A'}</span></td>
                <td>
                    ${farmer.application_status === 'pending' ? '<span class="status-badge status-pending">Applied</span>' :
                    farmer.application_status === 'approved' ? '<span class="status-badge status-approved">Active Loan</span>' :
                        '<span style="color:#999;">-</span>'}
                </td>
                <td>
                    <button class="btn btn-outline action-btn view-farmer-btn-general" data-id="${farmer.id}" data-source="${farmer.source}">View Profile</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        container.appendChild(table);
    }

    // --- Profile Menu & Logout Logic ---
    const profileBtn = document.getElementById('profileDropdownBtn');
    const profileMenu = document.getElementById('profileDropdownMenu');

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = profileMenu.style.display === 'none' || profileMenu.style.display === '';
            profileMenu.style.display = isHidden ? 'block' : 'none';
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.style.display = 'none';
            }
        });

        const logoutLink = profileMenu.querySelector('a');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('active_user');
                sessionStorage.clear();
                window.location.href = '../index.html';
            });
        }
    }

    // List 'Recent Loans Disbursed' (Approved status)
    async function fetchRecentDisbursedLoans() {
        if (!window.supabaseClient) return;
        const user = JSON.parse(localStorage.getItem('active_user'));
        if (!user || !user.id) return;

        const tbody = document.getElementById('recent-loans-body');
        if (!tbody) return;

        // Fetch Approved Apps
        const { data: apps, error } = await window.supabaseClient
            .from('loan_applications')
            .select('*')
            .eq('mfi_id', user.id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching recent loans:', error);
            return;
        }

        if (!apps || apps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#888;">No recent loans disbursed.</td></tr>';
            return;
        }

        // Collect IDs
        const farmerIds = [...new Set(apps.map(a => a.farmer_id))];
        const productIds = [...new Set(apps.map(a => a.product_id))];

        // Fetch Farmers (Dual Source)
        const { data: manualFarmers } = await window.supabaseClient
            .from('farmers_manual').select('id, full_name').in('id', farmerIds);
        const { data: agristackFarmers } = await window.supabaseClient
            .from('farmers_agristack').select('id, full_name').in('id', farmerIds);

        const farmerMap = {};
        if (manualFarmers) manualFarmers.forEach(f => farmerMap[f.id] = f.full_name);
        if (agristackFarmers) agristackFarmers.forEach(f => farmerMap[f.id] = f.full_name);

        // Fetch Products
        const { data: products } = await window.supabaseClient
            .from('mfi_products').select('id, product_name').in('id', productIds);

        const productMap = {};
        if (products) products.forEach(p => productMap[p.id] = p.product_name);

        // Render Rows
        tbody.innerHTML = '';
        apps.forEach(app => {
            const borrowerName = farmerMap[app.farmer_id] || 'Unknown Borrower';
            const loanName = productMap[app.product_id] || 'Unknown Loan';
            const amount = app.amount ? `₹${app.amount.toLocaleString('en-IN')}` : '--';
            const date = new Date(app.created_at).toLocaleDateString();

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight: 500;">${borrowerName}</td>
                <td>${loanName}</td>
                <td>${amount}</td>
                <td>${date}</td>
                <td><span class="status-badge status-approved">Disbursed</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    // Initial load
    fetchMFILoans();
    fetchApplications();
    fetchGeneralFarmers();
    fetchRecentDisbursedLoans();

});
