## Context

The platform currently supports only user-initiated agent conversations via the chat UI. There is no mechanism for scheduled, automated agent invocations. The existing session/message infrastructure handles streaming conversations with tool use loops. We need to extend this to support programmatic session creation and execution triggered by a cron scheduler.

The project uses NestJS with TypeORM on PostgreSQL. The frontend is React with react-router.

## Goals / Non-Goals

**Goals:**
- Allow admins to create scheduled jobs that invoke an agent on a cron schedule
- Use a dedicated "job" agent to parse free-text job content into structured cron expression + job detail
- Execute jobs in the background, recording full execution logs
- Provide admin UI for job CRUD and log viewing

**Non-Goals:**
- Job chaining / dependencies between jobs
- Distributed scheduling (single-instance scheduler is sufficient)
- Real-time job output streaming to the UI
- Job retry/backoff policies (jobs simply succeed or fail)
- Non-admin job management

## Decisions

### 1. Scheduling library: `cron` (npm)

Use the `cron` package (`CronJob` class) for in-process scheduling. It's lightweight, well-maintained, and sufficient for single-instance deployment.

Alternative considered: `node-cron` — similar API but `cron` has better TypeScript support and a longer track record.

Alternative considered: Bull/BullMQ with Redis — overkill for this use case; adds infrastructure dependency.

### 2. Job execution via session service

When a cron fires, create a new session programmatically (same as user-initiated), send the `job_detail` as the first user message, and run the agent loop to completion. Store the full assistant response in `t_job_log.job_log`.

This reuses the existing `SessionService.sendMessage()` flow but in a non-streaming mode (collect all output, don't SSE).

### 3. Job agent for content parsing

A dedicated "job" agent with a system prompt that extracts `cron_exp` and `job_detail` from user-provided free-text `content`. The agent outputs JSON. This is called once when creating/editing a job — not during job execution.

The job execution itself uses the agent specified in `t_job.agent_id`.

### 4. Module structure

Create a new `packages/api/src/app/job/` module containing:
- `job.entity.ts` — `t_job` TypeORM entity
- `job-log.entity.ts` — `t_job_log` TypeORM entity
- `job.controller.ts` — REST endpoints
- `job.service.ts` — CRUD logic
- `job-scheduler.service.ts` — cron scheduling, starts on module init, reloads on job changes
- `job-executor.service.ts` — creates session, sends message, collects result
- `job.module.ts` — module definition

### 5. Non-streaming execution

Job execution collects the full response without SSE streaming. The executor calls the LLM service directly (or a simplified session flow) and concatenates all text blocks into the log. Tool calls are executed in the loop as normal.

### 6. Frontend routing

Add pages under `/settings/jobs`:
- `/settings/jobs` — job list
- `/settings/jobs/:id` — job detail (view/edit)
- `/settings/jobs/new` — add job
- `/settings/jobs/:id/logs` — job log list
- `/settings/jobs/:id/logs/:logId` — log detail

## Risks / Trade-offs

- **Single-instance scheduling** → If the server restarts, missed cron ticks are lost. Mitigation: acceptable for MVP; can add persistence-based catch-up later.
- **Long-running jobs** → Agent loops with many tool calls could run indefinitely. Mitigation: Apply the existing `MAX_TOOL_CALLS` limit; add a timeout (e.g., 5 minutes per job execution).
- **Job agent accuracy** → LLM-based cron extraction may produce invalid expressions. Mitigation: Validate the extracted cron expression before saving; show validation errors to the admin.
- **Memory pressure** → Many concurrent jobs could strain memory. Mitigation: Limit concurrent job execution (e.g., max 3 parallel jobs via a semaphore).
