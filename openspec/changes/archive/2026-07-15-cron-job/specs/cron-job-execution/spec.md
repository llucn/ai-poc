## ADDED Requirements

### Requirement: Scheduler starts on application boot
The system SHALL initialize the cron scheduler on module startup, loading all jobs with valid cron expressions from the database and registering them as active cron entries.

#### Scenario: Application starts with existing jobs
- **WHEN** the application starts and there are 3 jobs with valid cron expressions in `t_job`
- **THEN** the scheduler registers 3 cron entries that will fire at their specified times

#### Scenario: Application starts with no jobs
- **WHEN** the application starts and there are no jobs
- **THEN** the scheduler starts with no active cron entries

### Requirement: Scheduler reloads on job changes
The system SHALL reload the cron schedule whenever a job is created, updated, or deleted. Only jobs with non-null `cron_exp` SHALL be scheduled.

#### Scenario: New job created
- **WHEN** a new job with a valid cron_exp is created
- **THEN** the scheduler adds a new cron entry for that job

#### Scenario: Job deleted
- **WHEN** a job is deleted
- **THEN** the scheduler removes the corresponding cron entry

### Requirement: Job execution creates a session and sends message
When a cron fires, the system SHALL create a new session for the job's associated agent, send the `job_detail` as the first user message, and run the agent loop to completion (non-streaming). The full assistant response SHALL be stored in `t_job_log`.

#### Scenario: Successful job execution
- **WHEN** a cron fires for a job with agent "reporter" and job_detail "generate sales report"
- **THEN** system creates a session, sends the message, collects the full response, and writes a log entry with status 0 (Success)

#### Scenario: Job execution fails
- **WHEN** a cron fires and the agent loop throws an error
- **THEN** system writes a log entry with status -1 (Fail) and the error message in `job_log`

### Requirement: Job execution respects concurrency limit
The system SHALL limit concurrent job executions to a configurable maximum (default: 3). If all slots are occupied, the job execution SHALL be queued or skipped with a warning log.

#### Scenario: Concurrency limit reached
- **WHEN** 3 jobs are already executing and a 4th cron fires
- **THEN** the 4th execution is skipped and a warning is logged

### Requirement: Job execution has a timeout
The system SHALL enforce a maximum execution time per job (default: 5 minutes). If a job exceeds this timeout, the execution SHALL be terminated and logged as failed.

#### Scenario: Job exceeds timeout
- **WHEN** a job execution runs for more than 5 minutes
- **THEN** system terminates the execution and writes a log entry with status -1 and message indicating timeout

### Requirement: Job log records execution details
Each job execution SHALL create a record in `t_job_log` with the job_id, full response text (job_log), status (0=Success, -1=Fail, 1=Running), and timestamps.

#### Scenario: Running status during execution
- **WHEN** a job starts executing
- **THEN** a log entry is created with status 1 (Running)

#### Scenario: Status updated on completion
- **WHEN** a job execution completes successfully
- **THEN** the log entry status is updated to 0 (Success) and job_log contains the full response

### Requirement: Admin can list job logs
The system SHALL provide an endpoint to list execution logs for a given job, ordered by created_on descending.

#### Scenario: List logs for a job
- **WHEN** admin requests logs for job ID 5
- **THEN** system returns all log entries for that job, most recent first

### Requirement: Admin can view a job log detail
The system SHALL provide an endpoint to retrieve a single log entry by ID.

#### Scenario: View log detail
- **WHEN** admin requests log entry by ID
- **THEN** system returns the full log record including job_log content and status
