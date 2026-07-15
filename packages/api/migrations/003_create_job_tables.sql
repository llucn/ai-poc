-- Migration: Create t_job and t_job_log tables
-- Description: Scheduled job execution with agent invocation and logging

CREATE TABLE t_job (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    content TEXT NULL,
    cron_exp VARCHAR(255) NULL,
    job_detail TEXT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_on TIMESTAMP NULL,
    updated_by VARCHAR(255) NULL,

    CONSTRAINT fk_job_agent
        FOREIGN KEY (agent_id)
        REFERENCES t_agent(id)
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_job_name ON t_job(name);

CREATE TABLE t_job_log (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    job_log TEXT NULL,
    job_status INTEGER NULL,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_on TIMESTAMP NULL,
    updated_by VARCHAR(255) NULL,

    CONSTRAINT fk_job_log_job
        FOREIGN KEY (job_id)
        REFERENCES t_job(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_job_log_job_id ON t_job_log(job_id);
CREATE INDEX idx_job_log_created_on ON t_job_log(created_on);

COMMENT ON TABLE t_job IS 'Scheduled jobs that invoke agents on a cron schedule';
COMMENT ON TABLE t_job_log IS 'Execution logs for scheduled jobs';
COMMENT ON COLUMN t_job_log.job_status IS '0=Success, -1=Fail, 1=Running';
