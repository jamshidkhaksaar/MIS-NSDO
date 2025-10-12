-- Optional sample data for local development

INSERT INTO reporting_years (year) VALUES (2023) ON DUPLICATE KEY UPDATE year = VALUES(year);
INSERT INTO reporting_years (year) VALUES (2024) ON DUPLICATE KEY UPDATE year = VALUES(year);
INSERT INTO reporting_years (year) VALUES (2025) ON DUPLICATE KEY UPDATE year = VALUES(year);

INSERT INTO sectors (id, sector_key, display_name, projects, start_date, end_date, field_activity, staff)
VALUES
  (1, 'Humanitarian', 'Humanitarian', 14, '2024-02-15', '2025-09-30', 'Emergency response & relief kits', 62),
  (2, 'Advocacy', 'Advocacy', 9, '2024-03-01', '2024-12-31', 'Policy dialogues & community forums', 28),
  (3, 'Development', 'Development', 11, '2024-01-10', '2025-12-31', 'Infrastructure rehabilitation', 44)
ON DUPLICATE KEY UPDATE
  projects = VALUES(projects),
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  field_activity = VALUES(field_activity),
  staff = VALUES(staff);

DELETE FROM sector_provinces WHERE sector_id IN (1,2,3);
INSERT INTO sector_provinces (sector_id, province) VALUES
  (1, 'Kabul'), (1, 'Takhar'), (1, 'Badakhshan'), (1, 'Herat'),
  (2, 'Parwan'), (2, 'Kabul'), (2, 'Baghlan'),
  (3, 'Kunduz'), (3, 'Baghlan'), (3, 'Parwan'), (3, 'Badakhshan')
ON DUPLICATE KEY UPDATE province = VALUES(province);

DELETE FROM beneficiary_stats WHERE sector_id IN (1,2,3);
INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect) VALUES
  (1, 'childrenGirls', 280, 180),
  (1, 'childrenBoys', 260, 170),
  (1, 'adultsWomen', 310, 240),
  (1, 'adultsMen', 210, 195),
  (1, 'households', 140, 120),
  (1, 'idps', 90, 75),
  (1, 'returnees', 65, 48),
  (1, 'pwds', 55, 36),
  (2, 'childrenGirls', 160, 120),
  (2, 'childrenBoys', 150, 115),
  (2, 'adultsWomen', 190, 160),
  (2, 'adultsMen', 140, 120),
  (2, 'households', 90, 72),
  (2, 'idps', 50, 42),
  (2, 'returnees', 44, 30),
  (2, 'pwds', 28, 22),
  (3, 'childrenGirls', 210, 150),
  (3, 'childrenBoys', 200, 140),
  (3, 'adultsWomen', 250, 190),
  (3, 'adultsMen', 220, 170),
  (3, 'households', 120, 110),
  (3, 'idps', 70, 62),
  (3, 'returnees', 60, 48),
  (3, 'pwds', 44, 34);

INSERT INTO users (name, email, role, organization) VALUES
  ('Jamila Farzad', 'jamila.farzad@example.org', 'Administrator', 'NSDO HQ'),
  ('Rahim Khan', 'rahim.khan@example.org', 'Editor', 'Regional Office'),
  ('Sara Barakzai', 'sara.barakzai@example.org', 'Viewer', 'Partner Agency')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), organization = VALUES(organization);

INSERT INTO projects (id, name, sector_key, goal, objectives, major_achievements, country, start_date, end_date, staff)
VALUES
  (
    1,
    'Community-Based Agricultural Support',
    'Agriculture',
    'Increase household food security through resilient agricultural practices.',
    '• Provide farmer field school training across 3 provinces.\n• Introduce drought-resilient seed kits and irrigation tools.\n• Establish producer cooperatives to connect farmers with local markets.',
    '• 1,250 farmers trained on climate-smart techniques.\n• 18 agribusiness cooperatives formed with 45% women leadership.\n• Average crop yields increased by 27% in target districts.',
    'Afghanistan',
    '2024-01-10',
    '2025-12-31',
    45
  ),
  (
    2,
    'Inclusive Education Access Initiative',
    'Education',
    'Broaden safe learning access for primary students in rural communities.',
    '• Rehabilitate 12 community classrooms and learning spaces.\n• Deploy accelerated learning curricula for out-of-school children.\n• Train teachers on inclusive education and safeguarding.',
    '• 2,050 children re-enrolled in formal schooling pathways.\n• 164 teachers certified on inclusive pedagogy.\n• Child protection referral pathways established in all target schools.',
    'Afghanistan',
    '2024-03-01',
    '2025-09-30',
    32
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  sector_key = VALUES(sector_key),
  goal = VALUES(goal),
  objectives = VALUES(objectives),
  major_achievements = VALUES(major_achievements),
  country = VALUES(country),
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  staff = VALUES(staff);

DELETE FROM project_geography WHERE project_id IN (1,2);
INSERT INTO project_geography (project_id, level, name) VALUES
  (1, 'province', 'Kabul'),
  (1, 'province', 'Takhar'),
  (1, 'province', 'Herat'),
  (1, 'district', 'Kabul City'),
  (1, 'district', 'Rostaq'),
  (1, 'district', 'Guzara'),
  (1, 'community', 'Pole-e-Charkhi'),
  (1, 'community', 'Dasht-e-Qala'),
  (1, 'community', 'Karokh'),
  (2, 'province', 'Kunduz'),
  (2, 'province', 'Baghlan'),
  (2, 'district', 'Kunduz City'),
  (2, 'district', 'Pul-e-Khumri'),
  (2, 'community', 'Imam Sahib'),
  (2, 'community', 'Nahr-e-Shahi')
ON DUPLICATE KEY UPDATE name = VALUES(name);

DELETE FROM project_clusters WHERE project_id IN (1,2);
INSERT INTO project_clusters (project_id, cluster) VALUES
  (1, 'Food Security and Agriculture Cluster'),
  (1, 'WASH (Water, Sanitation and Hygiene) Cluster'),
  (2, 'Education Cluster'),
  (2, 'Protection Cluster')
ON DUPLICATE KEY UPDATE cluster = VALUES(cluster);

DELETE FROM project_standard_sectors WHERE project_id IN (1,2);
INSERT INTO project_standard_sectors (project_id, sector_label) VALUES
  (1, 'Food Security & Agriculture'),
  (1, 'Livelihoods & Economic Empowerment'),
  (1, 'Environment & Climate Resilience'),
  (2, 'Education'),
  (2, 'Education & Literacy'),
  (2, 'Disability Inclusion'),
  (2, 'Gender Equality')
ON DUPLICATE KEY UPDATE sector_label = VALUES(sector_label);

DELETE FROM project_beneficiaries WHERE project_id IN (1,2);
INSERT INTO project_beneficiaries (project_id, type_key, direct, indirect) VALUES
  (1, 'childrenGirls', 320, 280),
  (1, 'childrenBoys', 340, 295),
  (1, 'adultsWomen', 460, 420),
  (1, 'adultsMen', 380, 360),
  (1, 'households', 220, 240),
  (1, 'idps', 120, 140),
  (1, 'returnees', 90, 110),
  (1, 'pwds', 70, 84),
  (2, 'childrenGirls', 620, 540),
  (2, 'childrenBoys', 590, 520),
  (2, 'adultsWomen', 420, 400),
  (2, 'adultsMen', 340, 310),
  (2, 'households', 180, 200),
  (2, 'idps', 150, 170),
  (2, 'returnees', 110, 130),
  (2, 'pwds', 95, 100)
ON DUPLICATE KEY UPDATE direct = VALUES(direct), indirect = VALUES(indirect);
