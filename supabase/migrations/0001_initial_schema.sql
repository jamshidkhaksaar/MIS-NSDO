CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Administrator','Editor','Viewer')),
  organization TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reporting_years (
  year INTEGER PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sectors (
  id BIGSERIAL PRIMARY KEY,
  sector_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  field_activity TEXT,
  projects INTEGER NOT NULL DEFAULT 0,
  staff INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sector_provinces (
  id BIGSERIAL PRIMARY KEY,
  sector_id BIGINT NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  province TEXT NOT NULL,
  UNIQUE(sector_id, province)
);

CREATE TABLE IF NOT EXISTS beneficiary_stats (
  id BIGSERIAL PRIMARY KEY,
  sector_id BIGINT NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  type_key TEXT NOT NULL,
  direct INTEGER NOT NULL DEFAULT 0,
  indirect INTEGER NOT NULL DEFAULT 0,
  UNIQUE(sector_id, type_key)
);

CREATE TABLE IF NOT EXISTS branding_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT 'NSDO',
  logo_data BYTEA,
  logo_mime TEXT,
  favicon_data BYTEA,
  favicon_mime TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  donor TEXT,
  sector TEXT,
  country TEXT,
  start_date DATE,
  end_date DATE,
  budget DOUBLE PRECISION,
  focal_point TEXT,
  goal TEXT,
  objectives TEXT,
  major_achievements TEXT,
  staff INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_provinces (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  province TEXT NOT NULL,
  UNIQUE(project_id, province)
);

CREATE TABLE IF NOT EXISTS project_districts (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  district TEXT NOT NULL,
  UNIQUE(project_id, district)
);

CREATE TABLE IF NOT EXISTS project_communities (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  community TEXT NOT NULL,
  UNIQUE(project_id, community)
);

CREATE TABLE IF NOT EXISTS project_beneficiaries (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type_key TEXT NOT NULL,
  direct INTEGER NOT NULL DEFAULT 0,
  indirect INTEGER NOT NULL DEFAULT 0,
  UNIQUE(project_id, type_key)
);

CREATE TABLE IF NOT EXISTS project_clusters (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cluster TEXT NOT NULL,
  UNIQUE(project_id, cluster)
);

CREATE TABLE IF NOT EXISTS project_standard_sectors (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  standard_sector TEXT NOT NULL,
  UNIQUE(project_id, standard_sector)
);

CREATE TABLE IF NOT EXISTS project_documents (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_phases (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('baseline','monitoring','evaluation','accountability','learning')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS baseline_surveys (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tool TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','archived')),
  questionnaire_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enumerators (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  province TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS baseline_enumerator_assignments (
  id BIGSERIAL PRIMARY KEY,
  baseline_survey_id BIGINT NOT NULL REFERENCES baseline_surveys(id) ON DELETE CASCADE,
  enumerator_id BIGINT NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(baseline_survey_id, enumerator_id)
);

CREATE TABLE IF NOT EXISTS data_collection_tasks (
  id BIGSERIAL PRIMARY KEY,
  baseline_survey_id BIGINT REFERENCES baseline_surveys(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS baseline_reports (
  id BIGSERIAL PRIMARY KEY,
  baseline_survey_id BIGINT NOT NULL REFERENCES baseline_surveys(id) ON DELETE CASCADE,
  report_url TEXT,
  shared_with_program BOOLEAN NOT NULL DEFAULT FALSE,
  shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_visit_reports (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  location TEXT,
  positive_findings TEXT,
  negative_findings TEXT,
  photo_url TEXT,
  gps_coordinates TEXT,
  officer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_reports (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_month TEXT NOT NULL,
  summary TEXT,
  gaps TEXT,
  recommendations TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','feedback')),
  reviewer TEXT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluations (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  evaluator_name TEXT,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('baseline','midterm','endline','special')),
  report_url TEXT,
  findings_summary TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stories (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  story_type TEXT NOT NULL CHECK (story_type IN ('case','success','impact')),
  title TEXT NOT NULL,
  quote TEXT,
  summary TEXT,
  photo_url TEXT,
  spotlight_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS findings (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  finding_type TEXT NOT NULL CHECK (finding_type IN ('negative','positive')),
  category TEXT,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor','major','critical')),
  department TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','solved')),
  description TEXT,
  evidence_url TEXT,
  reminder_due_at TIMESTAMPTZ,
  last_reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS distribution_records (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  assistance_type TEXT NOT NULL,
  distribution_date DATE,
  location TEXT,
  target_beneficiaries INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdm_surveys (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  tool TEXT,
  quality_score INTEGER,
  quantity_score INTEGER,
  satisfaction_score INTEGER,
  protection_score INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdm_reports (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  report_date DATE,
  summary TEXT,
  recommendations TEXT,
  feedback_to_program TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  source TEXT,
  lesson TEXT NOT NULL,
  department TEXT,
  theme TEXT,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_resources (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  theme TEXT,
  description TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_access_assignments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  province TEXT,
  role TEXT,
  UNIQUE(user_id, project_id, province)
);

CREATE TABLE IF NOT EXISTS integrations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  config TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaints (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_metadata (
  complaint_id BIGINT PRIMARY KEY REFERENCES complaints(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','resolved')),
  assigned_officer TEXT,
  province TEXT,
  district TEXT,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  auto_assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_responses (
  id BIGSERIAL PRIMARY KEY,
  complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  responder TEXT,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_awareness_records (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  district TEXT,
  awareness_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cluster_catalog (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS sector_catalog (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_expires
  ON user_sessions(user_id, expires_at);

INSERT INTO branding_settings (id, company_name)
VALUES (1, 'NSDO')
ON CONFLICT(id) DO UPDATE SET company_name = excluded.company_name;
