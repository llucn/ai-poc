CREATE DATABASE IF NOT EXISTS ai_poc
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE ai_poc;

-- Table: t_user
-- Mock users for demo authentication system
CREATE TABLE IF NOT EXISTS t_user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(255) NULL COMMENT 'Values: SUPERVISOR, TECHNICIAN, SYSTEM_ADMIN, CUSTOMER',
  skill_matrix TEXT NULL,
  is_available INT NOT NULL DEFAULT 1,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NULL,
  UNIQUE INDEX idx_user_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed initial demo users
INSERT INTO t_user (name, display_name, email, role, skill_matrix, is_available, created_by) VALUES
('admin', 'System Administrator', 'admin@example.com', 'SYSTEM_ADMIN', 'System administration, user management', 1, 'system'),
('supervisor1', 'John Supervisor', 'john.supervisor@example.com', 'SUPERVISOR', 'Team management, quality control', 1, 'system'),
('tech1', 'Alice Technician', 'alice.tech@example.com', 'TECHNICIAN', 'Equipment repair, maintenance', 1, 'system'),
('customer1', 'Bob Customer', 'bob.customer@example.com', 'CUSTOMER', NULL, 1, 'system');
