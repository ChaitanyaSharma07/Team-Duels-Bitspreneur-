
document.addEventListener('DOMContentLoaded', function () {
    // --- Tab Navigation Logic ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const headerSearch = document.getElementById('header-search-container');

    // --- Session Verification ---
    const user = JSON.parse(localStorage.getItem('active_user'));
    if (!user || user.role !== 'Farmer') {
        // Not logged in or wrong role -> Redirect to Home
        window.location.href = '../index.html';
        return;
    }
    if (user && user.role === 'Farmer') {
        // Update Sidebar Profile
        const sidebarName = document.querySelector('.user-info .name');
        const sidebarAvatar = document.querySelector('.user-mini-profile .avatar');

        if (sidebarName) sidebarName.textContent = user.name;

        if (sidebarAvatar) {
            if (user.profile_picture) {
                // If profile picture exists, replace text with image
                sidebarAvatar.textContent = '';
                sidebarAvatar.style.backgroundImage = `url('${user.profile_picture}')`;
                sidebarAvatar.style.backgroundSize = 'cover';
                sidebarAvatar.style.backgroundPosition = 'center';
                sidebarAvatar.style.color = 'transparent'; // Hide any text
            } else {
                sidebarAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            }
        }

        // Update Header Welcome
        if (pageSubtitle) pageSubtitle.textContent = `Welcome back, ${user.name.split(' ')[0]}. Here's your financial summary.`;
    }

    // --- Profile Menu & Logout Logic ---
    const profileBtn = document.getElementById('farmer-profile-btn');
    const profileMenu = document.getElementById('farmer-profile-menu');
    const logoutBtn = document.getElementById('logout-btn');

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = profileMenu.style.display === 'none';
            profileMenu.style.display = isHidden ? 'block' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.style.display = 'none';
            }
        });

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('active_user');
                sessionStorage.clear();
                window.location.href = '../index.html';
            });
        }
    }

    function switchTab(tabId) {
        // Update Sidebar active state
        sidebarLinks.forEach(link => {
            if (link.dataset.tab === tabId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Show/Hide Tab Content
        tabContents.forEach(content => {
            if (content.id === tabId) {
                content.classList.add('active');
                // Animation reset
                content.style.animation = 'none';
                content.offsetHeight; /* trigger reflow */
                content.style.animation = 'fadeIn 0.3s ease-in-out';
            } else {
                content.classList.remove('active');
            }
        });

        // Update Header Info based on Tab
        if (tabId === 'home') {
            if (pageTitle) pageTitle.textContent = 'Overview';
            if (pageSubtitle) pageSubtitle.textContent = "Welcome back, here's your financial summary.";
            if (headerSearch) headerSearch.style.display = 'block';
        } else if (tabId === 'loans') {
            if (pageTitle) pageTitle.textContent = 'My Loans';
            if (pageSubtitle) pageSubtitle.textContent = 'Manage your active loans and repayments.';
            if (headerSearch) headerSearch.style.display = 'none';
            fetchMyActiveLoans();
        } else if (tabId === 'find') {
            if (pageTitle) pageTitle.textContent = 'Find Loans';
            if (pageSubtitle) pageSubtitle.textContent = 'Browse and apply for new loan products.';
            if (headerSearch) headerSearch.style.display = 'none';
        }
    }

    // Initialize sidebar click listeners
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.dataset.tab;
            if (tabId) switchTab(tabId);
        });
    });

    // --- My Loans Tab Logic ---
    const myLoansList = document.getElementById('my-loans-list');
    const myLoanDetails = document.getElementById('my-loan-details');
    const backToMyLoansBtn = document.getElementById('back-to-my-loans');

    if (backToMyLoansBtn) {
        backToMyLoansBtn.addEventListener('click', () => {
            myLoanDetails.style.display = 'none';
            myLoansList.style.display = 'block';
        });
    }

    async function fetchMyActiveLoans() {
        if (!window.supabaseClient) return;
        const user = JSON.parse(localStorage.getItem('active_user'));
        if (!user || !user.id) return;

        const container = document.querySelector('#my-loans-list .loans-grid');
        if (!container) return;

        container.innerHTML = '<p>Loading active loans...</p>';

        try {
            // Fetch Approved Applications
            // using ilike for case-insensitive 'approved' check just in case
            const { data: apps, error } = await window.supabaseClient
                .from('loan_applications')
                .select('*')
                .eq('farmer_id', user.id)
                .ilike('status', 'approved');

            if (error) throw error;

            if (!apps || apps.length === 0) {
                container.innerHTML = '<p>No active loans found.</p>';
                return;
            }

            // Fetch Products
            const productIds = [...new Set(apps.map(a => a.product_id))];
            if (productIds.length === 0) {
                container.innerHTML = '<p>No active loans found (Product Data Missing).</p>';
                return;
            }

            const { data: products, error: prodError } = await window.supabaseClient
                .from('mfi_products')
                .select('*')
                .in('id', productIds);

            if (prodError) throw prodError;

            const productMap = {};
            if (products) products.forEach(p => productMap[p.id] = p);

            // Fetch MFIs
            let mfiIds = [];
            if (products) mfiIds = [...new Set(products.map(p => p.mfi_id))];

            const { data: mfis, error: mfiError } = await window.supabaseClient
                .from('mfi_registrations')
                .select('id, org_name')
                .in('id', mfiIds);

            if (mfiError) throw mfiError;

            const mfiMap = {};
            if (mfis) mfis.forEach(m => mfiMap[m.id] = m.org_name);

            container.innerHTML = '';

            apps.forEach(app => {
                const product = productMap[app.product_id] || {
                    product_name: 'Unknown Product (ID mismatch)',
                    mfi_id: null,
                    interest_rate: 0
                };

                const mfiName = mfiMap[product.mfi_id] || 'Unknown Bank';

                // Mocks for display
                const balance = app.amount;
                const nextDueDate = new Date();
                nextDueDate.setDate(nextDueDate.getDate() + 15);
                const nextDueStr = nextDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                const card = document.createElement('div');
                card.className = 'loan-card';
                card.innerHTML = `
                <div class="loan-badge best-value">Active</div>
                <h4 class="loan-title" style="font-size: 1.2rem; font-weight: 700;">${product.product_name}</h4>
                <p class="text-light" style="margin-bottom: 1rem;">${mfiName}</p>
                <div class="loan-details">
                    <div class="detail-item"><span class="label">Balance</span><span class="value">₹ ${balance ? balance.toLocaleString('en-IN') : '--'}</span></div>
                    <div class="detail-item"><span class="label">Next Due</span><span class="value">${nextDueStr}</span></div>
                </div>
                <button class="btn btn-primary view-my-loan-btn" style="width: 100%;">View Details</button>
            `;

                const btn = card.querySelector('.view-my-loan-btn');
                btn.addEventListener('click', () => showMyLoanDetails(app, product, mfiName));

                container.appendChild(card);
            });

            if (container.children.length === 0) {
                container.innerHTML = `<p>Debug: Found ${apps.length} active apps, but failed to render them.</p>`;
            }

        } catch (err) {
            console.error('Error active loans:', err);
            container.innerHTML = '<p>Error loading loans. Please try again.</p>';
        }
    }

    function showMyLoanDetails(app, product, mfiName) {
        myLoansList.style.display = 'none';
        myLoanDetails.style.display = 'block';
        window.scrollTo(0, 0);

        // Populate Details
        // Title & Bank
        const titleEl = myLoanDetails.querySelector('h2.reg-title');
        const subtitleEl = myLoanDetails.querySelector('h2.reg-title + p'); // p following h2
        if (titleEl) titleEl.textContent = product.product_name;
        const durationText = product.tenure ? ` • Duration: ${product.tenure} Months` : '';
        if (subtitleEl) subtitleEl.textContent = `${mfiName}${durationText}`;

        // Stats Calculation
        // Handle Interest Rate: could be "7%", "7%-9%", or just 7
        let interestRate = 10; // Default
        let interestText = product.interest_rate || '10%';

        if (typeof interestText === 'string') {
            const cleanStr = interestText.replace(/%/g, '').trim();
            if (cleanStr.includes('-')) {
                const parts = cleanStr.split('-').map(s => parseFloat(s.trim()));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    interestRate = (parts[0] + parts[1]) / 2;
                } else {
                    interestRate = parseFloat(parts[0]) || 10;
                }
            } else {
                interestRate = parseFloat(cleanStr) || 10;
            }
        } else if (typeof interestText === 'number') {
            interestRate = interestText;
        }

        // Simplistic EMI Calculation: (P * R * (1+R)^n) / ((1+R)^n - 1)
        // Or just Interest for demo if Tenure is missing
        // Assuming monthly rest
        const principal = app.amount;
        let tenureMonths = 12;
        if (product.tenure) {
            const tStr = String(product.tenure).replace(/months/i, '').trim();
            tenureMonths = parseInt(tStr) || 12;
        }

        const monthlyRate = interestRate / 12 / 100;
        let emi = 0;

        if (monthlyRate > 0) {
            emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
        } else {
            emi = principal / tenureMonths;
        }

        emi = Math.round(emi);

        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 15);

        const stats = myLoanDetails.querySelectorAll('.stats-grid .stat-card');

        if (stats.length >= 3) {
            // Stat 1: Next Payment
            // Structure: span (label), span (value), button (pay)
            const s1 = stats[0];
            s1.children[0].textContent = `Next Payment (Due ${nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
            const val1 = s1.children[1]; // .stat-value
            if (val1) val1.textContent = `₹ ${emi.toLocaleString('en-IN')}`;

            // Re-attach pay listener to the new button if needed or just keep generic
            const payBtn = s1.querySelector('button');
            if (payBtn) {
                payBtn.onclick = () => window.location.href = 'payment.html';
            }

            // Stat 2: Outstanding
            const s2 = stats[1];
            s2.children[1].textContent = `₹ ${app.amount.toLocaleString('en-IN')}`;

            // Stat 3: Interest
            const s3 = stats[2];
            s3.children[1].textContent = `${interestText}% p.a.`;
        }

        // Payment Schedule - Mock Table
        const tbody = myLoanDetails.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
            // Generate 2 past payments
            for (let i = 1; i <= 2; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td>₹ ${emi.toLocaleString('en-IN')}</td>
                <td><span class="status-badge status-approved">Paid</span></td>
            `;
                tbody.appendChild(row);
            }
        }
    }

    // --- Pay Button Logic ---
    const payBtns = document.querySelectorAll('#my-loan-details .btn-primary'); // Assuming Pay Now is a primary btn here
    const paymentModal = document.getElementById('paymentModal');

    payBtns.forEach(btn => {
        if (btn.textContent.includes('Pay Now')) {
            btn.addEventListener('click', () => {
                window.location.href = 'payment.html';
            });
        }
    });


    // --- Find Loans Tab Logic ---
    // --- Find Loans Tab Logic ---
    const findLoansList = document.getElementById('find-loans-list');
    const productDetails = document.getElementById('product-details');
    const backToFindLoansBtn = document.getElementById('back-to-find-loans');
    const applyBtn = document.getElementById('apply-btn');

    let currentProduct = null;
    let availableLoans = [];
    let myAppliedLoans = new Set();

    // Helper: Fetch Loans from Supabase
    async function fetchAvailableLoans() {
        if (!window.supabaseClient) {
            console.warn('Supabase not connected');
            return;
        }

        const loansGrid = findLoansList.querySelector('.loans-grid');
        loansGrid.innerHTML = '<p>Loading loans...</p>';

        try {
            // 1. Fetch Products
            const { data: products, error: prodError } = await window.supabaseClient
                .from('mfi_products')
                .select('*');
            if (prodError) throw prodError;

            // 2. Fetch MFIs (to get names)
            // Note: In a real app, use foreign key select: .select('*, mfi_registrations(org_name)')
            // But simple independent fetch is robust for partial schemas.
            const { data: mfis, error: mfiError } = await window.supabaseClient
                .from('mfi_registrations')
                .select('id, org_name');
            if (mfiError) throw mfiError;

            // Map MFI names
            const mfiMap = {};
            mfis.forEach(m => mfiMap[m.id] = m.org_name);

            availableLoans = products.map(p => ({
                ...p,
                mfi_name: mfiMap[p.mfi_id] || 'Unknown Bank'
            }));

            // 3. Fetch My Applications
            const user = JSON.parse(localStorage.getItem('active_user'));
            myAppliedLoans.clear();
            if (user && user.id) {
                const { data: apps } = await window.supabaseClient
                    .from('loan_applications')
                    .select('product_id')
                    .eq('farmer_id', user.id);
                if (apps) {
                    apps.forEach(app => myAppliedLoans.add(app.product_id));
                }
            }

            // Render
            renderLoans(availableLoans);

            // Re-attach listeners to new buttons
            document.querySelectorAll('.view-product-details-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const loanId = btn.dataset.id;
                    const loan = availableLoans.find(l => l.id === loanId);
                    showLoanDetails(loan);
                });
            });

        } catch (err) {
            console.error('Error fetching loans:', err);
            loansGrid.innerHTML = '<p style="color:red">Failed to load loans.</p>';
        }
    }

    // --- Search Functionality ---
    function filterLoans(query) {
        if (!query) {
            renderLoans(availableLoans);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = availableLoans.filter(loan =>
            loan.product_name.toLowerCase().includes(lowerQuery) ||
            loan.mfi_name.toLowerCase().includes(lowerQuery)
        );
        renderLoans(filtered);
    }

    function renderLoans(loans) {
        const loansGrid = findLoansList.querySelector('.loans-grid');
        loansGrid.innerHTML = '';

        if (loans.length === 0) {
            loansGrid.innerHTML = '<p>No matching loan products found.</p>';
            return;
        }

        loans.forEach(loan => {
            const card = document.createElement('div');
            card.className = 'loan-card';
            card.innerHTML = `
                <div class="bank-logo" style="margin-bottom: 1rem; font-size: 2rem;">💰</div>
                <h4 class="loan-title" style="font-size: 1.2rem; font-weight: 700;">${loan.product_name}</h4>
                <p class="text-light" style="margin-bottom: 1rem;">${loan.mfi_name}</p>
                <div class="loan-details">
                    <div class="detail-item"><span class="label">Amount</span><span class="value">₹${loan.max_loan_amount}</span></div>
                </div>
                <button class="btn btn-outline view-product-details-btn" data-id="${loan.id}" style="width: 100%;">View Details</button>
            `;
            loansGrid.appendChild(card);
        });

        // Re-attach listeners
        document.querySelectorAll('.view-product-details-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const loanId = btn.dataset.id;
                const loan = availableLoans.find(l => l.id === loanId);
                showLoanDetails(loan);
            });
        });
    }

    // Attach Search Listeners
    const findSearchInput = document.getElementById('find-search-input');
    const findSearchBtn = document.getElementById('find-search-btn');

    if (findSearchBtn && findSearchInput) {
        // Search on Button Click
        findSearchBtn.addEventListener('click', () => {
            filterLoans(findSearchInput.value);
        });

        // Search on Enter Key
        findSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterLoans(findSearchInput.value);
            }
        });

        // Reset on Clear
        findSearchInput.addEventListener('input', (e) => {
            if (e.target.value === '') {
                filterLoans('');
            }
        });
    }

    function showLoanDetails(loan) {
        currentProduct = loan;
        findLoansList.style.display = 'none';
        productDetails.style.display = 'block';
        productDetails.scrollIntoView({ behavior: 'smooth' });

        // Populate Header
        const titleEl = productDetails.querySelector('.reg-title');
        const subtitleEl = productDetails.querySelector('.reg-card > div > .text-light');
        if (titleEl) titleEl.textContent = loan.product_name;
        if (subtitleEl) subtitleEl.textContent = loan.mfi_name;

        // Populate Stats
        const stats = productDetails.querySelectorAll('.stat-value');
        if (stats[0]) stats[0].textContent = loan.interest_rate || '--'; // Interest
        if (stats[1]) stats[1].textContent = loan.tenure || '--';        // Tenure
        if (stats[2]) {
            // Loan Amount Range
            const min = loan.min_loan_amount ? Number(loan.min_loan_amount).toLocaleString('en-IN') : '0';
            const max = loan.max_loan_amount ? Number(loan.max_loan_amount).toLocaleString('en-IN') : '--';
            stats[2].textContent = `₹ ${min} - ₹ ${max}`;
        }

        // Populate Description
        const descText = document.getElementById('loan-desc-text');
        if (descText) {
            descText.textContent = `Loan Type: ${loan.product_type}. Provided by ${loan.mfi_name}. Supports ranges from ₹${loan.min_loan_amount || 0} to ₹${loan.max_loan_amount || 0}.`;
        }

        // Populate Eligibility
        const eligText = document.getElementById('loan-eligibility-text');
        if (eligText) {
            eligText.textContent = loan.eligibility_criteria || 'Open to all registered farmers.';
        }

        // Reset apply button
        if (applyBtn) {
            if (myAppliedLoans.has(loan.id)) {
                applyBtn.textContent = 'Already Applied';
                applyBtn.disabled = true;
                applyBtn.classList.remove('btn-primary');
                applyBtn.classList.add('btn-outline');
            } else {
                applyBtn.textContent = 'Apply for Loan';
                applyBtn.disabled = false;
                applyBtn.classList.remove('btn-outline');
                applyBtn.classList.add('btn-primary');
            }
        }
    }

    // Trigger fetch when tab is clicked
    const findTabLink = document.querySelector('.sidebar-link[data-tab="find"]');
    if (findTabLink) {
        findTabLink.addEventListener('click', fetchAvailableLoans);
    }
    // Also fetch on load just in case
    fetchAvailableLoans();


    if (backToFindLoansBtn) {
        backToFindLoansBtn.addEventListener('click', () => {
            productDetails.style.display = 'none';
            findLoansList.style.display = 'block';
        });
    }

    async function updateHomescreenLoans() {
        if (!window.supabaseClient) return;
        const user = JSON.parse(localStorage.getItem('active_user'));
        if (!user || !user.id) return;

        const container = document.querySelector('.loans-status-list');
        if (!container) return;

        container.innerHTML = '<p>Loading application status...</p>';

        try {
            // Fetch All Applications
            const { data: apps, error } = await window.supabaseClient
                .from('loan_applications')
                .select('*')
                .eq('farmer_id', user.id);

            if (error) throw error;

            if (!apps || apps.length === 0) {
                container.innerHTML = '<p class="text-light">You have not applied for any loans yet.</p>';
                return;
            }

            // Fetch Products to get Names
            const productIds = [...new Set(apps.map(a => a.product_id))];
            const { data: products } = await window.supabaseClient
                .from('mfi_products')
                .select('id, product_name, mfi_id')
                .in('id', productIds);

            const productMap = {};
            // Also need MFI names
            let mfiIds = [];
            if (products) {
                products.forEach(p => {
                    productMap[p.id] = p;
                    if (p.mfi_id) mfiIds.push(p.mfi_id);
                });
            }

            // Fetch MFI Names
            const { data: mfis } = await window.supabaseClient
                .from('mfi_registrations')
                .select('id, org_name')
                .in('id', mfiIds);

            const mfiMap = {};
            if (mfis) mfis.forEach(m => mfiMap[m.id] = m.org_name);

            container.innerHTML = '';

            apps.forEach(app => {
                const product = productMap[app.product_id] || { product_name: 'Unknown Loan', mfi_id: null };
                const mfiName = mfiMap[product.mfi_id] || 'Unknown Bank';
                const dateStr = new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                // Badge Styles
                let badgeClass = 'status-pending';
                let badgeText = 'Pending Review';
                if (app.status === 'approved') {
                    badgeClass = 'status-approved';
                    badgeText = 'Approved';
                } else if (app.status === 'rejected') {
                    badgeClass = 'status-rejected'; // Ensure CSS exists or fallback
                    badgeText = 'Rejected';
                }

                // Icon logic (randomized or based on name)
                const icon = app.status === 'approved' ? '🌾' : '⏳';

                const card = document.createElement('div');
                card.className = 'stat-card';
                card.style = 'margin-bottom: 1rem; justify-content: space-between; align-items: center;';
                card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="stat-icon ${app.status === 'approved' ? 'primary' : 'warning'}">${icon}</div>
                    <div>
                        <h4 style="font-weight: 600; color: var(--secondary-color);">${product.product_name}</h4>
                        <p class="text-light" style="font-size: 0.9rem;">${mfiName}</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <span class="status-badge ${badgeClass}">${badgeText}</span>
                    <p class="text-light" style="font-size: 0.8rem; margin-top: 0.25rem;">Applied on ${dateStr}</p>
                </div>
            `;
                container.appendChild(card);
            });

        } catch (err) {
            console.error('Error fetching homescreen loans:', err);
            container.innerHTML = '<p>Error loading status.</p>';
        }
    }

    // Call on load
    updateHomescreenLoans();

    // If currently on loans tab, fetch active loans immediately
    if (document.querySelector('.sidebar-link[data-tab="loans"]').classList.contains('active')) {
        fetchMyActiveLoans();
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            if (!currentProduct) return;

            // Get Farmer Info
            // Assuming Farmer is logged in (fetched at top of file)
            // But 'active_user' in local storage currently doesn't store the ID from Supabase! 
            // We need to fix this in registration.js first to store ID. 
            // For now, I'll assume we can't reliably get the farmer ID unless registration stored it.
            // Let's check 'active_user' for an ID, if not found, we might need a workaround or alert user.

            // Correction: registration.js stores name/role but maybe not ID.
            // Let's assume for this step the registration flow added ID to local storage or we can't link it.
            // Wait, registration.js inserts but doesn't return ID to local storage in the artifact I saw earlier. 
            // I will try to use a placeholder ID or 'active_user.id' if available.

            const user = JSON.parse(localStorage.getItem('active_user'));

            // Check if user exists (ID is UUID string)
            if (!user || !user.id) {
                alert("Your session is outdated. Please re-register to sync your account details.");
                window.location.href = '../index.html'; // Or redirect to registration
                return;
            }

            const farmerId = user.id;

            const originalText = applyBtn.textContent;
            applyBtn.textContent = 'Applying...';
            applyBtn.disabled = true;

            try {
                const { error } = await window.supabaseClient
                    .from('loan_applications')
                    .insert([{
                        farmer_id: farmerId,
                        // farmer_type column removed as it's missing in schema
                        product_id: currentProduct.id,
                        mfi_id: currentProduct.mfi_id,
                        amount: currentProduct.max_loan_amount,
                        status: 'pending'
                    }]);

                if (error) throw error;

                // Update Farmer Status (Optimistic update on both tables)
                // This updates the 'application_status' column so the MFI sees it in the farmer directory
                await Promise.all([
                    window.supabaseClient.from('farmers_manual').update({ application_status: 'pending' }).eq('id', farmerId),
                    window.supabaseClient.from('farmers_agristack').update({ application_status: 'pending' }).eq('id', farmerId)
                ]);

                // Success UI
                applyBtn.textContent = '✓ Applied';
                applyBtn.classList.remove('btn-primary');
                applyBtn.classList.add('btn-outline');

                // Update session storage for Home Tab (Mock UI sync)
                const newLoan = { name: currentProduct.product_name, bank: currentProduct.mfi_name };
                const loans = JSON.parse(sessionStorage.getItem('applied_loans') || '[]');
                loans.push(newLoan);
                sessionStorage.setItem('applied_loans', JSON.stringify(loans));

                // Update Home
                updateHomescreenLoans();

                alert('Application submitted successfully!');

            } catch (err) {
                console.error('Error applying:', err);
                alert('Application failed: ' + err.message);
                applyBtn.textContent = originalText;
                applyBtn.disabled = false;
            }
        });
    }

    // Default state: Home
    // (Already set by HTML active classes, but good to align state)
    // switchTab('home'); 
    // Check for payment success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
        switchTab('loans'); // Switch to loans tab
        myLoansList.style.display = 'none';
        myLoanDetails.style.display = 'block'; // Show details
        paymentModal.classList.add('active');

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});
