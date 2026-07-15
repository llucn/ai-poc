## ADDED Requirements

### Requirement: Admin can create a job
The system SHALL allow SYSTEM_ADMIN users to create a job by providing a name, selecting an agent, and entering free-text content. The system SHALL invoke the "job" agent to extract a cron expression and job detail from the content, then persist the job to `t_job`.

#### Scenario: Successful job creation
- **WHEN** admin submits a job with name "Daily Report", selects agent "reporter", and provides content "Every day at 9am, generate the sales report"
- **THEN** system calls the job agent to extract cron expression and job detail, saves the job with the extracted `cron_exp` and `job_detail`, and returns the created job

#### Scenario: Duplicate name rejected
- **WHEN** admin creates a job with a name that already exists
- **THEN** system returns a 409 Conflict error

#### Scenario: Invalid cron expression extracted
- **WHEN** the job agent extracts a cron expression that fails validation
- **THEN** system returns a 400 Bad Request error with a message indicating the invalid expression

### Requirement: Admin can list all jobs
The system SHALL provide an endpoint to list all jobs with their name, cron expression, and associated agent name.

#### Scenario: List jobs
- **WHEN** admin requests the job list
- **THEN** system returns all jobs ordered by name ascending, including agent name

### Requirement: Admin can view a job
The system SHALL provide an endpoint to retrieve a single job by ID, including all fields.

#### Scenario: View existing job
- **WHEN** admin requests job with a valid ID
- **THEN** system returns the full job record including content, cron_exp, job_detail, and agent info

#### Scenario: Job not found
- **WHEN** admin requests a job with a non-existent ID
- **THEN** system returns 404 Not Found

### Requirement: Admin can update a job
The system SHALL allow SYSTEM_ADMIN users to update a job's name, agent, and content. When content changes, the system SHALL re-invoke the job agent to re-extract cron expression and job detail. The scheduler SHALL reload the updated cron schedule.

#### Scenario: Successful job update
- **WHEN** admin updates a job's content
- **THEN** system re-extracts cron_exp and job_detail, saves the updated job, and reloads the cron schedule

### Requirement: Admin can delete jobs
The system SHALL allow SYSTEM_ADMIN users to delete one or more jobs by ID. Deleting a job SHALL also remove its scheduled cron entry and all associated log records.

#### Scenario: Delete single job
- **WHEN** admin deletes a job by ID
- **THEN** system removes the job, its logs, and its cron schedule entry

#### Scenario: Bulk delete jobs
- **WHEN** admin deletes multiple jobs by providing an array of IDs
- **THEN** system removes all specified jobs, their logs, and their cron schedule entries

### Requirement: Job agent extracts cron and detail
The system SHALL have a dedicated "job" agent whose system prompt instructs it to parse free-text input and output a JSON object with `cron_exp` (string) and `job_detail` (string) fields. The system SHALL validate the extracted cron expression.

#### Scenario: Successful extraction
- **WHEN** the job agent receives "Every Monday at 8:30am, check server health"
- **THEN** it outputs `{"cron_exp": "30 8 * * 1", "job_detail": "check server health"}`

#### Scenario: Content without clear schedule
- **WHEN** the job agent receives content without a discernible schedule
- **THEN** it outputs `{"cron_exp": null, "job_detail": "<full content>"}` and the system saves with null cron_exp (job won't be scheduled until cron_exp is provided)
