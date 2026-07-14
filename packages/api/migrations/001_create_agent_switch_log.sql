-- Migration: Create t_agent_switch_log table
-- Description: Tracks agent switching operations for analytics and debugging

CREATE TABLE t_agent_switch_log (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    from_agent_id INTEGER NOT NULL,
    to_agent_id INTEGER NOT NULL,
    confidence_score DECIMAL(3, 2) NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    prompt_forward TEXT NOT NULL,
    switched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    error_message TEXT NULL,

    CONSTRAINT fk_agent_switch_log_session
        FOREIGN KEY (session_id)
        REFERENCES t_session(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_agent_switch_log_from_agent
        FOREIGN KEY (from_agent_id)
        REFERENCES t_agent(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_agent_switch_log_to_agent
        FOREIGN KEY (to_agent_id)
        REFERENCES t_agent(id)
        ON DELETE CASCADE
);

-- Create index on session_id for efficient lookup
CREATE INDEX idx_agent_switch_log_session_id ON t_agent_switch_log(session_id);

-- Create index on switched_at for time-based queries
CREATE INDEX idx_agent_switch_log_switched_at ON t_agent_switch_log(switched_at);

COMMENT ON TABLE t_agent_switch_log IS 'Logs all agent switching operations with metadata for analytics and debugging';
COMMENT ON COLUMN t_agent_switch_log.confidence_score IS 'Classification confidence score between 0.0 and 1.0';
COMMENT ON COLUMN t_agent_switch_log.prompt_forward IS 'Simplified or rephrased user request passed to target agent';
COMMENT ON COLUMN t_agent_switch_log.error_message IS 'Error message if switch failed, NULL on success';
