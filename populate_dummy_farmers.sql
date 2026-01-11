-- Insert Dummy Data into Farmers Manual (Manual Registration)
INSERT INTO public.farmers_manual (full_name, mobile_number, village, district, state, credit_score, land_size, current_crop, doc_type)
VALUES 
('Ramesh Kumar', '9876543210', 'Rampur', 'Varanasi', 'Uttar Pradesh', 750, 2.5, 'Wheat', 'aadhar'),
('Suresh Yadav', '9876543211', 'Lalpur', 'Azamgarh', 'Uttar Pradesh', 680, 1.2, 'Rice', 'pan'),
('Anita Devi', '9876543212', 'Madhopur', 'Patna', 'Bihar', 710, 3.0, 'Maize', 'aadhar');

-- Insert Dummy Data into Farmers Agristack (Agristack Verified)
INSERT INTO public.farmers_agristack (full_name, mobile_number, village, district, state, credit_score, land_size, current_crop, doc_type, agristack_id)
VALUES 
('Vikram Singh', '9876543213', 'Kishanpur', 'Jaipur', 'Rajasthan', 820, 5.5, 'Bajra', 'aadhar', 'AGRI-RJ-8892'),
('Priya Sharma', '9876543214', 'Sonpur', 'Bhopal', 'Madhya Pradesh', 790, 4.0, 'Soybean', 'aadhar', 'AGRI-MP-1120');
