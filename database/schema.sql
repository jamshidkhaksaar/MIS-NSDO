-- Schema for NSDO MIS MySQL database
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  role ENUM('Administrator','Editor','Viewer') NOT NULL DEFAULT 'Viewer',
  organization VARCHAR(160),
  password_hash VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reporting_years (
  year SMALLINT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sectors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sector_key VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  start_date DATE,
  end_date DATE,
  field_activity TEXT,
  projects INT NOT NULL DEFAULT 0,
  staff INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sector_provinces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sector_id INT NOT NULL,
  province VARCHAR(80) NOT NULL,
  UNIQUE KEY uniq_sector_province (sector_id, province),
  CONSTRAINT fk_sector_provinces_sector FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS beneficiary_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sector_id INT NOT NULL,
  type_key VARCHAR(32) NOT NULL,
  direct INT NOT NULL DEFAULT 0,
  indirect INT NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_sector_type (sector_id, type_key),
  CONSTRAINT fk_beneficiary_stats_sector FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS branding_settings (
  id TINYINT PRIMARY KEY CHECK (id = 1),
  company_name VARCHAR(160) NOT NULL DEFAULT 'NSDO',
  logo_data LONGBLOB,
  logo_mime VARCHAR(64),
  favicon_data LONGBLOB,
  favicon_mime VARCHAR(64),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(64),
  message TEXT NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sector_key VARCHAR(64) NOT NULL,
  goal TEXT,
  objectives TEXT,
  major_achievements TEXT,
  country VARCHAR(120) NOT NULL,
  start_date DATE,
  end_date DATE,
  staff INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_clusters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  cluster VARCHAR(160) NOT NULL,
  UNIQUE KEY uniq_project_cluster (project_id, cluster),
  CONSTRAINT fk_project_clusters_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_standard_sectors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  sector_label VARCHAR(160) NOT NULL,
  UNIQUE KEY uniq_project_sector (project_id, sector_label),
  CONSTRAINT fk_project_standard_sectors_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_geography (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  level ENUM('province','district','community') NOT NULL,
  name VARCHAR(120) NOT NULL,
  CONSTRAINT fk_project_geography_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_beneficiaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  type_key VARCHAR(32) NOT NULL,
  direct INT NOT NULL DEFAULT 0,
  indirect INT NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_project_type (project_id, type_key),
  CONSTRAINT fk_project_beneficiaries_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

INSERT INTO branding_settings (id, company_name) VALUES (1, 'NSDO')
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);
