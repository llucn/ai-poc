## Why

The platform needs scheduled job execution so that agents can perform recurring tasks automatically (e.g., periodic data processing, report generation, monitoring checks). Currently all agent interactions are user-initiated; there is no mechanism to trigger agent conversations on a schedule.

## What Changes

- Add a new `t_job` table to define scheduled jobs (linked to an agent, with cron expression and job detail)
- Add a new `t_job_log` table to record execution history and status
- Create a dedicated "job" agent that parses user-provided content to extract cron expressions and job details
- Implement a backend cron scheduler that triggers job execution automatically
- Add admin UI pages: job list, job detail, add/edit job, job log list, job log detail
- All job management is restricted to SYSTEM_ADMIN role

## Capabilities

### New Capabilities
- `cron-job-management`: CRUD operations for scheduled jobs, including agent association, cron expression extraction via a dedicated job agent, and job execution scheduling
- `cron-job-execution`: Background scheduler that triggers agent conversations on cron schedule and records execution logs with status tracking
- `cron-job-ui`: Admin UI pages for managing jobs and viewing execution logs

### Modified Capabilities
- `session-management`: Sessions can now be created programmatically by the scheduler (not only by user-initiated chat)

## Impact

- **Database**: Two new tables (`t_job`, `t_job_log`)
- **API**: New job controller with CRUD endpoints and log retrieval endpoints
- **Backend**: New cron scheduler service that runs in the background
- **Frontend**: New pages under Settings -> Job menu entry
- **Agents**: A new "job" agent with a system prompt for extracting cron expressions and job details from free-text content
- **Dependencies**: Will need a cron/scheduling library (e.g., `node-cron` or `cron` npm package)
