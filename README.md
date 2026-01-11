# GreatWhite Fin - Agricultural Finance Aggregator

GreatWhite Fin is a web-based platform designed to bridge the gap between farmers and Microfinance Institutions (MFIs). It simplifies the loan application process for farmers and streamlines applicant management for banks.

## Project Structure

- **root**: Contains the Landing Page (`index.html`) and SQL scripts for database setup.
- **`registration/`**: Farmer registration flows (Manual & AgriStack integration).
- **`bank/`**: MFI Registration steps and Dashboard.
- **`farmer/`**: Farmer Dashboard for viewing loans and applying.
- **`js/`**: Core logic files (`app.js`, `login.js`, `dashboard` scripts, `supabase-config.js`).
- **`css/`**: Styling (`style.css`).

## Key Features

### For Farmers
- **Dual Registration**: Register manually or valid via AgriStack (simulated).
- **Dashboard**: View active loans, upcoming payments, and credit score.
- **Find Loans**: Browse available loan products from various MFIs.
- **Apply**: One-click application for verified farmers.

### For MFIs / Banks
- **Registration**: automated onboarding process.
- **Product Management**: Create and manage loan products (Crop Loans, Term Loans).
- **Applicant Management**: View list of applicants, review profiles, and approve loans.
- **General Farmer Directory**: Browse registered farmers in the system.

## Search & Database
The project uses **Supabase** as the backend for:
- User Authentication (simulated via local storage + DB lookups).
- Data Storage (`farmers_manual`, `farmers_agristack`, `mfi_registrations`, `mfi_products`, `loan_applications`).

## How to Run
1. Open `index.html` in a web browser.
2. Select **Get Started** to register or **Log In** if you have an account.
3. Use the **SQL Scripts** provided in the root directory to set up or reset your Supabase database schema if needed.

## Recent Updates
- Improved Foreign Key handling in MFI Product creation.
- Enhanced "Active Loan" display with EMI calculations and Tenure.
- Integrated GPS Location capture (optional) during land registration.
- Auto-login redirection and session safety implementation.


for testing you can either register yourself
or
You can use these details to login
for farmer: 8976473709
mfi: bank2, 2025
