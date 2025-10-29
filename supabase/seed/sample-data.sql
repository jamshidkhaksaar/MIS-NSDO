-- Reporting years
INSERT INTO reporting_years (year) VALUES (2023) ON CONFLICT(year) DO NOTHING;
INSERT INTO reporting_years (year) VALUES (2024) ON CONFLICT(year) DO NOTHING;
INSERT INTO reporting_years (year) VALUES (2025) ON CONFLICT(year) DO NOTHING;

-- Cluster catalog
INSERT INTO cluster_catalog (name, description) VALUES ('Protection Cluster', 'Protection coordination and safeguarding activities.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO cluster_catalog (name, description) VALUES ('Emergency Shelter and Non-Food Items (ES/NFI) Cluster', 'Shelter support and essential household supplies.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO cluster_catalog (name, description) VALUES ('Health Cluster', 'Medical response and health system strengthening.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO cluster_catalog (name, description) VALUES ('Nutrition Cluster', 'Nutrition programming for vulnerable populations.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO cluster_catalog (name, description) VALUES ('Food Security and Agriculture Cluster', 'Agricultural livelihoods and food security actions.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO cluster_catalog (name, description) VALUES ('WASH (Water, Sanitation and Hygiene) Cluster', 'Water, sanitation, and hygiene interventions.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO cluster_catalog (name, description) VALUES ('Education Cluster', 'Education coordination and learning continuity.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO cluster_catalog (name, description) VALUES ('Livelihoods Cluster', 'Income generation and livelihoods support.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;

-- Sector catalog
INSERT INTO sector_catalog (name, description) VALUES ('Agriculture & Rural Development', 'Agricultural productivity and rural resilience.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO sector_catalog (name, description) VALUES ('Education & Literacy', 'Formal and informal education support.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO sector_catalog (name, description) VALUES ('Health Systems Strengthening', 'Primary and secondary health system capacity.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO sector_catalog (name, description) VALUES ('WASH (Water, Sanitation, Hygiene)', 'Safe water access, sanitation, and hygiene programming.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO sector_catalog (name, description) VALUES ('Protection (including GBV, Child Protection, Legal Aid)', 'Protection services and safeguards.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO sector_catalog (name, description) VALUES ('Food Security & Agriculture', 'Food security programming and agricultural inputs.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO sector_catalog (name, description) VALUES ('Livelihoods & Economic Empowerment', 'Income generation and skills development.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO sector_catalog (name, description) VALUES ('Environment & Climate Resilience', 'Climate adaptation and environmental protection.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO sector_catalog (name, description) VALUES ('Disaster Risk Reduction (DRR)', 'Preparedness and risk reduction programming.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO sector_catalog (name, description) VALUES ('Returnee & IDP Support', 'Assistance for displaced populations.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;
INSERT INTO sector_catalog (name, description) VALUES ('Vocational Training (TVET)', 'Skills training and workforce development.') ON CONFLICT(name) DO UPDATE SET description = excluded.description;

-- Sectors
INSERT INTO sectors (sector_key, display_name, projects, start_date, end_date, field_activity, staff)
VALUES ('Humanitarian', 'Humanitarian', 14, '2024-02-15', '2025-09-30', 'Emergency response & relief kits', 62)
ON CONFLICT(sector_key) DO UPDATE SET
  display_name = excluded.display_name,
  projects = excluded.projects,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  field_activity = excluded.field_activity,
  staff = excluded.staff;

INSERT INTO sectors (sector_key, display_name, projects, start_date, end_date, field_activity, staff)
VALUES ('Advocacy', 'Advocacy', 9, '2024-03-01', '2024-12-31', 'Policy dialogues & community forums', 28)
ON CONFLICT(sector_key) DO UPDATE SET
  display_name = excluded.display_name,
  projects = excluded.projects,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  field_activity = excluded.field_activity,
  staff = excluded.staff;

INSERT INTO sectors (sector_key, display_name, projects, start_date, end_date, field_activity, staff)
VALUES ('Development', 'Development', 11, '2024-01-10', '2025-12-31', 'Infrastructure rehabilitation', 44)
ON CONFLICT(sector_key) DO UPDATE SET
  display_name = excluded.display_name,
  projects = excluded.projects,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  field_activity = excluded.field_activity,
  staff = excluded.staff;

-- Sector provinces
INSERT INTO sector_provinces (sector_id, province)
SELECT id, 'Kabul' FROM sectors WHERE sector_key = 'Humanitarian' ON CONFLICT (sector_id, province) DO NOTHING;
INSERT INTO sector_provinces (sector_id, province)
SELECT id, 'Takhar' FROM sectors WHERE sector_key = 'Humanitarian' ON CONFLICT (sector_id, province) DO NOTHING;
INSERT INTO sector_provinces (sector_id, province)
SELECT id, 'Badakhshan' FROM sectors WHERE sector_key = 'Humanitarian' ON CONFLICT (sector_id, province) DO NOTHING;
INSERT INTO sector_provinces (sector_id, province)
SELECT id, 'Herat' FROM sectors WHERE sector_key = 'Humanitarian' ON CONFLICT (sector_id, province) DO NOTHING;

INSERT INTO sector_provinces (sector_id, province)
SELECT id, 'Parwan' FROM sectors WHERE sector_key = 'Advocacy' ON CONFLICT (sector_id, province) DO NOTHING;
INSERT INTO sector_provinces (sector_id, province)
SELECT id, 'Kabul' FROM sectors WHERE sector_key = 'Advocacy' ON CONFLICT (sector_id, province) DO NOTHING;
INSERT INTO sector_provinces (sector_id, province)
SELECT id, 'Baghlan' FROM sectors WHERE sector_key = 'Advocacy' ON CONFLICT (sector_id, province) DO NOTHING;

INSERT INTO sector_provinces (sector_id, province)
SELECT id, 'Kunduz' FROM sectors WHERE sector_key = 'Development' ON CONFLICT (sector_id, province) DO NOTHING;
INSERT INTO sector_provinces (sector_id, province)
SELECT id, 'Baghlan' FROM sectors WHERE sector_key = 'Development' ON CONFLICT (sector_id, province) DO NOTHING;
INSERT INTO sector_provinces (sector_id, province)
SELECT id, 'Parwan' FROM sectors WHERE sector_key = 'Development' ON CONFLICT (sector_id, province) DO NOTHING;
INSERT INTO sector_provinces (sector_id, province)
SELECT id, 'Badakhshan' FROM sectors WHERE sector_key = 'Development' ON CONFLICT (sector_id, province) DO NOTHING;

-- Beneficiary stats
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'childrenGirls', 280, 180 FROM sectors WHERE sector_key = 'Humanitarian'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'childrenBoys', 260, 170 FROM sectors WHERE sector_key = 'Humanitarian'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'adultsWomen', 310, 240 FROM sectors WHERE sector_key = 'Humanitarian'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'adultsMen', 210, 195 FROM sectors WHERE sector_key = 'Humanitarian'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'households', 140, 120 FROM sectors WHERE sector_key = 'Humanitarian'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'idps', 90, 75 FROM sectors WHERE sector_key = 'Humanitarian'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'returnees', 65, 48 FROM sectors WHERE sector_key = 'Humanitarian'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'pwds', 55, 36 FROM sectors WHERE sector_key = 'Humanitarian'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;

INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'childrenGirls', 160, 120 FROM sectors WHERE sector_key = 'Advocacy'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'childrenBoys', 150, 115 FROM sectors WHERE sector_key = 'Advocacy'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'adultsWomen', 190, 160 FROM sectors WHERE sector_key = 'Advocacy'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'adultsMen', 140, 120 FROM sectors WHERE sector_key = 'Advocacy'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'households', 90, 72 FROM sectors WHERE sector_key = 'Advocacy'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'idps', 50, 42 FROM sectors WHERE sector_key = 'Advocacy'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'returnees', 44, 30 FROM sectors WHERE sector_key = 'Advocacy'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'pwds', 28, 22 FROM sectors WHERE sector_key = 'Advocacy'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;

INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'childrenGirls', 210, 150 FROM sectors WHERE sector_key = 'Development'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'childrenBoys', 200, 140 FROM sectors WHERE sector_key = 'Development'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'adultsWomen', 250, 190 FROM sectors WHERE sector_key = 'Development'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'adultsMen', 220, 170 FROM sectors WHERE sector_key = 'Development'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'households', 120, 110 FROM sectors WHERE sector_key = 'Development'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'idps', 70, 62 FROM sectors WHERE sector_key = 'Development'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'returnees', 60, 48 FROM sectors WHERE sector_key = 'Development'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect)
SELECT id, 'pwds', 44, 34 FROM sectors WHERE sector_key = 'Development'
ON CONFLICT(sector_id, type_key) DO UPDATE SET direct = excluded.direct, indirect = excluded.indirect;

