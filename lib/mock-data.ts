import type {
  Deal,
  Lead,
  Notification,
  Organization,
  PlatformUser,
  RevenueTarget,
  SiteVisit,
} from './types'

export const organization: Organization = {
  id: 'org_estatly_blr',
  name: 'Estatly Realty',
  city: 'Bengaluru',
  is_active: true,
}

export const currentUser: PlatformUser = {
  id: 'usr_aditya_rao',
  org_id: organization.id,
  role: 'admin',
  parent_id: null,
  full_name: 'Aditya Rao',
  phone: '+91 98450 11234',
  username: 'aditya.rao',
  is_active: true,
  current_device_id: 'device_01',
}

export const leads: Lead[] = [
  { id: 'lead_001', org_id: organization.id, owner_id: 'usr_meera_iyer', full_name: 'Nikhil Bhatia', phone: '+91 90080 12233', email: 'nikhil.bhatia@gmail.com', source: 'Website', stage: 'proposal', temperature: 'hot', ai_score: 92, budget_min: 9500000, budget_max: 12000000, requirement: '3BHK apartment in Whitefield', interested_property_id: 'prop_014', converted_customer_id: null },
  { id: 'lead_002', org_id: organization.id, owner_id: 'usr_karan_shetty', full_name: 'Ananya Deshpande', phone: '+91 98220 44551', email: 'ananya.d@outlook.com', source: 'Facebook Ads', stage: 'site_visit', temperature: 'hot', ai_score: 88, budget_min: 6000000, budget_max: 7500000, requirement: '2BHK near Sarjapur Road', interested_property_id: 'prop_022', converted_customer_id: null },
  { id: 'lead_003', org_id: organization.id, owner_id: 'usr_priya_nair', full_name: 'Rahul Menon', phone: '+91 99000 77812', email: 'rahul.menon@yahoo.com', source: 'Referral', stage: 'qualified', temperature: 'warm', ai_score: 74, budget_min: 15000000, budget_max: 18000000, requirement: 'Villa in Devanahalli', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_004', org_id: organization.id, owner_id: 'usr_rohan_verma', full_name: 'Sneha Kulkarni', phone: '+91 96630 90218', email: 'sneha.k@gmail.com', source: 'Instagram', stage: 'contacted', temperature: 'warm', ai_score: 61, budget_min: 4500000, budget_max: 5500000, requirement: '1BHK for investment', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_005', org_id: organization.id, owner_id: 'usr_aditya_rao', full_name: 'Vikram Malhotra', phone: '+91 90350 11009', email: 'vikram.malhotra@gmail.com', source: 'Property Portal', stage: 'new', temperature: 'cold', ai_score: 38, budget_min: 8000000, budget_max: 9000000, requirement: '2BHK in Marathahalli', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_006', org_id: organization.id, owner_id: 'usr_meera_iyer', full_name: 'Divya Prakash', phone: '+91 97400 55678', email: 'divya.prakash@gmail.com', source: 'WhatsApp', stage: 'proposal', temperature: 'hot', ai_score: 90, budget_min: 11000000, budget_max: 13500000, requirement: '3BHK in Indiranagar', interested_property_id: 'prop_009', converted_customer_id: null },
  { id: 'lead_007', org_id: organization.id, owner_id: 'usr_karan_shetty', full_name: 'Arjun Reddy', phone: '+91 98450 33221', email: 'arjun.reddy@hotmail.com', source: 'Walk-in', stage: 'won', temperature: 'hot', ai_score: 95, budget_min: 20000000, budget_max: 24000000, requirement: 'Luxury villa in Hebbal', interested_property_id: 'prop_031', converted_customer_id: 'cust_101' },
  { id: 'lead_008', org_id: organization.id, owner_id: 'usr_priya_nair', full_name: 'Kavya Subramaniam', phone: '+91 90190 88214', email: 'kavya.s@gmail.com', source: 'Facebook Ads', stage: 'contacted', temperature: 'warm', ai_score: 55, budget_min: 5000000, budget_max: 6200000, requirement: '2BHK near Electronic City', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_009', org_id: organization.id, owner_id: 'usr_rohan_verma', full_name: 'Siddharth Rao', phone: '+91 99860 22190', email: 'siddharth.rao@gmail.com', source: 'Referral', stage: 'lost', temperature: 'cold', ai_score: 22, budget_min: 7000000, budget_max: 8500000, requirement: '2BHK apartment', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_010', org_id: organization.id, owner_id: 'usr_aditya_rao', full_name: 'Pooja Agarwal', phone: '+91 96110 44782', email: 'pooja.agarwal@gmail.com', source: 'Website', stage: 'qualified', temperature: 'warm', ai_score: 68, budget_min: 9000000, budget_max: 11000000, requirement: '3BHK in HSR Layout', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_011', org_id: organization.id, owner_id: 'usr_meera_iyer', full_name: 'Aditi Chauhan', phone: '+91 98330 99120', email: 'aditi.chauhan@gmail.com', source: 'Instagram', stage: 'site_visit', temperature: 'hot', ai_score: 84, budget_min: 6500000, budget_max: 8000000, requirement: '2BHK in JP Nagar', interested_property_id: 'prop_018', converted_customer_id: null },
  { id: 'lead_012', org_id: organization.id, owner_id: 'usr_karan_shetty', full_name: 'Manish Tiwari', phone: '+91 90080 66231', email: 'manish.tiwari@gmail.com', source: 'Property Portal', stage: 'new', temperature: 'cold', ai_score: 30, budget_min: 4000000, budget_max: 4800000, requirement: '1BHK studio', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_013', org_id: organization.id, owner_id: 'usr_priya_nair', full_name: 'Ritika Bansal', phone: '+91 99450 12876', email: 'ritika.bansal@gmail.com', source: 'WhatsApp', stage: 'contacted', temperature: 'warm', ai_score: 58, budget_min: 8500000, budget_max: 10000000, requirement: '3BHK in Koramangala', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_014', org_id: organization.id, owner_id: 'usr_rohan_verma', full_name: 'Harsh Vardhan', phone: '+91 97170 34521', email: 'harsh.vardhan@gmail.com', source: 'Walk-in', stage: 'qualified', temperature: 'warm', ai_score: 71, budget_min: 12000000, budget_max: 14500000, requirement: 'Villa in Sarjapur', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_015', org_id: organization.id, owner_id: 'usr_aditya_rao', full_name: 'Neha Kapoor', phone: '+91 98220 77012', email: 'neha.kapoor@gmail.com', source: 'Facebook Ads', stage: 'new', temperature: 'cold', ai_score: 41, budget_min: 5500000, budget_max: 6800000, requirement: '2BHK near Bellandur', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_016', org_id: organization.id, owner_id: 'usr_meera_iyer', full_name: 'Tanya Sharma', phone: '+91 90350 90871', email: 'tanya.sharma@gmail.com', source: 'Referral', stage: 'proposal', temperature: 'hot', ai_score: 87, budget_min: 10500000, budget_max: 12800000, requirement: '3BHK in Yelahanka', interested_property_id: 'prop_027', converted_customer_id: null },
  { id: 'lead_017', org_id: organization.id, owner_id: 'usr_karan_shetty', full_name: 'Gaurav Malik', phone: '+91 99000 12456', email: 'gaurav.malik@gmail.com', source: 'Website', stage: 'contacted', temperature: 'warm', ai_score: 53, budget_min: 6000000, budget_max: 7200000, requirement: '2BHK apartment resale', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_018', org_id: organization.id, owner_id: 'usr_priya_nair', full_name: 'Ishaan Gupta', phone: '+91 96630 21987', email: 'ishaan.gupta@gmail.com', source: 'Instagram', stage: 'site_visit', temperature: 'hot', ai_score: 81, budget_min: 7500000, budget_max: 9200000, requirement: '2BHK in Bannerghatta Rd', interested_property_id: 'prop_012', converted_customer_id: null },
  { id: 'lead_019', org_id: organization.id, owner_id: 'usr_rohan_verma', full_name: 'Simran Kaur', phone: '+91 90190 55021', email: 'simran.kaur@gmail.com', source: 'WhatsApp', stage: 'archive', temperature: 'cold', ai_score: 18, budget_min: 3500000, budget_max: 4200000, requirement: '1BHK budget flat', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_020', org_id: organization.id, owner_id: 'usr_aditya_rao', full_name: 'Aman Chopra', phone: '+91 98450 66782', email: 'aman.chopra@gmail.com', source: 'Property Portal', stage: 'qualified', temperature: 'warm', ai_score: 66, budget_min: 13000000, budget_max: 15500000, requirement: 'Villa in Kanakapura', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_021', org_id: organization.id, owner_id: 'usr_meera_iyer', full_name: 'Riya Saxena', phone: '+91 97400 12309', email: 'riya.saxena@gmail.com', source: 'Website', stage: 'won', temperature: 'hot', ai_score: 93, budget_min: 9800000, budget_max: 11200000, requirement: '3BHK in RR Nagar', interested_property_id: 'prop_006', converted_customer_id: 'cust_112' },
  { id: 'lead_022', org_id: organization.id, owner_id: 'usr_karan_shetty', full_name: 'Yash Pillai', phone: '+91 90080 90112', email: 'yash.pillai@gmail.com', source: 'Facebook Ads', stage: 'contacted', temperature: 'cold', ai_score: 35, budget_min: 4800000, budget_max: 5900000, requirement: '2BHK compact home', interested_property_id: null, converted_customer_id: null },
  { id: 'lead_023', org_id: organization.id, owner_id: 'usr_priya_nair', full_name: 'Meghana Rao', phone: '+91 99860 44201', email: 'meghana.rao@gmail.com', source: 'Referral', stage: 'proposal', temperature: 'hot', ai_score: 89, budget_min: 16000000, budget_max: 19000000, requirement: 'Premium villa in Whitefield', interested_property_id: 'prop_033', converted_customer_id: null },
  { id: 'lead_024', org_id: organization.id, owner_id: 'usr_rohan_verma', full_name: 'Farhan Ali', phone: '+91 96110 77345', email: 'farhan.ali@gmail.com', source: 'Walk-in', stage: 'new', temperature: 'warm', ai_score: 49, budget_min: 6500000, budget_max: 7800000, requirement: '2BHK near tech park', interested_property_id: null, converted_customer_id: null },
]

export const deals: Deal[] = [
  { id: 'deal_001', org_id: organization.id, owner_id: 'usr_meera_iyer', code: 'D-201', lead_id: 'lead_001', customer_id: null, property_id: 'prop_014', title: 'Whitefield 3BHK — Nikhil Bhatia', stage: 'proposal', value: 11200000, currency: 'INR', expected_close_date: '2026-08-28', closed_at: null, lost_reason: null, notes: null },
  { id: 'deal_002', org_id: organization.id, owner_id: 'usr_karan_shetty', code: 'D-202', lead_id: 'lead_002', customer_id: null, property_id: 'prop_022', title: 'Sarjapur 2BHK — Ananya Deshpande', stage: 'negotiation', value: 6800000, currency: 'INR', expected_close_date: '2026-08-20', closed_at: null, lost_reason: null, notes: null },
  { id: 'deal_003', org_id: organization.id, owner_id: 'usr_karan_shetty', code: 'D-198', lead_id: 'lead_007', customer_id: 'cust_101', property_id: 'prop_031', title: 'Hebbal Villa — Arjun Reddy', stage: 'booked', value: 22500000, currency: 'INR', expected_close_date: '2026-08-05', closed_at: '2026-08-05', lost_reason: null, notes: null },
  { id: 'deal_004', org_id: organization.id, owner_id: 'usr_meera_iyer', code: 'D-199', lead_id: 'lead_021', customer_id: 'cust_112', property_id: 'prop_006', title: 'RR Nagar 3BHK — Riya Saxena', stage: 'booked', value: 10500000, currency: 'INR', expected_close_date: '2026-08-10', closed_at: '2026-08-10', lost_reason: null, notes: null },
  { id: 'deal_005', org_id: organization.id, owner_id: 'usr_priya_nair', code: 'D-203', lead_id: 'lead_023', customer_id: null, property_id: 'prop_033', title: 'Whitefield Villa — Meghana Rao', stage: 'proposal', value: 17500000, currency: 'INR', expected_close_date: '2026-09-02', closed_at: null, lost_reason: null, notes: null },
  { id: 'deal_006', org_id: organization.id, owner_id: 'usr_rohan_verma', code: 'D-190', lead_id: null, customer_id: null, property_id: 'prop_009', title: 'Indiranagar 3BHK — Deal', stage: 'contract', value: 12200000, currency: 'INR', expected_close_date: '2026-08-15', closed_at: null, lost_reason: null, notes: null },
  { id: 'deal_007', org_id: organization.id, owner_id: 'usr_aditya_rao', code: 'D-185', lead_id: null, customer_id: null, property_id: 'prop_018', title: 'JP Nagar 2BHK — Deal', stage: 'lost', value: 7400000, currency: 'INR', expected_close_date: '2026-07-30', closed_at: null, lost_reason: 'Budget mismatch', notes: null },
  { id: 'deal_008', org_id: organization.id, owner_id: 'usr_karan_shetty', code: 'D-176', lead_id: null, customer_id: null, property_id: 'prop_027', title: 'Yelahanka 3BHK — Deal', stage: 'booked', value: 11800000, currency: 'INR', expected_close_date: '2026-07-22', closed_at: '2026-07-22', lost_reason: null, notes: null },
  { id: 'deal_009', org_id: organization.id, owner_id: 'usr_priya_nair', code: 'D-170', lead_id: null, customer_id: null, property_id: 'prop_012', title: 'Bannerghatta 2BHK — Deal', stage: 'qualified', value: 8100000, currency: 'INR', expected_close_date: '2026-09-10', closed_at: null, lost_reason: null, notes: null },
  { id: 'deal_010', org_id: organization.id, owner_id: 'usr_meera_iyer', code: 'D-162', lead_id: null, customer_id: null, property_id: 'prop_002', title: 'Devanahalli Villa — Deal', stage: 'booked', value: 15600000, currency: 'INR', expected_close_date: '2026-06-18', closed_at: '2026-06-18', lost_reason: null, notes: null },
  { id: 'deal_011', org_id: organization.id, owner_id: 'usr_rohan_verma', code: 'D-155', lead_id: null, customer_id: null, property_id: 'prop_040', title: 'Koramangala 3BHK — Deal', stage: 'booked', value: 13400000, currency: 'INR', expected_close_date: '2026-05-25', closed_at: '2026-05-25', lost_reason: null, notes: null },
  { id: 'deal_012', org_id: organization.id, owner_id: 'usr_karan_shetty', code: 'D-140', lead_id: null, customer_id: null, property_id: 'prop_045', title: 'HSR Layout 2BHK — Deal', stage: 'booked', value: 9200000, currency: 'INR', expected_close_date: '2026-04-14', closed_at: '2026-04-14', lost_reason: null, notes: null },
  { id: 'deal_013', org_id: organization.id, owner_id: 'usr_aditya_rao', code: 'D-128', lead_id: null, customer_id: null, property_id: 'prop_050', title: 'Electronic City Villa — Deal', stage: 'booked', value: 18900000, currency: 'INR', expected_close_date: '2026-03-08', closed_at: '2026-03-08', lost_reason: null, notes: null },
  { id: 'deal_014', org_id: organization.id, owner_id: 'usr_meera_iyer', code: 'D-115', lead_id: null, customer_id: null, property_id: 'prop_052', title: 'Marathahalli 2BHK — Deal', stage: 'booked', value: 7900000, currency: 'INR', expected_close_date: '2026-02-11', closed_at: '2026-02-11', lost_reason: null, notes: null },
  { id: 'deal_015', org_id: organization.id, owner_id: 'usr_priya_nair', code: 'D-102', lead_id: null, customer_id: null, property_id: 'prop_055', title: 'Hennur Villa — Deal', stage: 'booked', value: 20100000, currency: 'INR', expected_close_date: '2026-01-20', closed_at: '2026-01-20', lost_reason: null, notes: null },
]

export const siteVisits: SiteVisit[] = [
  { id: 'sv_001', org_id: organization.id, owner_id: 'usr_karan_shetty', lead_id: 'lead_002', customer_id: null, property_id: 'prop_022', scheduled_at: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(), status: 'scheduled', feedback: null },
  { id: 'sv_002', org_id: organization.id, owner_id: 'usr_meera_iyer', lead_id: 'lead_011', customer_id: null, property_id: 'prop_018', scheduled_at: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(), status: 'scheduled', feedback: null },
  { id: 'sv_003', org_id: organization.id, owner_id: 'usr_priya_nair', lead_id: 'lead_018', customer_id: null, property_id: 'prop_012', scheduled_at: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(), status: 'scheduled', feedback: null },
  { id: 'sv_004', org_id: organization.id, owner_id: 'usr_rohan_verma', lead_id: 'lead_016', customer_id: null, property_id: 'prop_027', scheduled_at: new Date(new Date().setHours(17, 30, 0, 0)).toISOString(), status: 'scheduled', feedback: null },
  { id: 'sv_005', org_id: organization.id, owner_id: 'usr_aditya_rao', lead_id: 'lead_023', customer_id: null, property_id: 'prop_033', scheduled_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), status: 'completed', feedback: 'Very interested, requested a proposal.' },
]

export const revenueTargets: RevenueTarget[] = [
  { org_id: organization.id, owner_id: null, period_start: '2026-01-01', period_end: '2026-01-31', target_value: 18000000 },
  { org_id: organization.id, owner_id: null, period_start: '2026-02-01', period_end: '2026-02-28', target_value: 18000000 },
  { org_id: organization.id, owner_id: null, period_start: '2026-03-01', period_end: '2026-03-31', target_value: 20000000 },
  { org_id: organization.id, owner_id: null, period_start: '2026-04-01', period_end: '2026-04-30', target_value: 20000000 },
  { org_id: organization.id, owner_id: null, period_start: '2026-05-01', period_end: '2026-05-31', target_value: 22000000 },
  { org_id: organization.id, owner_id: null, period_start: '2026-06-01', period_end: '2026-06-30', target_value: 22000000 },
  { org_id: organization.id, owner_id: null, period_start: '2026-07-01', period_end: '2026-07-31', target_value: 24000000 },
  { org_id: organization.id, owner_id: null, period_start: '2026-08-01', period_end: '2026-08-31', target_value: 24000000 },
]

export const notifications: Notification[] = [
  { recipient_id: currentUser.id, type: 'lead', title: 'New hot lead assigned', body: 'Nikhil Bhatia scored 92 — ready for proposal.', is_read: false },
  { recipient_id: currentUser.id, type: 'deal', title: 'Deal moved to negotiation', body: 'D-202 Sarjapur 2BHK entered negotiation stage.', is_read: false },
  { recipient_id: currentUser.id, type: 'follow_up', title: 'Follow-up overdue', body: '3 follow-ups are past their due date.', is_read: false },
  { recipient_id: currentUser.id, type: 'task', title: 'Task completed', body: 'Karan Shetty completed "Send brochure to Ananya".', is_read: true },
  { recipient_id: currentUser.id, type: 'system', title: 'Weekly report ready', body: 'Your team performance report for last week is ready.', is_read: true },
]

// Owner names used only for display lookups on this page.
export const ownerNamesById: Record<string, string> = {
  usr_aditya_rao: 'Aditya Rao',
  usr_meera_iyer: 'Meera Iyer',
  usr_karan_shetty: 'Karan Shetty',
  usr_priya_nair: 'Priya Nair',
  usr_rohan_verma: 'Rohan Verma',
}
