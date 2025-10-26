PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Administrator','Editor','Viewer')),
  organization TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reporting_years (
  year INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sectors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sector_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  field_activity TEXT,
  projects INTEGER NOT NULL DEFAULT 0,
  staff INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sector_provinces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sector_id INTEGER NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  province TEXT NOT NULL,
  UNIQUE(sector_id, province)
);

CREATE TABLE IF NOT EXISTS beneficiary_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sector_id INTEGER NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  type_key TEXT NOT NULL,
  direct INTEGER NOT NULL DEFAULT 0,
  indirect INTEGER NOT NULL DEFAULT 0,
  UNIQUE(sector_id, type_key)
);

CREATE TABLE IF NOT EXISTS branding_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT 'NSDO',
  logo_data BLOB,
  logo_mime TEXT,
  favicon_data BLOB,
  favicon_mime TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  donor TEXT,
  sector TEXT,
  country TEXT,
  start_date TEXT,
  end_date TEXT,
  budget REAL,
  focal_point TEXT,
  goal TEXT,
  objectives TEXT,
  major_achievements TEXT,
  staff INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_provinces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  province TEXT NOT NULL,
  UNIQUE(project_id, province)
);

CREATE TABLE IF NOT EXISTS project_districts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  district TEXT NOT NULL,
  UNIQUE(project_id, district)
);

CREATE TABLE IF NOT EXISTS project_communities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  community TEXT NOT NULL,
  UNIQUE(project_id, community)
);

CREATE TABLE IF NOT EXISTS project_beneficiaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type_key TEXT NOT NULL,
  direct INTEGER NOT NULL DEFAULT 0,
  indirect INTEGER NOT NULL DEFAULT 0,
  UNIQUE(project_id, type_key)
);

CREATE TABLE IF NOT EXISTS project_clusters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cluster TEXT NOT NULL,
  UNIQUE(project_id, cluster)
);

CREATE TABLE IF NOT EXISTS project_standard_sectors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  standard_sector TEXT NOT NULL,
  UNIQUE(project_id, standard_sector)
);

CREATE TABLE IF NOT EXISTS project_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('baseline','monitoring','evaluation','accountability','learning')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS baseline_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tool TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','archived')),
  questionnaire_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enumerators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  province TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS baseline_enumerator_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baseline_survey_id INTEGER NOT NULL REFERENCES baseline_surveys(id) ON DELETE CASCADE,
  enumerator_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(baseline_survey_id, enumerator_id)
);

CREATE TABLE IF NOT EXISTS data_collection_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baseline_survey_id INTEGER REFERENCES baseline_surveys(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  completed_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS baseline_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baseline_survey_id INTEGER NOT NULL REFERENCES baseline_surveys(id) ON DELETE CASCADE,
  report_url TEXT,
  shared_with_program INTEGER NOT NULL DEFAULT 0 CHECK (shared_with_program IN (0,1)),
  shared_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS field_visit_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  visit_date TEXT NOT NULL,
  location TEXT,
  positive_findings TEXT,
  negative_findings TEXT,
  photo_url TEXT,
  gps_coordinates TEXT,
  officer TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS monthly_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_month TEXT NOT NULL,
  summary TEXT,
  gaps TEXT,
  recommendations TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','feedback')),
  reviewer TEXT,
  feedback TEXT,
  submitted_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  evaluator_name TEXT,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('baseline','midterm','endline','special')),
  report_url TEXT,
  findings_summary TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  story_type TEXT NOT NULL CHECK (story_type IN ('case','success','impact')),
  title TEXT NOT NULL,
  quote TEXT,
  summary TEXT,
  photo_url TEXT,
  spotlight_order INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  finding_type TEXT NOT NULL CHECK (finding_type IN ('negative','positive')),
  category TEXT,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor','major','critical')),
  department TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','solved')),
  description TEXT,
  evidence_url TEXT,
  reminder_due_at TEXT,
  last_reminded_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS distribution_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  assistance_type TEXT NOT NULL,
  distribution_date TEXT,
  location TEXT,
  target_beneficiaries INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pdm_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  tool TEXT,
  quality_score INTEGER,
  quantity_score INTEGER,
  satisfaction_score INTEGER,
  protection_score INTEGER,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pdm_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  report_date TEXT,
  summary TEXT,
  recommendations TEXT,
  feedback_to_program TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  source TEXT,
  lesson TEXT NOT NULL,
  department TEXT,
  theme TEXT,
  captured_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS knowledge_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT,
  theme TEXT,
  description TEXT,
  file_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_access_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  province TEXT,
  role TEXT,
  UNIQUE(user_id, project_id, province)
);

CREATE TABLE IF NOT EXISTS integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  config TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaint_metadata (
  complaint_id INTEGER PRIMARY KEY REFERENCES complaints(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','resolved')),
  assigned_officer TEXT,
  province TEXT,
  district TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  is_anonymous INTEGER NOT NULL DEFAULT 0 CHECK (is_anonymous IN (0,1)),
  auto_assigned_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaint_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  responder TEXT,
  response TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crm_awareness_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  district TEXT,
  awareness_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cluster_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS sector_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_expires
  ON user_sessions(user_id, expires_at);

INSERT INTO branding_settings (id, company_name)
VALUES (1, 'NSDO')
ON CONFLICT(id) DO UPDATE SET company_name = excluded.company_name;
