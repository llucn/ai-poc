## ADDED Requirements

### Requirement: Job list page
The system SHALL display a table of all jobs at `/settings/jobs` accessible to SYSTEM_ADMIN users. The table SHALL show columns: Name (clickable link to detail), Cron Expression, Agent name, and a link to Job Logs.

#### Scenario: View job list with jobs
- **WHEN** admin navigates to /settings/jobs and there are jobs defined
- **THEN** system displays a table with all jobs showing name, cron expression, agent, and log link

#### Scenario: View empty job list
- **WHEN** admin navigates to /settings/jobs and there are no jobs
- **THEN** system displays an empty state message

### Requirement: Job list actions
The job list page SHALL have action buttons: "Add" (navigates to add form) and "Delete" (deletes selected jobs, requires selection). Delete SHALL require confirmation.

#### Scenario: Delete selected jobs
- **WHEN** admin selects 2 jobs and clicks Delete, then confirms
- **THEN** system deletes the selected jobs and refreshes the list

### Requirement: Add job page
The system SHALL provide a form at `/settings/jobs/new` with fields: Name (text input), Agent (select dropdown of available agents), and Content (multi-line textarea). On submit, the system SHALL call the API to create the job.

#### Scenario: Create job via form
- **WHEN** admin fills in name, selects agent, enters content, and submits
- **THEN** system calls the create job API and navigates back to the job list on success

### Requirement: Job detail page
The system SHALL display full job details at `/settings/jobs/:id` including: ID, Name, Agent, Content, Cron Expression, Job Detail, Created On, Created By, Updated On, Updated By. The page SHALL have an "Edit" button.

#### Scenario: View job detail
- **WHEN** admin clicks a job name in the list
- **THEN** system navigates to the detail page showing all job fields

### Requirement: Edit job page
The system SHALL provide an edit form at `/settings/jobs/:id/edit` pre-filled with the job's current name, agent, and content. ID SHALL be displayed but not editable. On submit, the system SHALL call the update API.

#### Scenario: Edit job
- **WHEN** admin modifies the content and submits
- **THEN** system calls the update API (which re-extracts cron/detail) and navigates to the detail page

### Requirement: Job log list page
The system SHALL display a table of execution logs at `/settings/jobs/:id/logs` showing columns: ID (as `#<id>`, clickable), Job Name, Time (created_on), and Status (icon-based: checkmark for success, X for fail, spinner for running).

#### Scenario: View logs for a job
- **WHEN** admin clicks the log link from the job list
- **THEN** system displays execution logs for that job, most recent first

### Requirement: Job log detail page
The system SHALL display a single log entry at `/settings/jobs/:id/logs/:logId` showing: ID, Job Name, Log (full text), Status, Created On, Created By, Updated On, Updated By.

#### Scenario: View log detail
- **WHEN** admin clicks a log ID in the log list
- **THEN** system navigates to the log detail page showing the full execution log

### Requirement: Settings menu entry
The system SHALL add a "Jobs" menu item under the Settings navigation, visible only to SYSTEM_ADMIN users.

#### Scenario: Menu visibility for admin
- **WHEN** a SYSTEM_ADMIN user views the settings menu
- **THEN** a "Jobs" menu item is visible and links to /settings/jobs

#### Scenario: Menu hidden for non-admin
- **WHEN** a non-admin user views the settings menu
- **THEN** the "Jobs" menu item is not displayed
