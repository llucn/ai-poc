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

-- Table: t_agent
-- AI Agent basic information, model config and system prompt.
-- model_config stores { baseUrl, authToken, modelName } as JSON;
-- authToken holds the model API key. is_default marks the single default
-- agent (at most one row has is_default = 1, enforced in the app layer).
CREATE TABLE IF NOT EXISTS t_agent (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  model_config JSON NULL,
  is_default INT NOT NULL DEFAULT 0,
  system_prompt LONGTEXT NULL,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NULL,
  UNIQUE INDEX idx_agent_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: t_agent_tool
-- MCP servers registered for an agent. Linked to t_agent via agent_id
-- (plain column, no DB foreign key — referential integrity is enforced
-- in the application layer). One row per MCP server.
-- mcp_schema stores the parsed registration info as a JSON array of
-- { name, description, parameters } objects fetched from the server URL.
CREATE TABLE IF NOT EXISTS t_agent_tool (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id INT NOT NULL,
  server_name VARCHAR(255) NOT NULL,
  server_url VARCHAR(2048) NOT NULL,
  mcp_schema JSON NULL,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NULL,
  INDEX idx_agent_tool_agent_id (agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: t_agent_skill
-- Skills associated with an agent. Linked to t_agent via agent_id
-- (plain column, no DB foreign key — referential integrity is enforced
-- in the application layer). content holds Markdown text.
CREATE TABLE IF NOT EXISTS t_agent_skill (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  content LONGTEXT NULL,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NULL,
  INDEX idx_agent_skill_agent_id (agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: t_session
-- Chat sessions. Each session belongs to a single user (user_name).
-- last_activity_time is denormalized for efficient list sorting.
-- agent_id associates the session with an Agent for LLM context.
CREATE TABLE IF NOT EXISTS t_session (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  last_activity_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  agent_id INT NOT NULL,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NULL,
  INDEX idx_session_user_name (user_name),
  INDEX idx_session_last_activity (last_activity_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: t_message
-- Messages within a chat session. user_name is the sender; "ASSISTANT"
-- for bot replies. message_type: 1=Text, 2=Image (only Text supported now).
-- is_thought: 1 marks an assistant "thought" entry rendered as a
-- collapsible note in the chat timeline; 0 is a regular message.
CREATE TABLE IF NOT EXISTS t_message (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  message_type INT NOT NULL DEFAULT 1,
  is_thought INT NOT NULL DEFAULT 0,
  content LONGTEXT NULL,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) NULL,
  INDEX idx_message_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
