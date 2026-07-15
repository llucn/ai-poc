## 1. Database & Entities

- [x] 1.1 Create migration SQL for `t_job` and `t_job_log` tables
- [x] 1.2 Create `job.entity.ts` TypeORM entity for `t_job`
- [x] 1.3 Create `job-log.entity.ts` TypeORM entity for `t_job_log`
- [x] 1.4 Register entities in `database.module.ts`

## 2. Job Module Setup

- [x] 2.1 Create `job.module.ts` with imports and providers
- [x] 2.2 Create `job.dto.ts` with DTOs for create, update, and delete operations
- [x] 2.3 Register `JobModule` in `app.module.ts`

## 3. Job CRUD Service & Controller

- [x] 3.1 Create `job.service.ts` with CRUD operations (create, list, findOne, update, delete, bulkDelete)
- [x] 3.2 Create `job.controller.ts` with REST endpoints (GET/POST/PUT/DELETE) restricted to SYSTEM_ADMIN
- [x] 3.3 Create `job-log.service.ts` for log CRUD (list by job, findOne)
- [x] 3.4 Add log endpoints to controller (GET /jobs/:id/logs, GET /jobs/:id/logs/:logId)

## 4. Job Agent & Content Parsing

- [x] 4.1 Write the job agent system prompt at `docs/job-agent-prompt.md`
- [x] 4.2 Create `job-parser.service.ts` that invokes the job agent to extract cron_exp and job_detail from content
- [x] 4.3 Add cron expression validation (validate extracted cron_exp before saving)
- [x] 4.4 Integrate parser into job create/update flow

## 5. Job Scheduler & Executor

- [x] 5.1 Add `cron` npm dependency
- [x] 5.2 Create `job-scheduler.service.ts` — loads jobs on init, manages CronJob instances, reloads on changes
- [x] 5.3 Create `job-executor.service.ts` — creates session programmatically, sends job_detail, collects response
- [x] 5.4 Add concurrency limiter (max 3 parallel executions)
- [x] 5.5 Add execution timeout (5 minute limit)
- [x] 5.6 Write job log entries (Running → Success/Fail) during execution

## 6. Session Service Extension

- [x] 6.1 Add method to create session programmatically (without selector agent, with specified agent_id and userName)
- [x] 6.2 Add non-streaming message execution method that returns the full response text

## 7. Frontend — Job List & Actions

- [x] 7.1 Create job list page at `/settings/jobs` with table (Name, Cron, Agent, Logs link)
- [x] 7.2 Add "Add" and "Delete" action buttons with confirmation dialog
- [x] 7.3 Add "Jobs" menu item under Settings nav (SYSTEM_ADMIN only)

## 8. Frontend — Job Detail & Edit

- [x] 8.1 Create job detail page at `/settings/jobs/:id` showing all fields
- [x] 8.2 Create add job form at `/settings/jobs/new` (Name, Agent select, Content textarea)
- [x] 8.3 Create edit job form at `/settings/jobs/:id/edit`
- [x] 8.4 Add agent selection dropdown (fetch available agents)

## 9. Frontend — Job Logs

- [x] 9.1 Create job log list page at `/settings/jobs/:id/logs` with table (ID, Job Name, Time, Status icon)
- [x] 9.2 Create job log detail page at `/settings/jobs/:id/logs/:logId`

## 10. Testing & Validation

- [x] 10.1 Verify job CRUD API endpoints work correctly
- [x] 10.2 Verify job agent content parsing produces valid cron expressions
- [x] 10.3 Verify scheduler starts and fires jobs on schedule
- [x] 10.4 Verify job execution creates sessions and logs results
- [x] 10.5 Run typecheck and fix any errors
